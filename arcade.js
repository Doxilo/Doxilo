/* ============================================================
   DOXILO NOVA — Arcade 3.0 (nova/arcade.js)

   17 games across 6 categories + Lobby Games, with real online
   multiplayer (nova/multiplayer.js, Firebase RTDB) and a
   BroadcastChannel fallback for same-device tabs.

   Categories
     arcade   Doodle Jump · Snake · Pong · Breakout
     board    Ludo · Chess · Checkers · Connect Four · Tic-Tac-Toe
     puzzle   2048 · Sudoku · Memory Match
     strategy Minesweeper · Reversi
     racing   Neon Racer
     casual   Reaction Challenge · Simon Says
     lobby    room-based play (Ludo, Chess, Checkers, Connect Four,
              Tic-Tac-Toe) via the lobby system

   Every game: dedicated screen, instructions, restart, settings,
   best-score tracking, responsive input (keyboard + touch).
   Board games with net:true also support online matches.
   ============================================================ */
(function () {
  "use strict";

  var M = window.NovaMatch || null;
  var HSKEY = "nova_arcade_hs_v1";
  var CFGKEY = "nova_arcade_cfg_v1";
  var STATKEY = "nova_arcade_stats_v1";
  var SFXKEY = "nova_arcade_sound_v1";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return val === undefined ? null : val; }
  }
  var HS = store(HSKEY) || {};
  var CFG = store(CFGKEY) || {};
  var STATS = store(STATKEY) || { wins: 0, losses: 0, draws: 0, played: 0, history: [] };
  function saveHS() { store(HSKEY, HS); }
  function saveCFG() { store(CFGKEY, CFG); }
  function saveSTATS() { store(STATKEY, STATS); }
  function setHS(id, score) {
    if (!HS[id] || score > HS[id]) { HS[id] = Math.floor(score); saveHS(); return true; }
    return false;
  }
  function fmtN(n) { return String(Math.floor(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* ---------- match history ---------- */
  function recordResult(game, result, detail) {
    STATS.played++;
    if (result === "win") STATS.wins++;
    else if (result === "loss") STATS.losses++;
    else if (result === "draw") STATS.draws++;
    STATS.history.unshift({ g: game, r: result, d: detail || "", ts: Date.now() });
    if (STATS.history.length > 24) STATS.history.length = 24;
    saveSTATS();
  }

  /* ============================================================
     Sound engine — tiny WebAudio synth, no assets, toggleable
     ============================================================ */
  var SFX = (function () {
    var on = localStorage.getItem(SFXKEY) !== "off";
    var ctx = null;
    function ac() {
      try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      } catch (e) { return null; }
    }
    function tone(freq, dur, type, vol, slide) {
      if (!on) return;
      var c = ac(); if (!c) return;
      try {
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(freq, c.currentTime);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), c.currentTime + dur);
        g.gain.setValueAtTime(vol || 0.08, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g); g.connect(c.destination);
        o.start(); o.stop(c.currentTime + dur + 0.02);
      } catch (e) {}
    }
    function noise(dur, vol) {
      if (!on) return;
      var c = ac(); if (!c) return;
      try {
        var len = Math.max(1, Math.floor(c.sampleRate * dur));
        var buf = c.createBuffer(1, len, c.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        var src = c.createBufferSource(); src.buffer = buf;
        var g = c.createGain(); g.gain.setValueAtTime(vol || 0.06, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        src.connect(g); g.connect(c.destination); src.start();
      } catch (e) {}
    }
    return {
      enabled: function () { return on; },
      toggle: function () { on = !on; try { localStorage.setItem(SFXKEY, on ? "on" : "off"); } catch (e) {} return on; },
      play: function (k) {
        switch (k) {
          case "click": tone(660, 0.05, "triangle", 0.05); break;
          case "move": tone(340, 0.07, "triangle", 0.06, 420); break;
          case "jump": tone(300, 0.14, "square", 0.045, 560); break;
          case "eat": tone(720, 0.09, "square", 0.07, 980); break;
          case "dice": noise(0.16, 0.05); tone(220, 0.1, "triangle", 0.05, 180); break;
          case "capture": tone(160, 0.18, "sawtooth", 0.08, 90); noise(0.1, 0.05); break;
          case "good": tone(520, 0.09, "sine", 0.07, 700); setTimeout(function () { tone(780, 0.12, "sine", 0.07, 990); }, 90); break;
          case "bad": tone(240, 0.2, "sawtooth", 0.07, 110); break;
          case "tick": tone(880, 0.03, "square", 0.03); break;
          case "check": tone(500, 0.12, "square", 0.06, 620); setTimeout(function () { tone(620, 0.12, "square", 0.06); }, 110); break;
          case "win": [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.16, "triangle", 0.08); }, i * 130); }); break;
          case "lose": [392, 330, 262].forEach(function (f, i) { setTimeout(function () { tone(f, 0.2, "sine", 0.07); }, i * 160); }); break;
          case "flip": tone(480, 0.05, "triangle", 0.05, 620); break;
        }
      }
    };
  })();

  /* ============================================================
     Game registry — one primary category per game
     ============================================================ */
  var CATS = [
    { id: "arcade", n: "Arcade Games", ic: "gamepad-2", d: "Fast reflex classics" },
    { id: "board", n: "Board Games", ic: "grid", d: "Ludo, chess & friends" },
    { id: "puzzle", n: "Puzzle Games", ic: "shapes", d: "Think it through" },
    { id: "strategy", n: "Strategy Games", ic: "brain-circuit", d: "Outsmart the bot" },
    { id: "racing", n: "Racing Games", ic: "zap", d: "Dodge at full speed" },
    { id: "casual", n: "Casual Games", ic: "smile", d: "Quick relaxing fun" },
    { id: "lobby", n: "Lobby Games", ic: "users", d: "Rooms, invites & real multiplayer" }
  ];
  var GAMES = [
    { id: "doodle", n: "Doodle Jump", cat: "arcade", ic: "doodle", c: "#22D3EE", b: "Bounce up an endless tower. Don't fall.", keys: "Arrows / A-D / drag" },
    { id: "snake", n: "Snake", cat: "arcade", ic: "snake", c: "#34F5C5", b: "Eat, grow and survive. Speed keeps rising.", keys: "Arrows / WASD / swipe" },
    { id: "pong", n: "Pong", cat: "arcade", ic: "pong", c: "#F472B6", b: "The original rally — beat the CPU to 7.", keys: "Arrows / drag" },
    { id: "breakout", n: "Breakout", cat: "arcade", ic: "breakout", c: "#FB923C", b: "Smash every brick, guard your paddle.", keys: "Arrows / drag" },
    { id: "ludo", n: "Ludo", cat: "board", ic: "ludo", c: "#FBBF24", b: "Yalla-style Ludo — 2/3/4 players, bots ya pass-n-play, sab rules customize.", keys: "Tap · Space rolls", net: true, lobby: true, dom: true },
    { id: "chess", n: "Chess", cat: "board", ic: "chess", c: "#A78BFA", b: "Full rules, AI levels, clock and move history.", keys: "Tap a piece · H hint", net: true, lobby: true },
    { id: "checkers", n: "Checkers", cat: "board", ic: "checkers", c: "#F87171", b: "Captures, kings and forced jumps vs a smart bot.", keys: "Tap a piece", net: true, lobby: true, dom: true },
    { id: "ttt", n: "Tic-Tac-Toe", cat: "board", ic: "ttt", c: "#38BDF8", b: "Three in a row — unbeatable AI or a friend.", keys: "Tap a square", net: true, lobby: true, dom: true },
    { id: "connect4", n: "Connect Four", cat: "board", ic: "connect4", c: "#FDE047", b: "Drop discs, line up four, block the trap.", keys: "Tap a column", net: true, lobby: true, dom: true },
    { id: "n2048", n: "2048", cat: "puzzle", ic: "n2048", c: "#F59E0B", b: "Merge tiles, chase 2048 and beyond.", keys: "Arrows / WASD / swipe", dom: true },
    { id: "sudoku", n: "Sudoku", cat: "puzzle", ic: "sudoku", c: "#60A5FA", b: "Generated grids, three difficulties, mistake tracking.", keys: "Tap cell · type 1-9", dom: true },
    { id: "memory", n: "Memory Match", cat: "puzzle", ic: "memory", c: "#C084FC", b: "Flip pairs, train recall, beat your best.", keys: "Tap cards", dom: true },
    { id: "minesweeper", n: "Minesweeper", cat: "strategy", ic: "mine", c: "#94A3B8", b: "Deduce every safe cell — flag the bombs.", keys: "Tap reveal · long-press flag", dom: true },
    { id: "reversi", n: "Reversi", cat: "strategy", ic: "reversi", c: "#34D399", b: "Flip the board — corners win games.", keys: "Tap a legal cell", net: true, dom: true },
    { id: "racer", n: "Neon Racer", cat: "racing", ic: "racer", c: "#F43F5E", b: "Three lanes, endless traffic, pure reflex.", keys: "Arrows / A-D / swipe" },
    { id: "reaction", n: "Reaction Challenge", cat: "casual", ic: "reaction", c: "#2DD4BF", b: "Wait for green, tap at lightspeed.", keys: "Tap / Space", dom: true },
    { id: "simon", n: "Simon Says", cat: "casual", ic: "simon", c: "#A3E635", b: "Watch the pattern, repeat it, level up.", keys: "Tap pads", dom: true }
  ];
  function gameById(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }
  function gamesIn(cat) { return GAMES.filter(function (g) { return g.cat === cat; }); }

  /* ============================================================
     Shell
     ============================================================ */
  var root = null, menuEl = null, stageEl = null, titleEl = null, boardEl = null, canvas = null, ctx = null, domEl = null;
  var statusEl = null, scoreEl = null, controlsEl = null, overlayEl = null, keysEl = null, logEl = null, netEl = null;
  var active = null, raf = 0, lastT = 0, openNow = false, keys = {}, curGame = null, curOpt = null;
  var curCat = "arcade", swipeStart = null, touchKey = null, clockTimer = null;

  var ICONS = {
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M6.4 6.4 5 5M19 19l-1.4-1.4M17.6 6.4 19 5M5 19l1.4-1.4"/>',
      "message-circle": '<path d="M20 12a8 8 0 1 1-3.1-6.3L20 4l-1.4 3.2A8 8 0 0 1 20 12Z"/>',
  /* shared UI icons (mirrored from NovaKit) */
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.8"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.8"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.8"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.8"/>',
  play: '<path d="M8 5.4v13.2L19 12Z"/>',
  users: '<circle cx="9" cy="8.4" r="3.3"/><path d="M3.4 19.6a5.6 5.6 0 0 1 11.2 0"/><path d="M15.6 5.5a3.2 3.2 0 0 1 0 6.1M17 14.4a5.6 5.6 0 0 1 3.6 5.2"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 9.4h16.8M3.6 14.6h16.8"/><path d="M12 3.4c2.2 2.3 3.4 5.2 3.4 8.6s-1.2 6.3-3.4 8.6c-2.2-2.3-3.4-5.2-3.4-8.6S9.8 5.7 12 3.4Z"/>',
  "book-open": '<path d="M7 3.6h10.4A1.6 1.6 0 0 1 19 5.2v13.6a1.6 1.6 0 0 1-1.6 1.6H7A2.6 2.6 0 0 1 4.4 17.8V6.2A2.6 2.6 0 0 1 7 3.6Z"/><path d="M8 3.6v16.8"/><path d="M11.6 8h4.2M11.6 12h4.2"/>',
  check: '<path d="M4.6 12.4 9.6 17.4 19.4 6.6"/>',
  sparkles: '<path d="M12 3.2l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7Z"/><path d="M18.6 14.2l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8Z"/>',
  "log-out": '<path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14"/><path d="M16.5 8.5 20 12l-3.5 3.5M10.5 12H20"/>',
  "gamepad-2": '<path d="M8 7.6h8a4.5 4.5 0 0 1 4.4 5.4l-.5 2.6a2.6 2.6 0 0 1-4.5 1.1l-1.3-1.5a2 2 0 0 0-1.5-.7h-2.2a2 2 0 0 0-1.5.7L7.6 16.7a2.6 2.6 0 0 1-4.5-1.1l-.5-2.6A4.5 4.5 0 0 1 8 7.6Z"/><path d="M8.1 10.5v2.8M6.7 11.9H9.5M15.4 11.2h.01M17.3 13.1h.01"/>',
  zap: '<path d="M13.3 2.6 5.4 13.1h5.2l-.9 8.3 8-10.7h-5.3Z"/>',
  "qr-code": '<rect x="3.6" y="3.6" width="6.8" height="6.8" rx="1.6"/><rect x="13.6" y="3.6" width="6.8" height="6.8" rx="1.6"/><rect x="3.6" y="13.6" width="6.8" height="6.8" rx="1.6"/><path d="M13.6 13.6h2.6v2.6h-2.6zM19.4 13.6h1M13.6 19.4v1M17 20.4h3.4M20.4 17v.6"/>',
  star: '<path d="M12 3.6l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 10l6-.9Z"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-4.4M12.7 16V8.6M17.4 16v-6.2"/>',
  shapes: '<rect x="4" y="4" width="7" height="7" rx="1"/><path d="M17.5 4.5 21 11h-7Z"/><circle cx="7.5" cy="16.5" r="3.5"/>',
  "brain-circuit": '<circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="3" r="1.4"/><circle cx="12" cy="21" r="1.4"/><circle cx="3" cy="12" r="1.4"/><circle cx="21" cy="12" r="1.4"/>',
  smile: '<circle cx="12" cy="12" r="8.6"/><path d="M8.6 14.2a4.4 4.4 0 0 0 6.8 0"/><path d="M9.2 9.6h.01M14.8 9.6h.01"/>',
    snake: '<path d="M4 17c0-2.4 1.9-4.2 4.2-4.2h7.6c1.5 0 2.6-1.1 2.6-2.6S17.3 7.6 15.8 7.6H8.4"/><circle cx="5.4" cy="17.2" r="1.6"/><path d="M17.6 5.2h2.8"/><circle cx="18.8" cy="5.2" r="2.4"/>',
    ludo: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="1"/><path d="M8 3.6v16.8M16 3.6v16.8M3.6 8h16.8M3.6 16h16.8"/><circle cx="6.2" cy="6.2" r="1"/><circle cx="17.8" cy="17.8" r="1"/>',
    chess: '<path d="M8 20h8l-.6-3.2a4.4 4.4 0 0 0-2.1-2.9c2.4-2.2 3.7-4.6 3.7-6.8A4 4 0 0 0 13 3.2c-1.2 0-2.2.5-3 1.4-.8-.9-1.8-1.4-3-1.4a4 4 0 0 0-4 4c0 2.1 1.4 4.5 3.8 6.7A4.4 4.4 0 0 0 4.6 16.8L4 20Z"/><path d="M4 20h16"/>',
    doodle: '<path d="M12 20V5"/><path d="M6.6 10.4 12 5l5.4 5.4"/><path d="M4 20h16"/>',
    dice: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="1.4"/><circle cx="8.4" cy="8.4" r="1"/><circle cx="15.6" cy="15.6" r="1"/><circle cx="12" cy="12" r="1"/>',
    bot: '<rect x="4.4" y="7.6" width="15.2" height="11.4" rx="1.6"/><path d="M12 4v3.6M8.4 12h.01M15.6 12h.01M9 15.4h6"/><path d="M2.6 11v4.2M21.4 11v4.2"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3.4v4.2h-4.2"/>',
    "arr-up": '<path d="M12 19V5"/><path d="m6.4 10.6 5.6-5.6 5.6 5.6"/>',
    "arr-down": '<path d="M12 5v14"/><path d="m6.4 13.4 5.6 5.6 5.6-5.6"/>',
    pong: '<circle cx="12" cy="12" r="2.4"/><path d="M4 6v12M20 6v12"/><path d="M7.4 12h2.2M14.4 12h2.2"/>',
    breakout: '<rect x="3.4" y="4.4" width="17.2" height="3" rx="1"/><rect x="3.4" y="9" width="5" height="3" rx="1"/><rect x="9.5" y="9" width="5" height="3" rx="1"/><rect x="15.6" y="9" width="5" height="3" rx="1"/><rect x="9.6" y="19" width="4.8" height="1.6" rx=".8"/>',
    checkers: '<circle cx="8" cy="8" r="3.4"/><circle cx="16" cy="16" r="3.4"/><path d="M11.4 8h4.6M8 11.4v4.6M16 11.4v4.6"/>',
    ttt: '<path d="M4 4h5v5H4z"/><path d="M15 15h5v5h-5z"/><path d="M15 4h5v5h-5z" stroke-dasharray="2 2"/><path d="M4 15h5v5H4z" stroke-dasharray="2 2"/><path d="M10.8 10.8 13.2 13.2"/>',
    connect4: '<circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="7" r="2.6"/><circle cx="7" cy="13" r="2.6"/><circle cx="17" cy="13" r="2.6"/><circle cx="7" cy="19" r="2.6"/>',
    n2048: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.4"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.4"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.4"/><circle cx="16.9" cy="16.9" r="3.5"/>',
    sudoku: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="1.2"/><path d="M9.2 3.6v16.8M14.8 3.6v16.8M3.6 9.2h16.8M3.6 14.8h16.8"/><circle cx="12" cy="12" r="1.4"/>',
    memory: '<rect x="3.6" y="5" width="7" height="8.6" rx="1.4"/><rect x="13.4" y="10.4" width="7" height="8.6" rx="1.4"/><path d="M6.4 8.6h1.6M16.2 14h1.6"/>',
    mine: '<circle cx="12" cy="13" r="6"/><path d="M12 4.6V7M5 8l2.2 2.2M19 8l-2.2 2.2M12 19v2"/>',
    reversi: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/><path d="M6.5 9a2.5 2.5 0 0 1 5 0"/>',
    racer: '<path d="M5 16h14"/><path d="M7 16v-4a5 5 0 0 1 10 0v4"/><circle cx="8" cy="18.6" r="1.8"/><circle cx="16" cy="18.6" r="1.8"/><path d="M12 3v4"/>',
    reaction: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3 2"/>',
    simon: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 5H5.5A2.5 2.5 0 0 0 8 9.4M16 5h2.5A2.5 2.5 0 0 1 16 9.4M12 13v3M8.5 20h7M10 16.5h4"/>',
    bolt: '<path d="M13 2 5.6 13.2H11L9.8 22l7.4-11.2H12.8Z"/>'
  };
  function svg(name, cls) {
    var p = ICONS[name] || "";
    return '<svg class="' + (cls || "nva-i") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }

  function build() {
    if (root) return;
    root = document.createElement("div");
    root.id = "nova-arcade";
    root.className = "nva3";
    root.innerHTML =
      '<div class="nva3-back" data-arc-close></div>' +
      '<div class="nva3-shell">' +
        '<header class="nva3-head">' +
          '<div class="nva3-brand"><span class="nva3-logo">' + logoMark() + '</span><div><b>NOVA ARCADE</b><span>17 games · zero downloads</span></div></div>' +
          '<div class="nva3-head-r">' +
            '<button type="button" class="nva3-iconbtn' + (SFX.enabled() ? " on" : "") + '" id="nva3-sfx" title="Sound effects" aria-label="Toggle sound effects">' + svg("bolt") + "</button>" +
            '<button type="button" class="nva3-iconbtn" id="nva3-stats" title="Your record" aria-label="Your record">' + svg("trophy") + "</button>" +
            '<button type="button" class="nvx-close" data-arc-close aria-label="Close arcade">' + svg("x") + "</button>" +
          "</div>" +
        "</header>" +
        '<div class="nva3-menu" id="nva3-menu"></div>' +
        '<div class="nva3-stage" id="nva3-stage" hidden>' +
          '<div class="nva3-stage-head">' +
            '<button type="button" class="nva3-backbtn" id="nva3-back">' + svg("arrow-left") + "Games</button>" +
            '<div class="nva3-title"><h2 id="nva3-title">Game</h2><span id="nva3-status">Ready</span></div>' +
            '<div class="nva3-hs"><span>BEST</span><b id="nva3-score">0</b><button type="button" class="nva3-restart" id="nva3-restart" title="Restart" aria-label="Restart">' + svg("rotate") + "</button></div>" +
          "</div>" +
          '<div class="nva3-board" id="nva3-board"><canvas id="nva3-canvas" width="600" height="600"></canvas><div class="nva3-dom" id="nva3-dom" hidden></div><div class="nva3-over" id="nva3-over"></div></div>' +
          '<div class="nva3-foot"><div class="nva3-controls" id="nva3-controls"></div><div class="nva3-log" id="nva3-log" hidden></div><div class="nva3-keys" id="nva3-keys"></div></div>' +
        "</div>" +
        '<div class="nva3-net" id="nva3-net" hidden></div>' +
      "</div>";
    document.body.appendChild(root);
    menuEl = root.querySelector("#nva3-menu");
    stageEl = root.querySelector("#nva3-stage");
    titleEl = root.querySelector("#nva3-title");
    statusEl = root.querySelector("#nva3-status");
    scoreEl = root.querySelector("#nva3-score");
    controlsEl = root.querySelector("#nva3-controls");
    keysEl = root.querySelector("#nva3-keys");
    logEl = root.querySelector("#nva3-log");
    boardEl = root.querySelector("#nva3-board");
    overlayEl = root.querySelector("#nva3-over");
    netEl = root.querySelector("#nva3-net");
    domEl = root.querySelector("#nva3-dom");
    canvas = root.querySelector("#nva3-canvas");
    ctx = canvas.getContext("2d");
    root.addEventListener("click", onClick);
    netEl.addEventListener("click", onNetClick);
    controlsEl.addEventListener("pointerdown", function (e) {
      var b = e.target.closest("[data-arc-key]");
      if (!b) return;
      var k = b.getAttribute("data-arc-key");
      touchKey = k;
      keys[k] = true;
      if (active && active.key) active.key(k);
    });
    window.addEventListener("pointerup", function () {
      if (touchKey) { keys[touchKey] = false; touchKey = null; }
    });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    /* DOM-board games dispatch through delegated listeners on the container */
    domEl.addEventListener("click", function (e) {
      if (active && active.onDomClick) active.onDomClick(e);
    });
    domEl.addEventListener("contextmenu", function (e) {
      if (active && active.onDomContext) { e.preventDefault(); active.onDomContext(e); }
    });
  }
  function logoMark() {
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Doxilo logo"><defs>' +
      '<linearGradient id="nvaLog" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#A78BFA"/></linearGradient></defs>' +
      '<path d="M28 68 L172 68 L100 180 Z" fill="rgba(15,20,44,.55)" stroke="url(#nvaLog)" stroke-width="8" stroke-linejoin="round"/>' +
      '<text x="100" y="100" text-anchor="middle" font-family="Sora,system-ui,sans-serif" font-weight="900" font-size="22" fill="#E7EAFF">NX</text></svg>';
  }

  /* ============================================================
     Menu (category-driven library)
     ============================================================ */
  function menuHTML() {
    var cats = CATS.map(function (c) {
      return '<button type="button" class="nva3-cat' + (curCat === c.id ? " on" : "") + '" data-arc-cat="' + c.id + '">' + svg(c.ic) + esc(c.n) + "</button>";
    }).join("");
    var hero;
    if (curCat === "lobby") {
      hero =
        '<div class="nva3-menuhead"><span class="nvx-kicker">' + svg("users") + "Lobby Games</span><h1>Play together</h1>" +
        "<p>Create a room, share the code or link, and play Ludo, Chess, Checkers, Connect Four or Tic-Tac-Toe with live sync" + (M && M.available() ? " across devices." : " — between tabs on this device while offline.") + "</p></div>" +
        lobbyPanelHTML();
    } else {
      var c0 = CATS.filter(function (c) { return c.id === curCat; })[0] || CATS[0];
      hero =
        '<div class="nva3-menuhead"><span class="nvx-kicker">' + svg(c0.ic) + esc(c0.n) + "</span><h1>Nova Arcade</h1><p>" + esc(c0.d) + ". Instant play — best scores are saved on this device.</p></div>" +
        '<div class="nva3-grid">' + badgesHTML(gamesIn(curCat)) + "</div>";
    }
    return '<div class="nva3-cats">' + cats + "</div>" + hero;
  }
  function badgesHTML(list) {
    return list.map(function (g) {
      var best = HS[g.id];
      var bestTxt = best != null ? "Best " + fmtN(best) : (g.net ? "Online ready" : "Not played yet");
      var catName = (CATS.filter(function (c) { return c.id === g.cat; })[0] || {}).n || g.cat;
      return '<button type="button" class="nva3-card" data-arc-play="' + g.id + '" style="--g:' + g.c + '">' +
        '<span class="nva3-card-ic">' + svg(g.ic) + "</span>" +
        '<span class="nva3-card-tag">' + esc(catName.replace(" Games", "")) + (g.net ? " · online" : "") + "</span>" +
        "<b>" + esc(g.n) + "</b><span class=\"nva3-card-b\">" + esc(g.b) + "</span>" +
        '<span class="nva3-card-foot"><span>' + svg("play") + "Play now</span><i>" + esc(bestTxt) + "</i></span></button>";
    }).join("");
  }
  function showMenu() {
    stopGame();
    if (M && M.room().code) { M.send({ t: "end" }); M.leave(); }
    closeNetPanel();
    if (overlayEl) { overlayEl.classList.remove("on"); overlayEl.innerHTML = ""; }
    curGame = null;
    menuEl.hidden = false;
    stageEl.hidden = true;
    menuEl.innerHTML = menuHTML();
    if (curCat === "lobby") lobbyBind();
  }

  /* ============================================================
     Stage / game lifecycle
     ============================================================ */
  function showDom(v) {
    if (!domEl) return;
    domEl.hidden = !v;
    canvas.hidden = !!v;
    if (v) domEl.innerHTML = "";
  }
  function play(id, opt) {
    build();
    if (!openNow) {
      root.classList.add("open");
      openNow = true;
      document.documentElement.style.overflow = "hidden";
    }
    if (opt !== "online" && M && M.room().code) { M.send({ t: "end" }); M.leave(); }
    stopGame();
    curGame = id; curOpt = opt || null;
    var g = gameById(id);
    if (!g) return;
    menuEl.hidden = true;
    stageEl.hidden = false;
    showDom(!!g.dom);
    titleEl.textContent = g.n;
    statusEl.textContent = "Ready";
    overlayEl.innerHTML = "";
    overlayEl.classList.remove("on");
    keys = {};
    if (logEl) { logEl.hidden = true; logEl.innerHTML = ""; }
    if (g.dom) boardEl.style.setProperty("--ar", "1/1");
    else if (id === "doodle") setCanvas(420, 620);
    else setCanvas(600, 600);
    controlsEl.innerHTML = controlsFor(id);
    if (keysEl) keysEl.innerHTML = KEYS[id] || "";
    if (id === "doodle") active = Doodle();
    else if (id === "snake") active = Snake();
    else if (id === "pong") active = Pong();
    else if (id === "breakout") active = Breakout();
    else if (id === "racer") active = Racer();
    else if (id === "ludo") active = LudoDom(opt || "bot");
    else if (id === "chess") active = Chess(opt || "bot");
    else if (id === "ttt") active = TTT(opt || "bot");
    else if (id === "connect4") active = Connect4(opt || "bot");
    else if (id === "checkers") active = Checkers(opt || "bot");
    else if (id === "reversi") active = Reversi(opt || "bot");
    else if (id === "n2048") active = G2048();
    else if (id === "sudoku") active = Sudoku();
    else if (id === "minesweeper") active = Minesweeper();
    else if (id === "memory") active = Memory();
    else if (id === "reaction") active = Reaction();
    else if (id === "simon") active = Simon();
    scoreEl.textContent = fmtN(HS[id] || 0);
    startLoop();
    if (active && active.start) active.start();
  }
  var KEYS = {
    doodle: "<kbd>←</kbd><kbd>→</kbd> steer",
    snake: "<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> turn",
    pong: "<kbd>↑</kbd><kbd>↓</kbd> move · drag",
    breakout: "<kbd>←</kbd><kbd>→</kbd> move · drag",
    ludo: "<kbd>Space</kbd> roll · <kbd>R</kbd> rules",
    chess: "<kbd>R</kbd> rules · <kbd>H</kbd> hint",
    checkers: "<kbd>R</kbd> rules",
    ttt: "Tap a square",
    connect4: "Tap a column",
    n2048: "<kbd>Arrows</kbd> / swipe",
    sudoku: "Tap cell · <kbd>1-9</kbd>",
    minesweeper: "Tap reveal · long-press flag",
    memory: "Tap two cards",
    reversi: "Tap a legal cell",
    racer: "<kbd>←</kbd><kbd>→</kbd> lanes · swipe",
    reaction: "Tap / <kbd>Space</kbd>",
    simon: "Repeat the pattern"
  };

  function restart() {
    if (curOpt === "online" && active && active.action) { active.action("restart"); return; }
    if (curGame) play(curGame, curOpt);
  }
  function setCanvas(w, h) {
    canvas.width = w; canvas.height = h;
    canvas.style.aspectRatio = w + "/" + h;
    boardEl.style.setProperty("--ar", w + "/" + h);
  }
  function startLoop() {
    cancelAnimationFrame(raf);
    lastT = 0;
    function tick(t) {
      if (!active) return;
      if (!lastT) lastT = t;
      var dt = Math.min(48, t - lastT);
      lastT = t;
      try { active.update(dt); if (!active.noDraw) active.draw(ctx); } catch (e) { try { console.warn("[arcade]", e); } catch (e2) {} }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }
  function stopGame() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    if (active && active.stop) { try { active.stop(); } catch (e) {} }
    active = null;
  }

  function api(id) {
    return {
      status: function (s) { if (statusEl && curGame === id) statusEl.textContent = s; },
      score: function (s, best) {
        if (curGame !== id) return;
        if (scoreEl) scoreEl.textContent = fmtN(best != null ? best : (HS[id] || 0));
      },
      record: function (s) {
        var nb = setHS(id, s);
        if (nb && scoreEl) scoreEl.textContent = fmtN(s);
        return nb;
      },
      over: function (title, sub, kind) {
        if (curGame !== id) return;
        if (kind === "win") SFX.play("win");
        else if (kind === "loss") SFX.play("lose");
        if (overlayEl) {
          overlayEl.innerHTML = '<div><span class="nva3-over-k">' + (kind === "win" ? "VICTORY" : kind === "draw" ? "DRAW" : "GAME OVER") + "</span><b>" + esc(title) + "</b><span>" + esc(sub || "") + "</span>" +
            '<div class="nva3-over-btns"><button type="button" data-arc-act="restart">' + svg("rotate") + "Play again</button><button type=\"button\" data-arc-act=\"menu\">" + svg("grid") + "Games</button></div></div>";
          overlayEl.classList.add("on");
        }
      },
      clearOver: function () { if (overlayEl) { overlayEl.classList.remove("on"); overlayEl.innerHTML = ""; } },
      w: function () { return canvas.width; },
      h: function () { return canvas.height; },
      setHTML: function (html) { if (domEl && curGame === id) domEl.innerHTML = html; }
    };
  }

  /* ============================================================
     Online match handshake (Firebase room status + BC fallback)
     ============================================================ */
  var NET2 = { recv: null };
  function netSend(m) { return !!(M && M.send(m)); }

  function openNet(html) {
    build();
    netEl.hidden = false;
    netEl.innerHTML = '<div class="nva3-net-card">' + html + "</div>";
  }
  function closeNetPanel() { if (netEl) { netEl.hidden = true; netEl.innerHTML = ""; } }

  function openChallenge(game) {
    build();
    if (!M) return;
    if (!M.available() && !("BroadcastChannel" in window)) {
      try { window.toast && window.toast("This browser cannot open private matches.", "error"); } catch (e) {}
      return;
    }
    var g = gameById(game);
    M.create({ game: game, maxPlayers: game === "ludo" ? 4 : 2 }).then(function (code) {
      var link = M.linkFor(code, game);
      var tr = M.transport();
      openNet(
        '<div class="nva3-nh"><b>Challenge · ' + esc(g.n) + '</b><button type="button" data-netc="close">✕</button></div>' +
        "<p class=\"nva3-np\">Share this code or invite link" + (tr === "firebase" ? " — it works across devices." : " — your friend joins from another tab on this device.") + "</p>" +
        '<div class="nva3-code">' + esc(code) + "</div>" +
        '<label class="nva3-nl">Invite link<input readonly value="' + esc(link) + '"></label>' +
        '<div class="nva3-nbtns"><button type="button" data-netc="copycode">Copy code</button><button type="button" data-netc="copylink">Copy link</button><button type="button" class="ghost" data-netc="close">Cancel</button></div>' +
        '<div class="nva3-nwait"><i></i> Waiting for a challenger…</div>' +
        (tr !== "firebase" ? '<div class="nva3-ntest">Offline mode: matches sync between tabs of this browser only. Deploy with a Firebase backend for true cross-device play.</div>' : "")
      );
      watchRoomForStart(game);
    });
  }
  function watchRoomForStart(game) {
    if (!M) return;
    var fired = false;
    M.onRoom(function (meta) {
      if (fired || curGame === game) return;
      var n = meta && meta.players ? Object.keys(meta.players).length : 0;
      if (n >= 2 && meta.status === "playing") { fired = true; closeNetPanel(); startOnline(game); }
      else if (n >= 2 && meta.status !== "playing" && M.room().role === "host") {
        fired = true;
        M.startGame();
        closeNetPanel();
        startOnline(game);
      }
    });
  }
  function openJoin() {
    build();
    var opts = GAMES.filter(function (g) { return g.net; }).map(function (g) {
      return '<option value="' + g.id + '">' + esc(g.n) + "</option>";
    }).join("");
    openNet(
      '<div class="nva3-nh"><b>Join a match</b><button type="button" data-netc="close">✕</button></div>' +
      '<p class="nva3-np">Enter the code your friend shared.</p>' +
      '<label class="nva3-nl">Match code<input id="nva3-join-code" maxlength="7" placeholder="e.g. NXK7QP" style="text-transform:uppercase;letter-spacing:.3em;font-weight:900"></label>' +
      '<label class="nva3-nl">Game<select id="nva3-join-game">' + opts + "</select></label>" +
      '<div class="nva3-nbtns"><button type="button" data-netc="join">Join match</button><button type="button" class="ghost" data-netc="close">Cancel</button></div>'
    );
    var inp = netEl.querySelector("#nva3-join-code");
    if (inp) setTimeout(function () { inp.focus(); }, 60);
  }
  function joinChallenge(code, game) {
    build();
    if (!M) return;
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) { try { window.toast && window.toast("Enter a match code", "error"); } catch (e) {} return; }
    M.join(code).then(function () {
      var gid = M.room().game || game || "ludo";
      var g = gameById(gid) || gameById("ludo");
      openNet(
        '<div class="nva3-nh"><b>Joining · ' + esc(code) + '</b><button type="button" data-netc="close">✕</button></div>' +
        '<p class="nva3-np">Connected to ' + esc(g.n) + ". Waiting for the host to start…</p>" +
        '<div class="nva3-nwait"><i></i> Syncing…</div>'
      );
      watchRoomForStart(gid);
    }).catch(function () {
      // no cloud room: fall back to same-device handshake
      if (!("BroadcastChannel" in window)) {
        try { window.toast && window.toast("Room not found — deploy with Firebase for cross-device rooms.", "error"); } catch (e) {}
        return;
      }
      openNet(
        '<div class="nva3-nh"><b>Joining · ' + esc(code) + '</b><button type="button" data-netc="close">✕</button></div>' +
        '<p class="nva3-np">Request sent to the host. The match starts when they accept.</p>' +
        '<div class="nva3-nwait"><i></i> Connecting…</div>'
      );
      M.send({ t: "join", from: M.name(), game: game || "ludo" });
    });
  }
  function startOnline(game) {
    M.markStarted();
    play(game, "online");
  }

  function onNetClick(e) {
    var b = e.target.closest("[data-netc]");
    if (!b) return;
    var a = b.getAttribute("data-netc");
    if (a === "close") {
      if (M && M.room().role === "host" && !M.room().started) M.send({ t: "cancel" });
      closeNetPanel();
      if (M && !M.room().started) M.leave();
      return;
    }
    if (a === "copycode" && M) { M.copyText(M.room().code, "Match code"); return; }
    if (a === "copylink" && M) { M.copyText(M.linkFor(M.room().code, M.room().game), "Invite link"); return; }
    if (a === "invite" && M) { friendsPanel(); return; }
    if (a === "lbstart") { try { var __ps = (M && M.room() && M.room().meta && M.room().meta.players) || {}; if (Object.keys(__ps).length >= 2) { M.startGame(); closeNetPanel(); startOnline(M.room().game); } } catch (e) {} return; }
      if (a === "accept") {
      M.startGame();
      closeNetPanel();
      startOnline(M.room().game);
      return;
    }
    if (a === "decline") { M.send({ t: "decline" }); closeNetPanel(); M.leave(); return; }
    if (a === "join") {
      var codeEl = netEl.querySelector("#nva3-join-code");
      var gameEl = netEl.querySelector("#nva3-join-game");
      joinChallenge(codeEl ? codeEl.value : "", gameEl ? gameEl.value : "ludo");
    }
  }

  /* BroadcastChannel-only handshake (offline / no Firebase) */
  M && M.onMessage(function (m) {
    if (!m || !m.t) return;
    if (["join", "accept", "decline", "cancel", "start"].indexOf(m.t) >= 0) { handleHandshake(m); return; }
    if (NET2.recv) NET2.recv(m);
  });
  function handleHandshake(m) {
    if (!M) return;
    var R = M.room();
    if (m.t === "join" && R.role === "host" && !R.started) {
      openNet(
        '<div class="nva3-nh"><b>Match request</b><button type="button" data-netc="close">✕</button></div>' +
        '<p class="nva3-np"><b style="color:#fff">' + esc(m.from || "Friend") + "</b> wants to play " + esc(((gameById(R.game) || {}).n) || "a game") + ".</p>" +
        '<div class="nva3-nbtns"><button type="button" data-netc="accept">Accept &amp; start</button><button type="button" class="ghost" data-netc="decline">Decline</button></div>'
      );
      return;
    }
    if ((m.t === "start" || m.t === "accept") && R.role === "guest" && !R.started && R.game) {
      R.started = true;
      closeNetPanel();
      startOnline(R.game);
      return;
    }
    if (m.t === "decline" && R.role === "guest") {
      closeNetPanel(); M.leave();
      try { window.toast && window.toast("Challenge declined", "error"); } catch (e) {}
      return;
    }
    if (m.t === "cancel" && R.role === "guest" && !R.started) {
      closeNetPanel(); M.leave();
      try { window.toast && window.toast("Host cancelled the match", "error"); } catch (e) {}
    }
  }

  /* ============================================================
     Lobby (rooms, slots, ready, invites)
     ============================================================ */
  var LOBBY_GAMES = GAMES.filter(function (g) { return g.lobby; });
  var lobbyWatch = null;
  function lobbyPanelHTML() {
    if (!M) return '<div class="nva3-lobby-note">Multiplayer layer failed to load.</div>';
    var cloud = M.available();
    var gameOpts = LOBBY_GAMES.map(function (g) { return '<option value="' + g.id + '">' + esc(g.n) + "</option>"; }).join("");
    return (
      '<div class="nva3-lobby">' +
        '<div class="nva3-lobby-col">' +
          "<h3>" + svg("grid") + "Create a room</h3>" +
          '<label class="nva3-nl">Room name<input id="nva3-lb-name" maxlength="32" placeholder="Friday night board club"></label>' +
          '<label class="nva3-nl">Game<select id="nva3-lb-game">' + gameOpts + "</select></label>" +
          '<label class="nva3-nl nva3-switchrow"><span>Public room (listed for anyone)</span><input type="checkbox" id="nva3-lb-pub" checked></label>' +
          '<button type="button" class="nva3-roll" data-arc-act="lobby-create">' + svg("users") + "Create room</button>" +
          '<div class="nva3-lobby-join"><input id="nva3-lb-code" maxlength="7" placeholder="ROOM CODE" aria-label="Room code" style="text-transform:uppercase;letter-spacing:.25em">' +
          '<button type="button" data-arc-act="lobby-join">Join</button></div>' +
        "</div>" +
        '<div class="nva3-lobby-col">' +
          "<h3>" + svg("globe") + "Public rooms</h3>" +
          '<div class="nva3-lobby-rooms" id="nva3-lb-rooms"><div class="nva3-lobby-note">' +
          (cloud ? "Loading public rooms…" : "Public rooms need a Firebase backend. You can still join with a code on this device (tabs).") +
          "</div></div>" +
          '<button type="button" class="nva3-ghost-btn" data-arc-act="lobby-friends">' + svg("users") + "Friends &amp; invites</button>" +
          '<div class="nva3-lobby-note">Private rooms: create one, share the code or invite link — your friend joins instantly.</div>' +
        "</div>" +
      "</div>"
    );
  }
  function lobbyBind() {
    if (!M || !M.available()) return;
    if (lobbyWatch) { lobbyWatch(); lobbyWatch = null; }
    var box = menuEl.querySelector("#nva3-lb-rooms");
    if (!box) return;
    lobbyWatch = M.pubRooms(null, function (rooms) {
      var b = menuEl.querySelector("#nva3-lb-rooms");
      if (!b) return;
      if (!rooms.length) { b.innerHTML = '<div class="nva3-lobby-note">No public rooms right now — create one!</div>'; return; }
      b.innerHTML = rooms.map(function (r) {
        var g = gameById(r.game);
        return '<button type="button" class="nva3-lobby-room" data-arc-lobby="' + esc(r.code) + '">' +
          '<span class="nlr-ic" style="--g:' + (g ? g.c : "#888") + '">' + svg(g ? g.ic : "grid") + "</span>" +
          '<span class="nlr-tx"><b>' + esc(r.name || "Room") + "</b><span>" + esc(g ? g.n : r.game) + " · code " + esc(r.code) + "</span></span>" +
          '<span class="nlr-go">Join</span></button>';
      }).join("");
    });
  }
  var lobbyUnbind = null;
  function openLobbyRoom(game, code) {
    if (!M) return;
    var g = gameById(game) || LOBBY_GAMES[0];
    if (lobbyUnbind) { lobbyUnbind(); lobbyUnbind = null; }
    lobbyUnbind = M.onRoom(function () { paintLobbyRoom(g); });
    paintLobbyRoom(g);
  }
  function paintLobbyRoom(g) {
    var meta = M.room().meta || {};
    var players = meta.players || {};
    var ids = Object.keys(players);
    var max = meta.maxPlayers || 2;
    var slots = "";
    for (var i = 0; i < max; i++) {
      var p = players[ids[i]];
      slots += p
        ? '<div class="nva3-slot filled"><span class="nva3-slot-av">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</span><b>" + esc(p.name) + "</b><span>" + (ids[i] === meta.host ? "Host" : "Player") + "</span></div>"
        : '<div class="nva3-slot empty"><span class="nva3-slot-av">+</span><b>Open seat</b><span>Waiting…</span></div>';
    }
    var isHost = M.room().role === "host";
    openNet(
      '<div class="nva3-nh"><b>' + esc(g.n) + " room · " + esc(M.room().code) + '</b><button type="button" data-netc="close">✕</button></div>' +
      '<div class="nva3-slots">' + slots + "</div>" +
      '<label class="nva3-nl">Invite link<input readonly value="' + esc(M.linkFor(M.room().code, g.id)) + '"></label>' +
      '<div class="nva3-nbtns"><button type="button" data-netc="copycode">Copy code</button><button type="button" data-netc="copylink">Copy link</button><button type="button" data-netc="invite">Invite friends</button></div>' +
      (isHost
        ? '<div class="nva3-nbtns"><button type="button" data-netc="lbstart"' + (ids.length >= 2 ? "" : " disabled") + ">Start match</button><button type=\"button\" class=\"ghost\" data-netc=\"close\">Leave</button></div>"
        : '<div class="nva3-nwait"><i></i> Waiting for the host to start…</div>')
    );
  }
  function lobbyCreate() {
    build();
    if (!M) return;
    var nameEl = menuEl.querySelector("#nva3-lb-name");
    var gameEl = menuEl.querySelector("#nva3-lb-game");
    var pubEl = menuEl.querySelector("#nva3-lb-pub");
    var game = (gameEl && gameEl.value) || "ludo";
    M.create({
      game: game,
      lobby: true,
      public: pubEl ? pubEl.checked : true,
      name: (nameEl && nameEl.value) || (M.name() + "'s room"),
      maxPlayers: game === "ludo" ? 4 : 2
    }).then(function (code) {
      curCat = "lobby";
      menuEl.innerHTML = menuHTML();
      openLobbyRoom(game, code);
    });
  }
  function lobbyJoin(code) {
    build();
    if (!M) return;
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!code) { try { window.toast && window.toast("Enter a room code", "error"); } catch (e) {} return; }
    M.join(code).then(function () {
      var game = M.room().game || "ludo";
      curCat = "lobby";
      menuEl.innerHTML = menuHTML();
      openLobbyRoom(game, code);
    }).catch(function (err) {
      try { window.toast && window.toast((err && err.message) || "Could not join room", "error"); } catch (e) {}
    });
  }
  function closeLobby() {
    if (lobbyUnbind) { lobbyUnbind(); lobbyUnbind = null; }
    closeNetPanel();
    if (M && M.room().code) M.leave();
  }
  function friendsPanel() {
    build();
    if (!M) return;
    if (!M.available()) {
      openNet('<div class="nva3-nh"><b>Friends &amp; invites</b><button type="button" data-netc="close">✕</button></div><p class="nva3-np">Friends and invitations need the cloud backend (Firebase). See DEPLOYMENT.md for the 5-minute setup.</p>');
      return;
    }
    openNet(
      '<div class="nva3-nh"><b>Friends &amp; invites</b><button type="button" data-netc="close">✕</button></div>' +
      '<label class="nva3-nl">Search players<input id="nva3-fr-q" placeholder="Type a player name…"></label>' +
      '<div class="nva3-fr-list" id="nva3-fr-res"><span class="nva3-lobby-note">Type at least 2 letters.</span></div>' +
      '<div class="nva3-fr-sect">Requests</div><div class="nva3-fr-list" id="nva3-fr-req"></div>' +
      '<div class="nva3-fr-sect">My friends</div><div class="nva3-fr-list" id="nva3-fr-list"></div>'
    );
    var qEl = netEl.querySelector("#nva3-fr-q");
    var tId = null;
    if (qEl) qEl.addEventListener("input", function () {
      clearTimeout(tId);
      tId = setTimeout(function () {
        var q = (qEl.value || "").trim();
        if (q.length < 2) return;
        M.findUserByName(q, function (users) {
          var box = netEl.querySelector("#nva3-fr-res");
          if (!box) return;
          if (!users.length) { box.innerHTML = '<span class="nva3-lobby-note">No players found.</span>'; return; }
          box.innerHTML = users.map(function (u) {
            return '<div class="nva3-fr-row"><span class="nva3-slot-av">' + esc((u.name || "?").charAt(0).toUpperCase()) + "</span><b>" + esc(u.name) + "</b>" +
              '<button type="button" data-fr-add="' + esc(u.uid) + '" data-fr-name="' + esc(u.name) + '">＋ Friend</button></div>';
          }).join("");
        });
      }, 300);
    });
    var unbindF = M.watchFriends(function (f) {
      var reqEl = netEl.querySelector("#nva3-fr-req");
      var listEl = netEl.querySelector("#nva3-fr-list");
      if (!reqEl || !listEl) return;
      var reqs = Object.keys(f.requests || {});
      var list = Object.keys(f.list || {});
      reqEl.innerHTML = reqs.length ? reqs.map(function (rid) {
        var info = f.requests[rid] || {};
        return '<div class="nva3-fr-row"><span class="nva3-slot-av">' + esc((info.name || "?").charAt(0).toUpperCase()) + "</span><b>" + esc(info.name || rid) + "</b>" +
          '<button type="button" data-fr-acc="' + esc(rid) + '" data-fr-name="' + esc(info.name || "") + '">Accept</button>' +
          '<button type="button" class="ghost" data-fr-dec="' + esc(rid) + '">Decline</button></div>';
      }).join("") : '<span class="nva3-lobby-note">No pending requests.</span>';
      listEl.innerHTML = list.length ? list.map(function (fid) {
        var info = f.list[fid] || {};
        return '<div class="nva3-fr-row"><span class="nva3-slot-av">' + esc((info.name || "?").charAt(0).toUpperCase()) + "</span><b>" + esc(info.name || fid) + "</b>" +
          '<button type="button" class="ghost" data-fr-del="' + esc(fid) + '">Remove</button></div>';
      }).join("") : '<span class="nva3-lobby-note">Add friends with ＋ Friend above.</span>';
    });
    netEl.addEventListener("click", function (e) {
      var add = e.target.closest("[data-fr-add]");
      if (add) { M.sendFriendRequest(add.getAttribute("data-fr-add"), add.getAttribute("data-fr-name")); return; }
      var acc = e.target.closest("[data-fr-acc]");
      if (acc) { M.acceptFriend(acc.getAttribute("data-fr-acc"), { name: acc.getAttribute("data-fr-name") }); return; }
      var dec = e.target.closest("[data-fr-dec]");
      if (dec) { M.declineFriend(dec.getAttribute("data-fr-dec")); return; }
      var del = e.target.closest("[data-fr-del]");
      if (del) { M.removeFriend(del.getAttribute("data-fr-del")); return; }
    });
    var oldClose = onNetClick;
    /* ensure leaving the friends panel stops the watcher */
    netEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-netc='close']")) { setTimeout(function () { unbindF(); }, 0); }
      void oldClose;
    });
  }

  /* ============================================================
     Click routing + input
     ============================================================ */
  function onClick(e) {
    if (e.target.closest("[data-arc-close]")) { close(); return; }
    var sfx = e.target.closest("#nva3-sfx");
    if (sfx) { var v = SFX.toggle(); sfx.classList.toggle("on", v); SFX.play("click"); return; }
    if (e.target.closest("#nva3-stats")) { showStats(); return; }
    var cat = e.target.closest("[data-arc-cat]");
    if (cat) { curCat = cat.getAttribute("data-arc-cat"); SFX.play("click"); menuEl.innerHTML = menuHTML(); if (curCat === "lobby") lobbyBind(); return; }
    var lob = e.target.closest("[data-arc-lobby]");
    if (lob) { lobbyJoin(lob.getAttribute("data-arc-lobby")); return; }
    var ch = e.target.closest("[data-arc-chal]");
    if (ch) { openChallenge(ch.getAttribute("data-arc-chal")); return; }
    if (e.target.closest("[data-arc-join]")) { openJoin(); return; }
    if (e.target.closest("[data-arc-act='lobby-create']")) { lobbyCreate(); return; }
    if (e.target.closest("[data-arc-act='lobby-join']")) { var ci = menuEl.querySelector("#nva3-lb-code"); lobbyJoin(ci ? ci.value : ""); return; }
    if (e.target.closest("[data-arc-act='lobby-friends']")) { friendsPanel(); return; }
    var p = e.target.closest("[data-arc-play]");
    if (p) { SFX.play("click"); play(p.getAttribute("data-arc-play")); return; }
    if (e.target.closest("#nva3-back")) { closeLobby(); showMenu(); return; }
    if (e.target.closest("#nva3-restart")) { restart(); return; }
    var a = e.target.closest("[data-arc-act]");
    if (a) {
      var act = a.getAttribute("data-arc-act");
      if (act === "close-over") { if (overlayEl) { overlayEl.classList.remove("on"); overlayEl.innerHTML = ""; } return; }
      if (act === "rules-close") { if (overlayEl) { overlayEl.classList.remove("on"); overlayEl.innerHTML = ""; } return; }
      if (active && active.action) active.action(act);
      return;
    }
    var k = e.target.closest("[data-arc-key]");
    if (k) { var kk = k.getAttribute("data-arc-key"); if (active && active.key) active.key(kk); }
  }

  /* ---------- pointer / keyboard input ---------- */
  function onPointerDown(e) {
    if (!active) return;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    var p = pos(e);
    swipeStart = { x: p.x, y: p.y };
    if (active.down) active.down(p.x, p.y);
  }
  function onPointerMove(e) {
    if (!active) return;
    var p = pos(e);
    if (active.move && (e.buttons || e.pointerType === "touch")) active.move(p.x, p.y);
  }
  function onPointerUp(e) {
    if (!active) return;
    var p = pos(e);
    if (swipeStart && active.swipe) {
      var dx = p.x - swipeStart.x, dy = p.y - swipeStart.y;
      if (Math.abs(dx) > 22 || Math.abs(dy) > 22) active.swipe(dx, dy);
    }
    if (active.up) active.up(p.x, p.y);
    swipeStart = null;
  }
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * canvas.width, y: (e.clientY - r.top) / r.height * canvas.height };
  }
  document.addEventListener("keydown", function (e) {
    if (!openNow) return;
    if (e.key === "Escape") { if (active) { closeLobby(); showMenu(); } else close(); return; }
    if (/^Arrow|^[wasdWASD]$/.test(e.key) || e.key === " ") {
      var domOpen = domEl && !domEl.hidden && (curGame === "n2048");
      if (stageEl && !stageEl.hidden && !domOpen) e.preventDefault();
    }
    keys[e.key] = true;
    if (active && active.key) active.key(e.key);
  });
  document.addEventListener("keyup", function (e) { keys[e.key] = false; });

  /* ---------- shared draw helpers ---------- */
  function bg(c, top, bottom) {
    var g = c.createLinearGradient(0, 0, 0, c.canvas.height);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    c.fillStyle = g; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
  }
  function round(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    c.closePath();
  }
  function label(c, text, x, y, size, color, align, weight) {
    c.font = (weight || 700) + " " + size + "px Sora, system-ui, sans-serif";
    c.fillStyle = color; c.textAlign = align || "center"; c.textBaseline = "middle";
    c.fillText(text, x, y);
  }
  function ghostBtn(act, icon, lbl, danger) {
    return '<button type="button" class="nva3-ghost-btn' + (danger ? " danger" : "") + '" data-arc-act="' + act + '">' + svg(icon) + lbl + "</button>";
  }
  function showStats() {
    var h = STATS.history || [];
    var rows = h.length ? h.slice(0, 10).map(function (r) {
      var g = gameById(r.g);
      var cls = r.r === "win" ? "w" : r.r === "loss" ? "l" : "d";
      return '<div class="nva3-hrow ' + cls + '"><b>' + esc(g ? g.n : r.g) + "</b><span>" + esc(r.d || r.r) + "</span><i>" + esc(new Date(r.ts).toLocaleDateString()) + "</i></div>";
    }).join("") : '<div class="nva3-hrow"><span>No games yet — go win one!</span></div>';
    openNet(
      '<div class="nva3-nh"><b>Your record</b><button type="button" data-netc="close">✕</button></div>' +
      '<div class="nva3-statrow"><div><b>' + STATS.wins + "</b><span>Wins</span></div><div><b>" + STATS.losses + "</b><span>Losses</span></div><div><b>" + STATS.draws + "</b><span>Draws</span></div><div><b>" + STATS.played + "</b><span>Played</span></div></div>" +
      '<div class="nva3-fr-sect">Recent games</div>' + rows +
      '<div class="nva3-nbtns"><button type="button" class="ghost" data-netc="wipestats">Reset record</button></div>'
    );
    netEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-netc='wipestats']")) {
        STATS = { wins: 0, losses: 0, draws: 0, played: 0, history: [] };
        saveSTATS();
        showStats();
      }
    });
  }

  /* ---------- rules ---------- */
  function guidesHTML(id) {
    var g = {
      doodle: ["Tap ← → or drag to steer — you bounce automatically.", "Green pads boost you higher; purple pads slide sideways.", "Wrap around the screen edges — falling ends the run.", "Score climbs the higher you climb. Your best is saved."],
      snake: ["Steer with arrows / WASD or swipes.", "Eat the glowing core to grow — every bite speeds the game up.", "Walls and your own tail are deadly.", "Space restarts after a crash."],
      pong: ["Move your paddle with ↑ ↓ or by dragging.", "The first to 7 points wins the rally game.", "The CPU tracks the ball — sharper angles beat it."],
      breakout: ["Steer the paddle to keep the ball alive.", "Clear all bricks to advance — the ball speeds up.", "You have 3 lives. Darker bricks take two hits."],
      ludo: ["Roll a 6 to move a token out of its base.", "Move clockwise by the exact dice value — you must roll the exact number to enter home.", "Landing on an opponent sends that token back to base — unless it stands on a safe square.", "Two or more tokens on one square form a blockade: opponents can neither land on nor pass it.", "A 6, a capture, or a token reaching home earns an extra turn.", "Rolling three 6s in a row forfeits your turn.", "Safe squares are the four coloured start squares plus the four star squares.", "First player to bring all four tokens home wins."],
      chess: ["White moves first. Tap a piece to see its legal moves, then tap a highlighted square.", "Castling, en passant and pawn promotion are fully supported — you pick the promotion piece.", "Moves that leave your own king in check are blocked automatically.", "The game ends by checkmate, stalemate, resignation or an agreed draw.", "Draws are detected automatically for the 50-move rule, threefold repetition and insufficient material.", "Use Hint for a suggested move, Offer draw to negotiate, and Resign to concede.", "Optional chess clock: pick 5 or 10 minutes per side."],
      checkers: ["Pieces move diagonally forward one square.", "Jump an opponent to capture it — jumps are mandatory when available.", "Chain jumps capture several pieces in one turn.", "Reaching the far row crowns a King, which may move backwards too.", "Win by capturing every enemy piece or leaving them without a move."],
      ttt: ["Take turns marking a 3×3 grid.", "Line up three of your marks in any direction to win.", "The Hard AI plays perfectly — a draw is a great result.", "Play a friend locally or online with a room code."],
      connect4: ["Tap a column to drop your disc — it falls to the lowest open cell.", "Line up four of your colour horizontally, vertically or diagonally to win.", "The AI blocks and builds threats — think ahead.", "Red always starts."],
      "n2048": ["Swipe or press arrows to slide every tile.", "Equal tiles merge into their sum.", "Reach the 2048 tile to win — keep going for a high score.", "The board fills up: plan merges ahead."],
      sudoku: ["Fill every row, column and 3×3 box with 1-9.", "Tap a cell then type a number, or use the keypad.", "Mistakes are counted as you play.", "Puzzles are generated fresh with a unique solution."],
      memory: ["Flip two cards per turn.", "Matching pairs stay open.", "Clear the board in the fewest moves and fastest time.", "Choose 4×4 or 6×6 in settings."],
      minesweeper: ["Tap a cell to reveal it. Numbers show adjacent mines.", "Long-press (or right-click / Flag mode) to flag suspected bombs.", "Clear every safe cell to win; hitting a mine ends the run.", "Three board sizes with rising mine density."],
      reversi: ["Place a disc so it brackets enemy discs — they flip to your colour.", "You must have a legal move; if not, your turn passes.", "Corners can never be flipped — grab them.", "Most discs when the board fills wins."],
      racer: ["Switch lanes with ← → or swipes.", "Dodge traffic — speed ramps up forever.", "One hit ends the run. Close calls score extra."],
      reaction: ["Wait for the panel to turn GREEN.", "Tap as fast as you can — your reaction time is scored.", "Tap too early and the attempt restarts.", "Five rounds; best and average are tracked."],
      simon: ["Watch the pads light up in order.", "Repeat the sequence by tapping the pads.", "Each round adds one step. One mistake ends the run."]
    }[id];
    return (g || []).map(function (t) { return "<li>" + t + "</li>"; }).join("");
  }
  function openRules(id) {
    if (!overlayEl) return;
    var g = gameById(id);
    overlayEl.innerHTML = '<div class="nva3-rules"><span class="nva3-over-k">HOW TO PLAY</span><b>' + esc(g ? g.n : id) + " rules</b>" +
      "<ul>" + guidesHTML(id) + "</ul>" +
      '<div class="nva3-over-btns"><button type="button" data-arc-act="rules-close">' + svg("check") + "Got it</button></div></div>";
    overlayEl.classList.add("on");
  }

  /* ============================================================
     DOODLE JUMP
     ============================================================ */
  function Doodle() {
    var W = 420, H = 620, apiA = api("doodle");
    var player, plats, score, alive, started, prevY, cam;
    var stars = [];
    for (var s = 0; s < 46; s++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, a: Math.random() * 0.5 + 0.2 });

    function platform(x, y, w, type) { return { x: x, y: y, w: w, h: 12, type: type || "normal", vx: type === "move" ? (Math.random() < 0.5 ? -0.9 : 0.9) : 0 }; }
    function reset() {
      player = { x: W / 2, y: H - 110, vx: 0, vy: -12 };
      plats = [platform(W / 2 - 45, H - 70, 90, "normal")];
      score = 0; alive = true; started = false; prevY = player.y; cam = 0;
      var y = H - 70;
      while (y > -H) {
        y -= 58 + Math.random() * 46;
        var type = Math.random() < 0.12 ? "move" : (Math.random() < 0.1 ? "boost" : "normal");
        plats.push(platform(18 + Math.random() * (W - 36 - 74), y, 74 + Math.random() * 26, type));
      }
      apiA.status("Arrows or drag to steer");
      apiA.clearOver();
    }
    reset();
    function die() {
      if (!alive) return;
      alive = false;
      SFX.play("lose");
      apiA.record(score);
      apiA.status("Fell — restart to try again");
      apiA.over("You fell!", "Score " + score + " · Best " + fmtN(HS.doodle || score), score >= (HS.doodle || 0) ? "win" : "loss");
      recordResult("doodle", score >= (HS.doodle || score) && score > 0 ? "win" : "loss", "score " + score);
    }
    return {
      start: function () {},
      update: function (dt) {
        if (!alive) return;
        var ms = dt / 16.67;
        if (!started) {
          if (keys.ArrowLeft || keys.ArrowRight || keys.a || keys.d) started = true;
        }
        player.vx = 0;
        if (keys.ArrowLeft || keys.a) player.vx = -4.4;
        if (keys.ArrowRight || keys.d) player.vx = 4.4;
        if (player.vx) started = true;
        player.x += player.vx * ms;
        if (player.x < -14) player.x = W + 14;
        if (player.x > W + 14) player.x = -14;
        prevY = player.y;
        player.vy += 0.6 * ms;
        player.y += player.vy * ms;
        for (var i = 0; i < plats.length; i++) {
          var p = plats[i];
          if (p.type === "move") {
            p.x += p.vx * ms;
            if (p.x < 8 || p.x + p.w > W - 8) p.vx *= -1;
          }
          var bottom = player.y + 16;
          var prevBottom = prevY + 16;
          if (player.vy > 0 && prevBottom <= p.y + 2 && bottom >= p.y && player.x > p.x - 10 && player.x < p.x + p.w + 10) {
            player.vy = p.type === "boost" ? -16.5 : -12.4;
            SFX.play("jump");
            if (p.type === "boost") p.type = "normal";
            started = true;
          }
        }
        if (player.y < H * 0.42) {
          var shift = H * 0.42 - player.y;
          player.y = H * 0.42;
          for (var j = 0; j < plats.length; j++) plats[j].y += shift;
          score += Math.round(shift * 0.14);
          apiA.score(score, HS.doodle || 0);
        }
        var minY = 0;
        for (var k = 0; k < plats.length; k++) minY = Math.min(minY, plats[k].y);
        while (minY > -80) {
          var ny = minY - (56 + Math.random() * 46);
          var t = Math.random() < 0.12 ? "move" : (Math.random() < 0.1 ? "boost" : "normal");
          plats.push(platform(18 + Math.random() * (W - 36 - 74), ny, 74 + Math.random() * 26, t));
          minY = ny;
        }
        plats = plats.filter(function (p) { return p.y < H + 80; });
        if (player.y > H + 50) die();
      },
      draw: function (c) {
        bg(c, "#061225", "#04070D");
        c.save();
        for (var i = 0; i < stars.length; i++) {
          c.globalAlpha = stars[i].a;
          c.fillStyle = "#DCE6FF";
          c.fillRect(stars[i].x, (stars[i].y + score * 0.25) % H, stars[i].r, stars[i].r);
        }
        c.restore();
        for (var j = 0; j < plats.length; j++) {
          var p = plats[j];
          c.fillStyle = p.type === "boost" ? "#34D399" : p.type === "move" ? "#A78BFA" : "#22D3EE";
          round(c, p.x, p.y, p.w, p.h, 3); c.fill();
          c.fillStyle = "rgba(255,255,255,.4)";
          c.fillRect(p.x + 3, p.y + 2, p.w - 6, 2);
        }
        c.save();
        c.translate(player.x, player.y);
        c.fillStyle = "#0B1220"; c.strokeStyle = "#EEF3FF"; c.lineWidth = 2;
        round(c, -13, -15, 26, 30, 4); c.fill(); c.stroke();
        c.fillStyle = "#22D3EE";
        c.fillRect(-13, -15, 26, 5);
        c.fillStyle = "#EEF3FF";
        c.fillRect(-7, -4, 4, 5); c.fillRect(3, -4, 4, 5);
        c.fillStyle = "#F472B6"; c.fillRect(-3, 5, 6, 2);
        c.restore();
        label(c, String(score), W / 2, 28, 22, "#fff", "center", 800);
        if (!started && alive) label(c, "Tap arrows / drag to steer", W / 2, H / 2 + 120, 14, "rgba(238,243,255,.6)");
      },
      key: function (k) { if (/^Arrow|^[wasd]$/i.test(k)) started = true; },
      move: function (x) {
        var d = x - player.x;
        if (Math.abs(d) > 4) player.vx = d > 0 ? 4.4 : -4.4;
        else player.vx = 0;
        if (Math.abs(d) > 4) { player.x += Math.sign(d) * 3; started = true; }
      },
      action: function (a) { if (a === "restart") reset(); if (a === "menu") showMenu(); },
      stop: function () {}
    };
  }

  /* ============================================================
     SNAKE
     ============================================================ */
  function Snake() {
    var W = 600, H = 600, apiA = api("snake");
    var N = 22, cell = W / N;
    var speedIdx = CFG.snake === "slow" ? 0 : CFG.snake === "fast" ? 2 : 1;
    var snake, dir, queue, food, score, alive, started, acc, stepMs, pulse;
    function reset() {
      snake = [{ x: 8, y: 11 }, { x: 7, y: 11 }, { x: 6, y: 11 }];
      dir = { x: 1, y: 0 }; queue = [];
      food = { x: 14, y: 11 };
      score = 0; alive = true; started = false; acc = 0; pulse = 0;
      stepMs = speedIdx === 0 ? 165 : speedIdx === 1 ? 135 : 105;
      apiA.status("Arrows / WASD or swipe");
      apiA.clearOver();
      apiA.score(0, HS.snake || 0);
    }
    reset();
    function placeFood() {
      for (var tries = 0; tries < 300; tries++) {
        var f = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
        var bad = false;
        for (var i = 0; i < snake.length; i++) if (snake[i].x === f.x && snake[i].y === f.y) bad = true;
        if (!bad) { food = f; return; }
      }
    }
    function addDir(x, y) {
      var base = queue.length ? queue[queue.length - 1] : dir;
      if (base.x === -x && base.y === -y) return;
      started = true;
      if (base.x === x && base.y === y) return;
      queue.push({ x: x, y: y });
    }
    function step() {
      if (queue.length) dir = queue.shift();
      var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) return die();
      for (var i = 1; i < snake.length; i++) if (snake[i].x === head.x && snake[i].y === head.y) return die();
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10; stepMs = Math.max(62, stepMs - 3.4);
        pulse = 1;
        SFX.play("eat");
        placeFood();
        apiA.score(score, HS.snake || 0);
      } else snake.pop();
    }
    function die() {
      alive = false;
      SFX.play("lose");
      apiA.record(score);
      apiA.status("Crashed at " + score);
      apiA.over("Snake down!", "Length " + snake.length + " · Score " + score, score >= (HS.snake || 0) && score > 0 ? "win" : "loss");
      recordResult("snake", score >= (HS.snake || score) && score > 0 ? "win" : "loss", "score " + score);
    }
    return {
      start: function () {},
      update: function (dt) {
        if (!alive) return;
        pulse = Math.max(0, pulse - dt / 220);
        if (!started) return;
        acc += dt;
        while (acc >= stepMs) { acc -= stepMs; step(); if (!alive) break; }
      },
      draw: function (c) {
        bg(c, "#06140F", "#03070A");
        c.strokeStyle = "rgba(148,163,255,.07)"; c.lineWidth = 1;
        for (var i = 1; i < N; i++) {
          c.beginPath(); c.moveTo(i * cell, 0); c.lineTo(i * cell, H); c.stroke();
          c.beginPath(); c.moveTo(0, i * cell); c.lineTo(W, i * cell); c.stroke();
        }
        c.fillStyle = "#F87171";
        c.shadowColor = "#F87171"; c.shadowBlur = 12 + pulse * 18;
        round(c, food.x * cell + 5, food.y * cell + 5, cell - 10, cell - 10, 4); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#34F5C5";
        c.fillRect(food.x * cell + cell / 2 - 1.5, food.y * cell + 4, 3, cell - 8);
        c.fillRect(food.x * cell + 4, food.y * cell + cell / 2 - 1.5, cell - 8, 3);
        for (var s = snake.length - 1; s >= 0; s--) {
          var b = snake[s];
          var t = s / Math.max(1, snake.length);
          c.fillStyle = s === 0 ? "#9BFFE3" : "rgba(52,245,197," + (0.85 - t * 0.5) + ")";
          round(c, b.x * cell + 2, b.y * cell + 2, cell - 4, cell - 4, 3); c.fill();
          if (s === 0) {
            c.fillStyle = "#04120F";
            var ex = dir.x > 0 ? cell - 8 : dir.x < 0 ? 5 : 7;
            var ey = dir.y > 0 ? cell - 8 : dir.y < 0 ? 5 : 7;
            c.fillRect(b.x * cell + ex, b.y * cell + ey, 3, 3);
            if (!dir.x) c.fillRect(b.x * cell + cell - 10, b.y * cell + ey, 3, 3);
          }
        }
        label(c, String(score), W - 16, 26, 18, "rgba(238,243,255,.9)", "right", 800);
        label(c, "Snake", 16, 26, 12, "rgba(238,243,255,.45)", "left", 700);
        if (!started && alive) {
          c.fillStyle = "rgba(2,6,10,.74)"; c.fillRect(0, 0, W, H);
          c.fillStyle = "rgba(5,15,12,.98)"; c.strokeStyle = "rgba(52,245,197,.42)"; c.lineWidth = 1.5;
          round(c, W / 2 - 172, H / 2 - 96, 344, 192, 10); c.fill(); c.stroke();
          label(c, "+  SNAKE  +", W / 2, H / 2 - 58, 27, "#34F5C5", "center", 900);
          label(c, "READY TO SLITHER", W / 2, H / 2 - 30, 9, "rgba(52,245,197,.6)", "center", 800);
          label(c, "Press an arrow key, WASD or swipe", W / 2, H / 2 + 4, 13.5, "#EEF3FF", "center", 700);
          label(c, "Eat the red core — avoid walls and your own tail", W / 2, H / 2 + 34, 11, "rgba(238,243,255,.5)", "center", 600);
        }
        if (!alive) {
          c.fillStyle = "rgba(3,7,10,.55)"; c.fillRect(0, 0, W, H);
        }
      },
      key: function (k) {
        if (k === "ArrowUp" || k === "w" || k === "W") addDir(0, -1);
        else if (k === "ArrowDown" || k === "s" || k === "S") addDir(0, 1);
        else if (k === "ArrowLeft" || k === "a" || k === "A") addDir(-1, 0);
        else if (k === "ArrowRight" || k === "d" || k === "D") addDir(1, 0);
        else if (k === " " && !alive) reset();
      },
      swipe: function (dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) addDir(dx > 0 ? 1 : -1, 0);
        else addDir(0, dy > 0 ? 1 : -1);
      },
      action: function (a) { if (a === "restart") reset(); if (a === "menu") showMenu(); },
      stop: function () {}
    };
  }

  /* ============================================================
     PONG
     ============================================================ */
  function Pong() {
    var W = 600, H = 600, apiA = api("pong");
    var pH = 96, pw = 12, target = 7;
    var py, cy, ball, scoreP, scoreC, serving, rallying, over;
    function reset() {
      py = cy = H / 2; scoreP = 0; scoreC = 0; over = false;
      serve(1); apiA.clearOver(); apiA.score(0, HS.pong || 0);
      apiA.status("↑ ↓ or drag — first to 7");
    }
    function serve(dirTo) {
      ball = { x: W / 2, y: H / 2, vx: dirTo * 5.2, vy: (Math.random() * 4 - 2) };
      serving = 900;
      rallying = false;
    }
    reset();
    function point(who) {
      if (who === "p") scoreP++; else scoreC++;
      SFX.play(who === "p" ? "good" : "bad");
      apiA.score(scoreP * 100, HS.pong || 0);
      if (scoreP >= target || scoreC >= target) {
        over = true;
        apiA.record(scoreP * 100 + (scoreP > scoreC ? 1000 : 0));
        apiA.over(scoreP > scoreC ? "You win!" : "CPU wins", scoreP + " : " + scoreC, scoreP > scoreC ? "win" : "loss");
        recordResult("pong", scoreP > scoreC ? "win" : "loss", scoreP + "–" + scoreC);
      } else serve(who === "p" ? 1 : -1);
    }
    return {
      start: function () {},
      update: function (dt) {
        if (over) return;
        var ms = dt / 16.67;
        if (serving > 0) { serving -= dt; return; }
        if (keys.ArrowUp || keys.w || keys.W) py -= 7 * ms;
        if (keys.ArrowDown || keys.s || keys.S) py += 7 * ms;
        py = Math.max(pH / 2 + 8, Math.min(H - pH / 2 - 8, py));
        /* simple tracking CPU — deliberately beatable */
        var diff = ball.y - cy;
        cy += Math.max(-5.2, Math.min(5.2, diff * 0.09)) * ms;
        cy = Math.max(pH / 2 + 8, Math.min(H - pH / 2 - 8, cy));
        ball.x += ball.vx * ms; ball.y += ball.vy * ms;
        if (ball.y < 8) { ball.y = 8; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H - 8) { ball.y = H - 8; ball.vy = -Math.abs(ball.vy); }
        /* player paddle at x=30, CPU at x=W-30 */
        if (ball.vx < 0 && ball.x < 42 && Math.abs(ball.y - py) < pH / 2 + 8) {
          ball.vx = -ball.vx * 1.04;
          ball.vy += (ball.y - py) * 0.06;
          SFX.play("move");
        }
        if (ball.vx > 0 && ball.x > W - 42 && Math.abs(ball.y - cy) < pH / 2 + 8) {
          ball.vx = -ball.vx * 1.04;
          ball.vy += (ball.y - cy) * 0.06;
        }
        if (ball.x < 0) point("c");
        if (ball.x > W) point("p");
      },
      draw: function (c) {
        bg(c, "#0A0E1E", "#05070F");
        c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 3; c.setLineDash([9, 13]);
        c.beginPath(); c.moveTo(W / 2, 14); c.lineTo(W / 2, H - 14); c.stroke();
        c.setLineDash([]);
        c.font = "800 52px Sora, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = "rgba(244,114,182,.8)"; c.fillText(String(scoreP), W / 2 - 80, 64);
        c.fillStyle = "rgba(148,163,255,.8)"; c.fillText(String(scoreC), W / 2 + 80, 64);
        round(c, 30 - pw, py - pH / 2, pw, pH, 6); c.fillStyle = "#F472B6"; c.fill();
        round(c, W - 30, cy - pH / 2, pw, pH, 6); c.fillStyle = "#60A5FA"; c.fill();
        c.beginPath(); c.arc(ball.x, ball.y, 8, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
        if (serving > 0 && !over) label(c, "Get ready…", W / 2, H / 2, 18, "rgba(238,243,255,.7)");
      },
      move: function (x, y) { py = Math.max(pH / 2 + 8, Math.min(H - pH / 2 - 8, y)); },
      key: function (k) { if (k === " " && over) reset(); },
      action: function (a) { if (a === "restart") reset(); if (a === "menu") showMenu(); },
      stop: function () {}
    };
  }

  /* ============================================================
     BREAKOUT
     ============================================================ */
  function Breakout() {
    var W = 600, H = 600, apiA = api("breakout");
    var pw = 96, ph = 13;
    var px, ball, bricks, lives, level, score, alive, launched;
    var COLS = 9, ROWS = 5, BW = 56, BH = 20, GAP = 6, TOP = 70;
    function makeBricks() {
      var arr = [];
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          arr.push({
            x: 24 + c * (BW + GAP), y: TOP + r * (BH + GAP),
            hp: r < 2 ? 2 : 1,
            col: ["#FB923C", "#FBBF24", "#34D399", "#38BDF8", "#A78BFA"][r]
          });
        }
      }
      return arr;
    }
    function reset(full) {
      if (full) { score = 0; lives = 3; level = 1; }
      px = W / 2;
      bricks = makeBricks();
      ball = { x: W / 2, y: H - 70, vx: 0, vy: 0 };
      launched = false; alive = true;
      apiA.status("← → or drag — break them all");
      apiA.clearOver();
      apiA.score(score, HS.breakout || 0);
    }
    reset(true);
    function launch() {
      if (launched) return;
      launched = true;
      ball.vx = (Math.random() * 3 - 1.5) || 2;
      ball.vy = -5.6 - level * 0.3;
    }
    function loseLife() {
      lives--;
      SFX.play("bad");
      if (lives <= 0) {
        alive = false;
        apiA.record(score);
        apiA.over("Game over", "Level " + level + " · Score " + score, "loss");
        recordResult("breakout", "loss", "score " + score);
      } else {
        ball = { x: px, y: H - 70, vx: 0, vy: 0 };
        launched = false;
      }
    }
    function levelUp() {
      level++;
      score += 250;
      SFX.play("win");
      reset(false);
    }
    return {
      start: function () {},
      update: function (dt) {
        if (!alive) return;
        var ms = dt / 16.67;
        if (keys.ArrowLeft || keys.a || keys.A) px -= 7.4 * ms;
        if (keys.ArrowRight || keys.d || keys.D) px += 7.4 * ms;
        px = Math.max(pw / 2 + 6, Math.min(W - pw / 2 - 6, px));
        if (!launched) { ball.x = px; ball.y = H - 70; return; }
        ball.x += ball.vx * ms; ball.y += ball.vy * ms;
        if (ball.x < 8) { ball.x = 8; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - 8) { ball.x = W - 8; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < 8) { ball.y = 8; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H - 30 && ball.y < H - 12 && Math.abs(ball.x - px) < pw / 2 + 8 && ball.vy > 0) {
          ball.vy = -Math.abs(ball.vy) * 1.02;
          ball.vx += (ball.x - px) * 0.05;
          SFX.play("move");
        }
        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (ball.x > b.x - 7 && ball.x < b.x + BW + 7 && ball.y > b.y - 7 && ball.y < b.y + BH + 7) {
            var hitSide = Math.abs(ball.x - (b.x + BW / 2)) > Math.abs(ball.y - (b.y + BH / 2));
            if (hitSide) ball.vx = -ball.vx; else ball.vy = -ball.vy;
            b.hp--;
            score += 10;
            if (b.hp <= 0) { bricks.splice(i, 1); SFX.play("eat"); } else SFX.play("click");
            apiA.score(score, HS.breakout || 0);
            break;
          }
        }
        if (!bricks.length) levelUp();
        if (ball.y > H + 24) loseLife();
      },
      draw: function (c) {
        bg(c, "#120D08", "#05070F");
        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          c.globalAlpha = b.hp === 2 ? 1 : 0.85;
          c.fillStyle = b.col;
          round(c, b.x, b.y, BW, BH, 4); c.fill();
          if (b.hp === 2) { c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(b.x + 3, b.y + 3, BW - 6, 3); }
        }
        c.globalAlpha = 1;
        round(c, px - pw / 2, H - 24, pw, ph, 6); c.fillStyle = "#FB923C"; c.fill();
        c.beginPath(); c.arc(ball.x, ball.y, 7, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
        label(c, "LIVES " + lives, 18, 26, 13, "rgba(238,243,255,.8)", "left", 800);
        label(c, "LVL " + level, W - 18, 26, 13, "rgba(238,243,255,.8)", "right", 800);
        if (!launched && alive) label(c, "Tap / press Space to launch", W / 2, H / 2 + 60, 14, "rgba(238,243,255,.6)");
      },
      move: function (x) { px = Math.max(pw / 2 + 6, Math.min(W - pw / 2 - 6, x)); },
      down: function () { launch(); },
      key: function (k) { if (k === " ") { if (!alive) reset(true); else launch(); } },
      action: function (a) { if (a === "restart") reset(true); if (a === "menu") showMenu(); },
      stop: function () {}
    };
  }

  /* ============================================================
     NEON RACER
     ============================================================ */
  function Racer() {
    var W = 420, H = 620, apiA = api("racer");
    var LANEW = W / 3, lanes = [LANEW * 0.5, LANEW * 1.5, LANEW * 2.5];
    var lane, speed, score, alive, started, obs, stripes, nearMisses;
    function reset() {
      lane = 1; speed = 5.2; score = 0; alive = true; started = false;
      obs = []; stripes = []; nearMisses = 0;
      for (var y = -80; y < H + 160; y += 70) stripes.push(y);
      apiA.status("← → or swipe to switch lanes");
      apiA.clearOver();
      apiA.score(0, HS.racer || 0);
    }
    reset();
    function spawn() {
      var l = Math.floor(Math.random() * 3);
      var last = obs.length ? obs[obs.length - 1] : null;
      if (last && last.y > H - 220 && last.lane === l) l = (l + 1 + Math.floor(Math.random() * 2)) % 3;
      obs.push({ lane: l, y: -70 });
    }
    function die() {
      alive = false;
      SFX.play("lose");
      apiA.record(score + nearMisses * 5);
      apiA.over("Crashed!", "Score " + (score + nearMisses * 5) + " · " + nearMisses + " near misses", score >= (HS.racer || 0) && score > 0 ? "win" : "loss");
      recordResult("racer", score >= (HS.racer || score) && score > 0 ? "win" : "loss", "score " + (score + nearMisses * 5));
    }
    return {
      start: function () {},
      update: function (dt) {
        if (!alive) return;
        var ms = dt / 16.67;
        if (keys.ArrowLeft || keys.a || keys.A) { if (lane > 0) { lane--; keys.ArrowLeft = keys.a = keys.A = false; SFX.play("move"); } }
        if (keys.ArrowRight || keys.d || keys.D) { if (lane < 2) { lane++; keys.ArrowRight = keys.d = keys.D = false; SFX.play("move"); } }
        if (started) {
          speed += 0.0016 * ms;
          score += Math.round(speed * 0.14 * ms);
          apiA.score(score + nearMisses * 5, HS.racer || 0);
        }
        for (var i = 0; i < stripes.length; i++) {
          stripes[i] += speed * ms;
          if (stripes[i] > H + 60) stripes[i] -= H + 160;
        }
        if (started) {
          if (!obs.length || obs[obs.length - 1].y > 170 - speed * 6) spawn();
          for (var k = 0; k < obs.length; k++) {
            obs[k].y += speed * ms;
            if (obs[k].y > H + 80) { obs.splice(k, 1); k--; continue; }
            if (obs[k].lane === lane && obs[k].y > H - 130 && obs[k].y < H - 40) { die(); return; }
          }
        }
      },
      draw: function (c) {
        bg(c, "#0A0D1A", "#04060D");
        c.fillStyle = "rgba(255,255,255,.04)";
        c.fillRect(lanes[0] - LANEW / 2 + 6, 0, LANEW - 12, H);
        c.fillRect(lanes[2] - LANEW / 2 + 6, 0, LANEW - 12, H);
        c.strokeStyle = "rgba(148,163,255,.3)"; c.lineWidth = 3; c.setLineDash([26, 34]);
        for (var s = 0; s < stripes.length; s++) {
          c.beginPath(); c.moveTo(lanes[1], stripes[s] - 34); c.lineTo(lanes[1], stripes[s] + 4); c.stroke();
          c.beginPath(); c.moveTo(lanes[0] + LANEW / 2, stripes[s] - 34); c.lineTo(lanes[0] + LANEW / 2, stripes[s] + 4); c.stroke();
        }
        c.setLineDash([]);
        for (var k = 0; k < obs.length; k++) {
          var o = obs[k];
          c.fillStyle = "#F43F5E";
          round(c, lanes[o.lane] - 22, o.y, 44, 64, 8); c.fill();
          c.fillStyle = "rgba(255,255,255,.3)";
          c.fillRect(lanes[o.lane] - 14, o.y + 10, 28, 8);
        }
        var px = lanes[lane], py = H - 92;
        c.fillStyle = "#22D3EE";
        round(c, px - 22, py, 44, 64, 8); c.fill();
        c.fillStyle = "rgba(255,255,255,.4)";
        c.fillRect(px - 14, py + 10, 28, 8);
        c.fillStyle = "rgba(255,255,255,.75)";
        c.fillRect(px - 12, py + 44, 24, 6);
        label(c, String(score + nearMisses * 5), W / 2, 30, 24, "#fff", "center", 800);
        if (!started && alive) label(c, "Press ← → to start", W / 2, H / 2 + 110, 15, "rgba(238,243,255,.65)");
      },
      swipe: function (dx) { if (dx < -20 && lane > 0) { lane--; started = true; SFX.play("move"); } if (dx > 20 && lane < 2) { lane++; started = true; SFX.play("move"); } },
      key: function (k) {
        if (k === "ArrowLeft" || k === "a" || k === "A") { if (lane > 0) { lane--; started = true; SFX.play("move"); } }
        else if (k === "ArrowRight" || k === "d" || k === "D") { if (lane < 2) { lane++; started = true; SFX.play("move"); } }
        else if (k === " " && !alive) reset();
      },
      action: function (a) { if (a === "restart") reset(); if (a === "menu") showMenu(); },
      stop: function () {}
    };
  }

  /* ============================================================
     DOM GAME FRAMEWORK — board games & puzzles render into #nva3-dom
     ============================================================ */
  function domApi(id) {
    var a = api(id);
    a.el = function () { return domEl; };
    a.setHTML = function (html) { if (domEl && curGame === id) domEl.innerHTML = html; };
    return a;
  }
  function domGame(id, opts) {
    var a = domApi(id);
    var g = {
      noDraw: true,
      api: a,
      start: function () { this.render(); },
      update: function (dt) { if (this.tick) this.tick(dt); },
      draw: function () {},
      render: function () {
        /* games render themselves via apiA.setHTML; only patch in html() output if provided */
        if (this.html) { var h = this.html(); if (typeof h === "string") a.setHTML(h); }
        this.bind();
      },
      bind: function () { /* delegated listeners live on domEl (bound in build()) */ },
      destroy: function () {}
    };
    Object.assign(g, opts || {});
    return g;
  }

  /* ============================================================
     TIC-TAC-TOE (unbeatable minimax AI · 2P · online)
     ============================================================ */
  function TTT(mode) {
    var apiA = api("ttt");
    var online = mode === "online";
    var hard = CFG.ttt === "easy" ? false : true;
    var board, turn, over, winLine, mySym, remoteBusy;
    var WL = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function reset() {
      board = ["", "", "", "", "", "", "", "", ""];
      turn = "X"; over = false; winLine = null; remoteBusy = false;
      mySym = online ? (M && M.room().role === "host" ? "X" : "O") : null;
      apiA.clearOver();
      apiA.status(online ? "You are " + mySym + " — " + turn + " starts" : "X starts — tap a square");
    }
    function winnerOf(b) {
      for (var i = 0; i < WL.length; i++) {
        var w = WL[i];
        if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return { s: b[w[0]], line: w };
      }
      return b.indexOf("") < 0 ? { s: "draw", line: null } : null;
    }
    function finish(res) {
      over = true; winLine = res.line;
      if (res.s === "draw") {
        apiA.over("Draw", "The grid is full.", "draw");
        recordResult("ttt", "draw", "draw");
        SFX.play("move");
      } else {
        var iWon = online ? res.s === mySym : (mode === "bot" ? res.s === "X" : true);
        apiA.over(res.s + " wins!", online ? (iWon ? "You beat your friend!" : "Your friend wins.") : "", iWon ? "win" : "loss");
        recordResult("ttt", iWon ? "win" : "loss", res.s + " line");
      }
    }
    function bestMove(b, sym) {
      /* minimax — unbeatable when hard; a random-ish greedy when easy */
      function score(b2, depth, cur) {
        var w = winnerOf(b2);
        if (w) return w.s === "draw" ? 0 : (w.s === sym ? 10 - depth : depth - 10);
        var best = cur === sym ? -99 : 99;
        for (var i = 0; i < 9; i++) {
          if (b2[i]) continue;
          b2[i] = cur;
          var v = score(b2, depth + 1, cur === "X" ? "O" : "X");
          b2[i] = "";
          if (cur === sym) best = Math.max(best, v); else best = Math.min(best, v);
        }
        return best;
      }
      var moves = [];
      for (var i = 0; i < 9; i++) if (!b[i]) moves.push(i);
      if (!moves.length) return -1;
      if (!hard) return moves[Math.floor(Math.random() * moves.length)];
      var bestV = -99, pick = moves[0];
      for (var j = 0; j < moves.length; j++) {
        b[moves[j]] = sym;
        var v = score(b, 0, sym === "X" ? "O" : "X");
        b[moves[j]] = "";
        if (v > bestV) { bestV = v; pick = moves[j]; }
      }
      return pick;
    }
    function place(i, byRemote) {
      if (over || board[i]) return;
      if (online && !byRemote) {
        if (turn !== mySym || remoteBusy) return;
        netSend({ t: "ttt-move", i: i });
      }
      board[i] = turn;
      SFX.play("move");
      var res = winnerOf(board);
      if (res) { render(); finish(res); return; }
      turn = turn === "X" ? "O" : "X";
      render();
      if (mode === "bot" && turn === "O" && !over) {
        remoteBusy = true;
        apiA.status("Bot is thinking…");
        setTimeout(function () {
          var mv = bestMove(board.slice(), "O");
          remoteBusy = false;
          if (mv >= 0) place(mv, false);
        }, 380);
      } else if (online && turn !== mySym) apiA.status("Waiting for your friend…");
      else apiA.status(turn + "'s turn");
    }
    function render() {
      var cells = "";
      for (var i = 0; i < 9; i++) {
        var v = board[i];
        var win = winLine && winLine.indexOf(i) >= 0;
        cells += '<button type="button" class="nvb-ttc' + (win ? " win" : "") + '" data-ttt="' + i + '"' + (v ? " disabled" : "") + ">" + (v === "X" ? "✕" : v === "O" ? "◯" : "") + "</button>";
      }
      apiA.setHTML('<div class="nvb-ttt">' + cells + "</div>" +
        '<div class="nvb-status">' + (over ? "Game over" : (online ? (turn === mySym ? "Your move (" + mySym + ")" : "Waiting…") : turn + " to move")) + "</div>");
    }
    reset();
    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "restart") { reset(); render(); return; }
        if (m.t === "end") { over = true; apiA.over("Match ended", "Your friend left the game.", "draw"); recordResult("ttt", "draw", "left"); return; }
        if (m.t === "ttt-move") place(m.i, true);
      };
    }
    return domGame("ttt", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-ttt]");
        if (c) place(parseInt(c.getAttribute("data-ttt"), 10));
      },
      action: function (a) {
        if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); render(); }
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("ttt");
        else if (a === "ttt-hard") { CFG.ttt = "hard"; saveCFG(); play("ttt", "bot"); }
        else if (a === "ttt-easy") { CFG.ttt = "easy"; saveCFG(); play("ttt", "bot"); }
        else if (a === "ttt-2p") play("ttt", "duo");
      },
      stop: function () {
        if (online) NET2.recv = null;
      }
    });
  }

  /* ============================================================
     CONNECT FOUR (heuristic AI · 2P · online)
     ============================================================ */
  function Connect4(mode) {
    var apiA = api("connect4");
    var online = mode === "online";
    var COLS = 7, ROWS = 6;
    var grid, turn, over, winCells, myColor;
    function reset() {
      grid = [];
      for (var r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(0));
      turn = 1; over = false; winCells = null;
      myColor = online ? (M && M.room().role === "host" ? 1 : 2) : null;
      apiA.clearOver();
      apiA.status(online ? (myColor === 1 ? "You are red" : "You are yellow") : "Red starts — tap a column");
      render();
    }
    function lowest(col) {
      for (var r = ROWS - 1; r >= 0; r--) if (!grid[r][col]) return r;
      return -1;
    }
    function lineOf(r, c, sym) {
      var dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (var d = 0; d < 4; d++) {
        var cells = [[r, c]];
        for (var s = -1; s <= 1; s += 2) {
          var rr = r + dirs[d][0] * s, cc = c + dirs[d][1] * s;
          while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc] === sym) {
            cells.push([rr, cc]); rr += dirs[d][0] * s; cc += dirs[d][1] * s;
          }
        }
        if (cells.length >= 4) return cells;
      }
      return null;
    }
    function drop(col, sym, byRemote) {
      if (over) return;
      var r = lowest(col);
      if (r < 0) return;
      if (online && !byRemote) {
        if (turn !== myColor) return;
        netSend({ t: "c4-move", col: col });
      }
      grid[r][col] = sym;
      SFX.play("flip");
      var win = lineOf(r, col, sym);
      if (win) {
        over = true;
        winCells = win.map(function (p) { return p[0] * COLS + p[1]; });
        var iWon = online ? sym === myColor : (mode === "bot" ? sym === 1 : true);
        apiA.over((sym === 1 ? "Red" : "Yellow") + " wins!", online && iWon ? "Four in a row!" : "", iWon ? "win" : "loss");
        recordResult("connect4", iWon ? "win" : "loss", sym === 1 ? "red" : "yellow");
        render();
        return;
      }
      var full = true;
      for (var c2 = 0; c2 < COLS; c2++) if (grid[0][c2] === 0) { full = false; break; }
      if (full) {
        over = true;
        apiA.over("Draw", "Board is full.", "draw");
        recordResult("connect4", "draw", "full");
        render();
        return;
      }
      turn = sym === 1 ? 2 : 1;
      render();
      if (mode === "bot" && turn === 2 && !over) {
        setTimeout(function () { botMove(); }, 420);
      }
    }
    function botMove() {
      /* heuristic: win > block > center > build */
      function trySym(sym) {
        for (var c = 0; c < COLS; c++) {
          var r = lowest(c);
          if (r < 0) continue;
          grid[r][c] = sym;
          var w = lineOf(r, c, sym);
          grid[r][c] = 0;
          if (w) return c;
        }
        return -1;
      }
      var c = trySym(2);
      if (c < 0) c = trySym(1);
      if (c < 0) {
        var order = [3, 2, 4, 1, 5, 0, 6];
        for (var i = 0; i < order.length; i++) {
          /* avoid handing the win right above */
          var r2 = lowest(order[i]);
          if (r2 < 0) continue;
          grid[r2][order[i]] = 2;
          var above = r2 - 1;
          var bad = false;
          if (above >= 0) {
            grid[above][order[i]] = 1;
            if (lineOf(above, order[i], 1)) bad = true;
            grid[above][order[i]] = 0;
          }
          grid[r2][order[i]] = 0;
          if (!bad) { c = order[i]; break; }
        }
        if (c < 0) c = 3;
      }
      drop(c, 2, true);
    }
    function render() {
      var cells = "";
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var v = grid[r][c];
          var cls = v === 1 ? " p1" : v === 2 ? " p2" : "";
          if (winCells && winCells.indexOf(r * COLS + c) >= 0) cls += " win";
          cells += '<button type="button" class="nvb-c4c' + cls + '" data-c4="' + c + '" aria-label="column ' + (c + 1) + ' row ' + (r + 1) + '"></button>';
        }
      }
      apiA.setHTML('<div class="nvb-c4">' + cells + "</div>" +
        '<div class="nvb-status">' + (over ? "Game over" : (online ? (turn === myColor ? "Your turn — tap a column" : "Waiting…") : (turn === 1 ? "Red" : "Yellow") + " to move")) + "</div>");
    }
    reset();
    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "restart") { reset(); return; }
        if (m.t === "end") { over = true; apiA.over("Match ended", "Your friend left the game.", "draw"); recordResult("connect4", "draw", "left"); render(); return; }
        if (m.t === "c4-move") drop(m.col, turn, true);
      };
    }
    return domGame("connect4", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-c4]");
        if (c) drop(parseInt(c.getAttribute("data-c4"), 10), 1, false);
      },
      action: function (a) {
        if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); }
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("connect4");
      },
      stop: function () { if (online) NET2.recv = null; }
    });
  }

  /* ============================================================
     MEMORY MATCH
     ============================================================ */
  function Memory() {
    var apiA = api("memory");
    var size = CFG.memory === "6" ? 6 : 4;
    var PAIRS = ["🍕", "🚀", "🐙", "🌵", "🎸", "⚽", "🎲", "🌈", "🦊", "☕", "⚡", "🧩", "🍉", "🎯", "🦄", "🔥", "🌙", "🍄"];
    var deck, open, matched, moves, t0, timerOn, done, lock;
    function reset() {
      var cells = size * size, pairs = cells / 2;
      var pool = PAIRS.slice(0, pairs);
      deck = pool.concat(pool);
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      open = []; matched = new Array(cells).fill(false);
      moves = 0; t0 = Date.now(); timerOn = true; done = false; lock = false;
      apiA.clearOver();
      apiA.status("Flip two cards — find every pair");
      startTimer();
      render();
    }
    function startTimer() {if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
      if (clockTimer) clearInterval(clockTimer);
      clockTimer = setInterval(function () {
        if (timerOn && !done) apiA.status("Moves " + moves + " · " + Math.floor((Date.now() - t0) / 1000) + "s");
      }, 500);
    }
    function flip(i) {
      if (done || lock || matched[i] || open.indexOf(i) >= 0) return;
      SFX.play("flip");
      open.push(i);
      render();
      if (open.length === 2) {
        moves++;
        lock = true;
        setTimeout(function () {
          var a = open[0], b = open[1];
          if (deck[a] === deck[b]) {
            matched[a] = matched[b] = true;
            SFX.play("good");
            if (matched.every(function (m) { return m; })) {
              done = true; timerOn = false;
              var secs = Math.floor((Date.now() - t0) / 1000);
              var sc = Math.max(10, 2000 - moves * 30 - secs * 4);
              apiA.record(sc);
              apiA.over("Cleared!", moves + " moves · " + secs + "s", "win");
              recordResult("memory", "win", moves + " moves " + secs + "s");
            }
          } else SFX.play("bad");
          open = [];
          lock = false;
          render();
        }, 620);
        render();
      }
    }
    function render() {
      var cells = "";
      for (var i = 0; i < deck.length; i++) {
        var face = matched[i] || open.indexOf(i) >= 0;
        cells += '<button type="button" class="nvb-mc' + (face ? " open" : "") + (matched[i] ? " done" : "") + '" data-mem="' + i + '">' + (face ? deck[i] : "?") + "</button>";
      }
      apiA.setHTML('<div class="nvb-mem m' + size + '">' + cells + "</div>" +
        '<div class="nvb-status">Moves ' + moves + (done ? " · cleared!" : "") + "</div>");
    }
    reset();
    return domGame("memory", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-mem]");
        if (c) flip(parseInt(c.getAttribute("data-mem"), 10));
      },
      action: function (a) {
        if (a === "restart") reset();
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("memory");
        else if (a === "memory-4") { CFG.memory = "4"; saveCFG(); play("memory"); }
        else if (a === "memory-6") { CFG.memory = "6"; saveCFG(); play("memory"); }
      },
      stop: function () { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }
    });
  }

  /* ============================================================
     2048
     ============================================================ */
  function G2048() {
    var apiA = api("n2048");
    var grid, score, over, won, keepGoing;
    function reset() {
      grid = new Array(16).fill(0);
      score = 0; over = false; won = false; keepGoing = false;
      addTile(); addTile();
      apiA.clearOver();
      apiA.status("Arrows / WASD / swipe to slide");
      apiA.score(0, HS["2048"] || 0);
      render();
    }
    function addTile() {
      var free = [];
      for (var i = 0; i < 16; i++) if (!grid[i]) free.push(i);
      if (!free.length) return;
      var i = free[Math.floor(Math.random() * free.length)];
      grid[i] = Math.random() < 0.9 ? 2 : 4;
    }
    function rowsOf(dir) {
      /* returns array of line index arrays in slide order */
      var lines = [];
      for (var i = 0; i < 4; i++) {
        var line = [];
        for (var j = 0; j < 4; j++) {
          if (dir === "left") line.push(i * 4 + j);
          else if (dir === "right") line.push(i * 4 + (3 - j));
          else if (dir === "up") line.push(j * 4 + i);
          else line.push((3 - j) * 4 + i);
        }
        lines.push(line);
      }
      return lines;
    }
    function slide(dir) {
      if (over && !keepGoing) return;
      var lines = rowsOf(dir), moved = false, gained = 0;
      for (var li = 0; li < 4; li++) {
        var line = lines[li];
        var vals = line.map(function (i) { return grid[i]; }).filter(function (v) { return v; });
        var merged = [];
        for (var i = 0; i < vals.length; i++) {
          if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
            var nv = vals[i] * 2;
            merged.push(nv);
            gained += nv;
            if (nv === 2048) won = true;
            i++;
          } else merged.push(vals[i]);
        }
        while (merged.length < 4) merged.push(0);
        for (var j = 0; j < 4; j++) {
          if (grid[line[j]] !== merged[j]) moved = true;
          grid[line[j]] = merged[j];
        }
      }
      if (!moved) return;
      score += gained;
      SFX.play(gained ? "good" : "move");
      addTile();
      if (won && !keepGoing) {
        apiA.record(score);
        apiA.over("2048!", "You built the legendary tile — keep going?", "win");
        recordResult("2048", "win", "score " + score);
        keepGoing = true;
      }
      apiA.score(score, HS["2048"] || 0);
      if (!canMove()) {
        over = true;
        apiA.record(score);
        apiA.over("No moves left", "Score " + score, "loss");
        recordResult("2048", "loss", "score " + score);
      }
      render();
    }
    function canMove() {
      for (var i = 0; i < 16; i++) if (!grid[i]) return true;
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var v = grid[r * 4 + c];
        if (c < 3 && grid[r * 4 + c + 1] === v) return true;
        if (r < 3 && grid[(r + 1) * 4 + c] === v) return true;
      }
      return false;
    }
    function render() {
      var cells = "";
      for (var i = 0; i < 16; i++) {
        var v = grid[i];
        cells += '<div class="nvb-t2 t' + (v || 0) + '">' + (v || "") + "</div>";
      }
      apiA.setHTML('<div class="nvb-2048"><div class="nvb-t2head"><b>SCORE</b><span>' + fmtN(score) + "</span></div>" +
        '<div class="nvb-t2grid">' + cells + "</div></div>" +
        '<div class="nvb-status">Join the numbers — reach 2048</div>');
    }
    reset();
    return domGame("n2048", {
      html: render,
      onDomClick: function () {},
      key: function (k) {
        if (k === "ArrowLeft" || k === "a" || k === "A") slide("left");
        else if (k === "ArrowRight" || k === "d" || k === "D") slide("right");
        else if (k === "ArrowUp" || k === "w" || k === "W") slide("up");
        else if (k === "ArrowDown" || k === "s" || k === "S") slide("down");
      },
      swipe: function (dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) slide(dx > 0 ? "right" : "left");
        else slide(dy > 0 ? "down" : "up");
      },
      action: function (a) {
        if (a === "restart") reset();
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("2048");
        else if (a === "close-over") { apiA.clearOver(); }
      },
      stop: function () {}
    });
  }

  /* ============================================================
     MINESWEEPER
     ============================================================ */
  function Minesweeper() {
    var apiA = api("minesweeper");
    var LVL = {
      easy: { c: 9, r: 9, m: 10 },
      med: { c: 12, r: 12, m: 24 },
      hard: { c: 16, r: 14, m: 40 }
    };
    var level = CFG.minesweeper || "easy";
    if (!LVL[level]) level = "easy";
    var W, H, mines, revealed, flagged, planted, dead, won, t0, timerOn, flagMode;
    function reset() {
      var L = LVL[level];
      W = L.c; H = L.r;
      mines = new Array(W * H).fill(false);
      revealed = new Array(W * H).fill(false);
      flagged = new Array(W * H).fill(false);
      planted = false;
      dead = false; won = false; t0 = 0; timerOn = false; flagMode = false;
      apiA.clearOver();
      apiA.status("Tap to reveal — long-press or Flag mode to flag");
      render();
    }
    function startTimer() {
      if (timerOn) return;
      timerOn = true; t0 = Date.now();
      var tick = function () {
        if (timerOn && !dead && !won) apiA.status("Time " + Math.floor((Date.now() - t0) / 1000) + "s · flags " + flagged.filter(Boolean).length + "/" + countMines());
      };
      clockTimer = setInterval(tick, 500); tick();
    }
    function countMines() {
      var n = 0;
      for (var i = 0; i < mines.length; i++) if (mines[i]) n++;
      return n;
    }
    function plant(safe) {
      var L = LVL[level];
      var spots = [];
      for (var i = 0; i < W * H; i++) if (i !== safe) spots.push(i);
      for (var m = 0; m < L.m && spots.length; m++) {
        var j = Math.floor(Math.random() * spots.length);
        mines[spots[j]] = true;
        spots.splice(j, 1);
      }
      planted = true;
      startTimer();
    }
    function neighbors(i) {
      var r = Math.floor(i / W), c = i % W, out = [];
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < H && cc >= 0 && cc < W) out.push(rr * W + cc);
      }
      return out;
    }
    function adjCount(i) {
      var n = 0;
      neighbors(i).forEach(function (j) { if (mines[j]) n++; });
      return n;
    }
    function reveal(i) {
      if (dead || won || revealed[i] || flagged[i]) return;
      if (!planted) plant(i);
      if (mines[i]) {
        dead = true;
        timerOn = false;
        SFX.play("lose");
        apiA.record(0);
        apiA.over("Boom!", "You hit a mine at " + Math.floor((Date.now() - t0) / 1000) + "s", "loss");
        recordResult("minesweeper", "loss", level + " level");
        render();
        return;
      }
      SFX.play("click");
      var stack = [i];
      while (stack.length) {
        var k = stack.pop();
        if (revealed[k] || flagged[k]) continue;
        revealed[k] = true;
        if (adjCount(k) === 0) neighbors(k).forEach(function (j) { if (!revealed[j]) stack.push(j); });
      }
      checkWin();
      render();
    }
    function toggleFlag(i) {
      if (dead || won || revealed[i]) return;
      flagged[i] = !flagged[i];
      SFX.play("flip");
      render();
    }
    function checkWin() {
      for (var i = 0; i < W * H; i++) if (!mines[i] && !revealed[i]) return;
      won = true;
      timerOn = false;
      var secs = Math.floor((Date.now() - t0) / 1000);
      var score = Math.max(50, 5000 - secs * 10);
      SFX.play("win");
      apiA.record(score);
      apiA.over("Field cleared!", level + " board in " + secs + "s", "win");
      recordResult("minesweeper", "win", level + " " + secs + "s");
    }
    function render() {
      var L = LVL[level];
      var cells = "";
      for (var i = 0; i < W * H; i++) {
        var cls = "nvb-msc";
        if (revealed[i]) {
          cls += " open" + (mines[i] ? " boom" : " n" + adjCount(i));
        } else if (flagged[i]) cls += " flag";
        if (dead && mines[i]) cls += " shown";
        cells += '<button type="button" class="' + cls + '" data-ms="' + i + '">' +
          (revealed[i] ? (mines[i] ? "💥" : adjCount(i) || "") : (flagged[i] ? "🚩" : "")) + "</button>";
      }
      apiA.setHTML('<div class="nvb-ms w' + W + '">' + cells + "</div>" +
        '<div class="nvb-msbar"><button type="button" class="nva3-ghost-btn' + (flagMode ? " on" : "") + '" data-arc-act="ms-flag">🚩 Flag mode</button>' +
        '<span class="nvb-msinfo">' + countMines() + " mines · " + L.r + "×" + L.c + "</span></div>");
    }
    reset();
    return domGame("minesweeper", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-ms]");
        if (!c) return;
        var i = parseInt(c.getAttribute("data-ms"), 10);
        if (flagMode) toggleFlag(i); else reveal(i);
      },
      onDomContext: function (e) {
        var c = e.target.closest("[data-ms]");
        if (c) toggleFlag(parseInt(c.getAttribute("data-ms"), 10));
      },
      key: function (k) { if (k === "f" || k === "F") { flagMode = !flagMode; render(); } },
      action: function (a) {
        if (a === "restart") reset();
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("minesweeper");
        else if (a === "ms-flag") { flagMode = !flagMode; render(); }
        else if (a === "ms-easy") { CFG.minesweeper = "easy"; saveCFG(); play("minesweeper"); }
        else if (a === "ms-med") { CFG.minesweeper = "med"; saveCFG(); play("minesweeper"); }
        else if (a === "ms-hard") { CFG.minesweeper = "hard"; saveCFG(); play("minesweeper"); }
      },
      stop: function () { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }
    });
  }

  /* ============================================================
     SUDOKU — generated grids, unique solution
     ============================================================ */
  function Sudoku() {
    var apiA = api("sudoku");
    var diff = CFG.sudoku || "easy";
    var TARGET = { easy: 38, med: 30, hard: 25 };
    if (!TARGET[diff]) diff = "easy";
    var puzzle, solution, cur, mistakes, checks, t0, timerOn, done, sel;
    function solvedBoard() {
      var b = new Array(81).fill(0);
      function ok(i, v) {
        var r = Math.floor(i / 9), c = i % 9;
        for (var k = 0; k < 9; k++) {
          if (b[r * 9 + k] === v) return false;
          if (b[k * 9 + c] === v) return false;
        }
        var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) if (b[(br + dr) * 9 + bc + dc] === v) return false;
        return true;
      }
      function fill(i) {
        if (i === 81) return true;
        var vals = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(function () { return Math.random() - 0.5; });
        for (var v = 0; v < 9; v++) {
          if (ok(i, vals[v])) {
            b[i] = vals[v];
            if (fill(i + 1)) return true;
            b[i] = 0;
          }
        }
        return false;
      }
      fill(0);
      return b;
    }
    function countSolutions(b, limit) {
      function nextEmpty() { for (var i = 0; i < 81; i++) if (!b[i]) return i; return -1; }
      function ok(i, v) {
        var r = Math.floor(i / 9), c = i % 9;
        for (var k = 0; k < 9; k++) {
          if (b[r * 9 + k] === v) return false;
          if (b[k * 9 + c] === v) return false;
        }
        var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) if (b[(br + dr) * 9 + bc + dc] === v) return false;
        return true;
      }
      var n = 0;
      function rec() {
        if (n >= limit) return;
        var i = nextEmpty();
        if (i < 0) { n++; return; }
        for (var v = 1; v <= 9; v++) {
          if (ok(i, v)) { b[i] = v; rec(); b[i] = 0; if (n >= limit) return; }
        }
      }
      rec();
      return n;
    }
    function reset() {
      solution = solvedBoard();
      puzzle = solution.slice();
      var target = TARGET[diff];
      var order = [];
      for (var i = 0; i < 81; i++) order.push(i);
      order.sort(function () { return Math.random() - 0.5; });
      var removed = 0;
      for (var k = 0; k < order.length && removed < 81 - target; k++) {
        var idx = order[k];
        var keep = puzzle[idx];
        puzzle[idx] = 0;
        if (countSolutions(puzzle.slice(), 2) !== 1) puzzle[idx] = keep;
        else removed++;
      }
      cur = puzzle.slice();
      mistakes = 0; checks = 3; t0 = Date.now(); timerOn = true; done = false; sel = -1;
      apiA.clearOver();
      apiA.status("Tap a cell, then a number — " + diff + " puzzle");
      apiA.score(0, HS.sudoku || 0);
      if (clockTimer) clearInterval(clockTimer);
      clockTimer = setInterval(function () {
        if (timerOn && !done) apiA.status("Time " + Math.floor((Date.now() - t0) / 1000) + "s · mistakes " + mistakes);
      }, 500);
      render();
    }
    function setCell(i, v) {
      if (done || puzzle[i]) return;
      sel = i;
      if (v && solution[i] !== v) {
        mistakes++;
        SFX.play("bad");
        cur[i] = 0;
      } else {
        cur[i] = v;
        if (v) SFX.play("click");
      }
      var full = true;
      for (var j = 0; j < 81; j++) if (!cur[j]) { full = false; break; }
      if (full) {
        done = true; timerOn = false;
        var secs = Math.floor((Date.now() - t0) / 1000);
        var score = Math.max(50, 10000 - secs * 12 - mistakes * 250);
        SFX.play("win");
        apiA.record(score);
        apiA.over("Solved!", diff + " puzzle in " + secs + "s · " + mistakes + " mistakes", "win");
        recordResult("sudoku", "win", diff + " " + secs + "s");
      }
      render();
    }
    function render() {
      var cells = "";
      for (var i = 0; i < 81; i++) {
        var given = !!puzzle[i];
        var v = cur[i];
        var bad = v && solution[i] !== v;
        var cls = "nvb-sdc" + (given ? " given" : "") + (i === sel ? " sel" : "") + (bad ? " bad" : "") +
          (i % 3 === 2 && i % 9 !== 8 ? " rbar" : "") + (Math.floor(i / 9) % 3 === 2 && i < 72 ? " bbar" : "");
        cells += '<button type="button" class="' + cls + '" data-sd="' + i + '">' + (v || "") + "</button>";
      }
      var keys = "";
      for (var n = 1; n <= 9; n++) keys += '<button type="button" class="nvb-sdk" data-sdk="' + n + '">' + n + "</button>";
      keys += '<button type="button" class="nvb-sdk wide" data-sdk="0">✕ clear</button>';
      apiA.setHTML('<div class="nvb-sd">' + cells + "</div>" +
        '<div class="nvb-sdkrow">' + keys + "</div>" +
        '<div class="nvb-status">Time ' + Math.floor((Date.now() - t0) / 1000) + "s · mistakes " + mistakes + "</div>");
    }
    reset();
    return domGame("sudoku", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-sd]");
        if (c) { sel = parseInt(c.getAttribute("data-sd"), 10); render(); return; }
        var k = e.target.closest("[data-sdk]");
        if (k && sel >= 0) setCell(sel, parseInt(k.getAttribute("data-sdk"), 10));
      },
      key: function (k) {
        if (/^[1-9]$/.test(k) && sel >= 0) setCell(sel, parseInt(k, 10));
        else if ((k === "Backspace" || k === "0") && sel >= 0) setCell(sel, 0);
      },
      action: function (a) {
        if (a === "restart") reset();
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("sudoku");
        else if (a === "sd-easy") { CFG.sudoku = "easy"; saveCFG(); play("sudoku"); }
        else if (a === "sd-med") { CFG.sudoku = "med"; saveCFG(); play("sudoku"); }
        else if (a === "sd-hard") { CFG.sudoku = "hard"; saveCFG(); play("sudoku"); }
      },
      stop: function () { if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }
    });
  }

  /* ============================================================
     CHECKERS — American rules, forced captures, kings, AI
     ============================================================ */
  function Checkers(mode) {
    var apiA = api("checkers");
    var online = mode === "online";
    var board, turn, over, sel, chain, myColor, msg;
    function reset() {
      board = new Array(64).fill(null);
      for (var i = 9; i <= 14; i++) if (i % 8 < 4) board[i] = "b";
      for (var i = 17; i <= 22; i++) if (i % 8 >= 4) board[i] = "b";
      for (var i = 41; i <= 46; i++) if (i % 8 >= 4) board[i] = "r";
      for (var i = 49; i <= 54; i++) if (i % 8 < 4) board[i] = "r";
      turn = "r"; over = false; sel = -1; chain = null; msg = "";
      myColor = online ? (M && M.room().role === "host" ? "r" : "b") : null;
      apiA.clearOver();
      apiA.status(online ? "You play " + (myColor === "r" ? "Red (first)" : "White") : "Red starts — tap a piece");
      render();
    }
    function dirsOf(p) {
      var base = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      if (p === "r") return [[-1, -1], [1, -1]];
      if (p === "b") return [[-1, 1], [1, 1]];
      return base;
    }
    function movesFor(i) {
      /* returns [{to, cap?}] — when captures exist anywhere, only captures are legal */
      var p = board[i];
      if (!p) return [];
      var col = p.toLowerCase();
      if (chain && chain.from !== i) return [];
      var r = Math.floor(i / 8), c = i % 8;
      var out = [];
      dirsOf(p).forEach(function (d) {
        var rr = r + d[1], cc = c + d[0];
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return;
        var j = rr * 8 + cc;
        if (!board[j]) out.push({ to: j });
        else if (board[j] && board[j].toLowerCase() !== col) {
          var jr = rr + d[1], jc = cc + d[0];
          if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7 && !board[jr * 8 + jc]) out.push({ to: jr * 8 + jc, cap: j });
        }
      });
      return out;
    }
    function capturesExist(col) {
      for (var i = 0; i < 64; i++) {
        if (!board[i] || board[i].toLowerCase() !== col) continue;
        var ms = movesFor(i);
        for (var k = 0; k < ms.length; k++) if (ms[k].cap != null) return true;
      }
      return false;
    }
    function legalMoves(i) {
      var ms = movesFor(i);
      if (!chain) {
        var col = board[i] && board[i].toLowerCase();
        if (capturesExist(col)) return ms.filter(function (m) { return m.cap != null; });
      }
      return ms;
    }
    function applyMove(mv, byRemote) {
      var p = board[sel];
      if (!p) return;
      if (online && !byRemote) {
        if (turn !== myColor) return;
        netSend({ t: "ck-move", from: sel, to: mv.to, cap: mv.cap != null ? mv.cap : -1 });
      }
      board[mv.to] = p;
      board[sel] = null;
      SFX.play(mv.cap != null ? "capture" : "move");
      var col = p.toLowerCase();
      /* promotion */
      if (mv.to < 8 && col === "r") board[mv.to] = "R";
      if (mv.to >= 56 && col === "b") board[mv.to] = "B";
      if (mv.cap != null) board[mv.cap] = null;
      /* multi-jump: keep the turn if the same piece can capture again */
      if (mv.cap != null) {
        var more = movesFor(mv.to).filter(function (m) { return m.cap != null; });
        if (more.length) {
          chain = { from: mv.to };
          sel = mv.to;
          apiA.status("Chain jump — keep capturing!");
          render();
          return;
        }
      }
      chain = null; sel = -1;
      var opp = col === "r" ? "b" : "r";
      if (!hasAny(opp)) {
        over = true;
        var iWon = online ? col === myColor : (mode === "bot" ? col === "r" : true);
        apiA.over((col === "r" ? "Red" : "White") + " wins!", online && iWon ? "You cleared the board!" : "", iWon ? "win" : "loss");
        recordResult("checkers", iWon ? "win" : "loss", col === "r" ? "red" : "white");
        render();
        return;
      }
      turn = opp;
      render();
      if (mode === "bot" && turn === "b" && !over) setTimeout(botMove, 460);
      else if (online && turn !== myColor) apiA.status("Waiting for your friend…");
    }
    function hasAny(col) {
      for (var i = 0; i < 64; i++) if (board[i] && board[i].toLowerCase() === col) return true;
      return false;
    }
    function botMove() {
      /* collect (i, mv) pairs; prefer captures (forced anyway), then safety */
      var opts = [];
      for (var i = 0; i < 64; i++) {
        if (!board[i] || board[i].toLowerCase() !== "b") continue;
        var ms = legalMoves(i);
        for (var k = 0; k < ms.length; k++) opts.push({ i: i, mv: ms[k] });
      }
      if (!opts.length) {
        over = true;
        apiA.over("Red wins!", "White has no moves.", "win");
        recordResult("checkers", "win", "blocked");
        render();
        return;
      }
      var best = null, bestV = -1e9;
      for (var j = 0; j < opts.length; j++) {
        var o = opts[j], v = Math.random() * 4;
        if (o.mv.cap != null) v += board[o.mv.cap] === "R" || board[o.mv.cap] === "B" ? 60 : 30;
        var toR = Math.floor(o.mv.to / 8);
        if (board[o.i] === "b") v += toR * 2;
        /* avoid landing where it can be jumped back */
        var r2 = toR, c2 = o.mv.to % 8;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) {
          var jr = r2 + d[1], jc = c2 + d[0];
          var br = r2 - d[1], bc = c2 - d[0];
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && br >= 0 && br < 8 && bc >= 0 && bc < 8) {
            var q = board[jr * 8 + jc];
            if (q && q.toLowerCase() === "r" && !board[br * 8 + bc]) v -= 24;
          }
        });
        if (v > bestV) { bestV = v; best = o; }
      }
      sel = best.i;
      applyMove(best.mv, true);
    }
    function render() {
      var cells = "";
      for (var i = 0; i < 64; i++) {
        var dark = (Math.floor(i / 8) + i % 8) % 2 === 1;
        var cls = "nvb-ckc" + (dark ? " dark" : "") + (i === sel ? " sel" : "");
        var p = board[i];
        var glyph = p === "r" ? "🔴" : p === "b" ? "⚪" : p === "R" ? "👑" : p === "B" ? "♔" : "";
        if (p && i === sel) cls += " sel";
        var can = !over && p && p.toLowerCase() === turn && (!online || turn === myColor);
        if (can) cls += " can";
        if (sel >= 0 && p == null) {
          var ms = legalMoves(sel);
          for (var k = 0; k < ms.length; k++) if (ms[k].to === i) { cls += " hint"; break; }
        }
        cells += '<button type="button" class="' + cls + '" data-ck="' + i + '">' + glyph + "</button>";
      }
      apiA.setHTML('<div class="nvb-ck">' + cells + "</div>" +
        '<div class="nvb-status">' + (over ? "Game over" : (online ? (turn === myColor ? "Your move" : "Waiting…") : (turn === "r" ? "Red" : "White") + " to move" + (chain ? " · chain jump!" : ""))) + "</div>");
    }
    reset();
    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "restart") { reset(); return; }
        if (m.t === "end") { over = true; apiA.over("Match ended", "Your friend left the game.", "draw"); recordResult("checkers", "draw", "left"); render(); return; }
        if (m.t === "ck-move") {
          sel = m.from;
          applyMove({ to: m.to, cap: m.cap >= 0 ? m.cap : null }, true);
        }
      };
    }
    return domGame("checkers", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-ck]");
        if (!c || over) return;
        var i = parseInt(c.getAttribute("data-ck"), 10);
        if (online && turn !== myColor) return;
        if (mode === "bot" && turn !== "r") return;
        var p = board[i];
        if (p && p.toLowerCase() === turn) { sel = i; SFX.play("click"); render(); return; }
        if (sel >= 0 && !p) {
          var ms = legalMoves(sel);
          for (var k = 0; k < ms.length; k++) {
            if (ms[k].to === i) { applyMove(ms[k]); return; }
          }
          sel = -1;
          render();
        }
      },
      action: function (a) {
        if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); }
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("checkers");
      },
      stop: function () { if (online) NET2.recv = null; }
    });
  }

  /* ============================================================
     REVERSI — legal flips, corner-aware AI, online
     ============================================================ */
  function Reversi(mode) {
    var apiA = api("reversi");
    var online = mode === "online";
    var board, turn, over, myColor, passStreak;
    var WEIGHT = [
      120, -20, 20, 5, 5, 20, -20, 120,
      -20, -40, -5, -5, -5, -5, -40, -20,
      20, -5, 15, 3, 3, 15, -5, 20,
      5, -5, 3, 3, 3, 3, -5, 5,
      5, -5, 3, 3, 3, 3, -5, 5,
      20, -5, 15, 3, 3, 15, -5, 20,
      -20, -40, -5, -5, -5, -5, -40, -20,
      120, -20, 20, 5, 5, 20, -20, 120
    ];
    function reset() {
      board = new Array(64).fill(0);
      board[27] = board[36] = 1; /* white */
      board[28] = board[35] = 2; /* black */
      turn = 2; over = false; passStreak = 0;
      myColor = online ? (M && M.room().role === "host" ? 2 : 1) : null;
      apiA.clearOver();
      apiA.status(online ? "You play " + (myColor === 2 ? "Black (first)" : "White") : "Black starts — tap a legal cell");
      render();
    }
    function flipsFor(i, col) {
      if (board[i]) return [];
      var opp = col === 1 ? 2 : 1;
      var dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      var r = Math.floor(i / 8), c = i % 8, all = [];
      for (var d = 0; d < 8; d++) {
        var line = [];
        var rr = r + dirs[d][0], cc = c + dirs[d][1];
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && board[rr * 8 + cc] === opp) {
          line.push(rr * 8 + cc);
          rr += dirs[d][0]; cc += dirs[d][1];
        }
        if (line.length && rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && board[rr * 8 + cc] === col) all = all.concat(line);
      }
      return all;
    }
    function legalMoves(col) {
      var out = [];
      for (var i = 0; i < 64; i++) if (flipsFor(i, col).length) out.push(i);
      return out;
    }
    function play(i, byRemote) {
      if (over) return;
      var col = turn;
      if (online && !byRemote) {
        if (turn !== myColor) return;
        netSend({ t: "rv-move", i: i });
      }
      var fl = flipsFor(i, col);
      if (!fl.length) return;
      board[i] = col;
      fl.forEach(function (j) { board[j] = col; });
      SFX.play("flip");
      passStreak = 0;
      turn = col === 1 ? 2 : 1;
      advance();
    }
    function advance() {
      var lm = legalMoves(turn);
      if (!lm.length) {
        var opp = turn === 1 ? 2 : 1;
        if (!legalMoves(opp).length) { finish(); return; }
        passStreak++;
        apiA.status((turn === 1 ? "White" : "Black") + " has no move — turn passes");
        turn = opp;
        if (passStreak >= 2) { finish(); return; }
      } else passStreak = 0;
      render();
      if (mode === "bot" && turn === 1 && !over) setTimeout(botMove, 480);
      else if (online && turn !== myColor) apiA.status("Waiting for your friend…");
    }
    function finish() {
      over = true;
      var b = 0, w = 0;
      for (var i = 0; i < 64; i++) { if (board[i] === 2) b++; if (board[i] === 1) w++; }
      var iWon = online ? (myColor === 2 ? b > w : w > b) : (mode === "bot" ? w > b : true);
      var draw = b === w;
      apiA.record(b + w);
      apiA.over(draw ? "Draw" : (b > w ? "Black" : "White") + " wins " + Math.max(b, w) + "–" + Math.min(b, w), "", draw ? "draw" : (iWon ? "win" : "loss"));
      recordResult("reversi", draw ? "draw" : (iWon ? "win" : "loss"), b + "–" + w);
      render();
    }
    function botMove() {
      var lm = legalMoves(1);
      if (!lm.length) { advance(); return; }
      var best = lm[0], bestV = -1e9;
      for (var i = 0; i < lm.length; i++) {
        var v = WEIGHT[lm[i]] + flipsFor(lm[i], 1).length * 2 + Math.random() * 6;
        if (v > bestV) { bestV = v; best = lm[i]; }
      }
      play(best, true);
    }
    function render() {
      var lm = legalMoves(turn);
      var cells = "";
      for (var i = 0; i < 64; i++) {
        var cls = "nvb-rvc" + ((Math.floor(i / 8) + i % 8) % 2 ? " dark" : "");
        var v = board[i];
        var inLm = lm.indexOf(i) >= 0 && (mode !== "bot" ? turn === 2 || turn === 1 : turn === 2);
        if (v) cls += v === 2 ? " p2" : " p1";
        else if (inLm && (online ? turn === myColor : turn === 2)) cls += " hint";
        cells += '<button type="button" class="' + cls + '" data-rv="' + i + '">' + (v === 2 ? "●" : v === 1 ? "○" : "") + "</button>";
      }
      var b = 0, w = 0;
      for (var i2 = 0; i2 < 64; i2++) { if (board[i2] === 2) b++; if (board[i2] === 1) w++; }
      apiA.setHTML('<div class="nvb-rv">' + cells + "</div>" +
        '<div class="nvb-status">● ' + b + " · ○ " + w + (over ? " · game over" : " · " + (turn === 2 ? "Black" : "White") + " to move") + "</div>");
    }
    reset();
    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "restart") { reset(); return; }
        if (m.t === "end") { over = true; apiA.over("Match ended", "Your friend left the game.", "draw"); recordResult("reversi", "draw", "left"); render(); return; }
        if (m.t === "rv-move") play(m.i, true);
      };
    }
    return domGame("reversi", {
      html: render,
      onDomClick: function (e) {
        var c = e.target.closest("[data-rv]");
        if (!c || over) return;
        if (online && turn !== myColor) return;
        if (mode === "bot" && turn !== 2) return;
        play(parseInt(c.getAttribute("data-rv"), 10));
      },
      action: function (a) {
        if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); }
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("reversi");
      },
      stop: function () { if (online) NET2.recv = null; }
    });
  }

  /* ============================================================
     LUDO — premium DOM board (Phase 7 redesign)
     CSS grid board, animated tokens, real dice, safe stars,
     blockades, home lanes, bots / hot-seat / online.
     Rules engine ported from the proven canvas implementation.
     ============================================================ */
  var LTRACK = (function () {
    var a = [], x, y;
    for (y = 13; y >= 9; y--) a.push([6, y]);
    for (x = 5; x >= 0; x--) a.push([x, 8]);
    for (y = 7; y >= 6; y--) a.push([0, y]);
    for (x = 1; x <= 5; x++) a.push([x, 6]);
    for (y = 5; y >= 0; y--) a.push([6, y]);
    for (x = 7; x <= 8; x++) a.push([x, 0]);
    for (y = 1; y <= 5; y++) a.push([8, y]);
    for (x = 9; x <= 14; x++) a.push([x, 6]);
    for (y = 7; y <= 8; y++) a.push([14, y]);
    for (x = 13; x >= 9; x--) a.push([x, 8]);
    for (y = 9; y <= 14; y++) a.push([8, y]);
    for (x = 7; x >= 6; x--) a.push([x, 14]);
    return a;
  })();
  var LUDOP = {
    red: { c: "#F87171", c2: "#7F1D1D", start: 0, base: "bl", lane: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 7]] },
    green: { c: "#34D399", c2: "#065F46", start: 13, base: "tl", lane: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [7, 7]] },
    yellow: { c: "#FBBF24", c2: "#78350F", start: 26, base: "tr", lane: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 7]] },
    blue: { c: "#60A5FA", c2: "#1E3A8A", start: 39, base: "br", lane: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [7, 7]] }
  };
  var LS_SAFE = { 0: 1, 8: 1, 13: 1, 21: 1, 26: 1, 34: 1, 39: 1, 47: 1 };

  /* ---------- Yalla-style setup ---------- */
  var LUDOCFG = null;
  function ludoSetup(pre) {
    var oldEl = document.getElementById("nva3-ludocfg");
    if (oldEl) oldEl.remove();
    var COLORS = { red: "#EF4444", green: "#22C55E", yellow: "#EAB308", blue: "#3B82F6" };
    var COUNT_ORDER = { 2: ["red", "yellow"], 3: ["red", "green", "yellow"], 4: ["red", "green", "yellow", "blue"] };
    var st = {
      count: (pre && pre.count) || (LUDOCFG && LUDOCFG.count) || 4,
      bots: (pre && pre.bots) || (LUDOCFG && LUDOCFG.bots) || { red: false, green: true, yellow: true, blue: true },
      names: (pre && pre.names) || (LUDOCFG && LUDOCFG.names) || { red: "You", green: "Bot Green", yellow: "Bot Yellow", blue: "Bot Blue" },
      rules: (pre && pre.rules) || (LUDOCFG && LUDOCFG.rules) || { sixOpen: true, capture: true, exact: true, sixForfeit: true },
      color: (pre && pre.color) || (LUDOCFG && LUDOCFG.color) || "red",
      theme: (pre && pre.theme) || (LUDOCFG && LUDOCFG.theme) || (function () { try { return localStorage.getItem("nva3_ludo_theme") || "classic"; } catch (e) { return "classic"; } })()
    };
    var WHEEL = ["red", "green", "yellow", "blue"];
    var OPPOSITE = { red: "yellow", yellow: "red", green: "blue", blue: "green" };
    function orderFor(count, color) {
      if (count === 2) return [color, OPPOSITE[color]];
      var i = WHEEL.indexOf(color), out = [];
      for (var n = 0; n < count; n++) out.push(WHEEL[(i + n) % 4]);
      return out;
    }
    var rulesList = [
      ["sixOpen", "6 to leave base", "Tokens only leave home on a 6"],
      ["capture", "Captures", "Landing on a rival sends them home"],
      ["exact", "Exact finish", "Need the exact roll to enter home"],
      ["sixForfeit", "3 sixes = forfeit", "Three sixes in a row lose the turn"]
    ];
    var el = document.createElement("div");
    el.id = "nva3-ludocfg";
    el.style.cssText = "position:fixed;inset:0;z-index:99990;background:rgba(4,6,16,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:14px";
    function paint() {
      var seatOrder = orderFor(st.count, st.color);
      var seats = seatOrder.map(function (c, i) {
        var isBot = !!st.bots[c];
        return '<div class="nvl-seat" style="display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid rgba(148,163,255,.22);border-radius:12px;background:rgba(255,255,255,.04)">' +
          '<span style="width:14px;height:14px;border-radius:50%;background:' + COLORS[c] + ';flex:0 0 auto;box-shadow:0 0 8px ' + COLORS[c] + '88"></span>' +
          '<input id="nvl-name-' + c + '" value="' + esc(st.names[c] || "") + '" maxlength="14" placeholder="Seat ' + (i + 1) + '" style="flex:1;min-width:0;background:rgba(0,0,0,.35);border:1px solid rgba(148,163,255,.25);border-radius:9px;color:#EEF3FF;font:700 13px/1 Sora,system-ui;padding:9px 10px;outline:none">' +
          '<button type="button" data-nvl-seat="' + c + '" style="flex:0 0 auto;min-width:74px;min-height:38px;border-radius:9px;font:800 12px/1 Sora,system-ui;cursor:pointer;border:1px solid ' + (isBot ? "rgba(167,139,250,.55)" : "rgba(52,211,153,.55)") + ';color:' + (isBot ? "#A78BFA" : "#34D399") + ';background:' + (isBot ? "rgba(139,92,246,.14)" : "rgba(16,185,129,.14)") + '">' + (isBot ? "🤖 Bot" : "👤 Player") + "</button></div>";
      }).join("");
      var rules = rulesList.map(function (r) {
        var on = st.rules[r[0]] !== false;
        return '<button type="button" data-nvl-rule="' + r[0] + '" style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:10px 12px;border:1px solid rgba(148,163,255,.2);border-radius:12px;background:rgba(255,255,255,.04);cursor:pointer;margin-bottom:7px">' +
          '<span style="text-align:left"><b style="display:block;font:800 12.5px/1.3 Sora,system-ui;color:#EEF3FF">' + r[1] + '</b><span style="font:500 10.5px/1.4 system-ui;color:rgba(238,243,255,.55)">' + r[2] + '</span></span>' +
          '<span style="flex:0 0 auto;width:40px;height:22px;border-radius:99px;background:' + (on ? "rgba(52,211,153,.8)" : "rgba(148,163,255,.25)") + ';position:relative;transition:.15s"><i style="position:absolute;top:2px;left:' + (on ? "20px" : "2px") + ';width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s"></i></span></button>';
      }).join("");
      el.innerHTML = '<div style="width:min(94vw,430px);max-height:88vh;overflow-y:auto;background:linear-gradient(160deg,#131629,#0B0E1C);border:1px solid rgba(148,163,255,.3);border-radius:20px;padding:18px 16px;box-shadow:0 30px 80px -30px rgba(0,0,0,.8)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><b style="font:900 17px/1 Sora,system-ui;color:#EEF3FF">🎲 Ludo Room Setup</b><button type="button" data-nvl-close style="background:none;border:0;color:rgba(238,243,255,.6);font-size:22px;cursor:pointer;min-width:38px;min-height:38px">✕</button></div>' +
        '<div style="font:800 10.5px/1 system-ui;letter-spacing:.14em;color:rgba(238,243,255,.5);text-transform:uppercase;margin-bottom:7px">Players</div>' +
        '<div style="display:flex;gap:7px;margin-bottom:14px">' + [2, 3, 4].map(function (n) {
          return '<button type="button" data-nvl-count="' + n + '" style="flex:1;min-height:42px;border-radius:11px;font:900 14px/1 Sora,system-ui;cursor:pointer;border:1px solid ' + (st.count === n ? "rgba(34,211,238,.7)" : "rgba(148,163,255,.25)") + ';background:' + (st.count === n ? "rgba(34,211,238,.16)" : "rgba(255,255,255,.04)") + ';color:' + (st.count === n ? "#67E8F9" : "rgba(238,243,255,.75)") + '">' + n + "P</button>";
        }).join("") + "</div>" +
        '<div style="font:800 10.5px/1 system-ui;letter-spacing:.14em;color:rgba(238,243,255,.5);text-transform:uppercase;margin-bottom:7px">Your Color</div>' +
        '<div style="display:flex;gap:7px;margin-bottom:14px">' + WHEEL.map(function (c) {
          var sel = st.color === c;
          return '<button type="button" data-nvl-color="' + c + '" style="flex:1;min-height:40px;border-radius:11px;cursor:pointer;font:800 11px/1 Sora,system-ui;color:' + (sel ? "#0B0E1C" : "rgba(238,243,255,.85)") + ';border:2px solid ' + (sel ? "#fff" : "transparent") + ';background:' + COLORS[c] + (sel ? "" : "55") + '">' + c.toUpperCase() + (sel ? " ★" : "") + "</button>";
        }).join("") + "</div>" +
        '<div style="font:800 10.5px/1 system-ui;letter-spacing:.14em;color:rgba(238,243,255,.5);text-transform:uppercase;margin-bottom:7px">Board Theme</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:14px">' + [["classic", "Classic 🎯"], ["neon", "Neon 💠"], ["ocean", "Ocean 🌊"], ["marble", "Marble 🏛️"], ["candy", "Candy 🍬"]].map(function (t) {
          var sel = st.theme === t[0];
          return '<button type="button" data-nvl-theme="' + t[0] + '" style="flex:1;min-width:0;min-height:40px;border-radius:11px;cursor:pointer;font:800 10px/1.2 Sora,system-ui;padding:4px 2px;color:' + (sel ? "#67E8F9" : "rgba(238,243,255,.7)") + ';border:1px solid ' + (sel ? "rgba(34,211,238,.7)" : "rgba(148,163,255,.25)") + ';background:' + (sel ? "rgba(34,211,238,.16)" : "rgba(255,255,255,.04)") + '">' + t[1] + "</button>";
        }).join("") + "</div>" +
        '<div style="font:800 10.5px/1 system-ui;letter-spacing:.14em;color:rgba(238,243,255,.5);text-transform:uppercase;margin-bottom:7px">Seats — Player ya Bot</div>' +
        seats +
        '<div style="font:800 10.5px/1 system-ui;letter-spacing:.14em;color:rgba(238,243,255,.5);text-transform:uppercase;margin:14px 0 7px">House Rules</div>' +
        rules +
        '<button type="button" id="nvl-start" style="width:100%;min-height:50px;margin-top:8px;border:0;border-radius:13px;font:900 15px/1 Sora,system-ui;color:#06121B;background:linear-gradient(135deg,#34D399,#22D3EE);cursor:pointer;box-shadow:0 12px 30px -12px rgba(34,211,238,.7)">▶ Start Game</button>' +
        "</div>";
      el.querySelectorAll("[data-nvl-count]").forEach(function (b) {
        b.addEventListener("click", function () { st.count = Number(b.getAttribute("data-nvl-count")); paint(); });
      });
      el.querySelectorAll("[data-nvl-color]").forEach(function (b) {
        b.addEventListener("click", function () {
          var c2 = b.getAttribute("data-nvl-color");
          if (c2 !== st.color) {
            var prev = st.color;
            st.bots[prev] = true;
            st.bots[c2] = false;
            if (st.names[prev] === "You") st.names[prev] = "Bot " + prev.charAt(0).toUpperCase() + prev.slice(1);
            st.names[c2] = "You";
          }
          st.color = c2;
          paint();
        });
      });
      el.querySelectorAll("[data-nvl-theme]").forEach(function (b) {
        b.addEventListener("click", function () { st.theme = b.getAttribute("data-nvl-theme"); paint(); });
      });
      el.querySelectorAll("[data-nvl-seat]").forEach(function (b) {
        b.addEventListener("click", function () {
          var c = b.getAttribute("data-nvl-seat");
          st.bots[c] = !st.bots[c];
          var inp = el.querySelector("#nvl-name-" + c);
          if (inp) st.names[c] = inp.value.slice(0, 14);
          paint();
        });
      });
      el.querySelectorAll("[data-nvl-rule]").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-nvl-rule");
          st.rules[k] = st.rules[k] === false;
          paint();
        });
      });
      el.querySelectorAll("#nvl-name-" + COUNT_ORDER[st.count].join(",#nvl-name-")).forEach(function (inp) {
        inp.addEventListener("input", function () { st.names[inp.id.replace("nvl-name-", "")] = inp.value.slice(0, 14); });
      });
      var closeBtn = el.querySelector("[data-nvl-close]");
      if (closeBtn) closeBtn.addEventListener("click", function () { el.remove(); });
      el.addEventListener("click", function (ev) { if (ev.target === el) el.remove(); });
      var startBtn = el.querySelector("#nvl-start");
      if (startBtn) startBtn.addEventListener("click", function () {
        var order = orderFor(st.count, st.color).slice();
        var humans = 0;
        order.forEach(function (c) {
          var inp = el.querySelector("#nvl-name-" + c);
          if (inp) st.names[c] = inp.value.trim().slice(0, 14) || st.names[c];
          if (!st.bots[c]) humans++;
        });
        if (!humans) { st.bots.red = false; st.names.red = st.names.red || "You"; humans = 1; }
        try { localStorage.setItem("nva3_ludo_theme", st.theme); } catch (e) {}
        LUDOCFG = { count: st.count, order: order, bots: Object.assign({}, st.bots), names: Object.assign({}, st.names), rules: Object.assign({}, st.rules), humans: humans, color: st.color, theme: st.theme };
        window.__ludoCfg = LUDOCFG;
        el.remove();
        play("ludo", "custom");
      });
    }
    paint();
    document.body.appendChild(el);
  }

  function LudoDom(mode) {
    var apiA = api("ludo");
    var online = mode === "online";
    var cfg = mode === "custom" ? (window.__ludoCfg || null) : null;
    var order;
    if (cfg) order = cfg.order.slice();
    else if (mode === "bot" || mode === "4p") order = ["red", "green", "yellow", "blue"];
    else order = ["red", "yellow"];
    var myColor = online ? (M && M.room().role === "host" ? "red" : "yellow") : null;
    var players = {}, turn = 0, dice = 0, rolling = false, phase = "roll", winner = null;
    var botTimer = 0, sixStreak = {}, moving = false, pulseOpts = [];
    var boardBuilt = false;
    var TURN_MS = 30000, turnDeadline = 0, timerIv = 0, missed = {}, HIST = [], histSaved = false;
    var chatCd = 0, chatCount = 0, chatWindow = 0;

    function isBot(n) { return (mode === "bot" && n !== "red") || !!(cfg && cfg.bots && cfg.bots[n]); }
    function isMine(n) { return online ? n === myColor : !isBot(n); }
    function pname(n) {
      if (cfg && cfg.names && cfg.names[n]) return cfg.names[n];
      if (online) return n === myColor ? "You" : "Friend";
      if (mode === "bot") return n === "red" ? "You" : "Bot " + n.charAt(0).toUpperCase() + n.slice(1);
      return n.charAt(0).toUpperCase() + n.slice(1);
    }
    function logLine(n, text) {
      if (!logEl) return;
      var col = n && LUDOP[n] ? LUDOP[n].c : "rgba(238,243,255,.55)";
      var row = '<div class="nva3-logrow"><i style="background:' + col + '"></i><span>' + esc(text) + "</span></div>";
      logEl.insertAdjacentHTML("afterbegin", row);
      while (logEl.children.length > 28) logEl.removeChild(logEl.lastChild);
    }

    /* ---------- move history ledger ---------- */
    function histAdd(c, s2, k) {
      HIST.push({ ts: Date.now(), c: c || "", s: String(s2 || ""), k: k || "info" });
      if (HIST.length > 300) HIST = HIST.slice(-300);
      renderHist();
      histPersist();
      if (online && (HIST.length % 5 === 0 || k === "win")) histPushRemote();
    }
    function histPersist() {
      try { localStorage.setItem("nva3_ludo_hist", JSON.stringify(HIST.slice(-80))); } catch (e) {}
    }
    function histPushRemote() {
      histSaved = true;
      try {
        var room = M && M.room && M.room();
        if (room && room.code && window.db) window.db.ref("matches/" + room.code + "/hist").set({ updated: Date.now(), log: HIST.slice(-120) }).catch(function () {});
      } catch (e) {}
    }
    function histLoadRemote(cb) {
      try {
        var room = M && M.room && M.room();
        if (room && room.code && window.db) {
          window.db.ref("matches/" + room.code + "/hist").once("value").then(function (sn) {
            var v = sn && sn.val();
            if (v && Array.isArray(v.log) && v.log.length) { HIST = v.log.slice(-300); renderHist(); }
            if (cb) cb();
          }).catch(function () { if (cb) cb(); });
          return;
        }
      } catch (e) {}
      if (cb) cb();
    }
    function histPrevLoad() {
      try { return JSON.parse(localStorage.getItem("nva3_ludo_prev") || "[]"); } catch (e) { return []; }
    }
    function histPrevSave() {
      try { localStorage.setItem("nva3_ludo_prev", JSON.stringify(HIST.slice(-60))); } catch (e) {}
    }
    function renderHist() {
      if (!domEl) return;
      var el = domEl.querySelector("#nva3-ldhist-cur");
      if (!el) return;
      var rows = HIST.slice(-60).map(function (h) {
        var dot = h.c && LUDOP[h.c] ? '<i style="background:' + LUDOP[h.c].c + '"></i>' : "<i class=\"nva3-hdot\"></i>";
        return '<div class="nva3-hrow">' + dot + "<span>" + esc(h.s) + '</span><time>' + new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "</time></div>";
      }).join("");
      el.innerHTML = rows || '<div class="nva3-hempty">Dice rolls aur moves yahan record honge…</div>';
      var pe = domEl.querySelector("#nva3-ldhist-prev");
      if (pe && !pe.dataset.done) {
        var prev = histPrevLoad();
        pe.innerHTML = prev.length ? prev.slice(-40).map(function (h) {
          var dot = h.c && LUDOP[h.c] ? '<i style="background:' + LUDOP[h.c].c + '"></i>' : "<i class=\"nva3-hdot\"></i>";
          return '<div class="nva3-hrow">' + dot + "<span>" + esc(h.s) + "</span></div>";
        }).join("") : '<div class="nva3-hempty">Pichla match record yahan milega.</div>';
        pe.dataset.done = "1";
      }
      el.scrollTop = 0;
    }
    function histResetForNewMatch() {
      if (HIST.length && !online) histPrevSave();
      HIST = [];
      histSaved = false;
      try { localStorage.removeItem("nva3_ludo_hist"); } catch (e) {}
      if (domEl) {
        var pe = domEl.querySelector("#nva3-ldhist-prev");
        if (pe) { pe.dataset.done = ""; pe.innerHTML = ""; }
      }
    }

    /* ---------- 30s turn timer ---------- */
    function timerStart() {
      turnDeadline = Date.now() + TURN_MS;
      if (timerIv) clearInterval(timerIv);
      timerIv = setInterval(timerTick, 250);
      timerTick();
    }
    function timerStop() {
      turnDeadline = 0;
      if (timerIv) { clearInterval(timerIv); timerIv = 0; }
      var el = domEl && domEl.querySelector("#nva3-ldtimer");
      if (el) { el.textContent = ""; el.classList.remove("warn"); }
    }
    function timerTick() {
      if (!turnDeadline || winner) return;
      if (!domEl || !document.body.contains(domEl)) { if (timerIv) clearInterval(timerIv); timerIv = 0; return; }
      var left = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
      var el = domEl.querySelector("#nva3-ldtimer");
      if (el) {
        el.textContent = "⏱ " + left + "s";
        el.classList.toggle("warn", left <= 10);
      }
      if (left <= 0) timerExpire();
    }
    function timerExpire() {
      if (winner || rolling || moving || phase !== "roll") return;
      if (online && M && M.room && M.room().role && M.room().role !== "host") { turnDeadline = Date.now() + TURN_MS; return; }
      turnDeadline = Date.now() + TURN_MS;
      var loser = cur();
      if (isBot(loser)) { turnDeadline = Date.now() + TURN_MS; return; }
      missed[loser] = (missed[loser] || 0) + 1;
      logLine(loser, pname(loser) + " ran out of time — turn skipped (" + missed[loser] + "/3).");
      histAdd(loser, pname(loser) + " missed the turn (timeout " + missed[loser] + "/3)", "skip");
      apiA.status(pname(loser) + " timed out!");
      if (missed[loser] >= 3) {
        if (online) { netSend({ t: "ludo-forfeit", loser: loser }); }
        forfeitWin(loser);
        return;
      }
      if (online) netSend({ t: "ludo-skip", by: loser });
      phase = "end";
      paint();
      setTimeout(function () { if (!winner) nextTurn(false); }, 550);
    }
    function nextEligible(after) {
      var i = order.indexOf(after);
      for (var n = 1; n <= order.length; n++) {
        var c = order[(i + n) % order.length];
        if (players[c] && players[c].home < 4) return c;
      }
      return order[(i + 1) % order.length];
    }
    function forfeitWin(loser) {
      if (winner) return;
      winner = nextEligible(loser);
      timerStop();
      SFX.play("win");
      logLine(winner, "🏆 " + pname(winner) + " wins — " + pname(loser) + " missed 3 turns in a row!");
      histAdd(winner, "🏆 " + pname(winner) + " wins by forfeit (" + pname(loser) + " missed 3 turns)", "win");
      apiA.status(pname(winner) + " wins by forfeit!");
      var res = online ? (winner === myColor ? "win" : "loss") : (mode === "bot" ? (winner === "red" ? "win" : "loss") : (mode === "custom" && cfg && cfg.bots[winner] && cfg.humans === 1 ? "loss" : "win"));
      apiA.over(pname(winner) + " wins!", pname(loser) + " missed 3 turns in a row.", res);
      recordResult("ludo", res, pname(winner) + " won by forfeit");
      paint();
    }

    /* ---------- quick chat ---------- */
    var BAD_WORDS = ["fuck", "fuk", "bitch", "asshole", "bastard", "dick", "shit", "cunt", "motherfucker", "nigger", "faggot", "slut", "whore", "retard", "kutta", "kamina", "harami", "bakwas", "chutiya", "madarchod", "behenchod", "gandu", "teri maa"];
    function cleanText(t) {
      t = String(t || "").slice(0, 80);
      BAD_WORDS.forEach(function (w) {
        var rx = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        t = t.replace(rx, function (m2) { return m2[0] + "*".repeat(Math.max(2, m2.length - 1)); });
      });
      return t;
    }
    function showBubble(name, text) {
      if (!domEl) return;
      var wrap = domEl.querySelector("#nva3-ldbubbles");
      if (!wrap) return;
      var b = document.createElement("div");
      b.className = "nva3-bubble";
      var col = name && LUDOP[name] ? LUDOP[name].c : "#8B93B8";
      b.innerHTML = '<i style="background:' + col + '"></i><span><b>' + esc(name && LUDOP[name] ? pname(name) : "Player") + "</b>" + esc(text) + "</span>";
      wrap.appendChild(b);
      while (wrap.children.length > 2) wrap.removeChild(wrap.firstChild);
      setTimeout(function () { b.classList.add("out"); }, 3200);
      setTimeout(function () { b.remove(); }, 3700);
    }
    function botReply() {
      var replies = ["Good luck! 😄", "Nice move!", "Ooops 😅", "Fast chal yaar 😜", "Well played!", "Kya move tha! 🔥", "Dice mere saath hai aaj 😎"];
      setTimeout(function () {
        var b = order.filter(function (c) { return isBot(c); });
        if (!b.length || winner) return;
        var who = b[Math.floor(Math.random() * b.length)];
        var r = replies[Math.floor(Math.random() * replies.length)];
        showBubble(who, r);
        logLine(who, pname(who) + ": " + r);
        histAdd(who, pname(who) + " messaged: " + r, "msg");
      }, 850 + Math.random() * 700);
    }
    function sendChat(text) {
      var now = Date.now();
      if (now - chatCd < 2000) { toast("Message spam-guard: wait 2s", "warn"); return; }
      if (now - chatWindow > 30000) { chatWindow = now; chatCount = 0; }
      chatCount++;
      if (chatCount > 5) { toast("Chat limit: max 5 messages / 30s", "warn"); return; }
      chatCd = now;
      var t = cleanText(text);
      if (!t) return;
      var me = online ? myColor : "red";
      showBubble(me, t);
      logLine(me, pname(me) + ": " + t);
      histAdd(me, pname(me) + " messaged: " + t, "msg");
      if (online) netSend({ t: "ludo-msg", by: me, text: t });
      else botReply();
    }

    /* ---------- geometry ---------- */
    function cellPct(x, y) { return { x: ((x + 0.5) / 15) * 100, y: ((y + 0.5) / 15) * 100 }; }
    function baseSlots(n) {
      /* grid-cell centers of each base's inner token cluster -> board percent */
      var B = { bl: [2, 11], tl: [2, 2], tr: [11, 2], br: [11, 11] }[LUDOP[n].base];
      var offs = [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]];
      return offs.map(function (o) {
        return { x: ((B[0] + 0.5 + o[0]) / 15) * 100, y: ((B[1] + 0.5 + o[1]) / 15) * 100 };
      });
    }
    function tokenPct(name, idx, pos) {
      if (pos === -1) { var s = baseSlots(name); return { x: s[idx % 4].x, y: s[idx % 4].y }; }
      if (pos === 56) return { x: 50, y: 50 };
      var l;
      if (pos <= 50) l = LTRACK[(LUDOP[name].start + pos) % 52];
      else l = LUDOP[name].lane[pos - 51] || [7, 7];
      var base = cellPct(l[0], l[1]);
      /* stack offset when tokens share a cell */
      var same = 0;
      for (var i = 0; i < idx; i++) if (players[name].tokens[i] === pos && pos !== 56) same++;
      var off = [[0, 0], [-1.1, -1.1], [1.1, 1.1], [1.1, -1.1]][same % 4];
      return { x: base.x + off[0], y: base.y + off[1] };
    }

    /* ---------- rules (ported, proven) ---------- */
    function globalAt(name, pos) { return pos >= 0 && pos <= 50 ? (LUDOP[name].start + pos) % 52 : -1; }
    function oppCountAt(name, g) {
      var c = 0;
      for (var oi = 0; oi < order.length; oi++) {
        var o = order[oi];
        if (o === name) continue;
        var t = players[o].tokens;
        for (var k = 0; k < 4; k++) if (t[k] >= 0 && t[k] <= 50 && globalAt(o, t[k]) === g) c++;
      }
      return c;
    }
    function blockedPath(name, from, to) {
      if (to > 50) to = 50;
      var start = from < 0 ? 0 : from + 1;
      for (var p = start; p <= to; p++) {
        var g = (LUDOP[name].start + p) % 52;
        if (oppCountAt(name, g) >= 2) return true;
      }
      return false;
    }
    function moves(name, d) {
      var t = players[name].tokens, out = [];
      for (var i = 0; i < 4; i++) {
        var p = t[i];
        if (p === 56) continue;
        if (p === -1) {
          if ((d === 6 || (cfg && cfg.rules && cfg.rules.sixOpen === false)) && !blockedPath(name, -1, 0)) out.push({ i: i, from: p, to: 0 });
          continue;
        }
        var to = p + d;
        if (to > 56) {
          if (!cfg || !cfg.rules || cfg.rules.exact !== false) continue;
          to = 56;
        }
        if (blockedPath(name, p, to)) continue;
        out.push({ i: i, from: p, to: to });
      }
      return out;
    }

    /* ---------- rendering ---------- */
    function boardHTML() {
      var cells = [];
      var inTrack = {};
      LTRACK.forEach(function (t, i) { inTrack[t[0] + "," + t[1]] = i; });
      var laneMap = {};
      order.forEach(function (n) {
        LUDOP[n].lane.forEach(function (l, li) { laneMap[l[0] + "," + l[1]] = n; });
      });
      var startMap = {};
      order.forEach(function (n) { var s = LTRACK[LUDOP[n].start]; startMap[s[0] + "," + s[1]] = n; });
      for (var y = 0; y < 15; y++) {
        for (var x = 0; x < 15; x++) {
          var key = x + "," + y;
          var cls = "nvb-ldc";
          var content = "";
          if (inTrack[key] != null) {
            cls += " path";
            if (LS_SAFE[inTrack[key]]) cls += " safe";
            if (startMap[key]) cls += " start-" + startMap[key];
            if (LS_SAFE[inTrack[key]]) content = "★";
          } else if (laneMap[key]) {
            cls += " lane lane-" + laneMap[key];
          } else if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
            cls += " center";
            content = '<span class="nvb-ld-star">▲</span>';
          } else {
            var bcol = x < 6 && y < 6 ? "green" : x > 8 && y < 6 ? "yellow" : x < 6 && y > 8 ? "red" : x > 8 && y > 8 ? "blue" : null;
            if (bcol) cls += " base base-" + bcol;
            else cls += " filler";
          }
          cells.push('<div class="' + cls + '">' + content + "</div>");
        }
      }
      return '<div class="nvb-ldboard">' + cells.join("") + "</div>";
    }
    function ensureBoard() {
      if (boardBuilt) return;
      var el = domEl.querySelector(".nvb-ldwrap");
      if (!el) return;
      /* append the play area after the player-cards head (never overwrite it) */
      el.insertAdjacentHTML("beforeend",
        '<div class="nvb-ldplay">' + boardHTML() +
        '<div class="nvb-ldtokens" id="nva3-ldtokens"></div>' +
        '<div class="nvb-lddice" id="nva3-lddice"><span>–</span></div>' +
        '<div class="nvb-ldtimer" id="nva3-ldtimer"></div>' +
        '<div class="nva3-ldbubbles" id="nva3-ldbubbles"></div>' +
        '<button type="button" class="nvb-ldchatbtn" id="nva3-ldchatbtn" aria-label="Quick chat">💬</button></div>' +
        '<div class="nva3-ldhist"><div class="nva3-hhead"><span>📜 Move History</span><button type="button" class="nva3-hprevbtn" id="nva3-ldprevbtn">Previous match ▾</button></div>' +
        '<div class="nva3-hscroll" id="nva3-ldhist-cur"></div>' +
        '<div class="nva3-hprev" id="nva3-ldhist-prev-wrap" hidden><div class="nva3-hscroll" id="nva3-ldhist-prev"></div></div></div>');
      boardBuilt = true;
      applyTheme();
    }
    function applyTheme() {
      if (!domEl) return;
      var bd = domEl.querySelector(".nvb-ldboard");
      if (!bd) return;
      var th = "classic";
      try { th = (cfg && cfg.theme) || localStorage.getItem("nva3_ludo_theme") || "classic"; } catch (e) {}
      bd.classList.remove("t-classic", "t-neon", "t-ocean", "t-marble", "t-candy");
      bd.classList.add("t-" + th);
    }
    function paint() {
      ensureBoard();
      var tWrap = domEl.querySelector("#nva3-ldtokens");
      if (!tWrap) return;
      /* tokens */
      order.forEach(function (n) {
        for (var i = 0; i < 4; i++) {
          var id = "ldtok-" + n + i;
          var el = tWrap.querySelector("#" + id);
          if (!el) {
            el = document.createElement("button");
            el.type = "button";
            el.id = id;
            el.className = "nvb-ldtok t-" + n;
            el.setAttribute("aria-label", pname(n) + " token " + (i + 1));
            tWrap.appendChild(el);
          }
          var pos = players[n].tokens[i];
          var p = tokenPct(n, i, pos);
          el.style.left = p.x + "%";
          el.style.top = p.y + "%";
          var clickable = phase === "pick" && !rolling && !moving && !winner && isMine(cur()) && n === cur() &&
            pulseOpts.some(function (m) { return m.i === i && m.n === n; });
          el.classList.toggle("pickable", !!clickable);
          el.classList.toggle("active", pulseOpts.some(function (m) { return m.n === n && m.i === i && !m.option; }));
        }
      });
      /* dice */
      var dEl = domEl.querySelector("#nva3-lddice");
      if (dEl) {
        dEl.className = "nvb-lddice" + (rolling ? " rolling" : "") + (phase === "roll" && !winner && isMine(cur()) && !moving ? " can" : "");
        dEl.innerHTML = dice ? diceDots(dice) : "<span>–</span>";
        var cn = LUDOP[cur()];
        if (cn) dEl.style.borderColor = cn.c;
      }
      /* player cards */
      var cards = order.map(function (n) {
        var done = players[n].tokens.filter(function (x) { return x === 56; }).length;
        return '<div class="nvb-ldp' + (n === cur() ? " on" : "") + (winner === n ? " won" : "") + '" style="--pc:' + LUDOP[n].c + '">' +
          '<i></i><b>' + esc(pname(n)) + "</b><span>" + done + "/4 home</span></div>";
      }).join("");
      var head = domEl.querySelector(".nvb-ldhead");
      if (head) head.innerHTML = cards;
    }
    function diceDots(v) {
      var spots = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      var d = '<span class="nvb-ldd">';
      for (var i = 0; i < 9; i++) d += '<i class="' + (spots[v].indexOf(i) >= 0 ? "on" : "") + '"></i>';
      return d + "</span>";
    }
    function fullRender() {
      apiA.setHTML(
        '<div class="nvb-ldwrap"><div class="nvb-ldhead"></div></div>'
      );
      boardBuilt = false;
      ensureBoard();
      paint();
    }

    /* ---------- game flow ---------- */
    function statusFor(n) {
      if (isBot(n)) return "Bot " + n.charAt(0).toUpperCase() + n.slice(1) + "'s turn — thinking…";
      if (online) return n === myColor ? "Your turn — roll the dice" : "Waiting for your friend…";
      if (mode === "bot" && n === "red") return "Your turn — roll the dice";
      return pname(n) + "'s turn — roll the dice";
    }
    function cur() { return order[turn]; }
    function reset() {
      players = {};
      order.forEach(function (n) { players[n] = { tokens: [-1, -1, -1, -1], home: 0 }; });
      turn = 0; dice = 0; rolling = false; phase = "roll"; winner = null;
      botTimer = 0; sixStreak = {}; moving = false; pulseOpts = [];
      missed = {}; timerStop(); histResetForNewMatch();
      if (logEl) logEl.innerHTML = "";
      apiA.clearOver();
      fullRender();
      logLine(null, "New match — " + (online ? "you are " + myColor : mode === "custom" && cfg ? cfg.count + "P custom rules" : mode === "4p" ? "4-player hot-seat" : mode === "duo" ? "2-player" : "vs bots") + ".");
      apiA.status(statusFor(order[0]));
      if (isBot(order[0])) botTimer = 700;
      apiA.score(0, HS.ludo || 0);
      if (online) histLoadRemote(function () {
        histAdd(null, "🎲 Match started — " + order.map(function (n) { return pname(n); }).join(" vs "), "info");
        timerStart();
      });
      else {
        histAdd(null, "🎲 New match — " + order.map(function (n) { return pname(n); }).join(" vs "), "info");
        timerStart();
      }
    }
    function apply(name, m, remote) {
      if (winner) return;
      var tok = players[name].tokens;
      var from = m.from;
      var to = m.to;
      pulseOpts = [];
      /* capture check happens after arrival */
      var captured = [];
      var g = to >= 0 && to <= 50 ? globalAt(name, to) : -1;
      if (g >= 0 && !LS_SAFE[g] && (!cfg || !cfg.rules || cfg.rules.capture !== false)) {
        order.forEach(function (o) {
          if (o === name) return;
          var ot = players[o].tokens;
          for (var k = 0; k < 4; k++) {
            if (ot[k] >= 0 && ot[k] <= 50 && globalAt(o, ot[k]) === g) captured.push({ o: o, i: k });
          }
        });
      }
      var steps = to === -1 ? 1 : (to - Math.max(from, -1));
      var hops = Math.max(1, Math.min(steps, 12));
      moving = true;
      phase = "moving";
      paint();
      var step = 0;
      var iv = setInterval(function () {
        step++;
        var mid = from === -1 ? to : Math.min(from + step, to);
        var el = domEl.querySelector("#ldtok-" + name + m.i);
        if (el) {
          var p = tokenPct(name, m.i, mid);
          el.style.left = p.x + "%";
          el.style.top = p.y + "%";
        }
        if (step >= hops) {
          clearInterval(iv);
          tok[m.i] = to;
          players[name].home = tok.filter(function (x) { return x === 56; }).length;
          if (captured.length) {
            SFX.play("capture");
            captured.forEach(function (c) { players[c.o].tokens[c.i] = -1; });
            var pop = domEl.querySelector("#ldtok-" + name + m.i);
            if (pop) { pop.classList.remove("cap"); void pop.offsetWidth; pop.classList.add("cap"); }
          }
          paint();
          logLine(name, pname(name) + " moved token " + (m.i + 1) + (from === -1 ? " out of base" : " to " + (to <= 50 ? "step " + to : to === 56 ? "home" : "the home lane")) + ".");
          var finished = to === 56;
          if (finished) logLine(name, pname(name) + " brought a token home!");
          var won0 = tok.every(function (x) { return x === 56; });
          captured.forEach(function (c) { logLine(name, pname(name) + " captured " + pname(c.o) + " — sent back to base!"); });
          missed[name] = 0;
          histAdd(name, "🎯 " + pname(name) + " moved " + (from === -1 ? "out of base" : "to " + (to <= 50 ? "step " + to : "home")) + (steps > 1 ? " (" + steps + " steps)" : ""), "move");
          if (finished) histAdd(name, "🏠 " + pname(name) + " brought a token home (" + players[name].home + "/4)", "finish");
          captured.forEach(function (c) { histAdd(name, "💥 " + pname(name) + " captured " + pname(c.o), "capture"); });
          var extra = dice === 6 || finished || captured.length > 0;
          if (extra && !won0) histAdd(name, "⚡ " + pname(name) + " earned a bonus turn", "bonus");
          var won = tok.every(function (x) { return x === 56; });
          moving = false;
          if (won) {
            winner = name;
            timerStop();
            histAdd(name, "🏆 " + pname(name) + " WON the match!", "win");
            histPushRemote();
            SFX.play("win");
            apiA.record(players[name].home * 100 + (myColor === name ? 1000 : 0));
            apiA.status(pname(name) + " wins!");
            apiA.over(pname(name) + " wins!", "All four tokens are home.", online ? (name === myColor ? "win" : "loss") : (mode === "bot" ? (name === "red" ? "win" : "loss") : (mode === "custom" && cfg && cfg.bots[name] && cfg.humans === 1 ? "loss" : "win")));
            recordResult("ludo", online ? (name === myColor ? "win" : "loss") : (mode === "bot" ? (name === "red" ? "win" : "loss") : (mode === "custom" && cfg && cfg.bots[name] && cfg.humans === 1 ? "loss" : "win")), pname(name) + " won");
            paint();
            return;
          }
          if (!remote && online) netSend({ t: "ludo-move", by: name, i: m.i, from: from, to: to });
          phase = "end";
          var delay = remote ? 480 : (isBot(name) ? 480 : 420);
          setTimeout(function () { nextTurn(extra, name); }, delay);
        } else if (step % 2 === 0) SFX.play("move");
      }, 110);
    }
    function nextTurn(keep, who) {
      if (winner) return;
      if (!(keep && who && who === cur())) turn = (turn + 1) % order.length;
      dice = 0; rolling = false; phase = "roll"; pulseOpts = [];
      paint();
      apiA.status(statusFor(cur()));
      timerStart();
      if (isBot(cur())) botTimer = 620;
    }
    function rollFor(name) {
      if (winner || rolling || moving || phase !== "roll" || name !== cur()) return;
      /* humans roll their own turns; bots are rolled by the game loop timer */
      if (!isMine(name) && !isBot(name)) return;
      rolling = true; phase = "rolling";
      SFX.play("dice");
      apiA.status("Rolling…");
      paint();
      var dEl0 = domEl.querySelector("#nva3-lddice");
      if (dEl0) dEl0.classList.add("rolling");
      var ticks = 0;
      var iv = setInterval(function () {
        dice = 1 + Math.floor(Math.random() * 6);
        var dEl = domEl.querySelector("#nva3-lddice");
        if (dEl) dEl.innerHTML = diceDots(dice);
        ticks++;
        if (ticks <= 7) return;
        clearInterval(iv);
        rolling = false;
        var dEl1 = domEl.querySelector("#nva3-lddice");
        if (dEl1) dEl1.classList.remove("rolling");
        var v = dice;
        logLine(name, pname(name) + " rolled a " + v + ".");
        missed[name] = 0;
        histAdd(name, "🎲 " + pname(name) + " rolled a " + v, "roll");
        timerStart();
        if (v === 6) sixStreak[name] = (sixStreak[name] || 0) + 1; else sixStreak[name] = 0;
        if (online && isMine(name)) netSend({ t: "ludo-dice", by: name, v: v });
        if (sixStreak[name] >= 3 && (!cfg || !cfg.rules || cfg.rules.sixForfeit !== false)) {
          sixStreak[name] = 0;
          logLine(name, "Three sixes in a row — turn forfeited.");
          histAdd(name, "🎲 3 sixes in a row — turn forfeited", "skip");
          apiA.status("Three sixes — turn passes");
          phase = "end";
          paint();
          setTimeout(function () { if (!winner) nextTurn(false); }, 700);
          if (online && isMine(name)) netSend({ t: "ludo-pass", reason: "sixes" });
          return;
        }
        var ms = moves(name, v);
        if (!ms.length) {
          logLine(name, "No legal move with " + v + " — passing.");
          apiA.status("Dice " + v + " — no move, passing");
          phase = "end";
          paint();
          setTimeout(function () { if (!winner) nextTurn(false); }, 720);
          if (online && isMine(name)) netSend({ t: "ludo-pass" });
          return;
        }
        if (ms.length === 1) {
          apiA.status("Dice " + v + " — moving…");
          phase = "pick";
          setTimeout(function () { apply(name, ms[0]); }, 280);
          return;
        }
        if (isBot(name)) {
          phase = "pick";
          apiA.status("Bot rolled " + v + "…");
          setTimeout(function () { apply(name, botChoose(name, ms)); }, 520);
          return;
        }
        phase = "pick";
        pulseOpts = ms.map(function (m) { return { n: name, i: m.i, from: m.from, option: true }; });
        apiA.status("Dice " + v + " — choose a token");
        paint();
      }, 55);
    }
    function botChoose(name, ms) {
      var best = ms[0], bestScore = -1e9;
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i], s = Math.random() * 6;
        if (m.to === 56) s += 1200;
        if (m.to > 50) s += 320;
        if (m.from === -1) s += 220;
        if (m.to <= 50) {
          var g = globalAt(name, m.to);
          var opp = oppCountAt(name, g);
          if (opp === 1 && !LS_SAFE[g]) s += 650;
          if (LS_SAFE[g]) s += 40;
          for (var oi = 0; oi < order.length; oi++) {
            var o = order[oi];
            if (o === name) continue;
            var ot = players[o].tokens;
            for (var k = 0; k < 4; k++) {
              var op = ot[k];
              if (op >= 0 && op <= 50) {
                var og = globalAt(o, op);
                var dist = (g - og + 52) % 52;
                if (dist >= 1 && dist <= 6 && !LS_SAFE[og]) s += 30;
              }
            }
          }
        }
        s += m.to * 0.4;
        if (s > bestScore) { bestScore = s; best = m; }
      }
      return best;
    }
    function clickToken(name, i) {
      if (winner || rolling || moving || phase !== "pick" || !isMine(cur())) return;
      var ms = moves(name, dice);
      for (var k = 0; k < ms.length; k++) {
        if (ms[k].i === i) { apply(name, ms[k]); return; }
      }
    }

    function ldChatOpen() {
      var old = document.getElementById("nva3-ldchat");
      if (old) { old.remove(); return; }
      var el = document.createElement("div");
      el.id = "nva3-ldchat";
      el.style.cssText = "position:fixed;inset:0;z-index:99988;display:flex;align-items:flex-end;justify-content:center;background:rgba(4,6,16,.6);padding:18px";
      var presets = ["Good luck! 🍀", "Nice move! 👏", "Fast chal yaar 😄", "Ooops 😅", "Well played! 🔥", "Dice ka kamaal 😎"];
      el.innerHTML = '<div style="width:min(94vw,380px);background:linear-gradient(160deg,#131629,#0B0E1C);border:1px solid rgba(148,163,255,.35);border-radius:20px;padding:14px;box-shadow:0 -20px 60px -20px rgba(0,0,0,.8)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font:900 14px Sora,system-ui;color:#EEF3FF">💬 Quick Chat</b><button type="button" id="nva3-cc-x" style="background:none;border:0;color:#94A3B8;font-size:20px;cursor:pointer;min-width:38px;min-height:38px">✕</button></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">' + presets.map(function (p) { return '<button type="button" class="nva3-cc-p" data-p="' + p + '" style="padding:9px 13px;border-radius:99px;border:1px solid rgba(148,163,255,.3);background:rgba(255,255,255,.06);color:#C7D2FE;font:700 12.5px system-ui;cursor:pointer">' + p + "</button>"; }).join("") + "</div>" +
        '<div style="display:flex;gap:7px"><input id="nva3-cc-in" maxlength="80" placeholder="Message (max 80)…" style="flex:1;min-width:0;min-height:44px;background:rgba(0,0,0,.4);border:1px solid rgba(148,163,255,.3);border-radius:12px;color:#EEF3FF;font:600 13.5px system-ui;padding:0 12px;outline:none"><button type="button" id="nva3-cc-send" style="min-width:56px;min-height:44px;border:0;border-radius:12px;background:linear-gradient(135deg,#34D399,#22D3EE);color:#06121B;font:900 13px Sora,system-ui;cursor:pointer">➤</button></div>' +
        '<div style="font:600 10px system-ui;color:rgba(238,243,255,.45);margin-top:7px">2s cooldown · max 5 msgs / 30s · bad words filtered</div></div>';
      el.addEventListener("click", function (ev) { if (ev.target === el) el.remove(); });
      el.querySelector("#nva3-cc-x").addEventListener("click", function () { el.remove(); });
      el.querySelectorAll(".nva3-cc-p").forEach(function (b) {
        b.addEventListener("click", function () { sendChat(b.getAttribute("data-p")); el.remove(); });
      });
      var doSend = function () {
        var v = el.querySelector("#nva3-cc-in").value;
        if (v.trim()) { sendChat(v); el.remove(); }
      };
      el.querySelector("#nva3-cc-send").addEventListener("click", doSend);
      el.querySelector("#nva3-cc-in").addEventListener("keydown", function (ev) { if (ev.key === "Enter") doSend(); });
      document.body.appendChild(el);
      el.querySelector("#nva3-cc-in").focus();
    }

    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "end") {
          if (!winner) {
            winner = "left";
            apiA.status("Your friend left the match");
            apiA.over("Match ended", "Your friend closed the game.", "draw");
            recordResult("ludo", "draw", "left");
          }
          return;
        }
        if (m.t === "restart") { reset(); return; }
        if (m.t === "ludo-dice" && m.by && m.by !== myColor) {
          dice = m.v;
          var dEl = domEl.querySelector("#nva3-lddice");
          if (dEl) dEl.innerHTML = diceDots(dice);
          apiA.status(pname(m.by) + " rolled " + m.v + "…");
          histAdd(m.by, "🎲 " + pname(m.by) + " rolled a " + m.v, "roll");
          return;
        }
        if (m.t === "ludo-move" && m.by && m.by !== myColor) {
          apply(m.by, { i: m.i, from: (m.from == null ? -2 : m.from), to: m.to }, true);
          return;
        }
        if (m.t === "ludo-msg" && m.by && m.by !== (online ? myColor : "")) {
          var mt = cleanText(m.text || "");
          showBubble(m.by, mt);
          logLine(m.by, pname(m.by) + ": " + mt);
          histAdd(m.by, pname(m.by) + " messaged: " + mt, "msg");
          return;
        }
        if (m.t === "ludo-skip") {
          logLine(m.by, pname(m.by) + " ran out of time — turn skipped.");
          histAdd(m.by, pname(m.by) + " missed the turn (timeout)", "skip");
          phase = "end";
          paint();
          setTimeout(function () { if (!winner) nextTurn(false); }, 550);
          return;
        }
        if (m.t === "ludo-forfeit") {
          forfeitWin(m.loser || cur());
          return;
        }
        if (m.t === "ludo-pass" && phase !== "end") {
          phase = "end";
          if (m.reason === "sixes") logLine(null, "Turn forfeited after three sixes.");
          paint();
          setTimeout(function () { if (!winner) nextTurn(false); }, 500);
          return;
        }
      };
    }

    reset();
    return {
      noDraw: true,
      start: function () {},
      update: function (dt) {
        if (botTimer > 0) {
          botTimer -= dt;
          if (botTimer <= 0) {
            botTimer = 0;
            if (!winner && !rolling && !moving && phase === "roll" && isBot(cur())) rollFor(cur());
          }
        }
      },
      draw: function () {},
      onDomClick: function (e) {
        var t = e.target.closest(".nvb-ldtok");
        if (t) {
          var id = t.id.replace("ldtok-", "");
          clickToken(id.slice(0, -1), parseInt(id.slice(-1), 10));
          return;
        }
        if (e.target.closest("#nva3-ldchatbtn")) { ldChatOpen(); return; }
        if (e.target.closest("#nva3-ldprevbtn")) {
          var pw = domEl.querySelector("#nva3-ldhist-prev-wrap");
          if (pw) pw.hidden = !pw.hidden;
          return;
        }
        if (e.target.closest("#nva3-lddice")) rollFor(cur());
      },
      key: function (k) {
        if (k === " " || k === "Enter") rollFor(cur());
        else if (k === "r" || k === "R") openRules("ludo");
      },
      action: function (a) {
        if (a === "roll") rollFor(cur());
        else if (a === "ludo-setup") ludoSetup(null);
        else if (a === "ludo-chat") ldChatOpen();
        else if (a === "ludo-bot") ludoSetup({ count: 4, bots: { red: false, green: true, yellow: true, blue: true }, names: { red: "You", green: "Bot Green", yellow: "Bot Yellow", blue: "Bot Blue" } });
        else if (a === "ludo-duo") ludoSetup({ count: 2, bots: { red: false, yellow: false, green: true, blue: true }, names: { red: "Player 1", yellow: "Player 2", green: "Bot Green", blue: "Bot Blue" } });
        else if (a === "ludo-4p") ludoSetup({ count: 4, bots: { red: false, green: false, yellow: false, blue: false }, names: { red: "Player 1", green: "Player 2", yellow: "Player 3", blue: "Player 4" } });
        else if (a === "rules") openRules("ludo");
        else if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); }
        else if (a === "menu") showMenu();
      },
      stop: function () { if (online) NET2.recv = null; }
    };
  }

  /* ============================================================
     REACTION CHALLENGE
     ============================================================ */
  function Reaction() {
    var apiA = api("reaction");
    var state, t0, round, times, best, toId;
    function reset() {
      state = "idle"; round = 0; times = []; best = 0;
      if (toId) clearTimeout(toId);
      apiA.clearOver();
      apiA.score(0, HS.reaction || 0);
      apiA.status("Tap to start — 5 rounds");
      render();
    }
    function render() {
      var cls = state === "ready" ? " go" : state === "wait" ? " wait" : state === "early" ? " early" : state === "done" ? " done" : "";
      var txt = {
        idle: "TAP TO START",
        wait: "WAIT FOR GREEN…",
        ready: "TAP NOW!",
        early: "TOO EARLY — tap to retry",
        result: "NEXT ROUND — tap to continue",
        done: "TAP TO RESTART"
      }[state] || "TAP TO START";
      var info = "";
      if (times.length) {
        var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
        info = "Round " + Math.min(round, 5) + "/5 · last " + (times[times.length - 1]) + "ms · avg " + avg + "ms · best " + best + "ms";
      }
      apiA.setHTML('<button type="button" class="nvb-rxn' + cls + '" data-rxn="1"><b>' + txt + "</b><span>" + info + "</span></button>");
    }
    function tap() {
      if (state === "idle" || state === "done" || state === "early" || state === "result") {
        if (state === "done") { reset(); return; }
        if (round >= 5) { finishRun(); return; }
        round++;
        state = "wait";
        render();
        toId = setTimeout(function () {
          state = "ready";
          t0 = Date.now();
          SFX.play("good");
          render();
        }, 1200 + Math.random() * 2300);
        return;
      }
      if (state === "wait") {
        clearTimeout(toId);
        state = "early";
        SFX.play("bad");
        render();
        return;
      }
      if (state === "ready") {
        var ms = Date.now() - t0;
        times.push(ms);
        if (!best || ms < best) best = ms;
        SFX.play("good");
        apiA.record(Math.max(10, 1500 - best));
        apiA.score(Math.max(10, 1500 - best), HS.reaction || 0);
        state = round >= 5 ? "done" : "result";
        render();
        if (state === "done") finishRun();
      }
    }
    function finishRun() {
      var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, times.length));
      recordResult("reaction", "win", "best " + best + "ms avg " + avg + "ms");
      apiA.status("Best " + best + "ms · avg " + avg + "ms");
    }
    reset();
    return domGame("reaction", {
      html: render,
      onDomClick: function (e) { if (e.target.closest("[data-rxn]")) tap(); },
      key: function (k) { if (k === " ") tap(); },
      action: function (a) { if (a === "restart") reset(); else if (a === "menu") showMenu(); else if (a === "rules") openRules("reaction"); },
      stop: function () { if (toId) clearTimeout(toId); }
    });
  }

  /* ============================================================
     SIMON SAYS
     ============================================================ */
  function Simon() {
    var apiA = api("simon");
    var seq, idx, phase, level, toIds;
    var PADS = [
      { f: 329.6, cls: "g" }, { f: 415.3, cls: "r" }, { f: 261.6, cls: "y" }, { f: 493.9, cls: "b" }
    ];
    function reset() {
      seq = []; idx = 0; phase = "idle"; level = 0; toIds = [];
      apiA.clearOver();
      apiA.score(0, HS.simon || 0);
      apiA.status("Tap start — watch the pattern");
      render();
    }
    function render(activePad, inputPad) {
      var pads = PADS.map(function (p, i) {
        return '<button type="button" class="nvb-simon c-' + p.cls + (activePad === i ? " lit" : "") + (inputPad === i ? " err" : "") + '" data-simon="' + i + '"></button>';
      }).join("");
      apiA.setHTML('<div class="nvb-simonwrap">' + pads + "</div>" +
        '<div class="nvb-status">' + (phase === "idle" ? "Tap START to begin" : phase === "show" ? "Watch…" : phase === "input" ? "Round " + level + " — repeat it (" + idx + "/" + seq.length + ")" : phase === "over" ? "Game over — level " + level : "") + "</div>" +
        (phase === "idle" || phase === "over" ? '<div class="nvb-status"><button type="button" class="nva3-ghost-btn" data-simon-start="1">▶ Start</button></div>' : ""));
    }
    function flash(i, dur) {
      SFX.play("tick");
      render(i);
      toIds.push(setTimeout(function () { render(); }, dur || 320));
    }
    function playback() {
      phase = "show";
      render();
      seq.forEach(function (s, i) {
        toIds.push(setTimeout(function () { flash(s, Math.max(200, 420 - level * 14)); }, 600 + i * Math.max(320, 560 - level * 16)));
      });
      toIds.push(setTimeout(function () {
        phase = "input"; idx = 0;
        render();
      }, 700 + seq.length * Math.max(320, 560 - level * 16)));
    }
    function nextRound() {
      level++;
      seq.push(Math.floor(Math.random() * 4));
      apiA.score(level, HS.simon || 0);
      playback();
    }
    function press(i) {
      if (phase !== "input") return;
      flash(i, 200);
      if (seq[idx] === i) {
        idx++;
        if (idx >= seq.length) {
          phase = "show";
          apiA.score(level + 1, HS.simon || 0);
          setTimeout(nextRound, 700);
        }
      } else {
        phase = "over";
        SFX.play("bad");
        apiA.record(level);
        apiA.over("Sequence broken!", "You reached level " + level, "loss");
        recordResult("simon", "loss", "level " + level);
        render();
      }
    }
    reset();
    return domGame("simon", {
      html: render,
      onDomClick: function (e) {
        if (e.target.closest("[data-simon-start]")) { phase = "show"; nextRound(); return; }
        var p = e.target.closest("[data-simon]");
        if (p) press(parseInt(p.getAttribute("data-simon"), 10));
      },
      action: function (a) {
        if (a === "restart") reset();
        else if (a === "menu") showMenu();
        else if (a === "rules") openRules("simon");
      },
      stop: function () { toIds.forEach(clearTimeout); }
    });
  }

  /* ============================================================
     Controls bar (per-game modes + settings)
     ============================================================ */
  function controlsFor(id) {
    if (id === "doodle") {
      return '<div class="nva3-dpad"><button type="button" data-arc-key="ArrowLeft" aria-label="Left">' + svg("arrow-left") + '</button><button type="button" data-arc-key="ArrowRight" aria-label="Right">' + svg("arrow-right") + "</button></div>" +
        '<div class="nva3-hint">Arrows / A-D · hold to steer · wrap around edges</div>';
    }
    if (id === "snake") {
      var sp = CFG.snake || "normal";
      return '<div class="nva3-dpad four">' +
        '<button type="button" data-arc-key="ArrowUp" aria-label="Up">' + svg("arr-up") + "</button>" +
        '<button type="button" data-arc-key="ArrowLeft" aria-label="Left">' + svg("arrow-left") + "</button>" +
        '<button type="button" data-arc-key="ArrowDown" aria-label="Down">' + svg("arr-down") + "</button>" +
        '<button type="button" data-arc-key="ArrowRight" aria-label="Right">' + svg("arrow-right") + "</button></div>" +
        '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="snake-slow" class="' + (sp === "slow" ? "on" : "") + '">Slow</button>' +
        '<button type="button" data-arc-act="snake-normal" class="' + (sp === "normal" ? "on" : "") + '">Normal</button>' +
        '<button type="button" data-arc-act="snake-fast" class="' + (sp === "fast" ? "on" : "") + '">Fast</button></div>' +
        '<div class="nva3-hint">Arrows / WASD or swipe to turn · eat the red core</div>';
    }
    if (id === "pong" || id === "breakout" || id === "racer") {
      var pad = id === "racer"
        ? '<div class="nva3-dpad"><button type="button" data-arc-key="ArrowLeft" aria-label="Lane left">' + svg("arrow-left") + '</button><button type="button" data-arc-key="ArrowRight" aria-label="Lane right">' + svg("arrow-right") + "</button></div>"
        : '<div class="nva3-dpad four"><button type="button" data-arc-key="ArrowUp" aria-label="Up">' + svg("arr-up") + '</button><button type="button" data-arc-key="ArrowLeft" aria-label="Left">' + svg("arrow-left") + '</button><button type="button" data-arc-key="ArrowDown" aria-label="Down">' + svg("arr-down") + '</button><button type="button" data-arc-key="ArrowRight" aria-label="Right">' + svg("arrow-right") + "</button></div>";
      return pad + '<div class="nva3-hint">' + esc((gameById(id) || {}).keys || "") + "</div>";
    }
    if (id === "ludo") {
      var lm = curOpt === "4p" ? "4p" : curOpt === "online" ? "online" : curOpt === "duo" ? "duo" : curOpt === "custom" ? "custom" : "bot";
      return '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="ludo-setup" class="' + (lm === "custom" ? "on" : "") + '">' + svg("settings") + "Yalla Setup</button>" +
        '<button type="button" data-arc-act="ludo-bot" class="' + (lm === "bot" ? "on" : "") + '">' + svg("bot") + "Vs Bots</button>" +
        '<button type="button" data-arc-act="ludo-duo" class="' + (lm === "duo" ? "on" : "") + '">' + svg("users") + "2 Player</button>" +
        '<button type="button" data-arc-act="ludo-4p" class="' + (lm === "4p" ? "on" : "") + '">' + svg("grid") + "4 Player</button>" +
        (lm === "online" ? '<button type="button" class="on" disabled>' + svg("globe") + "Online</button>" : "") +
        "</div>" +
        '<div class="nva3-seg"><button type="button" class="nva3-rollbtn" data-arc-act="roll">' + svg("dice") + "Roll dice</button></div>" +
        ghostBtn("ludo-chat", "message-circle", "Quick Chat") +
        ghostBtn("rules", "book-open", "Rules") +
        '<div class="nva3-hint">30s turn timer · 3 misses = forfeit · 6 / capture / home = bonus turn · quick chat 💬 · themes &amp; color picker in Yalla Setup</div>';
    }
    if (id === "chess") return chessControls();
    if (id === "ttt") {
      var th = CFG.ttt !== "easy";
      return '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="ttt-hard" class="' + (th ? "on" : "") + '">Hard AI</button>' +
        '<button type="button" data-arc-act="ttt-easy" class="' + (!th ? "on" : "") + '">Easy AI</button>' +
        '<button type="button" data-arc-act="ttt-2p" class="">2 Player</button></div>' +
        ghostBtn("rules", "book-open", "Rules");
    }
    if (id === "minesweeper") {
      var ml = CFG.minesweeper || "easy";
      return '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="ms-easy" class="' + (ml === "easy" ? "on" : "") + '">9×9</button>' +
        '<button type="button" data-arc-act="ms-med" class="' + (ml === "med" ? "on" : "") + '">12×12</button>' +
        '<button type="button" data-arc-act="ms-hard" class="' + (ml === "hard" ? "on" : "") + '">16×14</button></div>' +
        '<div class="nva3-hint">Long-press or right-click also flags · F toggles flag mode</div>';
    }
    if (id === "sudoku") {
      var sl = CFG.sudoku || "easy";
      return '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="sd-easy" class="' + (sl === "easy" ? "on" : "") + '">Easy</button>' +
        '<button type="button" data-arc-act="sd-med" class="' + (sl === "med" ? "on" : "") + '">Medium</button>' +
        '<button type="button" data-arc-act="sd-hard" class="' + (sl === "hard" ? "on" : "") + '">Hard</button></div>' +
        '<div class="nva3-hint">Tap a cell, type 1-9 or use the keypad</div>';
    }
    if (id === "memory") {
      var msz = CFG.memory || "4";
      return '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="memory-4" class="' + (msz === "4" ? "on" : "") + '">4×4</button>' +
        '<button type="button" data-arc-act="memory-6" class="' + (msz === "6" ? "on" : "") + '">6×6</button></div>' +
        '<div class="nva3-hint">Fewer moves and faster clears score higher</div>';
    }
    if (id === "n2048" || id === "checkers" || id === "reversi" || id === "connect4") {
      var extra = "";
      if (id === "checkers") extra = ghostBtn("rules", "book-open", "Rules");
      if (id === "reversi") extra = ghostBtn("rules", "book-open", "Rules");
      if (id === "connect4") extra = ghostBtn("rules", "book-open", "Rules");
      return '<div class="nva3-hint">' + esc((gameById(id) || {}).keys || "") + "</div>" + extra;
    }
    return "";
  }

  /* ============================================================
     CHESS — full rules, 3 AI levels (fixed), clock, undo, history
     ============================================================ */
  function chessControls() {
    var cm = curOpt === "duo" ? "duo" : curOpt === "online" ? "online" : "bot";
    var lvl = curOpt === "lvl1" ? 1 : curOpt === "lvl3" ? 3 : 2;
    var clk = CFG.chessClock || "off";
    var out = '<div class="nva3-seg">' +
      '<button type="button" data-arc-act="chess-bot" class="' + (cm === "bot" ? "on" : "") + '">' + svg("bot") + "Vs AI</button>" +
      '<button type="button" data-arc-act="chess-duo" class="' + (cm === "duo" ? "on" : "") + '">' + svg("users") + "2 Player</button>" +
      (cm === "online" ? '<button type="button" class="on" disabled>' + svg("globe") + "Online</button>" : "") +
      "</div>";
    if (cm === "bot") {
      out += '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="chess-lvl1" class="' + (lvl === 1 ? "on" : "") + '">Easy</button>' +
        '<button type="button" data-arc-act="chess-lvl2" class="' + (lvl === 2 ? "on" : "") + '">Normal</button>' +
        '<button type="button" data-arc-act="chess-lvl3" class="' + (lvl === 3 ? "on" : "") + '">Hard</button></div>';
    }
    if (cm !== "online") {
      out += '<div class="nva3-seg">' +
        '<button type="button" data-arc-act="chess-clk0" class="' + (clk === "off" ? "on" : "") + '">No clock</button>' +
        '<button type="button" data-arc-act="chess-clk5" class="' + (clk === "5" ? "on" : "") + '">5 min</button>' +
        '<button type="button" data-arc-act="chess-clk10" class="' + (clk === "10" ? "on" : "") + '">10 min</button></div>';
    }
    out += '<div class="nva3-clockrow" id="nva3-chclock"></div>' +
      ghostBtn("rules", "book-open", "Rules") +
      ghostBtn("hint", "sparkles", "Hint") +
      ghostBtn("undo", "rotate", "Undo") +
      ghostBtn("draw", "users", "Offer draw") +
      ghostBtn("resign", "log-out", "Resign", true) +
      '<div class="nva3-hint">Tap a piece, then a highlighted square · castling, en passant &amp; promotion included</div>';
    return out;
  }

  function Chess(mode) {
    var SZ = 600, apiA = api("chess");
    var online = mode === "online";
    var solo = !online && mode !== "duo";
    var level = mode === "lvl1" ? 1 : mode === "lvl3" ? 3 : 2;
    var myColor = online ? (M && M.room().role === "host" ? "w" : "b") : null;
    var board, side, selected, legal, lastMove, castling, ep, state, thinking, checkSquare;
    var halfmove = 0, reps = {}, ply = 0, pendingPromo = null, hintMove = null, hintT = 0;
    var hist = [], snapshots = [];
    var clockMode = CFG.chessClock === "5" || CFG.chessClock === "10" ? parseInt(CFG.chessClock, 10) : 0;
    var clocks = { w: 0, b: 0 }, clockRunning = false;
    var GLYPH = {
      wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
      bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟"
    };
    var VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
    function idx(f, r) { return r * 8 + f; }
    function inside(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
    function pieceAt(f, r) { return inside(f, r) ? board[idx(f, r)] : null; }
    function colorOf(p) { return p ? p[0] : null; }
    function typeOf(p) { return p ? p[1] : null; }
    function sideName(c) { return c === "w" ? "White" : "Black"; }
    function fmtClock(ms) {
      var s = Math.max(0, Math.ceil(ms / 1000));
      return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
    }
    function mineTurn() {
      if (state !== "playing" || thinking || pendingPromo) return false;
      if (solo) return side === "w";
      if (online) return side === myColor;
      return true;
    }
    function logLine(col, text) {
      if (!logEl) return;
      var chip = col === "w" ? "W" : col === "b" ? "B" : "·";
      var cls = col === "w" ? "wt" : col === "b" ? "bk" : "nt";
      var row = '<div class="nva3-logrow"><i class="' + cls + '">' + chip + "</i><span>" + esc(text) + "</span></div>";
      logEl.insertAdjacentHTML("afterbegin", row);
      while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
    }
    function snap() {
      return {
        board: board.slice(), side: side, castling: Object.assign({}, castling), ep: ep ? Object.assign({}, ep) : null,
        halfmove: halfmove, reps: Object.assign({}, reps), ply: ply, lastMove: lastMove, histLen: hist.length,
        clocks: { w: clocks.w, b: clocks.b }
      };
    }
    function restore(s) {
      board = s.board.slice(); side = s.side; castling = Object.assign({}, s.castling);
      ep = s.ep ? Object.assign({}, s.ep) : null;
      halfmove = s.halfmove; reps = Object.assign({}, s.reps); ply = s.ply;
      lastMove = s.lastMove; hist.length = s.histLen;
      clocks = { w: s.clocks.w, b: s.clocks.b };
      selected = null; legal = []; hintMove = null; hintT = 0; pendingPromo = null;
      state = "playing"; checkSquare = null;
      if (inCheck(side)) { for (var i = 0; i < 64; i++) if (board[i] === side + "K") checkSquare = i; }
    }
    function repKey() {
      var s = board.join(",") + "|" + side + "|" + (castling.wK ? "K" : "") + (castling.wQ ? "Q" : "") + (castling.bK ? "k" : "") + (castling.bQ ? "q" : "") + "|";
      return s + (ep ? ep.f + "," + ep.r : "-");
    }
    function noteRep() {
      var k = repKey();
      reps[k] = (reps[k] || 0) + 1;
      return reps[k];
    }
    function endGame(kind, title, sub, who) {
      if (state === "over") return;
      state = "over";
      thinking = false;
      pendingPromo = null;
      clockRunning = false;
      apiA.status(title);
      apiA.over(title, sub, kind === "win" && who && (solo ? who === "w" : (online ? who === myColor : true)) ? "win" : (kind === "draw" ? "draw" : "loss"));
      if (kind === "win") {
        SFX.play("win");
        if (solo && who === "w") apiA.record(1);
        recordResult("chess", online ? (who === myColor ? "win" : "loss") : (solo ? (who === "w" ? "win" : "loss") : "win"), sub);
      } else if (kind === "draw") {
        recordResult("chess", "draw", sub);
      } else {
        SFX.play("lose");
        recordResult("chess", online ? (myColor === "w" ? "loss" : "win") : (solo ? "loss" : "win"), sub);
      }
      logLine(who || null, "Result: " + sub);
      paintClock();
    }
    function reset() {
      board = [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        "wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ];
      side = "w"; selected = null; legal = []; lastMove = null;
      castling = { wK: true, wQ: true, bK: true, bQ: true };
      ep = null; state = "playing"; thinking = false; checkSquare = null;
      halfmove = 0; reps = {}; ply = 0; pendingPromo = null; hintMove = null; hintT = 0;
      hist = []; snapshots = [];
      if (clockMode) { clocks = { w: clockMode * 60000, b: clockMode * 60000 }; clockRunning = true; }
      apiA.clearOver();
      if (logEl) logEl.innerHTML = "";
      reps[repKey()] = 1;
      apiA.status(online ? ("You are " + sideName(myColor) + " — " + sideName(side) + " to move") : "White to move");
      logLine(null, online ? "Online match started — you play " + sideName(myColor) + "." : solo ? "New game vs AI (" + (level === 1 ? "Easy" : level === 3 ? "Hard" : "Normal") + (clockMode ? ", " + clockMode + " min clock" : "") + ")." : "New 2-player game" + (clockMode ? " (" + clockMode + " min clock)" : "") + ".");
      apiA.score(0, HS.chess || 0);
      paintClock();
    }
    function paintClock() {
      var el = document.getElementById("nva3-chclock");
      if (!el) return;
      if (!clockMode) { el.innerHTML = '<span class="nva3-ckchip off">no clock</span>'; return; }
      var low = clockMode * 60000 / 4;
      el.innerHTML =
        '<span class="nva3-ckchip' + (side === "w" && state === "playing" ? " on" : "") + (clocks.w < low ? " low" : "") + '">♔ ' + fmtClock(clocks.w) + "</span>" +
        '<span class="nva3-ckchip' + (side === "b" && state === "playing" ? " on" : "") + (clocks.b < low ? " low" : "") + '">♚ ' + fmtClock(clocks.b) + "</span>";
    }
    function inCheck(col) {
      var kf = -1, kr = -1;
      for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) if (board[idx(f, r)] === col + "K") { kf = f; kr = r; }
      if (kf < 0) return false;
      return attacked(kf, kr, col === "w" ? "b" : "w");
    }
    function attacked(f, r, by) {
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var d = 0; d < 4; d++) {
        var ff = f + dirs[d][0], rr = r + dirs[d][1], step = 0;
        while (inside(ff, rr)) {
          var p = pieceAt(ff, rr); step++;
          if (p) {
            if (colorOf(p) === by && (typeOf(p) === "R" || typeOf(p) === "Q" || (typeOf(p) === "K" && step === 1))) return true;
            break;
          }
          ff += dirs[d][0]; rr += dirs[d][1];
        }
      }
      var diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var e = 0; e < 4; e++) {
        var g = f + diag[e][0], h = r + diag[e][1], st = 0;
        while (inside(g, h)) {
          var q = pieceAt(g, h); st++;
          if (q) {
            if (colorOf(q) === by && (typeOf(q) === "B" || typeOf(q) === "Q" || (typeOf(q) === "K" && st === 1))) return true;
            break;
          }
          g += diag[e][0]; h += diag[e][1];
        }
      }
      var kn = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (var k = 0; k < 8; k++) {
        var p2 = pieceAt(f + kn[k][0], r + kn[k][1]);
        if (p2 && colorOf(p2) === by && typeOf(p2) === "N") return true;
      }
      var pawnDir = by === "w" ? 1 : -1;
      var pp1 = pieceAt(f - 1, r + pawnDir), pp2 = pieceAt(f + 1, r + pawnDir);
      if (pp1 && colorOf(pp1) === by && typeOf(pp1) === "P") return true;
      if (pp2 && colorOf(pp2) === by && typeOf(pp2) === "P") return true;
      return false;
    }
    function pseudoMoves(f, r, capOnly, noCastle) {
      var p = board[idx(f, r)], col = colorOf(p), t = typeOf(p), out = [];
      function add(nf, nr, extra) {
        if (!inside(nf, nr)) return false;
        var q = board[idx(nf, nr)];
        if (q && colorOf(q) === col) return false;
        if (!capOnly || q || (extra && extra.ep)) out.push(Object.assign({ from: idx(f, r), to: idx(nf, nr), piece: p }, extra || {}));
        return !q;
      }
      if (t === "P") {
        var dir = col === "w" ? -1 : 1, startRow = col === "w" ? 6 : 1, promoRow = col === "w" ? 0 : 7;
        var one = r + dir;
        if (!capOnly && inside(f, one) && !board[idx(f, one)]) {
          out.push({ from: idx(f, r), to: idx(f, one), piece: p, promo: one === promoRow });
          if (r === startRow && !board[idx(f, r + dir * 2)]) out.push({ from: idx(f, r), to: idx(f, r + dir * 2), piece: p });
        }
        [[f - 1, one], [f + 1, one]].forEach(function (q) {
          var target = pieceAt(q[0], q[1]);
          if (target && colorOf(target) !== col) out.push({ from: idx(f, r), to: idx(q[0], q[1]), piece: p, promo: q[1] === promoRow });
          else if (ep && q[0] === ep.f && q[1] === ep.r) out.push({ from: idx(f, r), to: idx(q[0], q[1]), piece: p, ep: true });
        });
      } else if (t === "N") {
        [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(function (d) { add(f + d[0], r + d[1]); });
      } else if (t === "K") {
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { add(f + d[0], r + d[1]); });
        if (!noCastle && !capOnly) {
          var row = col === "w" ? 7 : 0;
          if (r === row && f === 4 && !inCheck(col)) {
            var rookK = board[idx(7, row)] === col + "R";
            var rookQ = board[idx(0, row)] === col + "R";
            var enemy = col === "w" ? "b" : "w";
            if (rookK && castling[col + "K"] && !board[idx(5, row)] && !board[idx(6, row)] && !attacked(5, row, enemy)) {
              out.push({ from: idx(f, r), to: idx(6, row), piece: p, castle: "K" });
            }
            if (rookQ && castling[col + "Q"] && !board[idx(3, row)] && !board[idx(2, row)] && !board[idx(1, row)] && !attacked(3, row, enemy)) {
              out.push({ from: idx(f, r), to: idx(2, row), piece: p, castle: "Q" });
            }
          }
        }
      } else {
        var rays = [];
        if (t === "R" || t === "Q") rays = rays.concat([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        if (t === "B" || t === "Q") rays = rays.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
        rays.forEach(function (d) {
          var nf = f + d[0], nr = r + d[1];
          while (inside(nf, nr)) {
            var q = board[idx(nf, nr)];
            if (!q) { if (!capOnly) out.push({ from: idx(f, r), to: idx(nf, nr), piece: p }); }
            else {
              if (colorOf(q) !== col) out.push({ from: idx(f, r), to: idx(nf, nr), piece: p });
              break;
            }
            nf += d[0]; nr += d[1];
          }
        });
      }
      return out;
    }
    function legalFor(f, r) {
      var p = board[idx(f, r)];
      if (!p || colorOf(p) !== side) return [];
      return pseudoMoves(f, r).filter(function (m) { return !leavesKing(m); });
    }
    function makeTmp(m) {
      var fromP = board[m.from], cap = board[m.to], capEp = null;
      board[m.to] = m.promo ? colorOf(fromP) + (m.promoType || "Q") : fromP;
      board[m.from] = null;
      if (m.ep) {
        var dir = colorOf(fromP) === "w" ? 1 : -1;
        var ef = (m.to % 8), er = Math.floor(m.to / 8) + dir;
        capEp = board[idx(ef, er)];
        board[idx(ef, er)] = null;
      }
      if (m.castle) {
        var row = colorOf(fromP) === "w" ? 7 : 0;
        if (m.castle === "K") { board[idx(5, row)] = board[idx(7, row)]; board[idx(7, row)] = null; }
        else { board[idx(3, row)] = board[idx(0, row)]; board[idx(0, row)] = null; }
      }
      return { cap: cap, capEp: capEp, capEpSq: m.ep ? (m.to % 8) + (Math.floor(m.to / 8) + (colorOf(fromP) === "w" ? 1 : -1)) * 8 : -1, fromP: fromP, m: m };
    }
    function unmakeTmp(s) {
      var m = s.m;
      board[m.from] = s.fromP; board[m.to] = s.cap;
      if (s.capEpSq >= 0) board[s.capEpSq] = s.capEp;
      if (m.castle) {
        var row = colorOf(s.fromP) === "w" ? 7 : 0;
        if (m.castle === "K") { board[idx(7, row)] = board[idx(5, row)]; board[idx(5, row)] = null; }
        else { board[idx(0, row)] = board[idx(3, row)]; board[idx(3, row)] = null; }
      }
    }
    function leavesKing(m) {
      var s = makeTmp(m);
      var bad = inCheck(colorOf(s.fromP));
      unmakeTmp(s);
      return bad;
    }
    function allLegal(col) {
      var out = [];
      for (var i = 0; i < 64; i++) {
        if (board[i] && colorOf(board[i]) === col) {
          var ms = pseudoMoves(i % 8, Math.floor(i / 8));
          for (var j = 0; j < ms.length; j++) {
            var s = makeTmp(ms[j]); var bad = inCheck(col); unmakeTmp(s);
            if (!bad) out.push(ms[j]);
          }
        }
      }
      return out;
    }
    function sqName(i) { return "abcdefgh".charAt(i % 8) + (8 - Math.floor(i / 8)); }
    function moveText(p, m, isCap) {
      if (m.castle) return m.castle === "K" ? "O-O" : "O-O-O";
      var t = typeOf(p), s = t === "P" ? "" : t;
      if (t === "P" && isCap) s += "abcdefgh".charAt(m.from % 8);
      if (isCap) s += "x";
      s += sqName(m.to);
      if (m.promo) s += "=" + (m.promoType || "Q");
      return s;
    }
    function insufficient() {
      var wm = [], bm = [];
      for (var i = 0; i < 64; i++) {
        var p = board[i]; if (!p) continue;
        var t = typeOf(p);
        if (t === "P" || t === "R" || t === "Q") return false;
        if (t === "N" || t === "B") (colorOf(p) === "w" ? wm : bm).push({ t: t, sq: i });
      }
      if (wm.length > 1 || bm.length > 1) return false;
      if (wm.length === 0 || bm.length === 0) return true;
      var a = wm[0], b = bm[0];
      return a.t === "B" && b.t === "B" && (a.sq + b.sq) % 2 === 0;
    }
    function applyMove(m, remote) {
      if (state !== "playing") return;
      var p = board[m.from];
      if (!p) return;
      var col = colorOf(p), cap = board[m.to] || m.ep;
      var wasPawn = typeOf(p) === "P";
      var pt = m.promoType || "Q";
      var txt = moveText(p, m, !!cap);
      snapshots.push(snap());
      if (snapshots.length > 64) snapshots.shift();
      hist.push({ ply: ply + 1, txt: txt, col: col });
      if (m.ep) {
        var er = Math.floor(m.to / 8) + (col === "w" ? 1 : -1);
        board[idx(m.to % 8, er)] = null;
      }
      board[m.to] = m.promo ? col + pt : p;
      board[m.from] = null;
      if (m.castle) {
        var r0 = col === "w" ? 7 : 0;
        if (m.castle === "K") { board[idx(5, r0)] = board[idx(7, r0)]; board[idx(7, r0)] = null; }
        else { board[idx(3, r0)] = board[idx(0, r0)]; board[idx(0, r0)] = null; }
      }
      if (wasPawn && Math.abs(m.to - m.from) === 16) {
        ep = { f: m.to % 8, r: Math.floor(((m.from + m.to) / 2) / 8) };
      } else ep = null;
      if (p === "wK") { castling.wK = false; castling.wQ = false; }
      if (p === "bK") { castling.bK = false; castling.bQ = false; }
      if (p === "wR" && m.from === 56) castling.wQ = false;
      if (p === "wR" && m.from === 63) castling.wK = false;
      if (p === "bR" && m.from === 0) castling.bQ = false;
      if (p === "bR" && m.from === 7) castling.bK = false;
      if (m.to === 56) castling.wQ = false;
      if (m.to === 63) castling.wK = false;
      if (m.to === 0) castling.bQ = false;
      if (m.to === 7) castling.bK = false;
      halfmove = (wasPawn || cap || m.ep) ? 0 : halfmove + 1;
      ply++;
      lastMove = m; selected = null; legal = []; hintMove = null; hintT = 0;
      side = side === "w" ? "b" : "w";
      SFX.play(cap ? "capture" : "move");
      var chk = inCheck(side);
      checkSquare = null;
      if (chk) {
        for (var i = 0; i < 64; i++) if (board[i] === side + "K") checkSquare = i;
        SFX.play("check");
      }
      var ms = allLegal(side);
      var suffix = !ms.length ? (chk ? "#" : "") : (chk ? "+" : "");
      logLine(col, txt + suffix);
      if (!remote && online) {
        netSend({ t: "chess-move", from: m.from, to: m.to, promo: !!m.promo, promoType: m.promo ? pt : "", ep: !!m.ep, castle: m.castle || "" });
      }
      if (!ms.length) {
        if (chk) endGame("win", "Checkmate!", sideName(col) + " wins the game.", col);
        else endGame("draw", "Stalemate", "No legal moves — it's a draw.");
        return;
      }
      var rc = noteRep();
      if (halfmove >= 100) { endGame("draw", "Draw", "50-move rule — no pawn move or capture."); return; }
      if (rc >= 3) { endGame("draw", "Draw", "Threefold repetition — the same position appeared three times."); return; }
      if (insufficient()) { endGame("draw", "Draw", "Insufficient material to checkmate."); return; }
      apiA.status(sideName(side) + " to move" + (chk ? " — CHECK!" : "") + (online ? " · " + (side === myColor ? "your turn" : "waiting") : ""));
      paintClock();
      if (solo && side === "b") scheduleAI();
    }
    function undo() {
      if (online || thinking || !snapshots.length) return;
      SFX.play("click");
      restore(snapshots.pop());
      if (solo && side === "b" && snapshots.length) restore(snapshots.pop()); /* revert the AI reply too */
      apiA.status(sideName(side) + " to move — position restored");
      paintClock();
    }
    function scheduleAI() {
      if (thinking) return;
      thinking = true;
      apiA.status("AI is thinking…");
      setTimeout(function () {
        if (state !== "playing" || side !== "b") { thinking = false; return; }
        var m = aiMove();
        thinking = false;
        if (m) applyMove(m);
      }, 320 + level * 140);
    }
    function evaluate() {
      var s = 0;
      for (var i = 0; i < 64; i++) {
        var p = board[i]; if (!p) continue;
        var v = VAL[typeOf(p)] || 0;
        var f = i % 8, r = Math.floor(i / 8);
        var centerBonus = Math.round((3.5 - Math.abs(3.5 - f)) * 6 + (3.5 - Math.abs(3.5 - r)) * 4);
        v += centerBonus;
        s += colorOf(p) === "b" ? v : -v;
      }
      return s;
    }
    function aiMove() {
      var ms = allLegal("b");
      if (!ms.length) return null;
      var best = null, bestScore = -1e9;
      ms.sort(function (a, b) { return (board[b.to] ? 1 : 0) - (board[a.to] ? 1 : 0); });
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        var s = makeTmp(m);
        /* evaluate() is black-positive, so no negation here (BUG fixed) */
        var sc = minimax(level - 1, "w", -1e9, 1e9);
        unmakeTmp(s);
        sc += Math.random() * (level === 1 ? 90 : level === 2 ? 18 : 4);
        if (sc > bestScore) { bestScore = sc; best = m; }
      }
      return best;
    }
    function minimax(depth, col, alpha, beta) {
      if (depth === 0) return evaluate();
      var ms = allLegal(col);
      if (!ms.length) return inCheck(col) ? (col === "b" ? -99999 : 99999) : 0;
      if (col === "b") {
        var best = -1e9;
        for (var i = 0; i < ms.length; i++) {
          var s = makeTmp(ms[i]);
          best = Math.max(best, minimax(depth - 1, "w", alpha, beta));
          unmakeTmp(s);
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
        return best;
      }
      var low = 1e9;
      for (var j = 0; j < ms.length; j++) {
        var t = makeTmp(ms[j]);
        low = Math.min(low, minimax(depth - 1, "b", alpha, beta));
        unmakeTmp(t);
        beta = Math.min(beta, low);
        if (beta <= alpha) break;
      }
      return low;
    }
    function sqFromClick(x, y) {
      var f = Math.floor(x / (SZ / 8)), r = Math.floor(y / (SZ / 8));
      if (f < 0 || f > 7 || r < 0 || r > 7) return -1;
      return idx(f, r);
    }
    function click(x, y) {
      if (!mineTurn()) return;
      var sq = sqFromClick(x, y);
      if (sq < 0) return;
      var p = board[sq];
      if (selected != null) {
        var mv = null;
        for (var i = 0; i < legal.length; i++) if (legal[i].to === sq) mv = legal[i];
        if (mv) {
          if (mv.promo) { pendingPromo = mv; showPromo(); }
          else applyMove(mv);
          return;
        }
      }
      if (p && colorOf(p) === side) {
        selected = sq;
        legal = legalFor(sq % 8, Math.floor(sq / 8));
        SFX.play("click");
      } else { selected = null; legal = []; }
    }
    function showPromo() {
      if (!overlayEl) return;
      var opts = ["Q", "R", "B", "N"].map(function (t) {
        return '<button type="button" data-arc-act="promo-' + t + '">' + GLYPH[side + t] + "</button>";
      }).join("");
      overlayEl.innerHTML = '<div><span class="nva3-over-k">PAWN PROMOTION</span><b>Choose a piece</b><span>Your pawn reached the last rank.</span><div class="nva3-promo">' + opts + "</div></div>";
      overlayEl.classList.add("on");
    }
    function closeOverlay() {
      if (overlayEl) { overlayEl.classList.remove("on"); overlayEl.innerHTML = ""; }
    }
    function resign() {
      if (state !== "playing") return;
      var loser = online ? myColor : solo ? "w" : side;
      var winner = loser === "w" ? "b" : "w";
      if (online) netSend({ t: "chess-resign", by: loser });
      logLine(loser, sideName(loser) + " resigned.");
      endGame("win", sideName(winner) + " wins", sideName(loser) + (online && loser === myColor ? " (you)" : "") + " resigned the game.", winner);
    }
    function offerDraw() {
      if (state !== "playing") return;
      if (online) {
        netSend({ t: "chess-draw", by: myColor });
        logLine(myColor, "Draw offered.");
        apiA.status("Draw offered — waiting for reply…");
        return;
      }
      if (solo) {
        if (Math.abs(evaluate()) < 150) endGame("draw", "Draw", "The AI accepts your draw offer.");
        else { try { window.toast && window.toast("AI declined the draw offer", "error"); } catch (e) {} apiA.status("Draw declined by AI"); }
        return;
      }
      endGame("draw", "Draw", "Both players agreed to a draw.");
    }
    function hint() {
      if (!mineTurn()) { try { window.toast && window.toast("Wait for your turn", "error"); } catch (e) {} return; }
      var ms = allLegal(side), best = null, bestSc = side === "w" ? 1e9 : -1e9;
      for (var i = 0; i < ms.length; i++) {
        var s = makeTmp(ms[i]);
        var ev = evaluate();
        unmakeTmp(s);
        if (side === "w" ? ev < bestSc : ev > bestSc) { bestSc = ev; best = ms[i]; }
      }
      if (!best) return;
      hintMove = { from: best.from, to: best.to };
      hintT = 2800;
      apiA.status("Hint: " + moveText(board[best.from], best, !!board[best.to]));
    }
    function incomingDraw() {
      if (state !== "playing" || !overlayEl) return;
      overlayEl.innerHTML = '<div><span class="nva3-over-k">DRAW OFFER</span><b>Your friend offers a draw</b><span>Accepting ends the game immediately.</span><div class="nva3-over-btns"><button type="button" data-arc-act="draw-accept">' + svg("check") + 'Accept</button><button type="button" data-arc-act="draw-decline">' + svg("x") + "Decline</button></div></div>";
      overlayEl.classList.add("on");
      apiA.status("Draw offered — accept or decline");
    }
    if (online) {
      NET2.recv = function (m) {
        if (!m) return;
        if (m.t === "end") {
          if (state === "playing") endGame("draw", "Match ended", "Your friend closed the game.");
          return;
        }
        if (m.t === "restart") { reset(); return; }
        if (m.t === "chess-move") {
          if (state !== "playing") return;
          applyMove({ from: m.from, to: m.to, piece: board[m.from], promo: !!m.promo, promoType: m.promoType || "Q", ep: !!m.ep, castle: m.castle || null }, true);
          return;
        }
        if (m.t === "chess-resign") {
          var loser = m.by === "w" ? "w" : "b", win = loser === "w" ? "b" : "w";
          logLine(loser, sideName(loser) + " resigned.");
          endGame("win", sideName(win) + " wins", sideName(loser) + " resigned the game.", win);
          return;
        }
        if (m.t === "chess-draw") { incomingDraw(); return; }
        if (m.t === "chess-draw-yes") {
          closeOverlay();
          logLine(null, "Draw accepted.");
          endGame("draw", "Draw", "The draw offer was accepted.");
          return;
        }
        if (m.t === "chess-draw-no") {
          closeOverlay();
          try { window.toast && window.toast("Draw declined", "error"); } catch (e) {}
          apiA.status(sideName(side) + " to move");
          return;
        }
      };
    }
    reset();
    return {
      start: function () {},
      update: function (dt) {
        if (hintT > 0) {
          hintT -= dt;
          if (hintT <= 0) hintMove = null;
        }
        if (clockMode && clockRunning && state === "playing" && !thinking) {
          clocks[side] -= dt;
          if (clocks[side] <= 0) {
            clocks[side] = 0;
            var winnerSide = side === "w" ? "b" : "w";
            endGame("win", "Time out!", sideName(side) + " ran out of time — " + sideName(winnerSide) + " wins.", winnerSide);
          }
        }
        if (clockMode && Math.floor(Date.now() / 500) % 2 === 0) paintClock();
      },
      draw: function (c) {
        var sz = SZ / 8;
        for (var r = 0; r < 8; r++) {
          for (var f = 0; f < 8; f++) {
            var x = f * sz, y = r * sz;
            c.fillStyle = (f + r) % 2 ? "#B9C6DE" : "#EDF1FA";
            c.fillRect(x, y, sz, sz);
          }
        }
        if (lastMove) {
          [lastMove.from, lastMove.to].forEach(function (sq) {
            var f = sq % 8, r = Math.floor(sq / 8);
            c.fillStyle = "rgba(34,211,238,.25)"; c.fillRect(f * sz, r * sz, sz, sz);
          });
        }
        if (hintMove) {
          [hintMove.from, hintMove.to].forEach(function (sq) {
            var f = sq % 8, r = Math.floor(sq / 8);
            c.strokeStyle = "rgba(251,191,36,.95)"; c.lineWidth = 3;
            c.strokeRect(f * sz + 2.5, r * sz + 2.5, sz - 5, sz - 5);
          });
        }
        if (checkSquare != null) {
          c.fillStyle = "rgba(248,113,113,.38)";
          c.fillRect((checkSquare % 8) * sz, Math.floor(checkSquare / 8) * sz, sz, sz);
        }
        if (selected != null) {
          c.fillStyle = "rgba(167,139,250,.35)";
          c.fillRect((selected % 8) * sz, Math.floor(selected / 8) * sz, sz, sz);
        }
        for (var k = 0; k < legal.length; k++) {
          var tf = legal[k].to % 8, tr = Math.floor(legal[k].to / 8);
          if (legal[k].castle) c.fillStyle = "rgba(52,245,197,.35)";
          else c.fillStyle = board[legal[k].to] ? "rgba(248,113,113,.45)" : "rgba(52,245,197,.4)";
          c.beginPath(); c.arc(tf * sz + sz / 2, tr * sz + sz / 2, board[legal[k].to] ? sz * 0.34 : 7, 0, Math.PI * 2); c.fill();
        }
        for (var i = 0; i < 64; i++) {
          var p = board[i]; if (!p) continue;
          var f2 = i % 8, r2 = Math.floor(i / 8);
          var cx = f2 * sz + sz / 2, cy = r2 * sz + sz / 2;
          var white = colorOf(p) === "w";
          c.font = "bold " + Math.round(sz * 0.72) + "px serif";
          c.textAlign = "center"; c.textBaseline = "middle";
          c.lineWidth = 1.6;
          c.strokeStyle = white ? "rgba(15,23,42,.9)" : "rgba(255,255,255,.9)";
          c.strokeText(GLYPH[p] || "", cx, cy + 2);
          c.fillStyle = white ? "#FFFFFF" : "#101A2E";
          c.fillText(GLYPH[p] || "", cx, cy + 2);
        }
        c.font = "700 10px Sora, system-ui, sans-serif";
        c.textAlign = "left"; c.textBaseline = "middle";
        for (var f3 = 0; f3 < 8; f3++) {
          c.fillStyle = (f3 + 7) % 2 ? "rgba(15,23,42,.5)" : "rgba(15,23,42,.34)";
          c.fillText("abcdefgh".charAt(f3), f3 * sz + 4, 7 * sz + sz - 8);
        }
        for (var r3 = 0; r3 < 8; r3++) {
          c.fillStyle = r3 % 2 ? "rgba(15,23,42,.34)" : "rgba(15,23,42,.5)";
          c.fillText(String(8 - r3), 4, r3 * sz + 10);
        }
        if (online) {
          c.fillStyle = "rgba(4,10,20,.72)"; round(c, SZ - 132, 8, 124, 26, 3); c.fill();
          c.strokeStyle = side === myColor ? "rgba(52,245,197,.55)" : "rgba(148,163,255,.35)"; c.lineWidth = 1; round(c, SZ - 132, 8, 124, 26, 3); c.stroke();
          c.font = "800 9.5px Sora, system-ui, sans-serif"; c.textAlign = "center";
          c.fillStyle = side === myColor ? "#34F5C5" : "rgba(238,243,255,.65)";
          c.fillText(side === myColor ? "YOUR TURN · " + sideName(myColor).toUpperCase() : "WAITING · YOU ARE " + sideName(myColor).toUpperCase(), SZ - 70, 22);
        }
        if (state === "over") {
          c.fillStyle = "rgba(3,5,10,.55)"; c.fillRect(0, 0, SZ, SZ);
        }
      },
      down: function (x, y) { click(x, y); },
      key: function (k) {
        if (k === "r" || k === "R") openRules("chess");
        else if (k === "h" || k === "H") hint();
        else if (k === "u" || k === "U") undo();
      },
      action: function (a) {
        if (a === "chess-bot") play("chess", "lvl2");
        else if (a === "chess-duo") play("chess", "duo");
        else if (a === "chess-lvl1") play("chess", "lvl1");
        else if (a === "chess-lvl2") play("chess", "lvl2");
        else if (a === "chess-lvl3") play("chess", "lvl3");
        else if (a === "chess-clk0") { CFG.chessClock = "off"; saveCFG(); play("chess", mode === "duo" ? "duo" : (mode === "lvl1" || mode === "lvl3" ? mode : "bot")); }
        else if (a === "chess-clk5") { CFG.chessClock = "5"; saveCFG(); play("chess", mode === "duo" ? "duo" : (mode === "lvl1" || mode === "lvl3" ? mode : "bot")); }
        else if (a === "chess-clk10") { CFG.chessClock = "10"; saveCFG(); play("chess", mode === "duo" ? "duo" : (mode === "lvl1" || mode === "lvl3" ? mode : "bot")); }
        else if (a === "rules") openRules("chess");
        else if (a === "hint") hint();
        else if (a === "undo") undo();
        else if (a === "draw") offerDraw();
        else if (a === "resign") resign();
        else if (a === "draw-accept") { if (online) netSend({ t: "chess-draw-yes" }); closeOverlay(); logLine(null, "Draw accepted."); endGame("draw", "Draw", "The draw offer was accepted."); }
        else if (a === "draw-decline") { if (online) netSend({ t: "chess-draw-no" }); closeOverlay(); apiA.status(sideName(side) + " to move"); }
        else if (a.indexOf("promo-") === 0) {
          if (!pendingPromo) return;
          var m = pendingPromo;
          pendingPromo = null;
          m.promoType = a.slice(6).charAt(0) || "Q";
          closeOverlay();
          applyMove(m);
        }
        else if (a === "restart") { if (online) netSend({ t: "restart" }); reset(); }
        else if (a === "menu") showMenu();
      },
      stop: function () { if (online) NET2.recv = null; }
    };
  }

  /* ============================================================
     Lifecycle
     ============================================================ */
  function open() {
    build();
    showMenu();
    root.classList.add("open");
    openNow = true;
    document.documentElement.style.overflow = "hidden";
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("nova") === "arcade" && (q.get("m") || q.get("ch"))) {
        var g = q.get("g") === "chess" ? "chess" : (gameById(q.get("g")) || {}).net ? q.get("g") : "ludo";
        var code = q.get("m") || q.get("ch");
        setTimeout(function () { if (openNow) joinChallenge(code, g); }, 340);
      }
    } catch (e) {}
  }
  function close() {
    if (!root) return;
    if (M && M.room().code) { M.send({ t: "end" }); M.leave(); }
    closeLobby();
    stopGame();
    root.classList.remove("open");
    openNow = false;
    document.documentElement.style.overflow = "";
  }

  window.NovaArcade = { open: open, close: close, play: play, menu: showMenu, challenge: openChallenge, join: joinChallenge, sound: function () { return SFX.enabled(); } };
})();
