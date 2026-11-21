/* ============================================================
   DOXILO NOVA — Multiplayer layer (nova/multiplayer.js)

   Real internet multiplayer for Nova Arcade games over Firebase
   Realtime Database, with a same-device BroadcastChannel fallback.

   Public API (window.NovaMatch):
     .available()          -> true when the Firebase DB handle exists
     .transport()          -> "firebase" | "broadcast" | "none"
     .uid()                -> stable per-device player id
     .name()               -> current display name
     .create(opts)         -> Promise<code>  host a match/lobby
     .join(code)           -> Promise<role>  join an existing match/lobby
     .leave()              -> tear down listeners + presence
     .send(msg)            -> send a protocol message to the room
     .onMessage(cb)        -> receive protocol messages (returns unbind)
     .onRoom(cb)           -> room meta updates (players, status, settings)
     .setReady(v)          -> lobby ready flag
     .startGame()          -> host flips the room to "playing"
     .friendsOpen()        -> friends & requests manager
     .pubRooms(game, cb)   -> watch public lobby list (returns unbind)

   Firebase model
     matches/<CODE>/meta     { game, host, hostName, players{},
                               status: lobby|waiting|playing|ended, public,
                               createdAt, settings:{}, maxPlayers }
     matches/<CODE>/moves/<push>  { t, ... }   append-only protocol log
     matches/<CODE>/presence/<pid> { name, ts, ok }  (onDisconnect cleared)
     matches/<CODE>/ready/<pid>    bool
     invites/<uid>/<push>    { from, name, game, code, ts }
     friends/<uid>/list/<fid>  { name, ts }
     friends/<uid>/requests/<fid> { name, ts }
     lobbyIndex/<CODE>       { game, name, ts, host }  (public rooms only)

   Protocol messages (same shape the games already speak):
     join / accept / decline / cancel / end / restart / start / hello
     <game>-move / <game>-dice / <game>-pass / ...     (game payloads)
   ============================================================ */
