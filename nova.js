/* ============================================================
   DOXILO NOVA — appearance engine, custom icons & branding
   ============================================================ */
(function () {
  "use strict";

  var KEY = "nova_ui_v2";
  var DEFAULTS = { theme: "aurora", accent: "auto", radius: "sharp", glow: true, motion: true };

  var THEMES = [
    { id: "aurora",  name: "Aurora",  sw: "#7C5CFF", prev: "linear-gradient(140deg,#0B2230,#071021 55%,#1B1140)", glow: "radial-gradient(circle,#22D3EE,transparent 70%)" },
    { id: "nebula",  name: "Nebula",  sw: "#B16CFF", prev: "linear-gradient(140deg,#22103A,#0B0618 55%,#3A0F2E)", glow: "radial-gradient(circle,#F472B6,transparent 70%)" },
    { id: "ember",   name: "Ember",   sw: "#FF7A45", prev: "linear-gradient(140deg,#2A160C,#140A06 55%,#301018)", glow: "radial-gradient(circle,#FFC24B,transparent 70%)" },
    { id: "glacier", name: "Glacier", sw: "#7DD3FC", prev: "linear-gradient(140deg,#0A2436,#050E18 55%,#12203A)", glow: "radial-gradient(circle,#A5B4FC,transparent 70%)" }
  ];

  var ACCENTS = [
    { id: "auto",  name: "Auto",   sw: "conic-gradient(from 40deg,#22D3EE,#7C5CFF,#F472B6,#22D3EE)" },
    { id: "violet",name: "Violet", sw: "#7C5CFF" },
    { id: "cyan",  name: "Cyan",   sw: "#22D3EE" },
    { id: "mint",  name: "Mint",   sw: "#2BE8A8" },
    { id: "amber", name: "Amber",  sw: "#FFB020" },
    { id: "rose",  name: "Rose",   sw: "#FF5C8A" },
    { id: "blue",  name: "Blue",   sw: "#4C8DFF" }
  ];

  var ICONS = {
    home: '<path d="M4 10.4 12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6h-3.9v-5.8H9.5v5.8H5.6A1.6 1.6 0 0 1 4 19Z"/>',
    compass: '<circle cx="12" cy="12" r="8.6"/><path d="M15.6 8.4l-2.3 5-5 2.3 2.3-5Z"/>',
    "plus-circle": '<path d="M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z"/><path d="M12 8.4v7.2M8.4 12h7.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trophy: '<path d="M8 4h8v4.1a4 4 0 0 1-8 0Z"/><path d="M8 5.6H5.3a2.8 2.8 0 0 0 2.8 3M16 5.6h2.7a2.8 2.8 0 0 1-2.8 3"/><path d="M12 12.1V16"/><path d="M8.7 20h6.6l-.7-3.1a1.6 1.6 0 0 0-1.6-1.3h-1.9a1.6 1.6 0 0 0-1.6 1.3Z"/>',
    "book-open": '<path d="M7 3.6h10.4A1.6 1.6 0 0 1 19 5.2v13.6a1.6 1.6 0 0 1-1.6 1.6H7A2.6 2.6 0 0 1 4.4 17.8V6.2A2.6 2.6 0 0 1 7 3.6Z"/><path d="M8 3.6v16.8"/><path d="M11.6 8h4.2M11.6 12h4.2"/>',
    globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 9.4h16.8M3.6 14.6h16.8"/><path d="M12 3.4c2.2 2.3 3.4 5.2 3.4 8.6s-1.2 6.3-3.4 8.6c-2.2-2.3-3.4-5.2-3.4-8.6S9.8 5.7 12 3.4Z"/>',
    medal: '<circle cx="12" cy="14.6" r="5.8"/><path d="M8.6 3.2l2.2 6.1M15.4 3.2l-2.2 6.1"/><path d="M12 12.2l.8 1.6 1.8.3-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.3 1.8-.3Z"/>',
    "shopping-bag": '<path d="M5.4 8h13.2l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H7.9a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M9.1 10V6.9a2.9 2.9 0 0 1 5.8 0V10"/>',
    "qr-code": '<rect x="3.6" y="3.6" width="6.8" height="6.8" rx="1.6"/><rect x="13.6" y="3.6" width="6.8" height="6.8" rx="1.6"/><rect x="3.6" y="13.6" width="6.8" height="6.8" rx="1.6"/><path d="M13.6 13.6h2.6v2.6h-2.6zM19.4 13.6h1M13.6 19.4v1M17 20.4h3.4M20.4 17v.6"/>',
    shield: '<path d="M12 3.2l7 2.9v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-6Z"/><path d="M9 12.1l2.1 2.1 4-4.1"/>',
    settings: '<path d="M4 7h8.2M17.4 7H20M4 17h2.6M11.8 17H20"/><circle cx="14.8" cy="7" r="2.2"/><circle cx="9.2" cy="17" r="2.2"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1.6a2 2 0 0 0 1.2-3.6 2 2 0 0 1 1.2-3.6h3.5A4.5 4.5 0 0 0 21 9.3C20.4 5.7 16.6 3 12 3Z"/><circle cx="7.6" cy="10.2" r="1"/><circle cx="9.6" cy="6.6" r="1"/><circle cx="14.2" cy="6.1" r="1"/>',
    "gamepad-2": '<path d="M8 7.6h8a4.5 4.5 0 0 1 4.4 5.4l-.5 2.6a2.6 2.6 0 0 1-4.5 1.1l-1.3-1.5a2 2 0 0 0-1.5-.7h-2.2a2 2 0 0 0-1.5.7L7.6 16.7a2.6 2.6 0 0 1-4.5-1.1l-.5-2.6A4.5 4.5 0 0 1 8 7.6Z"/><path d="M8.1 10.5v2.8M6.7 11.9H9.5M15.4 11.2h.01M17.3 13.1h.01"/>',
    monitor: '<rect x="3.5" y="4.8" width="17" height="11.4" rx="2"/><path d="M9 20h6M12 16.2V20"/>',
    gem: '<path d="M7.2 4.2h9.6l3 5.1L12 20.2 4.2 9.3Z"/><path d="M4.2 9.3h15.6M9.8 4.2 8.2 9.3l3.8 10.9 3.8-10.9-1.6-5.1"/>',
    "message-square": '<path d="M5.6 4.8h12.8a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H9.4L4.6 19.4V6.4a1.6 1.6 0 0 1 1.4-1.6Z"/>',
    bell: '<path d="M6.2 9.4a5.8 5.8 0 0 1 11.6 0c0 4.8 1.8 5.9 1.8 5.9H4.4s1.8-1.1 1.8-5.9Z"/><path d="M9.9 18.6a2.2 2.2 0 0 0 4.2 0"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="M16 16l4.2 4.2"/>',
    user: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0"/>',
    zap: '<path d="M13.3 2.6 5.4 13.1h5.2l-.9 8.3 8-10.7h-5.3Z"/>',
    sparkles: '<path d="M12 3.2l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7Z"/><path d="M18.6 14.2l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8Z"/>',
    "volume-2": '<path d="M4.4 9.6v4.8h3l4 3.3V6.3l-4 3.3Z"/><path d="M15.1 9.1a4.1 4.1 0 0 1 0 5.8M17.4 6.8a7.3 7.3 0 0 1 0 10.4"/>',
    "volume-x": '<path d="M4.4 9.6v4.8h3l4 3.3V6.3l-4 3.3Z"/><path d="M15.6 9.6l4 4.8M19.6 9.6l-4 4.8"/>',
    swords: '<path d="M5 3.6l6.6 6.6M19 3.6l-6.6 6.6"/><path d="M3.8 16.1l3.7-3.7 2.1 2.1-3.7 3.7a1.45 1.45 0 0 1-2.1 0 1.45 1.45 0 0 1 0-2.1ZM20.2 16.1l-3.7-3.7-2.1 2.1 3.7 3.7a1.45 1.45 0 0 0 2.1 0 1.45 1.45 0 0 0 0-2.1Z"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z"/>',
    download: '<path d="M12 3.4v10.8M7.6 10.2 12 14.6l4.4-4.4"/><path d="M4.6 20h14.8"/>',
    "chevron-right": '<path d="M9.4 5.6 15.8 12l-6.4 6.4"/>',
    "chevron-down": '<path d="M5.6 9.4 12 15.8l6.4-6.4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M4.6 12.4 9.6 17.4 19.4 6.6"/>',
    crown: '<path d="M4 8.4l3.8 3 4.2-6.2 4.2 6.2 3.8-3-1.4 10.2H5.4Z"/><path d="M6 20h12"/>',
    flame: '<path d="M12 3.2c3.1 3.6 5.2 5.9 5.2 9a5.2 5.2 0 0 1-10.4 0c0-1.9.9-3.5 2.4-5.2.4 1.6 1 2.5 1.8 2.7.7-2.2.5-4.4 1-6.5Z"/>',
    grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.8"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.8"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.8"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.8"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8 16v-4.4M12.7 16V8.6M17.4 16v-6.2"/>',
    calendar: '<rect x="3.8" y="5.2" width="16.4" height="15" rx="2.2"/><path d="M8 3.4v3.6M16 3.4v3.6M3.8 9.6h16.4"/>',
    vote: '<path d="M5 11.6h14v7.4H5z"/><path d="M8.6 11.6V15h6.8v-3.4"/><path d="M9.4 11.6l1.5-6.1h2.2l1.5 6.1"/>',
    clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.8"/>',
    star: '<path d="M12 3.6l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 10l6-.9Z"/>',
    users: '<circle cx="9" cy="8.4" r="3.3"/><path d="M3.4 19.6a5.6 5.6 0 0 1 11.2 0"/><path d="M15.6 5.5a3.2 3.2 0 0 1 0 6.1M17 14.4a5.6 5.6 0 0 1 3.6 5.2"/>',
    sprout: '<path d="M12 20v-6.5"/><path d="M12 13.5C12 9.9 9.2 7.2 5.4 7.2c0 3.7 2.9 6.3 6.6 6.3ZM12 11.8c0-3 2.3-5.4 5.4-5.4 0 3-2.4 5.4-5.4 5.4Z"/>',
    alert: '<path d="M12 3.6 21 19.4H3Z"/><path d="M12 9.4v4.2M12 16.6h.01"/>',
    "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clipboard: '<rect x="6" y="4.6" width="12" height="15.8" rx="2"/><path d="M9.4 4.6V3.4h5.2v1.2"/><path d="M9.4 10h5.2M9.4 13.6h5.2"/>',
    "log-out": '<path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14"/><path d="M16.5 8.5 20 12l-3.5 3.5M10.5 12H20"/>',
    pencil: '<path d="M4.5 19.5h4L19 9a2.1 2.1 0 0 0-3-3L5.5 16.5Z"/><path d="M14.5 6.5l3 3"/>',
    "eye": '<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="3.1"/>',
    "eye-off": '<path d="M9.9 5.9A9.9 9.9 0 0 1 12 5.8c6 0 9.4 6.2 9.4 6.2a17 17 0 0 1-2.7 3.5M6.4 7.5A17 17 0 0 0 2.6 12S6 18.2 12 18.2c1.3 0 2.5-.3 3.6-.7"/><path d="M4 4l16 16"/>',
    "log-in": '<path d="M10 4.5h7.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H10"/><path d="M4 12h11M11 8l4 4-4 4"/>',
    play: '<path d="M8 5.4v13.2L19 12Z"/>',
    moon: '<path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6 8.6 8.6 0 1 0 20.4 14.2Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6"/>',
    sunrise: '<path d="M3 18.4h18"/><path d="M7 15.2a5 5 0 0 1 10 0"/><path d="M12 5.4V9M9.4 7.4 12 4.8l2.6 2.6"/>',
    sunset: '<path d="M3 18.4h18"/><path d="M7 15.2a5 5 0 0 1 10 0"/><path d="M9.4 7.8 12 10.4l2.6-2.6"/>',
    camera: '<rect x="3.4" y="6.6" width="17.2" height="13" rx="2"/><path d="M8.6 6.6 9.9 4.2h4.2l1.3 2.4"/><circle cx="12" cy="13" r="3.4"/>',
    image: '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2"/><circle cx="8.6" cy="9.4" r="1.4"/><path d="m4.6 17.8 4.8-4.8 3.4 3.4 2.6-2.6 4 4"/>'
  };

  var EMOJI = {
    "🏆": "trophy", "💎": "gem", "🎮": "gamepad-2", "🖥️": "monitor", "🖥": "monitor",
    "💬": "message-square", "⚔️": "swords", "⚔": "swords", "🏅": "medal", "🥇": "medal",
    "📊": "chart", "📅": "calendar", "🗳": "vote", "⏱": "clock", "⏱️": "clock",
    "⚡": "zap", "⭐": "star", "🌟": "star", "👥": "users", "📘": "book-open",
    "🌱": "sprout", "❌": "x", "⚠️": "alert", "⚠": "alert", "👑": "crown",
    "←": "arrow-left", "🔔": "bell", "📲": "download", "🔊": "volume-2",
    "🔇": "volume-x", "🚀": "zap", "🧰": "grid", "🎯": "compass", "❤️": "star",
    "🛡️": "shield", "🛡": "shield", "➡️": "arrow-right", "➡": "arrow-right",
    "🚪": "log-out", "📋": "clipboard", "✕": "x", "▸": "chevron-right",
    "⚙️": "settings", "⚙": "settings", "✏️": "pencil", "✏": "pencil",
    "🌍": "globe", "🌎": "globe", "🌐": "globe", "▶️": "play", "▶": "play",
    "🛠️": "tool", "🛠": "tool", "🎛️": "settings", "🎚️": "settings",
    "🌙": "moon", "🌅": "sunrise", "🌆": "sunset", "☀️": "sun", "☀": "sun",
    "🔥": "flame", "📷": "camera", "📸": "camera", "🖼️": "image", "🖼": "image",
    "🪪": "user", "🆔": "user", "📝": "pencil", "🎭": "user", "🎨": "palette",
    "🛒": "shopping-bag", "🛍️": "shopping-bag", "✨": "sparkles", "💫": "sparkles"
  };

  function svg(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  /* ---------- state ---------- */
  var S = {};
  try { S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = Object.assign({}, DEFAULTS); }
  if (!S.theme) S = Object.assign({}, DEFAULTS);

  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function themeMeta(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  function accentMeta(id) { for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === id) return ACCENTS[i]; return ACCENTS[0]; }

  function themeColor() {
    return ({ aurora: "#05080F", nebula: "#080512", ember: "#0B0705", glacier: "#040B12" })[S.theme] || "#05080F";
  }

  function apply() {
    var r = document.documentElement;
    r.setAttribute("data-nova-theme", S.theme || "aurora");
    if ((S.accent || "auto") === "auto") r.removeAttribute("data-nova-accent");
    else r.setAttribute("data-nova-accent", S.accent);
    r.setAttribute("data-nova-radius", S.radius || "soft");
    r.classList.toggle("nova-no-glow", S.glow === false);
    r.classList.toggle("nova-reduce-motion", S.motion === false);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", themeColor());
    updateDrawerSub();
  }

  /* ---------- sheet ---------- */
  function buildSheet() {
    if (document.getElementById("nova-sheet")) return;
    var el = document.createElement("div");
    el.id = "nova-sheet";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Appearance settings");
    el.innerHTML =
      '<div class="nova-backdrop" data-nova-close></div>' +
      '<aside class="nova-panel">' +
        '<div class="nova-head">' +
          '<h2 class="nova-title"><span class="nova-tlogo">' + svg("palette") + "</span>Appearance</h2>" +
          '<button class="nova-close" data-nova-close aria-label="Close">' + svg("x") + "</button>" +
        "</div>" +
        '<p class="nova-sub">Themes, accent colors, corners and effects — saved on this device.</p>' +
        '<span class="nova-label">Theme</span><div class="nova-themes" id="nova-themes"></div>' +
        '<span class="nova-label">Accent color</span><div class="nova-swatches" id="nova-swatches"></div>' +
        '<span class="nova-label">Corner radius</span><div class="nova-seg" id="nova-seg">' +
          '<button data-radius="sharp">Sharp</button><button data-radius="soft">Soft</button><button data-radius="round">Round</button>' +
        "</div>" +
        '<span class="nova-label">Effects</span>' +
        '<div class="nova-row"><div><b>Aurora glow</b><small>Ambient gradients and neon shadows</small></div><button class="nova-switch" data-flag="glow" aria-label="Aurora glow"></button></div>' +
        '<div class="nova-row"><div><b>Motion</b><small>Animations and transitions</small></div><button class="nova-switch" data-flag="motion" aria-label="Motion"></button></div>' +
        '<button class="nova-reset" id="nova-reset">Reset to Aurora defaults</button>' +
        '<div class="nova-ver">Doxilo Nova · v1.0</div>' +
      "</aside>";
    document.body.appendChild(el);

    el.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-nova-close]")) { close(); return; }
      var t = ev.target.closest("[data-theme]");
      if (t) { S.theme = t.getAttribute("data-theme"); save(); apply(); paint(); return; }
      var a = ev.target.closest("[data-accent]");
      if (a) { S.accent = a.getAttribute("data-accent"); save(); apply(); paint(); return; }
      var rad = ev.target.closest("[data-radius]");
      if (rad) { S.radius = rad.getAttribute("data-radius"); save(); apply(); paint(); return; }
      var fl = ev.target.closest("[data-flag]");
      if (fl) { var f = fl.getAttribute("data-flag"); S[f] = !S[f]; save(); apply(); paint(); return; }
      if (ev.target.closest("#nova-reset")) {
        S = Object.assign({}, DEFAULTS); save(); apply(); paint();
        var p = document.querySelector(".nova-panel"); if (p) { p.classList.remove("nova-saved"); void p.offsetWidth; p.classList.add("nova-saved"); }
      }
    });
  }

  function paint() {
    var th = document.getElementById("nova-themes");
    var sw = document.getElementById("nova-swatches");
    var seg = document.getElementById("nova-seg");
    if (!th) return;
    th.innerHTML = THEMES.map(function (t) {
      return '<button class="nova-theme' + (S.theme === t.id ? " on" : "") + '" data-theme="' + t.id + '" style="--sw:' + t.sw + '">' +
        '<span class="prev" style="--prev:' + t.prev + ";--prevglow:" + t.glow + '"></span>' +
        '<span class="nm"><span>' + t.name + '</span><span class="dot"></span></span></button>';
    }).join("");
    sw.innerHTML = ACCENTS.map(function (a) {
      return '<button class="nova-sw' + ((S.accent || "auto") === a.id ? " on" : "") + '" data-accent="' + a.id + '" title="' + a.name + '" aria-label="' + a.name + '" style="--sw:' + a.sw + '"></button>';
    }).join("");
    var btns = seg.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("on", btns[i].getAttribute("data-radius") === (S.radius || "soft"));
    var switches = document.querySelectorAll(".nova-switch");
    for (var j = 0; j < switches.length; j++) {
      var f = switches[j].getAttribute("data-flag");
      switches[j].classList.toggle("on", !!S[f]);
      switches[j].setAttribute("aria-pressed", String(!!S[f]));
    }
  }

  function open() {
    buildSheet(); paint();
    var el = document.getElementById("nova-sheet");
    el.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    setTimeout(function () { var c = el.querySelector(".nova-close"); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    var el = document.getElementById("nova-sheet");
    if (!el) return;
    el.classList.remove("open");
    document.documentElement.style.overflow = "";
  }

  window.NovaUI = { open: open, close: close };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "n" || e.key === "N")) { e.preventDefault(); open(); }
  });

  /* ---------- drawer entries ---------- */
  function updateDrawerSub() {
    var sub = document.querySelector(".nova-drw-app .tx span");
    if (!sub) return;
    var a = accentMeta(S.accent || "auto");
    sub.textContent = themeMeta(S.theme).name + (a.id === "auto" ? "" : " · " + a.name);
  }
  function injectDrawerEntry() {
    var d = document.getElementById("drawer");
    if (!d || d.querySelector(".nova-drw-app")) return;
    var tools = d.querySelector(".drawer-tools") || d.querySelector(".drw-foot");
    if (!tools) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "nova-drw-app";
    b.innerHTML = '<span class="ic">' + svg("palette") + '</span><span class="tx"><b>Appearance</b><span>' + themeMeta(S.theme).name + '</span></span><span class="chev">' + svg("chevron-right") + "</span>";
    b.addEventListener("click", function () {
      try { window.closeDrawer && window.closeDrawer(); } catch (e) {}
      open();
    });
    tools.parentNode.insertBefore(b, tools);
    updateDrawerSub();
  }

  /* ---------- account row in drawer (removed by request) ---------- */
  function injectAccountRow() {
    /* Account / Create-or-sign-in row disabled — removed from drawer */
    var d = document.getElementById("drawer");
    var stale = d && d.querySelector(".nova-account");
    if (stale) stale.remove();
    return;
    var host = d.querySelector(".nova-drw-app") || d.querySelector(".drawer-tools");
    if (!host) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "nova-account";
    b.innerHTML = '<span class="ic">' + svg("user") + '</span><span class="tx"><b>Account</b><span>Create or sign in</span></span><span class="chev">' + svg("chevron-right") + "</span>";
    b.addEventListener("click", function () {
      try { window.closeDrawer && window.closeDrawer(); } catch (e) {}
      openAuth("signup");
    });
    host.parentNode.insertBefore(b, host);
  }

  /* ---------- realistic portrait avatars ---------- */
  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  var SKINS = [
    ["#FBE3CF", "#F0C6A6", "#CE9672"], ["#F6D7B8", "#E8B78E", "#C58B62"],
    ["#EFC9A4", "#DDA97E", "#B87A52"], ["#D9A674", "#C38A57", "#9C6638"],
    ["#B97D50", "#A2663A", "#7C4826"], ["#8D5A38", "#744529", "#54301B"],
    ["#6B4227", "#54301E", "#3A2013"], ["#F3D2B4", "#E1B08A", "#BC835C"]
  ];
  var HAIR_COLORS = [
    ["#3B2A20", "#1E140F"], ["#201A17", "#0C0908"], ["#6B4224", "#3F2513"],
    ["#A65D2E", "#6B3616"], ["#D8B36A", "#A67C37"], ["#8C8C8C", "#5A5A5A"],
    ["#4A2C49", "#2A1529"], ["#2F3A46", "#171E26"]
  ];
  var BG = [
    ["#16233A", "#070C16", "#38BDF8"], ["#241436", "#0B0616", "#C084FC"],
    ["#0E2B2A", "#050F12", "#2DD4BF"], ["#2C1810", "#0D0705", "#FB923C"],
    ["#26121D", "#0B0509", "#F472B6"], ["#1D1F2E", "#080A11", "#818CF8"],
    ["#122B1C", "#060F09", "#4ADE80"], ["#2A2415", "#0D0B06", "#FACC15"]
  ];
  var IRIS = ["#5B3A22", "#2E5A4B", "#3B5B8C", "#4A3728", "#3A6B5A", "#556270"];
  var SHIRT = [["#243244", "#111A27"], ["#34243F", "#171021"], ["#1C3A34", "#0B1D19"], ["#3A2A20", "#1A110C"], ["#22304E", "#0E1526"], ["#3B1F2B", "#1B0C12"]];
  var portraitCache = {};

  function portrait(seed) {
    seed = String(seed || "doxilo");
    if (portraitCache[seed]) return portraitCache[seed];
    var h = hash32(seed), n = h;
    function pick(arr, bits) { var v = n % arr.length; n = Math.floor(n / arr.length); return arr[v]; }
    var skin = pick(SKINS), hair = pick(HAIR_COLORS), bg = pick(BG), iris = pick(IRIS), shirt = pick(SHIRT);
    var hairStyle = n % 8; n = Math.floor(n / 8);
    var beard = (n & 1) === 1; var glasses = ((n >> 1) & 1) === 1; var lips = ((n >> 2) & 1) === 1;
    var shirtStyle = (n >> 3) % 5; var earring = ((n >> 5) & 1) === 1;
    var hairPaths = [
      "<path d='M29.5 43C27 29 34 17 50 17c15 0 22 11 20.5 26-2.6-5-5.6-8.3-10.6-9.6-7.5-1.9-16.8-1.4-24.4 4.1-2.6 1.9-4.6 3.6-6 5.5Z' fill='url(#hr)'/>",
      "<path d='M29.5 43C27 29 34 17 50 17c15 0 22 11 20.5 26-2.6-5-5.6-8.3-10.6-9.6-7.5-1.9-16.8-1.4-24.4 4.1-2.6 1.9-4.6 3.6-6 5.5Z' fill='url(#hr)'/><path d='M36 21c6-4 16-5 23 0-7 0-13 2-17 7-2-3-4-5-6-7Z' fill='" + hair[0] + "' opacity='.55'/>",
      "<path d='M31 39c1-12 8-19 19-19s18 7 19 19c-11-5-27-5-38 0Z' fill='url(#hr)' opacity='.94'/>",
      "<path d='M28 36c-2 13 0 25 6 33l-1-19c5-2 8-7 9-12 4 6 12 9 20 6l-1 25c7-8 8-21 4-33-3-11-11-18-23-18S31 25 28 36Z' fill='url(#hr)'/>",
      "<path d='M29 42c-3 14 1 25 8 30l1-20c-3-3-4-8-3-13 3 3 7 5 11 5 6 0 10-2 14-6 1 6-1 11-4 14l1 20c7-5 11-16 8-30-2-14-11-22-23-22S31 28 29 42Z' fill='url(#hr)'/>",
      "<circle cx='50' cy='14.5' r='6' fill='url(#hr)'/><path d='M31 40c1-12 8-19 19-19s18 7 19 19c-11-5-27-5-38 0Z' fill='url(#hr)'/>",
      "<g fill='url(#hr)'><circle cx='34' cy='28' r='7'/><circle cx='50' cy='21' r='8'/><circle cx='66' cy='28' r='7'/><circle cx='29' cy='40' r='5'/><circle cx='71' cy='40' r='5'/><path d='M31 40c1-12 8-19 19-19s18 7 19 19c-11-5-27-5-38 0Z'/></g>",
      "<path d='M30 41c-1-13 7-24 20-24 14 0 21 11 20 24-3-4-6-6-9-6l-2 5-4-5-5 4-5-4-4 5-2-5c-4 0-6 2-9 6Z' fill='url(#hr)'/>"
    ];
    var shirtOverlay = [
      "<path d='M36 71c4 7 8 10 14 10s10-3 14-10' stroke='#000' stroke-opacity='.22' stroke-width='2' fill='none'/>",
      "<path d='M34 70c5 9 11 13 16 13s11-4 16-13' fill='#000' opacity='.16'/><path d='M44 84v12M56 84v12' stroke='#fff' stroke-opacity='.22' stroke-width='1.2'/>",
      "<path d='M40 72l10 8 10-8 6 6-16 13-16-13Z' fill='#fff' opacity='.1'/>",
      "<path d='M42 71 32 78l8 14 10-21Z' fill='#fff' opacity='.07'/><path d='M58 71l10 7-8 14-10-21Z' fill='#fff' opacity='.07'/>",
      "<path d='M38 69h24v9c-8 4-16 4-24 0Z' fill='#000' opacity='.2'/>"
    ];
    var beardPath = beard ? "<path d='M31.4 47c1.4 14 9 24 18.6 24s17.2-10 18.6-24c-2 9-6 13-9.5 14.5-3 1.3-6.4 1.5-9.1 1.5s-6.1-.2-9.1-1.5C38.4 60 33.4 56 31.4 47Z' fill='url(#hr)' opacity='.5'/><path d='M44.5 61.2c2-1.2 4-1.2 5.5 0 1.5-1.2 3.5-1.2 5.5 0' stroke='" + hair[1] + "' stroke-width='1.2' fill='none' opacity='.7'/>" : "";
    var glassPath = glasses ? "<g stroke='#0B1020' stroke-opacity='.72' stroke-width='1.1' fill='none'><rect x='32.6' y='43.6' width='13.4' height='7.8' rx='1.4'/><rect x='54' y='43.6' width='13.4' height='7.8' rx='1.4'/><path d='M46 46.8h8M32.6 45.8l-3-1M67.4 45.8l3-1'/></g>" : "";
    var mouth = lips
      ? "<path d='M43.5 62.2c3-1.8 10-1.8 13 0-1.6 3-4.4 4.6-6.5 4.6s-4.9-1.6-6.5-4.6Z' fill='#9F3B3B' opacity='.55'/><path d='M46.4 66.4c2 1 5.2 1 7.2 0' stroke='#fff' stroke-opacity='.12' stroke-width='.9' fill='none'/>"
      : "<path d='M44 63.4c2.2 2.2 9.8 2.2 12 0' stroke='#6B2A2A' stroke-width='1.6' stroke-linecap='round' fill='none' opacity='.78'/><path d='M46.5 66.8c2 1.1 5 1.1 7 0' stroke='#fff' stroke-opacity='.14' stroke-width='.9' fill='none'/>";
    var svgTxt =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
      "<defs>" +
      "<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + bg[0] + "'/><stop offset='1' stop-color='" + bg[1] + "'/></linearGradient>" +
      "<radialGradient id='lit' cx='.3' cy='.16' r='.9'><stop offset='0' stop-color='#fff' stop-opacity='.24'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='sk' x1='0' y1='0' x2='.85' y2='1'><stop offset='0' stop-color='" + skin[0] + "'/><stop offset='.58' stop-color='" + skin[1] + "'/><stop offset='1' stop-color='" + skin[2] + "'/></linearGradient>" +
      "<linearGradient id='hr' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + hair[0] + "'/><stop offset='1' stop-color='" + hair[1] + "'/></linearGradient>" +
      "<linearGradient id='sh' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + shirt[0] + "'/><stop offset='1' stop-color='" + shirt[1] + "'/></linearGradient>" +
      "</defs>" +
      "<rect width='100' height='100' fill='url(#bg)'/><rect width='100' height='100' fill='url(#lit)'/>" +
      "<circle cx='82' cy='16' r='24' fill='" + bg[2] + "' opacity='.09'/><path d='M-10 90 110 20' stroke='#fff' stroke-opacity='.045' stroke-width='10'/>" +
      "<path d='M6 100c1-19 13-28 28-31l16-2 16 2c15 3 27 12 28 31Z' fill='url(#sh)'/>" +
      "<path d='M6 100c1-19 13-28 28-31 0 0 5 8 16 8s16-8 16-8c15 3 27 12 28 31Z' fill='#000' opacity='.12'/>" +
      shirtOverlay[shirtStyle] +
      "<path d='M39 65h22v14c0 5-5 8-11 8s-11-3-11-8z' fill='" + skin[1] + "'/><path d='M39 65h22v8c-5 4-17 4-22 0z' fill='#000' opacity='.16'/>" +
      "<ellipse cx='28.6' cy='47.4' rx='3.6' ry='5.2' fill='" + skin[1] + "'/><ellipse cx='71.4' cy='47.4' rx='3.6' ry='5.2' fill='" + skin[1] + "'/>" +
      (earring ? "<circle cx='28.6' cy='53.6' r='1.1' fill='#FBBF24'/>" : "") +
      "<path d='M50 16c-11.4 0-19 8.6-19 21.4 0 15 8.5 26.6 19 26.6s19-11.6 19-26.6C69 24.6 61.4 16 50 16Z' fill='url(#sk)'/>" +
      "<ellipse cx='44' cy='27' rx='13' ry='9' fill='#fff' opacity='.1'/>" +
      "<ellipse cx='35.5' cy='55' rx='5.6' ry='3.6' fill='" + skin[2] + "' opacity='.22'/><ellipse cx='64.5' cy='55' rx='5.6' ry='3.6' fill='" + skin[2] + "' opacity='.22'/>" +
      hairPaths[hairStyle] + beardPath +
      "<path d='M36.6 40.6c3-1.7 7-1.9 10-.9' stroke='" + hair[1] + "' stroke-width='2' stroke-linecap='round' fill='none' opacity='.82'/>" +
      "<path d='M53.4 39.7c3-1 7-.8 10 .9' stroke='" + hair[1] + "' stroke-width='2' stroke-linecap='round' fill='none' opacity='.82'/>" +
      "<path d='M35.8 47c2.5-2.4 6.4-2.4 8.9 0-2.5 2.4-6.4 2.4-8.9 0Z' fill='#FDFDFD'/><circle cx='40.25' cy='47' r='2.35' fill='" + iris + "'/><circle cx='40.25' cy='47' r='1.05' fill='#0B1020'/><circle cx='39.55' cy='46.3' r='.55' fill='#fff' opacity='.92'/>" +
      "<path d='M55.3 47c2.5-2.4 6.4-2.4 8.9 0-2.5 2.4-6.4 2.4-8.9 0Z' fill='#FDFDFD'/><circle cx='59.75' cy='47' r='2.35' fill='" + iris + "'/><circle cx='59.75' cy='47' r='1.05' fill='#0B1020'/><circle cx='59.05' cy='46.3' r='.55' fill='#fff' opacity='.92'/>" +
      "<path d='M50 48.2v6.6c0 1.4-1.1 2.4-2.5 2.3' stroke='#3A1D0F' stroke-opacity='.26' stroke-width='1.3' stroke-linecap='round' fill='none'/>" +
      "<ellipse cx='50' cy='58.2' rx='4.2' ry='1.4' fill='#7C2D12' opacity='.12'/>" +
      mouth + glassPath +
      "<path d='M46 70.6c2.6 1.2 5.4 1.2 8 0' stroke='#fff' stroke-opacity='.14' stroke-width='.9' fill='none'/>" +
      "<path d='M8 100c6-14 15-20 24-22' stroke='#fff' stroke-opacity='.05' stroke-width='1' fill='none'/>" +
      "</svg>";
    var uri = "data:image/svg+xml," + encodeURIComponent(svgTxt);
    portraitCache[seed] = uri;
    portraitCache[uri] = uri;
    return uri;
  }

  /* ---------- scenery avatars: planets, sun, mountains, rivers, trees ---------- */
  var SCENE_TYPES = ["planet", "sun", "moon", "mountains", "river", "forest", "desert", "aurora", "ocean", "volcano", "galaxy", "island", "waterfall", "lake", "canyon", "comet", "sakura", "tundra", "meadow", "nebula"];
  var SCENE_PAL = [
    ["#0B1026", "#1E1B4B", "#A78BFA"], ["#071A2C", "#0B3B4F", "#22D3EE"],
    ["#241436", "#0B0616", "#F472B6"], ["#2C1810", "#0D0705", "#FB923C"],
    ["#0E2B2A", "#050F12", "#34F5C5"], ["#2A2415", "#0D0B06", "#FACC15"],
    ["#1D1F2E", "#080A11", "#818CF8"], ["#122B1C", "#060F09", "#4ADE80"],
    ["#2C0F1A", "#0B0509", "#FB7185"], ["#0A1B2E", "#030A14", "#7DD3FC"]
  ];
  function mulberry(a) {
    a = a >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function scenery(spec) {
    if (typeof spec === "string") spec = { seed: spec };
    spec = spec || {};
    var seed = String(spec.seed || "doxilo");
    var r = mulberry(hash32(seed));
    var type = spec.type && SCENE_TYPES.indexOf(spec.type) >= 0 ? spec.type : SCENE_TYPES[Math.floor(r() * SCENE_TYPES.length)];
    var pal = SCENE_PAL[Math.floor(r() * SCENE_PAL.length)];
    var s1 = spec.sky1 || pal[0], s2 = spec.sky2 || pal[1], ac = spec.accent || pal[2];
    function stars(n, maxY) {
      var o = "";
      for (var i = 0; i < n; i++) {
        var x = (r() * 100).toFixed(1), y = (r() * (maxY || 72)).toFixed(1);
        o += "<circle cx='" + x + "' cy='" + y + "' r='" + (0.3 + r() * 0.9).toFixed(2) + "' fill='#fff' opacity='" + (0.25 + r() * 0.6).toFixed(2) + "'/>";
      }
      return o;
    }
    function tree(x, y, s, c) {
      return "<g transform='translate(" + x + " " + y + ") scale(" + s + ")'><rect x='-.9' y='0' width='1.8' height='9' fill='#20140C'/><path d='M0 -15 8 1h-16Z' fill='" + c + "'/><path d='M0 -7 10 5h-20Z' fill='" + c + "' opacity='.78'/></g>";
    }
    function birds(n) {
      var o = "";
      for (var i = 0; i < n; i++) {
        var x = (12 + r() * 76).toFixed(1), y = (8 + r() * 22).toFixed(1);
        o += "<path d='M" + x + " " + y + "q2.5-2 5 0M" + x + " " + y + "q-2.5-2-5 0' stroke='#fff' stroke-opacity='.4' stroke-width='.8' fill='none'/>";
      }
      return o;
    }
    var art;
    if (type === "planet") {
      art = stars(16) +
        "<ellipse cx='50' cy='52' rx='42' ry='11' fill='none' stroke='" + ac + "' stroke-opacity='.5' stroke-width='3' transform='rotate(-16 50 52)'/>" +
        "<circle cx='50' cy='50' r='28' fill='" + ac + "' opacity='.2'/>" +
        "<circle cx='50' cy='50' r='21' fill='" + ac + "'/>" +
        "<path d='M34 44c10-5 22-5 32 0' stroke='#fff' stroke-opacity='.3' stroke-width='3' fill='none'/>" +
        "<path d='M32 56c12 5 24 5 36 0' stroke='#000' stroke-opacity='.2' stroke-width='4' fill='none'/>" +
        "<circle cx='82' cy='22' r='4' fill='#fff' opacity='.85'/>";
    } else if (type === "sun") {
      art = "<circle cx='64' cy='36' r='22' fill='" + ac + "' opacity='.28'/><circle cx='64' cy='36' r='13' fill='#FFF7D6' opacity='.95'/>" +
        "<g stroke='" + ac + "' stroke-width='1.6' stroke-linecap='round' opacity='.7'><path d='M64 12v-6M64 60v6M40 36h-6M88 36h6M47 19l-4-4M81 19l4-4M47 53l-4 4M81 53l4 4'/></g>" +
        "<path d='M0 74c14-11 27-6 40 0s26 9 42-2 18 1 18 1V100H0Z' fill='#0B1220' opacity='.8'/>" +
        "<path d='M0 86c18-8 32-2 46 2s30 4 54-6V100H0Z' fill='#05080F'/>" + birds(2);
    } else if (type === "moon") {
      art = stars(22) +
        "<circle cx='62' cy='34' r='17' fill='#E2E8F0'/><circle cx='56' cy='30' r='14' fill='" + s1 + "'/>" +
        "<circle cx='35' cy='20' r='1.4' fill='#FDE68A'/><circle cx='24' cy='34' r='1' fill='#FDE68A'/>" +
        "<path d='M0 76 22 46 38 66 56 38 76 70 90 54 100 64V100H0Z' fill='#0A1322'/>" +
        "<path d='M0 90 18 66 34 82 50 60 72 86 88 72 100 80V100H0Z' fill='#05080F'/>";
    } else if (type === "mountains") {
      art = "<circle cx='26' cy='28' r='10' fill='#FDE68A' opacity='.9'/>" +
        "<path d='M0 82 24 40 42 68 62 30 84 70 100 48V100H0Z' fill='" + ac + "' opacity='.32'/>" +
        "<path d='M54 38l8 14 5-4 6 10-10 2Z' fill='#fff' opacity='.5'/>" +
        "<path d='M0 92 20 62 38 82 54 54 74 88 90 70 100 80V100H0Z' fill='#0B1424'/>" +
        "<path d='M0 100 26 78 48 94 70 76 100 92V100Z' fill='#05080F'/>" + birds(2);
    } else if (type === "river") {
      art = "<circle cx='74' cy='24' r='9' fill='#FDE68A' opacity='.75'/>" +
        "<path d='M0 60c16-12 34-12 50 0s34 12 50 0V100H0Z' fill='#0E2A1E'/>" +
        "<path d='M38 60c7 10 18 10 24 0 9 14 4 28 13 40H25c9-12 4-26 13-40Z' fill='" + ac + "' opacity='.55'/>" +
        "<path d='M45 64c5 12 9 24 7 36M55 64c-5 12-9 24-7 36' stroke='#fff' stroke-opacity='.35' stroke-width='1'/>" +
        tree(14, 62, 1, "#1F6E43") + tree(20, 68, 0.8, "#14532D") + tree(84, 64, 1.1, "#1F6E43") + tree(76, 70, 0.75, "#14532D");
    } else if (type === "forest") {
      art = "<circle cx='50' cy='26' r='16' fill='" + ac + "' opacity='.18'/>" +
        "<path d='M0 72c20-10 38-8 56-2s30 8 44 0V100H0Z' fill='#0A2417'/>" +
        tree(12, 62, 1.2, "#166534") + tree(24, 58, 0.9, "#15803D") + tree(36, 64, 1.35, "#14532D") +
        tree(52, 56, 1, "#166534") + tree(66, 64, 1.3, "#15803D") + tree(79, 58, 0.95, "#14532D") + tree(90, 66, 1.2, "#166534") +
        "<path d='M0 88c18-6 34-4 50 0s34 4 50-2V100H0Z' fill='#050F09'/>";
    } else if (type === "desert") {
      art = "<circle cx='30' cy='30' r='12' fill='#FDE68A' opacity='.85'/>" +
        "<path d='M0 74c18-14 36-8 52-2s32 8 48-4V100H0Z' fill='" + ac + "' opacity='.55'/>" +
        "<path d='M0 86c20-10 40-6 58 0s28 6 42-2V100H0Z' fill='#7C2D12' opacity='.75'/>" +
        "<path d='M0 95c24-7 44-3 62 1s26 3 38-2V100H0Z' fill='#3B1A0C'/>" +
        "<g fill='#0F2417'><rect x='72' y='62' width='3' height='22' rx='1'/><rect x='66' y='70' width='7' height='3' rx='1'/><rect x='74' y='66' width='6' height='3' rx='1'/></g>";
    } else if (type === "aurora") {
      art = stars(24) +
        "<path d='M-6 34c22-18 40 10 58-6s30-8 54 6v14c-24-12-34 2-54 4s-36-14-58 8Z' fill='" + ac + "' opacity='.4'/>" +
        "<path d='M-6 46c24-14 40 8 58-4s32-4 54 8v10c-22-10-34 2-54 2s-36-12-58 6Z' fill='" + ac + "' opacity='.28'/>" +
        "<path d='M-6 58c22-10 40 6 58-2s30-2 54 8v8c-24-8-34 2-54 2s-36-10-58 4Z' fill='#fff' opacity='.14'/>" +
        "<path d='M0 80 24 66 46 82 66 64 86 80 100 70V100H0Z' fill='#E2E8F0' opacity='.35'/>" +
        "<path d='M0 90 26 80 50 92 72 76 100 90V100H0Z' fill='#0B1220' opacity='.9'/>";
    } else if (type === "ocean") {
      art = "<circle cx='68' cy='30' r='12' fill='#FDE68A' opacity='.85'/>" +
        "<path d='M0 52h100v48H0Z' fill='" + ac + "' opacity='.32'/>" +
        "<path d='M0 62c14-6 26 6 40 0s28-8 42 0 18 2 18 2v36H0Z' fill='" + ac + "' opacity='.4'/>" +
        "<g stroke='#fff' stroke-opacity='.4' stroke-width='1.2' fill='none'><path d='M6 72q8-6 16 0t16 0 16 0 16 0 16 0'/><path d='M12 82q8-6 16 0t16 0 16 0 16 0'/><path d='M4 92q8-6 16 0t16 0 16 0 16 0 16 0'/></g>" + birds(2);
    } else if (type === "volcano") {
      art = stars(14, 40) +
        "<path d='M8 84 38 40 52 64 66 36 92 84Z' fill='#1F1210'/>" +
        "<path d='M40 46 50 60 57 48 64 58 70 42 58 62 50 52Z' fill='" + ac + "' opacity='.85'/>" +
        "<path d='M50 40c3-6 0-12-4-16 10 2 16 8 14 16-2-4-6-4-10 0Z' fill='#fff' opacity='.16'/>" +
        "<path d='M0 84c18-6 32-2 48 2s34 4 52-4V100H0Z' fill='#0B0705'/>" +
        "<circle cx='30' cy='26' r='1' fill='" + ac + "'/><circle cx='74' cy='18' r='1.2' fill='" + ac + "'/><circle cx='58' cy='12' r='.9' fill='" + ac + "'/>";
    } else if (type === "galaxy") {
      art = stars(26) +
        "<g transform='rotate(-24 50 50)' fill='none' stroke='" + ac + "'><ellipse cx='50' cy='50' rx='40' ry='13' stroke-opacity='.4' stroke-width='6'/><ellipse cx='50' cy='50' rx='30' ry='8' stroke-opacity='.7' stroke-width='3'/><ellipse cx='50' cy='50' rx='18' ry='4' stroke-opacity='.9' stroke-width='2'/></g>" +
        "<circle cx='50' cy='50' r='9' fill='#fff' opacity='.9'/><circle cx='50' cy='50' r='16' fill='" + ac + "' opacity='.3'/>" +
        "<circle cx='18' cy='70' r='1.4' fill='#fff' opacity='.8'/><circle cx='82' cy='26' r='1.2' fill='#fff' opacity='.8'/>";
    } else if (type === "island") {
      art = "<circle cx='70' cy='26' r='10' fill='#FDE68A' opacity='.8'/>" +
        "<path d='M0 60h100v40H0Z' fill='" + ac + "' opacity='.4'/>" +
        "<path d='M22 76c6-10 20-14 30-8s16 12 26 8v24H22Z' fill='#C2B280'/>" +
        "<path d='M30 72c6-6 14-8 22-6' stroke='#0F3D2E' stroke-width='4' fill='none'/>" +
        "<path d='M58 70V46' stroke='#3B2A1A' stroke-width='3'/><g fill='#15803D'><path d='M58 48c-10-6-16-2-18 2 8 0 14 2 18 6Z'/><path d='M58 46c10-7 17-3 19 1-8 0-14 2-19 6Z'/><path d='M58 50c-6-9-2-15 2-17 0 8 2 13 5 17Z'/></g>" +
        "<g stroke='#fff' stroke-opacity='.35' stroke-width='1' fill='none'><path d='M8 84h20M74 90h18M10 66h14'/></g>";
    } else if (type === "waterfall") {
      art = stars(10, 30) +
        "<path d='M0 20h34l-4 80H0Z' fill='#132030'/><path d='M66 20h34v80H70Z' fill='#132030'/>" +
        "<path d='M34 26h32v10c-6 4-12 4-18 0-5 4-9 4-14 0Z' fill='#1E3A5F'/>" +
        "<path d='M40 34h20v40c-5 3-9 3-15 0-2 2-4 2-5 0Z' fill='" + ac + "' opacity='.5'/>" +
        "<path d='M44 36v36M50 36v40M56 36v36' stroke='#fff' stroke-opacity='.4' stroke-width='1'/>" +
        "<path d='M20 84c10-6 22-6 30 0s22 6 30 0v16H20Z' fill='" + ac + "' opacity='.45'/>" +
        tree(10, 60, 0.9, "#14532D") + tree(88, 58, 1, "#14532D");
    } else if (type === "lake") {
      art = "<circle cx='72' cy='22' r='9' fill='#FDE68A' opacity='.8'/>" +
        "<path d='M0 62 20 40 36 58 54 34 74 60 90 44 100 54V72H0Z' fill='#0B1424'/>" +
        "<path d='M0 68h100v32H0Z' fill='" + ac + "' opacity='.35'/>" +
        "<path d='M0 68h100v6H0Z' fill='#fff' opacity='.12'/>" +
        "<g stroke='#fff' stroke-opacity='.3' stroke-width='1' fill='none'><path d='M10 80h18M42 86h22M70 78h16M24 92h20'/></g>" +
        tree(8, 60, 1, "#14532D") + tree(90, 62, 0.9, "#14532D");
    } else if (type === "canyon") {
      art = "<circle cx='50' cy='22' r='11' fill='#FDE68A' opacity='.75'/>" +
        "<path d='M0 40h100v60H0Z' fill='#7C2D12'/>" +
        "<path d='M0 48h100v10H0Z' fill='" + ac + "' opacity='.5'/><path d='M0 66h100v8H0Z' fill='#9A3412'/><path d='M0 82h100v6H0Z' fill='" + ac + "' opacity='.4'/>" +
        "<path d='M0 40 10 26 22 40ZM78 40 88 22 100 40Z' fill='#7C2D12'/>" +
        "<path d='M38 58h24v26H38Z' fill='#450A0A' opacity='.7'/>";
    } else if (type === "comet") {
      art = stars(26) +
        "<g transform='rotate(-32 50 50)'><path d='M52 50 18 34 10 40 46 56Z' fill='#fff' opacity='.25'/><path d='M52 50 26 40 20 44 46 54Z' fill='" + ac + "' opacity='.5'/><circle cx='56' cy='50' r='7' fill='#fff'/><circle cx='56' cy='50' r='12' fill='" + ac + "' opacity='.35'/></g>" +
        "<path d='M0 88 24 74 48 90 70 74 100 90V100H0Z' fill='#05080F'/>";
    } else if (type === "sakura") {
      art = stars(18) +
        "<path d='M-4 34c22 2 30 12 40 22s18 10 28 8' stroke='#3B2A1A' stroke-width='4' fill='none' stroke-linecap='round'/>" +
        "<path d='M22 40c4-8 10-12 16-12M52 52c6-6 12-8 18-6' stroke='#3B2A1A' stroke-width='2' fill='none'/>" +
        "<g fill='" + ac + "'><circle cx='18' cy='30' r='3'/><circle cx='30' cy='34' r='2.4'/><circle cx='40' cy='42' r='3.2'/><circle cx='52' cy='48' r='2.6'/><circle cx='62' cy='54' r='3'/><circle cx='74' cy='56' r='2.3'/><circle cx='26' cy='52' r='1.8'/><circle cx='48' cy='34' r='1.7'/></g>" +
        "<path d='M0 90c18-6 34-2 50 2s34 4 50-2V100H0Z' fill='#1F1220'/>";
    } else if (type === "tundra") {
      art = "<circle cx='68' cy='24' r='10' fill='#E0F2FE' opacity='.55'/>" +
        "<path d='M0 70 18 44 34 66 48 38 66 68 84 46 100 64V100H0Z' fill='" + ac + "' opacity='.4'/>" +
        "<path d='M0 82 16 62 32 80 46 58 64 84 82 64 100 78V100H0Z' fill='#CBD5E1' opacity='.5'/>" +
        "<path d='M0 92 20 84 40 96 62 82 82 94 100 88V100H0Z' fill='#F8FAFC' opacity='.8'/>" +
        "<g stroke='#fff' stroke-opacity='.5'><path d='M12 30v10M7 35h10M86 36v8M82 40h8'/></g>";
    } else if (type === "meadow") {
      art = "<circle cx='26' cy='22' r='9' fill='#FDE68A' opacity='.85'/>" + birds(2) +
        "<path d='M0 62c20-12 40-8 56-2s32 8 44-2V100H0Z' fill='#166534' opacity='.75'/>" +
        "<path d='M0 76c22-8 40-4 58 2s30 4 42-2V100H0Z' fill='#14532D'/>" +
        "<g><circle cx='16' cy='70' r='1.6' fill='" + ac + "'/><circle cx='30' cy='78' r='1.3' fill='#FDE68A'/><circle cx='44' cy='68' r='1.7' fill='" + ac + "'/><circle cx='58' cy='80' r='1.4' fill='#fff'/><circle cx='72' cy='70' r='1.6' fill='#FDE68A'/><circle cx='86' cy='78' r='1.3' fill='" + ac + "'/></g>" +
        tree(8, 64, 0.8, "#14532D") + tree(92, 66, 0.9, "#14532D");
    } else {
      art = stars(30) +
        "<circle cx='30' cy='34' r='26' fill='" + ac + "' opacity='.18'/><circle cx='70' cy='62' r='30' fill='#F472B6' opacity='.12'/><circle cx='52' cy='48' r='20' fill='#fff' opacity='.06'/>" +
        "<circle cx='62' cy='28' r='1.6' fill='#fff' opacity='.9'/><circle cx='38' cy='64' r='1.3' fill='#fff' opacity='.8'/><circle cx='80' cy='44' r='1.1' fill='#fff' opacity='.7'/>";
    }
    var uri = "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
      "<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + s1 + "'/><stop offset='1' stop-color='" + s2 + "'/></linearGradient>" +
      "<radialGradient id='gl' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='" + ac + "' stop-opacity='.55'/><stop offset='1' stop-color='" + ac + "' stop-opacity='0'/></radialGradient></defs>" +
      "<rect width='100' height='100' fill='url(#sky)'/><rect width='100' height='100' fill='url(#gl)' opacity='.35'/>" +
      art + "<rect width='100' height='100' fill='none' stroke='#fff' stroke-opacity='.07'/></svg>"
    );
    return uri;
  }
  /* scenery replaces every portrait avatar app-wide */
  function portrait(seed) {
    seed = String(seed || "doxilo");
    if (portraitCache[seed]) return portraitCache[seed];
    var uri = scenery(seed);
    portraitCache[seed] = uri;
    portraitCache[uri] = uri;
    return uri;
  }
  var SCENE_KINDS = [];
  function scenePresets() {
    var list = [], i, t;
    for (i = 0; i < SCENE_TYPES.length; i++) {
      list.push(scenery({ seed: "scene-" + SCENE_TYPES[i], type: SCENE_TYPES[i] }));
      SCENE_KINDS.push(SCENE_TYPES[i]);
    }
    for (i = 0; i < 8; i++) {
      t = SCENE_TYPES[(i * 3 + 7) % SCENE_TYPES.length];
      list.push(scenery({ seed: "scene-extra-" + i, type: t }));
      SCENE_KINDS.push(t);
    }
    return list;
  }
  var SCENES = scenePresets();

  var AV_MAP = {};
  function replaceAvatars(root) {
    var scope = root || document;
    var imgs = scope.querySelectorAll('img[src^="data:image/svg+xml"]:not([data-nv-av])');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i], src = img.getAttribute("src") || "";
      if (!src || src.length > 4200) continue;
      if (img.closest("#nova-auth,#nova-sheet")) continue;
      var next = AV_MAP[src];
      if (!next) {
        next = portrait(src);
        var keys = Object.keys(AV_MAP);
        if (keys.length > 160) delete AV_MAP[keys[0]]; /* simple FIFO cap */
        AV_MAP[src] = next;
      }
      img.setAttribute("src", next);
      img.setAttribute("data-nv-av", "1");
      img.style.objectFit = "cover";
    }
  }

  /* ---------- account / create-account screen ---------- */
  var AUTH_MODE = "signup";
  var authLocked = false;

  function authMarkup() {
    return '<div id="nova-auth" class="open" role="dialog" aria-modal="true" aria-label="Create account or sign in">' +
      '<div class="nva-card">' +
        
        '<section class="nva-form">' +
          '<button type="button" class="nva-close" data-auth-close aria-label="Close">' + svg("x") + '</button>' +
          '<p class="nva-kicker" id="nva-kicker">Get started</p>' +
          '<h3 id="nva-title">Create your account</h3>' +
          '<p class="nva-sub" id="nva-sub">Save your progress and unlock everything.</p>' +
          '<div class="nva-tabs"><button type="button" class="nva-tab on" data-mode="signup">Create account</button><button type="button" class="nva-tab" data-mode="signin">Sign in</button></div>' +
          '<div class="nva-fields" id="nva-fields"></div>' +
          '<button type="button" class="btn-primary" id="nva-ghostbtn" style="display:none" tabindex="-1" aria-hidden="true">Create Account (Instant)</button>' +
          '<button type="button" class="nva-submit" id="nva-submit">Create account</button>' +
          '<div class="nva-or">or</div>' +
          '<button type="button" class="nva-guest" id="nva-guest">Continue as guest</button>' +
          '<p class="nva-note">Guest progress stays on this device. <b>Create an account</b> to keep it safe.</p>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  var AV_SEEDS = ["nova-av-1", "nova-av-2", "nova-av-3", "nova-av-4", "nova-av-5", "nova-av-6", "nova-av-7", "nova-av-8"];

  function avatarPicker() {
    var opts = AV_SEEDS.map(function (seed, i) {
      return '<button type="button" class="nva-avp" data-av-src="' + portrait(seed) + '" aria-label="Avatar option ' + (i + 1) + '"><img src="' + portrait(seed) + '" alt=""></button>';
    }).join("");
    return '<div class="nva-avbox">' +
      '<div class="nva-avhead"><span>Pick your avatar <i>optional</i></span><button type="button" class="nva-avskip" data-av-skip>Auto</button></div>' +
      '<div class="nva-avgrid">' + opts + '</div>' +
      '</div>';
  }

  function authFields(mode) {
    if (mode === "signin") {
      return '<label class="nva-f"><span>Email</span><input id="li-email" class="nva-input" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
        '<label class="nva-f"><span>Password</span><div class="nva-pass-wrap"><input id="li-pass" class="nva-input" type="password" autocomplete="current-password" placeholder="Your password"><button type="button" class="nva-eye" data-eye="li-pass" aria-label="Show password">' + svg("eye") + '</button></div></label>';
    }
    return avatarPicker() +
      '<div class="nva-row"><label class="nva-f"><span>Display name</span><input id="au-name" class="nva-input" maxlength="24" autocomplete="nickname" placeholder="Your name"></label><img id="nva-face" class="nva-face" data-nv-av="1" alt="Avatar preview" src="' + portrait("signup-face") + '"></div>' +
      '<label class="nva-f"><span>Email</span><input id="au-email" class="nva-input" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
      '<label class="nva-f"><span>Password</span><div class="nva-pass-wrap"><input id="au-pass" class="nva-input" type="password" autocomplete="new-password" placeholder="4+ characters"><button type="button" class="nva-eye" data-eye="au-pass" aria-label="Show password">' + svg("eye") + '</button></div></label>';
  }

  function bindAuth(root) {
    var fields = root.querySelector("#nva-fields");
    var tabs = root.querySelectorAll(".nva-tab");
    var submit = root.querySelector("#nva-submit");
    var guest = root.querySelector("#nva-guest");
    var closeBtn = root.querySelector("[data-auth-close]");
    var title = root.querySelector("#nva-title");
    var sub = root.querySelector("#nva-sub");
    var kicker = root.querySelector("#nva-kicker");

    function paintMode(mode) {
      AUTH_MODE = mode;
      var signin = mode === "signin";
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i].getAttribute("data-mode") === mode);
      fields.innerHTML = authFields(mode);
      submit.textContent = signin ? "Sign in" : "Create account";
      if (title) title.textContent = signin ? "Welcome back" : "Create your account";
      if (sub) sub.textContent = signin ? "Sign in to restore your XP, streak and unlocks." : "Save your progress and unlock everything.";
      if (kicker) kicker.textContent = signin ? "Welcome back" : "Get started";
      var eyes = fields.querySelectorAll("[data-eye]");
      for (var j = 0; j < eyes.length; j++) {
        eyes[j].addEventListener("click", function () {
          var inp = document.getElementById(this.getAttribute("data-eye"));
          if (!inp) return;
          var show = inp.type === "password";
          inp.type = show ? "text" : "password";
          this.innerHTML = svg(show ? "eye-off" : "eye");
        });
      }
      var name = fields.querySelector("#au-name");
      var face = fields.querySelector("#nva-face");
      var picks = fields.querySelectorAll("[data-av-src]");
      var skip = fields.querySelector("[data-av-skip]");
      window.__novaAvChoice = null;
      for (var p = 0; p < picks.length; p++) {
        picks[p].addEventListener("click", function () {
          var src = this.getAttribute("data-av-src");
          window.__novaAvChoice = src;
          for (var q = 0; q < picks.length; q++) picks[q].classList.toggle("on", picks[q] === this);
          if (face) face.src = src;
        });
      }
      if (skip) skip.addEventListener("click", function () {
        window.__novaAvChoice = null;
        for (var q = 0; q < picks.length; q++) picks[q].classList.remove("on");
        if (face) face.src = portrait("name:" + ((name && name.value) || "").trim().toLowerCase());
      });
      if (name && face) {
        name.addEventListener("input", function () {
          if (!window.__novaAvChoice) face.src = portrait("name:" + (this.value || "").trim().toLowerCase());
        });
      }
      setTimeout(function () {
        var first = fields.querySelector("input");
        if (first) first.focus({ preventScroll: true });
      }, 90);
    }

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () { paintMode(this.getAttribute("data-mode")); });
    }
    submit.addEventListener("click", submitAuth);
    fields.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitAuth(); } });
    guest.addEventListener("click", startFreshGuest);
    if (closeBtn) closeBtn.addEventListener("click", function () { closeAuth(authLocked); });
    paintMode(AUTH_MODE || "signup");
  }

  function currentUser() {
    try { return typeof MY !== "undefined" ? MY : (window.MY || null); } catch (e) { return window.MY || null; }
  }

  function watchAuthResult(signup, av) {
    var t0 = Date.now();
    var iv = setInterval(function () {
      var u = currentUser();
      if (u && u.uid && /^u/.test(String(u.uid))) {
        clearInterval(iv);
        if (signup) {
          if (av) {
            try {
              u.avatar = av;
              if (typeof db !== "undefined" && db) db.ref("users/" + u.uid).update({ avatar: av }).catch(function () {});
            } catch (e) {}
          }
          try { localStorage.setItem("nova_tour_pending", "1"); } catch (e) {}
          try { if (typeof window.navTo === "function") window.navTo("home"); } catch (e) {}
        } else {
          try { localStorage.removeItem("nova_tour_pending"); localStorage.setItem("nova_tour_done", "1"); } catch (e) {}
        }
        closeAuth(false);
        setTimeout(function () {
          var pendingTour = false;
          try { pendingTour = localStorage.getItem("nova_tour_pending") === "1"; } catch (e2) {}
          if (pendingTour) { try { window.NovaTour && window.NovaTour.show(); } catch (e3) {} }
        }, 900);
      } else if (Date.now() - t0 > 18000) {
        clearInterval(iv);
      }
    }, 320);
  }

  function submitAuth() {
    var btn = document.getElementById("nva-submit");
    if (!btn || btn.disabled) return;
    var isSignin = AUTH_MODE === "signin";
    var label = isSignin ? "Sign in" : "Create account";
    var av = isSignin ? null : window.__novaAvChoice;
    btn.disabled = true;
    btn.textContent = isSignin ? "Signing in…" : "Creating account…";
    try {
      if (isSignin) {
        if (typeof window.doLogin !== "function") throw new Error("Sign in unavailable");
        window.doLogin();
      } else {
        if (typeof window.doSignup !== "function") throw new Error("Signup unavailable");
        window.doSignup();
      }
      watchAuthResult(!isSignin, av);
    } catch (e) {
      console.warn("[nova-auth]", e);
      try { toast("Account service is unavailable. Continue as guest.", "error"); } catch (x) {}
    }
    setTimeout(function () {
      if (document.getElementById("nova-auth") && btn) {
        btn.disabled = false;
        btn.textContent = label;
      }
    }, 3200);
  }

  function startFreshGuest() {
    authLocked = false;
    try { if (typeof window.clearSession === "function") window.clearSession(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try {
      /* clear only app-owned keys — never wipe unrelated site data */
      var wipe = ["doxilo_session", "doxilo_guest", "doxilo_guest_me", "doxilo_daynight",
        "doxilo_sound", "doxilo_admin_pass", "vty_offline_db1", "vty_wc_id",
        "nova_cos_v1", "nova_arcade_hs_v1", "nova_arcade_cfg_v1", "nova_arcade_stats_v1",
        "nova_wc_bubble", "wc_me", "vq_xp", "vq_history", "vq_played_count", "vq_best_pct", "vq_best_streak"];
      for (var wi = 0; wi < wipe.length; wi++) { try { localStorage.removeItem(wipe[wi]); } catch (we) {} }
      for (var wk in localStorage) {
        if (/^(wc_|vq_|dx_h_|rmIPKey|nova_tour|doxilo_)/.test(String(wk))) { try { localStorage.removeItem(wk); } catch (we2) {} }
      }
      localStorage.setItem("nova_tour_pending", "1");
    } catch (e) {}
    closeAuth(false);
    try { if (typeof window.V3SilentGuest === "function") { window.V3SilentGuest(); return; } } catch (ve) {}
    setTimeout(function () { location.reload(); }, 90);
  }

  function openAuth(mode) {
    var root = document.getElementById("auth-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "auth-root";
      document.body.appendChild(root);
    }
    authLocked = false;
    AUTH_MODE = mode === "signin" ? "signin" : "signup";
    root.innerHTML = authMarkup();
    var sheet = root.querySelector("#nova-auth");
    if (sheet) sheet.classList.add("open");
    bindAuth(root);
    document.documentElement.style.overflow = "hidden";
  }

  function closeAuth(reload) {
    var root = document.getElementById("auth-root");
    if (root) root.innerHTML = "";
    document.documentElement.style.overflow = "";
    authLocked = false;
    if (reload) setTimeout(function () { location.reload(); }, 60);
  }

  function novaLogout() {
    authLocked = true;
    try { if (typeof window.clearSession === "function") window.clearSession(); } catch (e) {}
    try { sessionStorage.removeItem("doxilo_admin"); } catch (e) {}
    try {
      localStorage.removeItem("doxilo_impersonate");
      localStorage.removeItem("doxilo_guest");
      localStorage.removeItem("doxilo_guest_me");
    } catch (e) {}
    try {
      localStorage.removeItem("nova_cos_v1");
      localStorage.removeItem("nova_arcade_hs_v1");
      localStorage.removeItem("nova_tour_done");
      localStorage.setItem("nova_tour_pending", "1");
    } catch (e) {}
    try { document.body.classList.remove("day"); } catch (e) {}
    try { window.closeDrawer && window.closeDrawer(); } catch (e) {}
    try { toast("Signed out. Create an account to save your progress."); } catch (e) {}
    openAuth("signup");
    authLocked = true; /* the auth sheet cannot be dismissed until signed in/up */
  }

  window.novaLogout = novaLogout;

  // admin sidebar logout should also clear the account and open the auth screen
  document.addEventListener("click", function (e) {
    var t = e.target;
    var lo = t && t.closest && t.closest(".adm4-side-logout");
    if (lo) {
      e.preventDefault();
      e.stopPropagation();
      novaLogout();
    }
  }, true);

  // route app signup/login entry points to the new screen (after guest boot)
  setTimeout(function () {
    try {
      window.novaOpenAuth = openAuth;
      window.showAuth = function (t) {
        openAuth(/sign\s*in|log\s*in/i.test(String(t || "")) ? "signin" : "signup");
        try { if (typeof MY === "undefined" || !MY) authLocked = true; } catch (le) {}
      };
      try { if (document.querySelector("#auth-root .au3-wrap")) openAuth("signin" === authMode ? "signin" : "signup"); } catch (e2) {}
    } catch (e) {}
  }, 600);

  /* ---------- five-tab bottom navigation ---------- */
  function fixBnav() {
    var nav = document.querySelector(".bnav");
    if (!nav) return;
    var items = nav.querySelectorAll(".bnav-item");
    var last = items[items.length - 1];
    if (last) {
      last.setAttribute("onclick", "navTo('profile')");
      last.setAttribute("aria-label", "Profile");
      var lb = last.querySelector(".bnav-lb");
      if (lb) lb.textContent = "Profile";
    }
    if (!nav.querySelector(".bnav-chat") && last) {
      var chat = document.createElement("div");
      chat.className = "bnav-item bnav-chat";
      chat.setAttribute("onclick", "try{VTY.open()}catch(e){navTo('phub')}");
      chat.setAttribute("aria-label", "Chat");
      chat.innerHTML = '<span class="bnav-ic">' + svg("message-square") + '</span><span class="bnav-lb">Chat</span>';
      chat.addEventListener("click", function () {
        var items2 = nav.querySelectorAll(".bnav-item");
        for (var x = 0; x < items2.length; x++) items2[x].classList.toggle("active", items2[x] === chat);
        setTimeout(styleChat, 700);
        setTimeout(styleChat, 1600);
      });
      nav.insertBefore(chat, last);
    }
  }

  function syncBnav(page) {
    var nav = document.querySelector(".bnav");
    if (!nav || ["home", "discover", "create", "chat", "profile"].indexOf(page) < 0) return;
    var items = nav.querySelectorAll(".bnav-item");
    for (var i = 0; i < items.length; i++) {
      var oc = items[i].getAttribute("onclick") || "";
      var m = oc.match(/navTo\('([^']+)'\)/);
      items[i].classList.toggle("active", !!(m && m[1] === page));
    }
  }

  (function wrapNav() {
    if (window.__novaNavWrapped) return;
    var orig = window.navTo;
    if (typeof orig !== "function") return;
    window.navTo = function (page) {
      if (page === "shop" && window.NovaShop && window.NovaShop.open) {
        try { window.NovaShop.open("shop"); syncBnav(page); return; } catch (e) {}
      }
      if (page === "arcade" && window.NovaArcade && window.NovaArcade.open) {
        try { window.NovaArcade.open(); syncBnav(page); return; } catch (e) {}
      }
      var out = orig.apply(this, arguments);
      try { syncBnav(page); setTimeout(function () { syncBnav(page); fixBnav(); }, 40); } catch (e) {}
      return out;
    };
    window.__novaNavWrapped = 1;
  })();

  /* ---------- shop / discover / admin polish ---------- */
  function stripEmoji(s) {
    s = String(s || "");
    try { s = s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ""); }
    catch (e) { s = s.replace(/[^\w\s·.&+]/g, ""); }
    return s.replace(/\s+/g, " ").trim();
  }

  function polishShop() {
    var wrap = document.querySelector(".xps-wrap");
    if (!wrap) return;
    var header = wrap.querySelector(".xps-header");
    if (header && !wrap.querySelector(".nova-hint")) {
      var hint = document.createElement("div");
      hint.className = "nova-hint";
      hint.innerHTML = svg("zap") + '<span><b>Earn XP</b> by voting, winning battles and keeping your daily streak alive.</span>';
      header.parentNode.insertBefore(hint, header.nextSibling);
    }
    var iconFor = { "Colors": "palette", "Avatars": "user", "Frames": "grid", "Titles": "star", "Avatar Effects": "sparkles", "Profile Themes": "monitor", "Text Fonts": "book-open", "Chat Stickers": "message-square" };
    var tabs = wrap.querySelectorAll(".xps-cat-tab");
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      if (tab.getAttribute("data-nova-cat")) continue;
      var label = stripEmoji(tab.textContent);
      tab.innerHTML = svg(iconFor[label] || "shopping-bag") + "<span>" + label + "</span>";
      tab.setAttribute("data-nova-cat", "1");
    }
    var names = wrap.querySelectorAll(".xps-name");
    for (var j = 0; j < names.length; j++) {
      if (names[j].getAttribute("data-nova-name")) continue;
      names[j].textContent = stripEmoji(names[j].textContent);
      names[j].setAttribute("data-nova-name", "1");
    }
    var acts = wrap.querySelectorAll(".xps-act");
    for (var k = 0; k < acts.length; k++) {
      if (acts[k].getAttribute("data-nova-act")) continue;
      var txt = stripEmoji(acts[k].textContent);
      acts[k].innerHTML = svg("shopping-bag") + "<span>" + txt + "</span>";
      acts[k].setAttribute("data-nova-act", "1");
    }
  }

  function polishDiscover() {
    var empty = null;
    var cores = document.querySelectorAll(".empty-core");
    for (var i = 0; i < cores.length; i++) {
      if (/No battles/i.test(cores[i].textContent || "")) { empty = cores[i]; break; }
    }
    if (empty && !empty.querySelector(".nova-empty-cta")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn-primary nova-empty-cta";
      b.textContent = "Start the first battle";
      b.addEventListener("click", function () { try { window.navTo("create"); } catch (e) {} });
      empty.appendChild(b);
    }
  }

  function polishAdmin() {
    if (!document.body.classList.contains("adm4-active")) return;
    var content = document.querySelector(".adm4-content");
    if (!content || content.querySelector(".nova-hint")) return;
    var tip = document.createElement("div");
    tip.className = "nova-hint";
    tip.innerHTML = svg("zap") + '<span><b>Quick tip:</b> press Ctrl + K anywhere to jump to any admin page.</span>';
    content.insertBefore(tip, content.firstChild);
  }

  var PF_RE = /[\p{Extended_Pictographic}\uFE0F\u200D]/u;
  var PF_SEQ = /[\p{Extended_Pictographic}\uFE0F\u200D]+/gu;
  var PF_SKIP = "input,textarea,select,script,style,svg,[contenteditable],[class*=chat],[class*=msg],[class*=bio],[class*=comment]";
  function iconifyEmoji(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) if (PF_RE.test(n.nodeValue || "")) list.push(n);
    for (var i = 0; i < list.length; i++) {
      var node = list[i], p = node.parentElement;
      if (!p || p===root || p.closest(PF_SKIP)) continue;
      var txt = node.nodeValue, frag = document.createDocumentFragment(), buf = "", last = 0, m;
      PF_SEQ.lastIndex = 0;
      while ((m = PF_SEQ.exec(txt))) {
        if (m.index > last) buf += txt.slice(last, m.index);
        if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ""; }
        var ic = EMOJI[m[0]];
        if (ic && ICONS[ic]) {
          var sp = document.createElement("span");
          sp.className = "nova-ico";
          sp.innerHTML = svg(ic);
          frag.appendChild(sp);
        }
        last = m.index + m[0].length;
      }
      if (last < txt.length) buf += txt.slice(last);
      if (buf) frag.appendChild(document.createTextNode(buf));
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    }
  }
  function polishProfile() {
    var v = document.querySelector("#app .view.active .pf2-card") ? document.querySelector("#app .view.active") : null;
    if (!v) return;
    iconifyEmoji(v);

    var hics = v.querySelectorAll(".pf2-hic");
    for (var j = 0; j < hics.length; j++) {
      var h = hics[j];
      if (h.querySelector("svg") || h.getAttribute("data-nova-hic")) continue;
      var card = h.closest(".pf2-card") || v;
      var ttl = (card.querySelector(".pf2-title") || {}).textContent || "";
      h.innerHTML = svg(/identity/i.test(ttl) ? "clipboard" : /photo/i.test(ttl) ? "user" : "chart");
      h.setAttribute("data-nova-hic", "1");
    }

    var tabs = v.querySelectorAll(".a-tab");
    for (var k = 0; k < tabs.length; k++) {
      var tab = tabs[k];
      if (tab.getAttribute("data-nova-ptab")) continue;
      var label = stripEmoji(tab.textContent.replace(/[★☆🎨🎭🖼️📷]/g, "")).trim() || "Avatars";
      tab.innerHTML = svg(/collection/i.test(label) ? "star" : "user") + "<span>" + label + "</span>";
      tab.setAttribute("data-nova-ptab", "1");
    }

    var up = v.querySelector(".pf2-upload");
    if (up && !up.getAttribute("data-nova-up")) {
      up.innerHTML = svg("download") + "<span>Upload Avatar</span>";
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; inp.hidden = true;
      inp.setAttribute("onchange", "pickUploadAv(this)");
      up.appendChild(inp);
      up.setAttribute("data-nova-up", "1");
    }
  }

  /* ---------- icons / emoji / logo ---------- */
  function swapIcons(root) {
    var scope = root || document;
    var list = scope.querySelectorAll("svg[data-lucide]");
    for (var i = 0; i < list.length; i++) {
      var s = list[i], n = s.getAttribute("data-lucide");
      if (ICONS[n]) {
        s.innerHTML = ICONS[n];
        s.setAttribute("stroke-width", "1.7");
        s.removeAttribute("data-lucide");
        s.setAttribute("data-nova-icon", n);
      }
    }
  }

  function swapEmoji() {
    var tin = document.querySelectorAll(".nh-ic");
    for (var i = 0; i < tin.length; i++) {
      var el = tin[i], txt = (el.textContent || "").trim();
      if (EMOJI[txt] && !el.querySelector("svg")) el.innerHTML = svg(EMOJI[txt]);
    }
    var welcome = document.querySelector(".nh-welcome");
    if (welcome && !welcome.getAttribute("data-nova")) {
      welcome.innerHTML = svg("sparkles") + "<span>Welcome to Doxilo</span><i class='nh-pulse'></i>";
      welcome.setAttribute("data-nova", "1");
    }
    var hub = document.querySelector(".dt-hub");
    if (hub && !hub.getAttribute("data-nova")) {
      hub.innerHTML = svg("grid") + "<span>Open Full Tools Hub</span>";
      hub.setAttribute("data-nova", "1");
    }
    var fulls = document.querySelectorAll(".drw-full");
    for (var j = 0; j < fulls.length; j++) {
      var f = fulls[j];
      if (f.getAttribute("data-nova")) continue;
      var t = (f.textContent || "").replace(/[📲🔊🔇]/g, "").trim();
      if (/install/i.test(t)) f.innerHTML = svg("download") + "<span>Install App</span>";
      else if (/sound/i.test(t)) f.innerHTML = svg(/on/i.test(t) && !/off/i.test(t) ? "volume-2" : "volume-x") + "<span>" + t + "</span>";
      f.setAttribute("data-nova", "1");
    }
  }

  // replace emoji glyphs used as UI icons (never touches chat/user content)
  var EMO_RE = new RegExp("(" + Object.keys(EMOJI).sort(function (a, b) { return b.length - a.length; }).join("|") + ")", "g");
  var SKIP = "textarea,input,option,script,style,svg,[contenteditable],[class*=chat],[class*=msg],[class*=message],[class*=bubble],[class*=comment],[id*=chat],[id*=msg]";

  function swapEmojiLeaves(root) {
    var scope = root || document;
    var els = scope.querySelectorAll("h1,h2,h3,h4,span,div,button,p,label,strong,b,small");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.children.length || el.getAttribute("data-nova-em")) continue;
      var txt = el.textContent || "";
      if (txt.length > 60 || !EMO_RE.test(txt)) { EMO_RE.lastIndex = 0; continue; }
      EMO_RE.lastIndex = 0;
      if (el.closest(SKIP)) continue;
      var fs = parseFloat(getComputedStyle(el).fontSize) || 14;
      if (fs >= 26 && txt.trim().length <= 2) continue;
      el.innerHTML = el.innerHTML.replace(EMO_RE, function (m) { return '<span class="nova-ico">' + svg(EMOJI[m]) + "</span>"; });
      el.setAttribute("data-nova-em", "1");
    }
  }

  function cleanupStrays() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n, kill = [];
    while ((n = w.nextNode())) {
      if (n.nodeValue && n.nodeValue.indexOf("[object Promise]") > -1) kill.push(n);
    }
    for (var i = 0; i < kill.length; i++) {
      var p = kill[i].parentElement;
      if (p && (p.tagName === "SCRIPT" || p.tagName === "STYLE")) continue;
      kill[i].nodeValue = kill[i].nodeValue.replace(/\[object Promise\]/g, "");
    }
  }

  function polishBits() {
    var els = document.querySelectorAll("div,section,label,a");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute("data-nova-pol") || el.closest("#nova-sheet,.drawer,#app .view:not(.active)")) continue;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (getComputedStyle(el).borderTopStyle === "dashed") {
        el.classList.add("nova-drop");
        el.setAttribute("data-nova-pol", "1");
      }
    }
    var best = null, bestA = 1e9;
    var cand = document.querySelectorAll("div,a");
    for (var j = 0; j < cand.length; j++) {
      var c = cand[j];
      if ((c.textContent || "").indexOf("Daily Challenge") < 0) continue;
      var q = c.getBoundingClientRect();
      if (q.height < 20 || q.height > 90 || q.width < 220 || q.width > 1100) continue;
      var area = q.width * q.height;
      if (area < bestA) { bestA = area; best = c; }
    }
    if (best) best.classList.add("nova-daily");
  }

  // New sharp logo mark
  function logoMark(uid) {
    uid = uid || "n" + Math.random().toString(36).slice(2, 7);
    var g = "nvlg-" + uid, cp = "nvlc-" + uid;
    return '<svg class="dx-logo-svg" viewBox="0 0 64 64" role="img" aria-label="Doxilo logo" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#22D3EE"/><stop offset=".5" stop-color="#6366F1"/><stop offset="1" stop-color="#C084FC"/>' +
      '</linearGradient><clipPath id="' + cp + '"><path d="M5 5h39l15 15v39H5Z"/></clipPath></defs>' +
      '<g clip-path="url(#' + cp + ')">' +
      '<rect x="5" y="5" width="54" height="54" fill="url(#' + g + ')"/>' +
      '<path d="M5 55 59 9v50H5Z" fill="#050A14" opacity=".16"/>' +
      '<path d="M17 17h13.6C40.4 17 46 22.4 46 32s-5.6 15-15.4 15H17Zm7 6.2v17.6h6C36 40.8 39 37.4 39 32s-3-8.8-9-8.8Z" fill="#050A14"/>' +
      '<path d="M45 5h14v14Z" fill="#fff" opacity=".9"/>' +
      '<path d="M14 49h12" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>' +
      '</g>' +
      '<path d="M5 5h39l15 15v39H5Z" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1"/>' +
      '<circle cx="50.5" cy="13.5" r="2" fill="#050A14"/>' +
      "</svg>";
  }

  window.dxLogoSVG = function (uid) { return logoMark(uid); };

  var CHAT_CSS = [
    "html,body{background:#05080F!important;color:#EEF3FF!important}",
    ".chat-page{background:linear-gradient(180deg,rgba(5,8,15,.58),rgba(5,8,15,.84))!important;background-color:#05080F!important}",
    ".chat-page.nv-wc-wall-on{background-color:#05080F!important}",
    ".chat-page.nv-wc-wall-on #wc-wall-canvas{display:none!important}",
    ".chat-header{background:rgba(6,10,20,.9)!important;border-bottom:1px solid rgba(148,163,255,.16)!important;backdrop-filter:blur(16px)!important;border-radius:0!important}",
    ".icobtn{border-radius:2px!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(148,163,255,.18)!important;color:#DCE6FF!important;box-shadow:none!important}",
    ".icobtn:hover{background:rgba(255,255,255,.09)!important;border-color:rgba(167,139,250,.45)!important}",
    ".chat-logo-badge{width:30px!important;height:30px!important;border-radius:2px!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important;padding:0!important}",
    ".chat-logo-badge svg{width:100%!important;height:100%!important;display:block}",
    ".chat-title .nm{color:#fff!important;font-weight:800!important}",
    ".chat-title .sub{color:rgba(238,243,255,.5)!important}",
    ".channel-strip{background:rgba(255,255,255,.02)!important;border-bottom:1px solid rgba(148,163,255,.12)!important;border-radius:0!important}",
    ".chat-layout{background:transparent!important}",
    ".chat-side{background:rgba(7,11,22,.95)!important;border-right:1px solid rgba(148,163,255,.14)!important;border-radius:0!important}",
    ".side-search-wrap,.side-search{background:rgba(255,255,255,.04)!important;border:1px solid rgba(148,163,255,.16)!important;border-radius:2px!important;color:#EEF3FF!important}",
    ".side-tab{border-radius:2px!important}",
    ".side-tab.active{background:rgba(99,102,241,.22)!important;color:#fff!important}",
    ".user-row{border-radius:2px!important}",
    ".user-row:hover{background:rgba(255,255,255,.05)!important}",
    ".chat-main,.chat-msgs{background:transparent!important}",
    ".day-div{display:block!important;width:auto!important;max-width:180px!important;margin:12px auto!important;padding:3px 10px!important;font-size:9px!important;letter-spacing:.1em!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(148,163,255,.14)!important;border-radius:2px!important;color:rgba(238,243,255,.55)!important}",
    ".msg-bubble{border:1px solid rgba(148,163,255,.16);border-radius:2px!important;color:#EEF3FF;box-shadow:0 10px 24px -18px #000;backdrop-filter:blur(8px);max-width:min(580px,76vw)!important}",
    ".chat-msgs .msg-row{opacity:1!important}",
    ".msg-text{color:#EAF0FF!important;font-size:13px!important;line-height:1.5!important}",
    ".msg-author-name{color:#9DB4FF!important}",
    ".msg-meta{color:rgba(238,243,255,.45)!important}",
    ".msg-tail{display:none!important}",
    ".chat-input-area{background:rgba(5,8,15,.94)!important;border-top:1px solid rgba(148,163,255,.14)!important;backdrop-filter:blur(16px)!important;border-radius:0!important}",
    ".input-pill{background:rgba(255,255,255,.05)!important;border:1px solid rgba(148,163,255,.18)!important;border-radius:2px!important}",
    ".input-pill:focus-within{border-color:rgba(139,92,246,.6)!important}",
    ".input-pill textarea,.input-pill input{color:#EEF3FF!important}",
    ".ci-btn{border-radius:2px!important}",
    ".ci-send{background:linear-gradient(135deg,#22D3EE,#6366F1)!important;color:#05121A!important;border:0!important}",
    ".reply-preview{background:rgba(255,255,255,.05)!important;border-left:2px solid #22D3EE!important;border-radius:2px!important}",
    ".user-modal{background:rgba(10,15,28,.97)!important;border:1px solid rgba(148,163,255,.18)!important;border-radius:2px!important;color:#EEF3FF!important}",
    ".chat-side-back{background:rgba(0,0,0,.5)!important}",
    ".sel-bar{border-radius:2px!important}",
    ".nv-wc-panel{position:fixed;inset:0;z-index:99999;display:none;background:rgba(3,6,12,.66);backdrop-filter:blur(7px);font-family:inherit}",
    ".nv-wc-panel.open{display:block}",
    ".nv-wc-sheet{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(600px,94vw);max-height:88vh;overflow:auto;background:#0A1120;border:1px solid rgba(148,163,255,.24);border-radius:14px!important;box-shadow:0 34px 90px -30px #000;padding:16px;color:#EEF3FF}",
    ".nv-wc-sh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}",
    ".nv-wc-sh b{font-size:15px;letter-spacing:-.01em}",
    ".nv-wc-sh button{width:30px;height:30px;border:1px solid rgba(148,163,255,.2);background:rgba(255,255,255,.04);border-radius:8px!important;color:#EEF3FF;cursor:pointer;font-size:15px;line-height:1}",
    ".nv-wc-sub{font-size:11px;color:rgba(238,243,255,.55);margin:0 0 12px}",
    ".nv-wc-h{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#A5B4FC;margin:14px 0 8px}",
    ".nv-wc-sw{display:flex;flex-wrap:wrap;gap:7px}",
    ".nv-wc-sw button{width:26px;height:26px;border-radius:50%!important;border:2px solid rgba(255,255,255,.18);cursor:pointer;padding:0}",
    ".nv-wc-sw button.on{box-shadow:0 0 0 2px #fff,0 0 14px rgba(34,211,238,.7)}",
    ".nv-wc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}",
    ".nv-wc-wall{position:relative;border:1px solid rgba(148,163,255,.16);border-radius:10px!important;overflow:hidden;cursor:pointer;aspect-ratio:16/10;background:#070B14}",
    ".nv-wc-wall i{position:absolute;inset:0;display:block}",
    ".nv-wc-wall span{position:absolute;left:6px;right:6px;bottom:4px;font-size:8.5px;font-weight:800;color:#fff;text-shadow:0 1px 4px #000;z-index:2}",
    ".nv-wc-wall em{position:absolute;top:4px;right:4px;font-size:7px;font-weight:900;letter-spacing:.08em;padding:2px 4px;background:rgba(34,211,238,.85);color:#04121A;border-radius:3px!important;z-index:2}",
    ".nv-wc-wall.on{border-color:#22D3EE;box-shadow:0 0 0 1px #22D3EE}",
    ".nv-wc-foot{display:flex;gap:8px;margin-top:14px}",
    ".nv-wc-foot button{flex:1;height:34px;border:1px solid rgba(148,163,255,.2);background:rgba(255,255,255,.04);color:#EEF3FF;border-radius:8px!important;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}",
    ".nv-wc-foot button.pri{background:linear-gradient(135deg,#22D3EE,#6366F1);border:0;color:#04121A}",
    "@media(max-width:520px){.nv-wc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "*::-webkit-scrollbar{width:8px;height:8px}",
    "*::-webkit-scrollbar-thumb{background:rgba(148,163,255,.22);border-radius:2px}"
  ].join("\n");

  /* ---------- World Chatter cosmetics bridge ---------- */
  var WC_WALL_CSS = [
    ".chat-page.nv-wc-wall-on{background:#05080F!important}",
    ".chat-page.nv-wc-wall-grid{background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),radial-gradient(900px 600px at 80% -10%,rgba(99,102,241,.24),transparent 60%),#05080F!important;background-size:30px 30px,30px 30px,auto,auto!important}",
    ".chat-page.nv-wc-wall-dots{background:radial-gradient(rgba(255,255,255,.14) 1px,transparent 1.4px),radial-gradient(760px 480px at 10% 110%,rgba(34,211,238,.18),transparent 60%),#05080F!important;background-size:20px 20px,auto,auto!important}",
    ".chat-page.nv-wc-wall-aurora{background:radial-gradient(70% 60% at 15% 0%,rgba(34,211,238,.34),transparent 70%),radial-gradient(60% 60% at 95% 100%,rgba(167,139,250,.3),transparent 70%),#05080F!important}",
    ".chat-page.nv-wc-wall-carbon{background:repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,.4) 0 3px,transparent 3px 7px),#0A0D14!important}",
    ".chat-page.nv-wc-wall-rings{background:repeating-radial-gradient(circle at 85% 12%,rgba(124,92,255,.2) 0 1px,transparent 1px 36px),#05080F!important}",
    ".chat-page.nv-wc-wall-starfield{background:radial-gradient(1.4px 1.4px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 68% 42%,#fff,transparent),radial-gradient(1.6px 1.6px at 42% 78%,#22D3EE,transparent),radial-gradient(1px 1px at 88% 66%,#fff,transparent),radial-gradient(60% 60% at 50% 50%,rgba(30,27,75,.7),transparent),#03050B!important;background-size:140px 140px,180px 180px,220px 220px,260px 260px,auto,auto!important;animation:nvWcDrift 90s linear infinite}",
    ".chat-page.nv-wc-wall-live-aurora{background:radial-gradient(70% 55% at 18% 0%,rgba(34,245,197,.4),transparent 65%),radial-gradient(55% 50% at 78% 12%,rgba(99,102,241,.45),transparent 65%),radial-gradient(70% 60% at 50% 110%,rgba(167,139,250,.35),transparent 70%),#05080F!important;background-size:160% 160%,160% 160%,160% 160%,auto!important;animation:nvWcDrift 18s ease-in-out infinite alternate}",
    ".chat-page.nv-wc-wall-live-stars{background:radial-gradient(1.5px 1.5px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 10%,#fff,transparent),radial-gradient(1.7px 1.7px at 45% 65%,#7DD3FC,transparent),radial-gradient(1px 1px at 85% 80%,#fff,transparent),radial-gradient(1.2px 1.2px at 10% 85%,#FDE68A,transparent),#03050B!important;background-size:180px 180px,140px 140px,240px 240px,200px 200px,260px 260px,auto!important;animation:nvWcStars 40s linear infinite}",
    ".chat-page.nv-wc-wall-live-waves{background:repeating-linear-gradient(180deg,rgba(34,211,238,.16) 0 2px,transparent 2px 34px),linear-gradient(180deg,#04121F,#062B3D 55%,#083B4C)!important;background-size:100% 240px,auto!important;animation:nvWcWaves 8s linear infinite}",
    ".chat-page.nv-wc-wall-live-neon{background:linear-gradient(rgba(34,211,238,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,.2) 1px,transparent 1px),radial-gradient(60% 60% at 50% 110%,rgba(99,102,241,.5),transparent 70%),#05030F!important;background-size:44px 44px,44px 44px,auto,auto!important;animation:nvWcGrid 6s linear infinite}",
    ".chat-page.nv-wc-wall-live-sunset{background:linear-gradient(180deg,#1B0A1F 0%,#5B1636 38%,#B4432E 66%,#F59E0B 88%,#FDE68A 100%)!important;background-size:100% 160%!important;animation:nvWcSunset 24s ease-in-out infinite alternate}",
    ".chat-page.nv-wc-wall-live-galaxy{background:radial-gradient(70% 55% at 25% 30%,rgba(167,139,250,.38),transparent 65%),radial-gradient(55% 45% at 75% 70%,rgba(34,211,238,.3),transparent 65%),radial-gradient(1.4px 1.4px at 30% 20%,#fff,transparent),radial-gradient(1px 1px at 80% 40%,#fff,transparent),radial-gradient(1.3px 1.3px at 55% 85%,#FDE68A,transparent),#05030F!important;background-size:180% 180%,180% 180%,160px 160px,220px 220px,260px 260px,auto!important;animation:nvWcDrift 26s ease-in-out infinite alternate}",
    ".chat-page.nv-wc-wall-live-rain{background:repeating-linear-gradient(112deg,rgba(125,211,252,.22) 0 1px,transparent 1px 12px),linear-gradient(180deg,#030A14,#071B2C)!important;background-size:auto,auto!important;animation:nvWcRain .8s linear infinite}",
    ".chat-page.nv-wc-wall-live-fireflies{background:radial-gradient(2px 2px at 20% 30%,#FDE047,transparent),radial-gradient(1.6px 1.6px at 65% 70%,#34F5C5,transparent),radial-gradient(1.4px 1.4px at 85% 25%,#FDE047,transparent),radial-gradient(1.5px 1.5px at 40% 85%,#34F5C5,transparent),linear-gradient(180deg,#04120C,#020904)!important;background-size:220px 220px,260px 260px,200px 200px,240px 240px,auto!important;animation:nvWcFloat 22s ease-in-out infinite alternate}",
    ".chat-page.nv-wc-wall-live-snow{background:radial-gradient(1.8px 1.8px at 15% 20%,#fff,transparent),radial-gradient(1.4px 1.4px at 55% 40%,#E0F2FE,transparent),radial-gradient(1.6px 1.6px at 80% 15%,#fff,transparent),radial-gradient(1.2px 1.2px at 35% 70%,#BFDBFE,transparent),linear-gradient(180deg,#071626,#0B2236)!important;background-size:180px 180px,220px 220px,260px 260px,200px 200px,auto!important;animation:nvWcSnow 16s linear infinite}",
    ".chat-page.nv-wc-wall-live-lava{background:radial-gradient(45% 40% at 20% 90%,rgba(249,115,22,.5),transparent 70%),radial-gradient(40% 35% at 75% 80%,rgba(220,38,38,.5),transparent 70%),radial-gradient(30% 30% at 50% 100%,rgba(253,224,71,.35),transparent 70%),linear-gradient(180deg,#0B0503,#1A0A05)!important;background-size:140% 140%,140% 140%,140% 140%,auto!important;animation:nvWcDrift 12s ease-in-out infinite alternate}",
    ".chat-page.nv-wc-wall-live-bubbles{background:radial-gradient(14px 14px at 20% 80%,rgba(125,211,252,.22),transparent 70%),radial-gradient(10px 10px at 65% 60%,rgba(167,139,250,.24),transparent 70%),radial-gradient(16px 16px at 85% 90%,rgba(34,245,197,.18),transparent 70%),linear-gradient(180deg,#03101C,#051826)!important;background-size:240px 240px,200px 200px,260px 260px,auto!important;animation:nvWcBubbles 20s linear infinite}",
    "@keyframes nvWcDrift{0%{background-position:0% 0%,100% 0%,50% 100%,0 0}100%{background-position:30% 20%,60% 30%,30% 70%,0 0}}",
    "@keyframes nvWcStars{0%{background-position:0 0,0 0,0 0,0 0,0 0,0 0}100%{background-position:180px 180px,140px 140px,240px 240px,200px 200px,260px 260px,0 0}}",
    "@keyframes nvWcWaves{0%{background-position:0 0,0 0}100%{background-position:0 240px,0 0}}",
    "@keyframes nvWcGrid{0%{background-position:0 0,0 0,0 0,0 0}100%{background-position:44px 44px,44px 44px,0 0,0 0}}",
    "@keyframes nvWcSunset{0%{background-position:50% 0%}100%{background-position:50% 60%}}",
    "@keyframes nvWcRain{0%{background-position:0 0,0 0}100%{background-position:-24px 48px,0 0}}",
    "@keyframes nvWcFloat{0%{background-position:0 0,0 0,0 0,0 0,0 0}100%{background-position:40px -30px,-30px 20px,20px 30px,-20px -20px,0 0}}",
    "@keyframes nvWcSnow{0%{background-position:0 0,0 0,0 0,0 0,0 0}100%{background-position:30px 180px,-20px 220px,10px 260px,-30px 200px,0 0}}",
    "@keyframes nvWcBubbles{0%{background-position:0 0,0 0,0 0,0 0}100%{background-position:20px -240px,-16px -200px,12px -260px,0 0}}"
  ].join("\n");

  function lightenHex(hex, a) {
    try {
      var t = String(hex || "").replace("#", "");
      if (t.length === 3) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
      var r = parseInt(t.substr(0, 2), 16), g = parseInt(t.substr(2, 2), 16), b = parseInt(t.substr(4, 2), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
      function mix(v) { return Math.min(255, Math.round(v + (255 - v) * a)); }
      return "#" + ((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1);
    } catch (e) { return hex; }
  }
  function wcWallId() {
    try {
      var s = JSON.parse(localStorage.getItem("nova_cos_v1") || "{}");
      var id = s && s.equipped && s.equipped.walls ? s.equipped.walls : "none";
      return id === "none" ? "" : id;
    } catch (e) { return ""; }
  }
  function appShopObj() {
    try { return (typeof SHOP !== "undefined" && SHOP) || window.SHOP || null; } catch (e) { return window.SHOP || null; }
  }
  function wcBubbleColor() {
    try {
      var ov = localStorage.getItem("nova_wc_bubble");
      if (ov) return ov;
      var u = currentUser(), id = u && u.shop ? u.shop.bubbles : null;
      var shop = appShopObj();
      var list = (shop && shop.bubbles) || [];
      if (id) for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].c;
    } catch (e) {}
    return "";
  }
  function paintChatCosmetics(d) {
    var page = d.querySelector(".chat-page");
    var col = wcBubbleColor();
    if (col) {
      d.documentElement.style.setProperty("--bubble", col);
      d.documentElement.style.setProperty("--bubble2", lightenHex(col, 0.38));
      if (d.body) { d.body.style.setProperty("--bubble", col); d.body.style.setProperty("--bubble2", lightenHex(col, 0.38)); }
    }
    if (page) {
      var cls = [];
      for (var i = 0; i < page.classList.length; i++) if (/^nv-wc-wall/.test(page.classList[i])) cls.push(page.classList[i]);
      for (var j = 0; j < cls.length; j++) page.classList.remove(cls[j]);
      var wall = wcWallId();
      if (wall) { page.classList.add("nv-wc-wall-" + wall); page.classList.add("nv-wc-wall-on"); }
    }
    var imgs = d.querySelectorAll('img[src^="data:image/svg+xml"]:not([data-nv-wcav])');
    for (var k = 0; k < imgs.length; k++) {
      var src = imgs[k].getAttribute("src") || "";
      if (src.length > 4200) { imgs[k].setAttribute("data-nv-wcav", "1"); continue; }
      try { imgs[k].src = portrait(src); } catch (e) {}
      imgs[k].setAttribute("data-nv-wcav", "1");
      imgs[k].style.objectFit = "cover";
    }
  }
  function wcPanel(d) {
    var old = d.getElementById("nv-wc-panel");
    if (old) old.remove();
    var walls = [];
    try { walls = window.NovaShop && window.NovaShop.walls ? window.NovaShop.walls() : []; } catch (e) {}
    var wallOwned = function (id) { try { return window.NovaShop && window.NovaShop.wallOwned ? window.NovaShop.wallOwned(id) : true; } catch (e) { return true; } };
    var curWall = wcWallId();
    var curBub = wcBubbleColor();
    var bubs = (appShopObj() && appShopObj().bubbles) || [];
    var el = d.createElement("div");
    el.id = "nv-wc-panel";
    el.className = "nv-wc-panel open";
    el.innerHTML = '<div class="nv-wc-sheet"><div class="nv-wc-sh"><b>Chat style</b><button type="button" data-wcclose aria-label="Close">✕</button></div>' +
      '<p class="nv-wc-sub">Bubble colors and live wallpapers from your XP Shop — applied instantly to World Chatter.</p>' +
      '<div class="nv-wc-h">Bubble color</div><div class="nv-wc-sw" id="nv-wc-sw">' +
      bubs.map(function (b) { return '<button type="button" data-wcb="' + escAttr(b.c) + '" title="' + escAttr(b.n) + '" style="background:' + escAttr(b.c) + '" class="' + (String(b.c).toLowerCase() === String(curBub).toLowerCase() ? "on" : "") + '"></button>'; }).join("") +
      '</div><div class="nv-wc-foot" style="margin-top:8px"><button type="button" data-wcb="" >Shop colors</button><button type="button" data-wcb="reset">Reset to theme</button></div>' +
      '<div class="nv-wc-h">Live wallpapers</div><div class="nv-wc-grid" id="nv-wc-walls">' +
      walls.map(function (w) {
        var on = (w.id === curWall) || (w.id === "none" && !curWall);
        var owned = wallOwned(w.id);
        return '<div class="nv-wc-wall' + (on ? " on" : "") + '" data-wcw="' + escAttr(w.id) + '" data-own="' + (owned ? 1 : 0) + '"><i class="nv-wc-prev nv-wall-' + escAttr(w.id) + '"></i><span>' + escAttr(w.n) + '</span>' + (w.live ? '<em>LIVE</em>' : "") + '</div>';
      }).join("") +
      '</div><div class="nv-wc-foot"><button type="button" data-wcw="native">Use native WC wallpaper</button><button type="button" class="pri" data-wcclose>Done</button></div></div>';
    d.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-wcb]");
      if (b) {
        var v = b.getAttribute("data-wcb");
        try {
          if (v === "reset") localStorage.removeItem("nova_wc_bubble");
          else if (v === "") { localStorage.removeItem("nova_wc_bubble"); try { window.NovaShop && window.NovaShop.open && window.NovaShop.open("bubbles"); } catch (x) {} }
          else localStorage.setItem("nova_wc_bubble", v);
        } catch (x) {}
        paintChatCosmetics(d);
        try { window.NovaKit && NovaKit.toast && NovaKit.toast(v === "reset" || v === "" ? "Bubble color reset" : "Bubble color applied"); } catch (x) {}
        el.remove(); setTimeout(function () { wcPanel(d); }, 60);
        return;
      }
      var w = e.target.closest("[data-wcw]");
      if (w) {
        var id = w.getAttribute("data-wcw");
        if (id === "native") {
          try { window.NovaShop && window.NovaShop.applyWall && window.NovaShop.applyWall("none"); } catch (x) {}
          localStorage.removeItem("nova_wc_bubble");
          paintChatCosmetics(d); el.remove();
          try { window.NovaKit && NovaKit.toast("Native World Chatter wallpaper restored"); } catch (x) {}
          return;
        }
        if (w.getAttribute("data-own") !== "1") {
          try { window.NovaKit && NovaKit.toast("Unlock this wallpaper in the XP Shop", "error"); window.NovaShop && window.NovaShop.open && window.NovaShop.open("walls"); } catch (x) {}
          return;
        }
        try { window.NovaShop && window.NovaShop.applyWall && window.NovaShop.applyWall(id); } catch (x) {}
        paintChatCosmetics(d); el.remove(); setTimeout(function () { wcPanel(d); }, 60);
        return;
      }
      if (e.target.closest("[data-wcclose]") || e.target === el) el.remove();
    });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") el.remove(); });
  }
  function escAttr(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function styleChat() {
    var frames = document.querySelectorAll("iframe"), ifr = null, i;
    for (i = 0; i < frames.length; i++) {
      try {
        var cd = frames[i].contentDocument;
        if (cd && cd.querySelector(".chat-page")) { ifr = frames[i]; break; }
      } catch (e) {}
    }
    if (!ifr) return;
    try {
      var d = ifr.contentDocument;
      if (!d.getElementById("nova-chat-css")) {
        var st = d.createElement("style");
        st.id = "nova-chat-css";
        st.textContent = CHAT_CSS + "\n" + WC_WALL_CSS;
        d.head.appendChild(st);
      }
      var badge = d.querySelector(".chat-logo-badge");
      if (badge && !badge.getAttribute("data-nova-logo")) {
        badge.innerHTML = logoMark("wc");
        badge.setAttribute("data-nova-logo", "1");
      }
      paintChatCosmetics(d);
    } catch (e) {}
  }
  window.novaStyleChat = styleChat;
  

  function setFavicon() {
    try {
      var href = "data:image/svg+xml," + encodeURIComponent(logoMark("favicon"));
      var links = document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]');
      for (var i = 0; i < links.length; i++) links[i].parentNode.removeChild(links[i]);
      var l = document.createElement("link");
      l.rel = "icon"; l.type = "image/svg+xml"; l.href = href;
      document.head.appendChild(l);
    } catch (e) {}
  }

  function refreshLogos() {
    var els = document.querySelectorAll(".dx-logo");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.querySelector(".dx-logo-svg")) el.innerHTML = logoMark("lg" + i);
    }
    var old = document.querySelectorAll(".dx-logo[data-dxl]");
    for (var j = 0; j < old.length; j++) old[j].removeAttribute("data-dxl");
    try { window.dxLogoHydrate && window.dxLogoHydrate(); } catch (e) {}
  }

  function squareTopbar() {
    var els = document.querySelectorAll(".mobile-topbar .icobtn,.mobile-topbar .tb-avatar,.mobile-topbar .vty-tb-group,.mobile-topbar .tb-search,.mobile-topbar .tb-search-go,.tb-burger");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute("data-nv-sq")) continue;
      el.style.setProperty("border-radius", "2px", "important");
      el.setAttribute("data-nv-sq", "1");
    }
  }

  /* ---------- render hooks ---------- */
  function afterRender() {
    injectDrawerEntry();
    injectAccountRow();
    fixBnav();
    swapIcons();
    swapEmoji();
    swapEmojiLeaves();
    cleanupStrays();
    polishBits();
    polishShop();
    polishDiscover();
    polishAdmin();
    polishProfile();
    replaceAvatars();
    refreshLogos();
    squareTopbar();
    try {
      var hooks = window.NovaHooks || [];
      for (var h = 0; h < hooks.length; h++) { try { hooks[h](); } catch (e) {} }
    } catch (e) {}
  }

  window.NovaHooks = window.NovaHooks || [];
  window.NovaKit = {
    svg: svg, icon: svg, portrait: portrait, logo: logoMark, icons: ICONS,
    toast: function (m, t) { try { if (typeof window.toast === "function") return window.toast(m, t); } catch (e) {} },
    openAuth: openAuth, closeAuth: closeAuth, user: currentUser,
    theme: function () { return S; }
  };

  /* ---------- scenery is now the avatar system app-wide ---------- */
  var SCENE_LABEL = {
    planet: "Ringed Planet", sun: "Rising Sun", moon: "Crescent Moon", mountains: "Mountain Range",
    river: "River Valley", forest: "Deep Forest", desert: "Golden Desert", aurora: "Aurora Sky",
    ocean: "Ocean Horizon", volcano: "Volcano", galaxy: "Spiral Galaxy", island: "Tropical Island",
    waterfall: "Waterfall", lake: "Calm Lake", canyon: "Canyon Layers", comet: "Comet Trail",
    sakura: "Sakura Night", tundra: "Frozen Tundra", meadow: "Flower Meadow", nebula: "Nebula Cloud"
  };
  try {
    window.AVATAR_PRESETS = SCENES.slice();
    window.pickAvatarFor = function () { return SCENES[Math.floor(Math.random() * SCENES.length)] || SCENES[0]; };
  } catch (e) {}
  

  /* ---------- Profile Studio (edit profile 2.0) ---------- */
  var epTab = "scenes", epDraft = null;
  function epEscape(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function epLevel() {
    try { var u = currentUser(); var l = window.getLevelData(u.xp || 0); return l && l.currentLvl ? l.currentLvl : 1; } catch (e) { return 1; }
  }
  function epXp() {
    try { var u = currentUser(); return typeof window.fmt === "function" ? fmt(u.xp || 0) : String(u.xp || 0); } catch (e) { return "0"; }
  }
  function epSceneOpts() {
    return SCENE_TYPES.map(function (t, i) { return '<option value="' + t + '">' + (SCENE_LABEL[t] || t) + "</option>"; }).join("");
  }
  function epSceneGrid() {
    return SCENES.map(function (uri, i) {
      var t = SCENE_KINDS[i] || SCENE_TYPES[i] || "scene";
      return '<button type="button" class="nvep-sc" data-epscene="' + i + '" title="' + epEscape(SCENE_LABEL[t] || t) + '"><img src="' + uri + '" alt=""><span>' + epEscape(SCENE_LABEL[t] || "Scene") + "</span></button>";
    }).join("");
  }
  window.openEditProfile = function () {
    var MY = currentUser();
    if (!MY) { try { openAuth("signup"); } catch (e) {} return; }
    var old = document.getElementById("epx");
    if (old) old.remove();
    epTab = "scenes"; epDraft = null; window._pfAv = null;
    var prev = MY.avatar || SCENES[0];
    var el = document.createElement("div");
    el.id = "epx";
    el.innerHTML =
      '<div class="epx-back" data-epclose></div>' +
      '<div class="epx-sheet nvep">' +
        '<div class="nvep-cover">' +
          '<button class="epx-x" type="button" data-epclose aria-label="Close">✕</button>' +
          '<div class="nvep-k">PROFILE STUDIO</div>' +
          '<h2>Make it unmistakably yours</h2>' +
          '<p>Landscapes, planets, rivers — or build a scene of your own.</p>' +
        '</div>' +
        '<div class="nvep-body">' +
          '<div class="nvep-hero">' +
            '<img id="pf-av-prev" src="' + epEscape(prev) + '" alt="Avatar preview">' +
            '<div class="nvep-hero-tx"><b>' + epEscape(MY.name || "You") + '</b><span><i>Lv ' + epLevel() + '</i><i>⚡ ' + epXp() + ' XP</i><i>' + epEscape(MY.uid || "") + '</i></span></div>' +
            '<label class="nvep-up" title="Upload a photo">' + svg("camera") + '<small>Upload</small><input type="file" accept="image/*" hidden onchange="pickUploadAv(this)"></label>' +
          '</div>' +
          '<div class="nvep-tabs">' +
            '<button type="button" class="on" data-ept="scenes">' + svg("image") + 'Scenery</button>' +
            '<button type="button" data-ept="studio">' + svg("palette") + 'Studio</button>' +
            '<button type="button" data-ept="details">' + svg("user") + 'Details</button>' +
          '</div>' +
          '<div class="nvep-pane" data-pane="scenes">' +
            '<div class="nvep-scenes" id="nvep-scenes">' + epSceneGrid() + '</div>' +
            '<div class="nvep-row"><button type="button" class="nvep-surprise" id="nvep-surprise">' + svg("sparkles") + 'Surprise me</button><span>Tap any scene to select it — then Save.</span></div>' +
          '</div>' +
          '<div class="nvep-pane" data-pane="studio" hidden>' +
            '<div class="nvep-studio">' +
              '<div class="nvep-studio-form">' +
                '<label>Scene type<select id="nvep-type">' + epSceneOpts() + '</select></label>' +
                '<label>Sky top<input id="nvep-sky1" type="color" value="#0B1026"></label>' +
                '<label>Sky bottom<input id="nvep-sky2" type="color" value="#1E1B4B"></label>' +
                '<label>Accent<input id="nvep-accent" type="color" value="#A78BFA"></label>' +
                '<button type="button" class="nvep-use" id="nvep-use">Use this scene</button>' +
              '</div>' +
              '<div class="nvep-stage"><img id="nvep-preview" alt="Custom scene preview"></div>' +
            '</div>' +
            '<p class="nvep-hint">Mix sky colors and an accent — every combination becomes a unique avatar.</p>' +
          '</div>' +
          '<div class="nvep-pane" data-pane="details" hidden>' +
            '<div class="nvep-sec"><div class="nvep-h">' + svg("user") + 'Identity</div>' +
              '<div class="nvep-grid2">' +
                '<label>Display name<input id="pf-name" maxlength="20" value="' + epEscape(MY.name || "") + '"></label>' +
                '<label>Gender<select id="pf-gender"><option value="">Select</option><option value="Male"' + (MY.gender === "Male" ? " selected" : "") + '>Male</option><option value="Female"' + (MY.gender === "Female" ? " selected" : "") + '>Female</option><option value="Other"' + (MY.gender === "Other" ? " selected" : "") + '>Other</option><option value="Prefer not to say"' + (MY.gender === "Prefer not to say" ? " selected" : "") + '>Prefer not to say</option></select></label>' +
                '<label>Date of birth<input id="pf-dob" type="date" value="' + epEscape(MY.dob || "") + '"></label>' +
                '<label>Phone<input id="pf-phone" value="' + epEscape(MY.phone || "") + '"></label>' +
              '</div>' +
            '</div>' +
            '<div class="nvep-sec"><div class="nvep-h">' + svg("compass") + 'Location</div>' +
              '<div class="nvep-grid2"><label>Country<input id="pf-country" value="' + epEscape(MY.country || "") + '"></label><label>City<input id="pf-city" value="' + epEscape(MY.city || "") + '"></label></div>' +
            '</div>' +
            '<div class="nvep-sec"><div class="nvep-h">' + svg("pencil") + 'About you</div><textarea id="pf-bio" maxlength="160" rows="3" placeholder="Write a short bio…">' + epEscape(MY.bio || "") + '</textarea><div class="nvep-count"><span id="nvep-bio-n">0</span>/160</div></div>' +
            '<div class="nvep-links"><button type="button" data-eplink="walls">' + svg("grid") + 'Wallpapers</button><button type="button" data-eplink="banners">' + svg("image") + 'Banners</button><button type="button" data-eplink="bubbles">' + svg("message-square") + 'Chat bubbles</button></div>' +
          '</div>' +
          '<div class="nvep-foot"><button type="button" class="ghost" data-epclose>Cancel</button><button type="button" class="pri" id="nvep-save">Save profile</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("in"); });
    document.documentElement.style.overflow = "hidden";

    var prevEl = el.querySelector("#pf-av-prev");
    var bio = el.querySelector("#pf-bio");
    var bioN = el.querySelector("#nvep-bio-n");
    function countBio() { if (bio && bioN) bioN.textContent = String((bio.value || "").length); }
    countBio();
    if (bio) bio.addEventListener("input", countBio);

    function pick(uri) {
      window._pfAv = uri;
      if (prevEl) prevEl.src = uri;
      var all = el.querySelectorAll(".nvep-sc");
      for (var i = 0; i < all.length; i++) all[i].classList.remove("on");
    }
    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-epclose]")) { closeEditProfile(); return; }
      var tab = e.target.closest("[data-ept]");
      if (tab) {
        epTab = tab.getAttribute("data-ept");
        var tabs = el.querySelectorAll("[data-ept]");
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i] === tab);
        var panes = el.querySelectorAll("[data-pane]");
        for (var j = 0; j < panes.length; j++) panes[j].hidden = panes[j].getAttribute("data-pane") !== epTab;
        return;
      }
      var sc = e.target.closest("[data-epscene]");
      if (sc) {
        pick(SCENES[Number(sc.getAttribute("data-epscene"))] || SCENES[0]);
        var all = el.querySelectorAll(".nvep-sc");
        for (var k = 0; k < all.length; k++) all[k].classList.toggle("on", all[k] === sc);
        return;
      }
      if (e.target.closest("#nvep-surprise")) {
        pick(SCENES[Math.floor(Math.random() * SCENES.length)]);
        try { toast("Surprise scene selected"); } catch (x) {}
        return;
      }
      if (e.target.closest("#nvep-use")) { pick(epDraft || studioPreview()); return; }
      var lk = e.target.closest("[data-eplink]");
      if (lk) {
        var cat = lk.getAttribute("data-eplink");
        try { window.NovaShop && window.NovaShop.open && window.NovaShop.open(cat); } catch (x) {}
        return;
      }
      if (e.target.closest("#nvep-save")) { saveStudio(); }
    });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") closeEditProfile(); });

    var typeEl = el.querySelector("#nvep-type");
    var sky1 = el.querySelector("#nvep-sky1");
    var sky2 = el.querySelector("#nvep-sky2");
    var acc = el.querySelector("#nvep-accent");
    var pv = el.querySelector("#nvep-preview");
    function studioPreview() {
      epDraft = scenery({ seed: "studio-preview", type: typeEl.value, sky1: sky1.value, sky2: sky2.value, accent: acc.value });
      if (pv) pv.src = epDraft;
      return epDraft;
    }
    function saveStudio() {
      var nameEl = el.querySelector("#pf-name");
      if (!nameEl || nameEl.value.trim().length < 2) { try { toast("Name too short", "error"); } catch (x) {} return; }
      Promise.resolve().then(function () {
        if (!window._pfAv) { var me = currentUser(); window._pfAv = (me && me.avatar) || SCENES[0]; }
        return window.saveProfile();
      }).then(function () {
        try { toast("Profile saved", "success"); } catch (x) {}
        closeEditProfile();
        setTimeout(function () { try { render(); } catch (x) {} }, 120);
      }).catch(function () { try { toast("Save failed", "error"); } catch (x) {} });
    }
    if (typeEl) {
      studioPreview();
      [typeEl, sky1, sky2, acc].forEach(function (inp) { if (inp) inp.addEventListener("input", studioPreview); });
    }
  };

  function hook() {
    try {
      if (typeof window.onRender === "function") window.onRender(afterRender);
    } catch (e) {}
    // fallback for shells rebuilt outside renderNow
    try {
      var app = document.getElementById("app");
      if (app && window.MutationObserver) {
        var t = null;
        new MutationObserver(function () { clearTimeout(t); t = setTimeout(afterRender, 60); }).observe(app, { childList: true, subtree: false });
      }
    } catch (e) {}
  }

  // wrap lucide so every icon render is auto-upgraded
  try {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      var orig = window.lucide.createIcons;
      window.lucide.createIcons = function () {
        var out = orig.apply(this, arguments);
        try { swapIcons(); } catch (e) {}
        return out;
      };
    }
  } catch (e) {}

  /* ---------- boot ---------- */
  apply();
  setFavicon();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(); buildSheet(); paint(); afterRender(); });
  } else {
    apply(); buildSheet(); paint(); afterRender();
  }
  hook();
  setTimeout(function () { apply(); injectDrawerEntry(); injectAccountRow(); fixBnav(); swapEmoji(); swapIcons(); replaceAvatars(); }, 1200);
  setTimeout(function () { refreshLogos(); replaceAvatars(); polishShop(); }, 400);
  setInterval(function () {
    if (document.hidden) return; /* skip DOM sweeps in background tabs */
    try {
      replaceAvatars(); fixBnav(); styleChat(); squareTopbar();
      var hooks = window.NovaHooks || [];
      for (var h = 0; h < hooks.length; h++) { try { hooks[h](); } catch (e) {} }
    } catch (e) {}
  }, 1800);
})();