(function () {
  "use strict";

  var ROOM_PREFIX = "NX";
  var ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function randCode() {
    var s = ROOM_PREFIX;
    for (var i = 0; i < 5; i++) s += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    return s;
  }

  function db() {
    try { return typeof window.db !== "undefined" && window.db ? window.db : null; } catch (e) { return null; }
  }
  function available() { return !!db(); }

  /* ---------- identity ---------- */
  var UID_KEY = "nova_mp_uid_v1";
  var myUid = "";
  try { myUid = localStorage.getItem(UID_KEY) || ""; } catch (e) {}
  if (!myUid) {
    myUid = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { localStorage.setItem(UID_KEY, myUid); } catch (e) {}
  }
  function uid() { return myUid; }
  function name() {
    try {
      var m = (typeof MY !== "undefined" && MY) || window.MY;
      if (m && (m.name || m.uid)) return String(m.name || m.uid).slice(0, 24);
    } catch (e) {}
    return "Player";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function transport() { return available() ? "firebase" : ("BroadcastChannel" in window ? "broadcast" : "none"); }

  /* ---------- room state ---------- */
  var R = {
    code: "", game: "", role: "", // host | guest
    started: false, ended: false,
    meta: null, movesRef: null, metaRef: null, presRef: null, invitesRef: null,
    msgCb: null, roomCb: null, heartbeat: null, bc: null,
    disconnectSet: false
  };

  function toast(msg, kind) {
    try { if (typeof window.toast === "function") { window.toast(msg, kind); return; } } catch (e) {}
    try { if (typeof window.t2 === "function") { window.t2(msg, kind); return; } } catch (e) {}
    try { console.log("[match]", msg); } catch (e) {}
  }

  /* ============================================================
     BroadcastChannel transport (same browser, all tabs)
     ============================================================ */
  var BC = {
    open: function (code) {
      this.close();
      if (!("BroadcastChannel" in window)) return;
      try {
        R.bc = new BroadcastChannel("nova-arcade-" + code);
        R.bc.onmessage = function (ev) { deliver(ev.data); };
      } catch (e) { R.bc = null; }
    },
    close: function () {
      if (R.bc) { try { R.bc.close(); } catch (e) {} }
      R.bc = null;
    },
    send: function (m) {
      if (!R.bc) return false;
      try { R.bc.postMessage(m); return true; } catch (e) { return false; }
    }
  };

  /* ============================================================
     Firebase transport (cross-device)
     ============================================================ */
  var FB = {
    write: function (msg) {
      var d = db();
      if (!d || !R.code) return false;
      msg = Object.assign({}, msg, { from: uid(), name: name(), ts: Date.now() });
      try { d.ref("matches/" + R.code + "/moves").push(msg); return true; }
      catch (e) { return false; }
    },
    listenMoves: function () {
      var d = db();
      if (!d || !R.code) return;
      if (R.movesRef) { try { R.movesRef.off(); } catch (e) {} }
      R.movesRef = d.ref("matches/" + R.code + "/moves");
      R.movesRef.limitToLast(60).on("child_added", function (sn) {
        var m = sn.val();
        if (!m) return;
        if (m.from === uid()) return; // ignore own writes
        deliver(m);
      });
    },
    listenMeta: function () {
      var d = db();
      if (!d || !R.code) return;
      if (R.metaRef) { try { R.metaRef.off(); } catch (e) {} }
      R.metaRef = d.ref("matches/" + R.code + "/meta");
      R.metaRef.on("value", function (sn) {
        R.meta = sn.val() || null;
        if (R.roomCb) { try { R.roomCb(R.meta); } catch (e) {} }
        if (R.meta && R.meta.status === "ended" && !R.ended) {
          R.ended = true;
          deliver({ t: "end", by: "system" });
        }
      });
    },
    presence: function () {
      var d = db();
      if (!d || !R.code || R.disconnectSet) return;
      try {
        var pr = d.ref("matches/" + R.code + "/presence/" + uid());
        pr.onDisconnect().remove();
        pr.set({ name: name(), ts: Date.now(), ok: true });
        R.presRef = pr;
        R.disconnectSet = true;
      } catch (e) {}
      if (!R.heartbeat) {
        R.heartbeat = setInterval(function () {
          if (!R.code) return;
          try {
            var d2 = db();
            if (!d2) return;
            d2.ref("matches/" + R.code + "/presence/" + uid()).update({ ts: Date.now(), ok: true });
          } catch (e) {}
        }, 15000);
      }
    },
    leavePresence: function () {
      try { if (R.presRef) { R.presRef.remove(); R.presRef.off(); } } catch (e) {}
      R.presRef = null; R.disconnectSet = false;
      if (R.heartbeat) { clearInterval(R.heartbeat); R.heartbeat = null; }
    }
  };

  /* ---------- message delivery ---------- */
  var __lastDeliver = "";
function deliver(m) { try { var _k = (m && (m.from || "")) + "|" + (m && (m.ts || m.t || "")); if (m && _k && _k !== "__|" && _k === __lastDeliver) return; if (m) __lastDeliver = _k; } catch (e) {}
    if (!m || !m.t) return;
    if (m.t === "hello") return; // informational only
    if (R.msgCb) { try { R.msgCb(m); } catch (e) {} }
  }

  /* ============================================================
     Room lifecycle
     ============================================================ */
  function create(opts) {
    opts = opts || {};
    var d = db();
    var code = randCode();
    R.code = code; R.game = opts.game || ""; R.role = "host";
    R.started = false; R.ended = false;
    R.meta = {
      game: R.game, host: uid(), hostName: name(),
      players: {}, status: opts.lobby ? "lobby" : "waiting",
      public: !!opts.public, createdAt: Date.now(),
      settings: opts.settings || {}, maxPlayers: opts.maxPlayers || 2
    };
    R.meta.players[uid()] = { name: name(), role: "host", joined: Date.now() };
    if (d) {
      try {
        d.ref("matches/" + code + "/meta").set(R.meta);
        if (opts.public && opts.lobby) {
          d.ref("lobbyIndex/" + code).set({ game: R.game, name: String(opts.name || (name() + "'s room")).slice(0, 40), ts: Date.now(), host: uid() });
          try { d.ref("lobbyIndex/" + code).onDisconnect().remove(); } catch (e) {}
        }
      } catch (e) { toast("Cloud room failed — falling back to local play", "error"); }
      FB.presence();
      FB.listenMeta();
      FB.listenMoves();
    }
    BC.open(code);
    return Promise.resolve(code);
  }

  function join(code) {
    var d = db();
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) return Promise.reject(new Error("Enter a room code"));
    R.code = code; R.role = "guest"; R.started = false; R.ended = false;
    BC.open(code);
    if (d) {
      return d.ref("matches/" + code + "/meta").once("value").then(function (sn) {
        var meta = sn.val();
        if (!meta) try { BC.close(); R.code = ""; R.role = ""; } catch (_rb) {} throw new Error("Room " + code + " not found or expired");
        R.game = meta.game || "";
        R.meta = meta;
        var players = meta.players || {};
        var isPlayer = !!players[uid()];
        var seatCount = Object.keys(players).length;
        if (!isPlayer) {
          if (meta.status !== "lobby" && meta.status !== "waiting") throw new Error("That match already started");
          if (seatCount >= (meta.maxPlayers || 2)) throw new Error("That room is full");
          var seat = seatCount === 0 ? "host" : "guest" + (seatCount > 1 ? seatCount : "");
          try {
            d.ref("matches/" + code + "/meta/players/" + uid()).set({ name: name(), role: seat, joined: Date.now() });
          } catch (e) { throw new Error("Could not join — permission denied"); }
        }
        R.meta.players = players;
        FB.presence();
        FB.listenMeta();
        FB.listenMoves();
        FB.write({ t: "hello", text: name() + " joined" });
        return R.role;
      });
    }
    // broadcast fallback: announce; the game layer handles accept/decline
    BC.send({ t: "join", from: name(), game: R.game });
    return Promise.resolve(R.role);
  }

  function leave() {
    var d = db();
    if (R.code && d) {
      try {
        if (R.role === "host") { d.ref("matches/" + R.code + "/meta/status").set("ended"); d.ref("lobbyIndex/" + R.code).remove(); }
        d.ref("matches/" + R.code + "/presence/" + uid()).remove();
      } catch (e) {}
    }
    if (R.started) send({ t: "end" });
    R.started = false;
    if (R.movesRef) { try { R.movesRef.off(); } catch (e) {} R.movesRef = null; }
    if (R.metaRef) { try { R.metaRef.off(); } catch (e) {} R.metaRef = null; }
    if (R.invitesRef) { try { R.invitesRef.off(); } catch (e) {} R.invitesRef = null; }
    FB.leavePresence();
    BC.close();
    R.code = ""; R.game = ""; R.role = ""; R.meta = null;
    /* callbacks kept: owners unbind explicitly */
  }

  function send(msg) {
    if (!R.code) return false;
    var viaBC = BC.send(msg);
    var viaFB = available() && R.role ? FB.write(msg) : false;
    return viaBC || !!viaFB;
  }

  function onMessage(cb) { R.msgCb = cb; return function () { if (R.msgCb === cb) R.msgCb = null; }; }
  function onRoom(cb) { R.roomCb = cb; (R.roomCbs = R.roomCbs || new Set()).add(cb); return function () { if (R.roomCbs) R.roomCbs.delete(cb); if (R.roomCb === cb) R.roomCb = null; }; }

  function setReady(v) {
    var d = db();
    if (d && R.code) { try { d.ref("matches/" + R.code + "/ready/" + uid()).set(!!v); } catch (e) {} }
    send({ t: "ready", on: !!v });
  }

  function startGame() {
    var d = db();
    if (d && R.code && R.role === "host") {
      try { d.ref("matches/" + R.code + "/meta/status").set("playing"); } catch (e) {}
      try { d.ref("lobbyIndex/" + R.code).remove(); } catch (e) {}
    }
    R.started = true;
    send({ t: "start" });
  }

  function markStarted() { R.started = true; }

  /* ---------- public lobby listing ---------- */
  function pubRooms(game, cb) {
    var d = db();
    if (!d) return function () {};
    var ref = d.ref("lobbyIndex").limitToLast(40);
    var handler = function (sn) {
      var out = [];
      sn.forEach(function (c) {
        var v = c.val() || {};
        if (game && v.game !== game) return;
        out.push({ code: c.key, game: v.game, name: v.name, ts: v.ts, host: v.host });
      });
      out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      cb(out);
    };
    ref.on("value", handler);
    return function () { try { ref.off("value", handler); } catch (e) {} };
  }

  /* ============================================================
     Invitations + friends
     ============================================================ */
  var inviteCb = null;
  function watchInvites(cb) {
    inviteCb = cb;
    var d = db();
    if (!d) return function () {};
    if (R.invitesRef) { try { R.invitesRef.off(); } catch (e) {} }
    R.invitesRef = d.ref("invites/" + uid()).limitToLast(8);
    R.invitesRef.on("child_added", function (sn) {
      var v = sn.val() || {};
      if (Date.now() - (v.ts || 0) > 120000) { try { sn.ref.remove(); } catch (e) {} return; }
      if (inviteCb) { try { inviteCb(v, sn.key); } catch (e) {} }
    });
    return function () { try { if (R.invitesRef) R.invitesRef.off(); } catch (e) {} };
  }
  function invite(targetUid, game, code) {
    var d = db();
    if (!d) { toast("Invitations need the cloud backend", "error"); return false; }
    try {
      d.ref("invites/" + targetUid).push({ from: uid(), name: name(), game: game, code: code, ts: Date.now() });
      toast("Invite sent");
      return true;
    } catch (e) { toast("Invite failed", "error"); return false; }
  }
  function clearInvite(key) {
    var d = db();
    if (d) { try { d.ref("invites/" + uid() + "/" + key).remove(); } catch (e) {} }
  }

  function sendFriendRequest(targetUid, targetName) {
    var d = db();
    if (!d) { toast("Friends need the cloud backend", "error"); return; }
    try {
      d.ref("friends/" + targetUid + "/requests/" + uid()).set({ name: name(), ts: Date.now() });
      toast("Friend request sent to " + (targetName || "player"));
    } catch (e) { toast("Request failed", "error"); }
  }
  function acceptFriend(fid, info) {
    var d = db();
    if (!d) return;
    try {
      d.ref("friends/" + uid() + "/list/" + fid).set({ name: (info && info.name) || "Player", ts: Date.now() });
      d.ref("friends/" + fid + "/list/" + uid()).set({ name: name(), ts: Date.now() });
      d.ref("friends/" + uid() + "/requests/" + fid).remove();
    } catch (e) {}
  }
  function declineFriend(fid) {
    var d = db();
    if (d) { try { d.ref("friends/" + uid() + "/requests/" + fid).remove(); } catch (e) {} }
  }
  function removeFriend(fid) {
    var d = db();
    if (d) { try { d.ref("friends/" + uid() + "/list/" + fid).remove(); } catch (e) {} }
  }
  function watchFriends(cb) {
    var d = db();
    if (!d) { cb({ list: {}, requests: {} }); return function () {}; }
    var ref = d.ref("friends/" + uid());
    var h = function (sn) {
      var v = sn.val() || {};
      cb({ list: v.list || {}, requests: v.requests || {} });
    };
    ref.on("value", h);
    return function () { try { ref.off("value", h); } catch (e) {} };
  }
  function findUserByName(q, cb) {
    var d = db();
    if (!d) { cb([]); return; }
    try {
      d.ref("users").limitToFirst(300).once("value").then(function (sn) {
        var out = [];
        var qq = String(q || "").toLowerCase();
        sn.forEach(function (c) {
          var u = c.val() || {};
          var nm = String(u.name || "");
          if (qq && nm.toLowerCase().indexOf(qq) < 0) return;
          out.push({ uid: c.key, name: nm, avatar: u.avatar || "" });
        });
        cb(out.slice(0, 12));
      }).catch(function () { cb([]); });
    } catch (e) { cb([]); }
  }

  /* ---------- invite link helpers ---------- */
  function linkFor(code, game) {
    try {
      var u = new URL(location.href);
      u.search = "";
      u.hash = "";
      u.searchParams.set("nova", "arcade");
      if (game) u.searchParams.set("g", game);
      u.searchParams.set("m", code);
      return u.toString();
    } catch (e) {
      return location.href.split(/[?#]/)[0] + "?nova=arcade" + (game ? "&g=" + game : "") + "&m=" + code;
    }
  }

  function copyText(text, label) {
    function done() { toast((label || "Copied") + " copied"); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
    } catch (e) { fallback(); }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done();
      } catch (e) { toast(text); }
    }
  }

  /* ---------- boot: incoming invite watcher ---------- */
  var lastInviteKey = "";
  function boot() {
    if (!available()) return;
    watchInvites(function (v, key) {
      if (R.code) return; // already in a room
      if (key === lastInviteKey) return;
      lastInviteKey = key;
      showInviteToast(v, key);
    });
  }

  function showInviteToast(v, key) {
    try {
      if (document.getElementById("nova-invite-pop")) return;
      var el = document.createElement("div");
      el.id = "nova-invite-pop";
      el.className = "nova-invite-pop";
      el.innerHTML =
        '<div class="nip-head">🎮 Game invite</div>' +
        '<div class="nip-body"><b>' + esc(v.name || "A player") + "</b> invites you to " +
        "<b>" + esc((v.game || "a game").charAt(0).toUpperCase() + (v.game || "").slice(1)) + "</b>" +
        '<span class="nip-code">' + esc(v.code || "") + "</span></div>" +
        '<div class="nip-btns"><button type="button" data-nip="accept">Join</button>' +
        '<button type="button" class="ghost" data-nip="decline">Decline</button></div>';
      document.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("on"); });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-nip]");
        if (!b) return;
        var a = b.getAttribute("data-nip");
        el.classList.remove("on");
        setTimeout(function () { el.remove(); }, 220);
        if (a === "accept" && window.NovaArcade) {
          clearInvite(key);
          window.NovaArcade.open();
          setTimeout(function () { window.NovaArcade.join(v.code, v.game); }, 250);
        }
        if (a === "decline") clearInvite(key);
      });
      setTimeout(function () {
        if (el.parentNode) { el.classList.remove("on"); setTimeout(function () { el.remove(); }, 240); }
      }, 30000);
    } catch (e) {}
  }

  /* ---------- export ---------- */
  window.NovaMatch = {
    available: available,
    transport: transport,
    uid: uid,
    name: name,
    esc: esc,
    create: create,
    join: join,
    leave: leave,
    send: send,
    onMessage: onMessage,
    onRoom: onRoom,
    setReady: setReady,
    startGame: startGame,
    markStarted: markStarted,
    room: function () { return R; },
    pubRooms: pubRooms,
    invite: invite,
    linkFor: linkFor,
    copyText: copyText,
    sendFriendRequest: sendFriendRequest,
    acceptFriend: acceptFriend,
    declineFriend: declineFriend,
    removeFriend: removeFriend,
    watchFriends: watchFriends,
    findUserByName: findUserByName,
    boot: boot
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
