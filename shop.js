/* ============================================================
   DOXILO NOVA — XP Shop 2.0, My Collection, profile cosmetics
   ============================================================ */
(function () {
  "use strict";
  var K = window.NovaKit || {};
  var svg = K.icon || function () { return ""; };
  var portrait = K.portrait || function () { return ""; };
  var logo = K.logo || function () { return ""; };
  var user = K.user || function () { return null; };
  var LS = "nova_cos_v1";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function strip(s) { s = String(s || ""); try { s = s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ""); } catch (e) {} return s.replace(/\s+/g, " ").trim(); }
  function fmtN(n) { try { if (typeof fmt === "function") return fmt(n); } catch (e) {} return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function toastMsg(m, t) {
    try { if (typeof window.toast === "function") { window.toast(m, t); return; } } catch (e) {}
    var el = document.getElementById("nvx-toast");
    if (!el) { el = document.createElement("div"); el.id = "nvx-toast"; document.body.appendChild(el); }
    el.textContent = m; el.className = "on " + (t === "error" ? "err" : ""); clearTimeout(el._t);
    el._t = setTimeout(function () { el.className = ""; }, 2400);
  }
  function dbRef(path) { try { return typeof db !== "undefined" && db ? db.ref(path) : null; } catch (e) { return null; } }
  function appShop() { try { if (typeof SHOP !== "undefined") return SHOP; } catch (e) {} return window.SHOP || null; }
  function fxMap() { try { if (typeof FX_MAP !== "undefined") return FX_MAP; } catch (e) {} return {}; }
  function avatars() { try { if (typeof AVATAR_PRESETS !== "undefined") return AVATAR_PRESETS; } catch (e) {} return []; }

  var CUSTOM = {
    banners: [
      { id: "aurora", n: "Aurora Veil", p: 800, c1: "#0EA5E9", c2: "#7C3AED" },
      { id: "ember", n: "Ember Dusk", p: 800, c1: "#F97316", c2: "#9F1239" },
      { id: "cyber", n: "Cyber Grid", p: 1000, c1: "#22D3EE", c2: "#4F46E5" },
      { id: "emerald", n: "Emerald Pulse", p: 900, c1: "#34D399", c2: "#065F46" },
      { id: "royal", n: "Royal Velvet", p: 1200, c1: "#7C3AED", c2: "#312E81" },
      { id: "holo", n: "Hologram", p: 1500, c1: "#F472B6", c2: "#22D3EE" },
      { id: "mono", n: "Monochrome", p: 600, c1: "#94A3B8", c2: "#0F172A" },
      { id: "supernova", n: "Supernova", p: 1800, c1: "#FDE047", c2: "#BE123C" },
      { id: "midnight", n: "Midnight City", p: 1100, c1: "#0B1220", c2: "#2563EB" },
      { id: "sakura", n: "Sakura Bloom", p: 1000, c1: "#F9A8D4", c2: "#9D174D" },
      { id: "deepsea", n: "Deep Sea", p: 1200, c1: "#0EA5E9", c2: "#082F49" },
      { id: "lava", n: "Lava Core", p: 1400, c1: "#F97316", c2: "#7C2D12" },
      { id: "forest", n: "Forest Canopy", p: 1000, c1: "#15803D", c2: "#052E16" },
      { id: "cosmos", n: "Cosmos", p: 1600, c1: "#1E1B4B", c2: "#C084FC" },
      { id: "goldrush", n: "Gold Rush", p: 1300, c1: "#FDE047", c2: "#78350F" },
      { id: "arctic", n: "Arctic Light", p: 1200, c1: "#E0F2FE", c2: "#0369A1" },
      { id: "b-nebula-drift", n: "Nebula Drift", p: 420, c1: "#F43F5E", c2: "#881337" },
      { id: "b-nebula-dawn", n: "Nebula Dawn", p: 520, c1: "#FB7185", c2: "#9F1239" },
      { id: "b-nebula-dusk", n: "Nebula Dusk", p: 640, c1: "#F97316", c2: "#9A3412" },
      { id: "b-nebula-storm", n: "Nebula Storm", p: 760, c1: "#FBBF24", c2: "#92400E" },
      { id: "b-nebula-veil", n: "Nebula Veil", p: 900, c1: "#FDE047", c2: "#854D0E" },
      { id: "b-nebula-bloom", n: "Nebula Bloom", p: 1100, c1: "#A3E635", c2: "#3F6212" },
      { id: "b-nebula-pulse", n: "Nebula Pulse", p: 1300, c1: "#34D399", c2: "#065F46" },
      { id: "b-nebula-cascade", n: "Nebula Cascade", p: 1600, c1: "#10B981", c2: "#064E3B" },
      { id: "b-nebula-horizon", n: "Nebula Horizon", p: 2000, c1: "#2DD4BF", c2: "#115E59" },
      { id: "b-nebula-mirage", n: "Nebula Mirage", p: 2600, c1: "#22D3EE", c2: "#155E75" },
      { id: "b-prism-drift", n: "Prism Drift", p: 3200, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "b-prism-dawn", n: "Prism Dawn", p: 4200, c1: "#0EA5E9", c2: "#082F49" },
      { id: "b-prism-dusk", n: "Prism Dusk", p: 420, c1: "#818CF8", c2: "#3730A3" },
      { id: "b-prism-storm", n: "Prism Storm", p: 520, c1: "#6366F1", c2: "#312E81" },
      { id: "b-prism-veil", n: "Prism Veil", p: 640, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "b-prism-bloom", n: "Prism Bloom", p: 760, c1: "#A855F7", c2: "#581C87" },
      { id: "b-prism-pulse", n: "Prism Pulse", p: 900, c1: "#C084FC", c2: "#6B21A8" },
      { id: "b-prism-cascade", n: "Prism Cascade", p: 1100, c1: "#E879F9", c2: "#86198F" },
      { id: "b-prism-horizon", n: "Prism Horizon", p: 1300, c1: "#F472B6", c2: "#9D174D" },
      { id: "b-prism-mirage", n: "Prism Mirage", p: 1600, c1: "#FB923C", c2: "#7C2D12" },
      { id: "b-solar-drift", n: "Solar Drift", p: 2000, c1: "#F43F5E", c2: "#881337" },
      { id: "b-solar-dawn", n: "Solar Dawn", p: 2600, c1: "#FB7185", c2: "#9F1239" },
      { id: "b-solar-dusk", n: "Solar Dusk", p: 3200, c1: "#F97316", c2: "#9A3412" },
      { id: "b-solar-storm", n: "Solar Storm", p: 4200, c1: "#FBBF24", c2: "#92400E" },
      { id: "b-solar-veil", n: "Solar Veil", p: 420, c1: "#FDE047", c2: "#854D0E" },
      { id: "b-solar-bloom", n: "Solar Bloom", p: 520, c1: "#A3E635", c2: "#3F6212" },
      { id: "b-solar-pulse", n: "Solar Pulse", p: 640, c1: "#34D399", c2: "#065F46" },
      { id: "b-solar-cascade", n: "Solar Cascade", p: 760, c1: "#10B981", c2: "#064E3B" },
      { id: "b-solar-horizon", n: "Solar Horizon", p: 900, c1: "#2DD4BF", c2: "#115E59" },
      { id: "b-solar-mirage", n: "Solar Mirage", p: 1100, c1: "#22D3EE", c2: "#155E75" },
      { id: "b-lunar-drift", n: "Lunar Drift", p: 1300, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "b-lunar-dawn", n: "Lunar Dawn", p: 1600, c1: "#0EA5E9", c2: "#082F49" },
      { id: "b-lunar-dusk", n: "Lunar Dusk", p: 2000, c1: "#818CF8", c2: "#3730A3" },
      { id: "b-lunar-storm", n: "Lunar Storm", p: 2600, c1: "#6366F1", c2: "#312E81" },
      { id: "b-lunar-veil", n: "Lunar Veil", p: 3200, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "b-lunar-bloom", n: "Lunar Bloom", p: 4200, c1: "#A855F7", c2: "#581C87" },
      { id: "b-lunar-pulse", n: "Lunar Pulse", p: 420, c1: "#C084FC", c2: "#6B21A8" },
      { id: "b-lunar-cascade", n: "Lunar Cascade", p: 520, c1: "#E879F9", c2: "#86198F" },
      { id: "b-lunar-horizon", n: "Lunar Horizon", p: 640, c1: "#F472B6", c2: "#9D174D" },
      { id: "b-lunar-mirage", n: "Lunar Mirage", p: 760, c1: "#FB923C", c2: "#7C2D12" },
      { id: "b-cosmic-drift", n: "Cosmic Drift", p: 900, c1: "#F43F5E", c2: "#881337" },
      { id: "b-cosmic-dawn", n: "Cosmic Dawn", p: 1100, c1: "#FB7185", c2: "#9F1239" },
      { id: "b-cosmic-dusk", n: "Cosmic Dusk", p: 1300, c1: "#F97316", c2: "#9A3412" },
      { id: "b-cosmic-storm", n: "Cosmic Storm", p: 1600, c1: "#FBBF24", c2: "#92400E" },
      { id: "b-cosmic-veil", n: "Cosmic Veil", p: 2000, c1: "#FDE047", c2: "#854D0E" },
      { id: "b-cosmic-bloom", n: "Cosmic Bloom", p: 2600, c1: "#A3E635", c2: "#3F6212" },
      { id: "b-cosmic-pulse", n: "Cosmic Pulse", p: 3200, c1: "#34D399", c2: "#065F46" },
      { id: "b-cosmic-cascade", n: "Cosmic Cascade", p: 4200, c1: "#10B981", c2: "#064E3B" },
      { id: "b-cosmic-horizon", n: "Cosmic Horizon", p: 420, c1: "#2DD4BF", c2: "#115E59" },
      { id: "b-cosmic-mirage", n: "Cosmic Mirage", p: 520, c1: "#22D3EE", c2: "#155E75" },
      { id: "b-crystal-drift", n: "Crystal Drift", p: 640, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "b-crystal-dawn", n: "Crystal Dawn", p: 760, c1: "#0EA5E9", c2: "#082F49" },
      { id: "b-crystal-dusk", n: "Crystal Dusk", p: 900, c1: "#818CF8", c2: "#3730A3" },
      { id: "b-crystal-storm", n: "Crystal Storm", p: 1100, c1: "#6366F1", c2: "#312E81" },
      { id: "b-crystal-veil", n: "Crystal Veil", p: 1300, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "b-crystal-bloom", n: "Crystal Bloom", p: 1600, c1: "#A855F7", c2: "#581C87" },
      { id: "b-crystal-pulse", n: "Crystal Pulse", p: 2000, c1: "#C084FC", c2: "#6B21A8" },
      { id: "b-crystal-cascade", n: "Crystal Cascade", p: 2600, c1: "#E879F9", c2: "#86198F" },
      { id: "b-crystal-horizon", n: "Crystal Horizon", p: 3200, c1: "#F472B6", c2: "#9D174D" },
      { id: "b-crystal-mirage", n: "Crystal Mirage", p: 4200, c1: "#FB923C", c2: "#7C2D12" },
      { id: "b-phantom-drift", n: "Phantom Drift", p: 420, c1: "#F43F5E", c2: "#881337" },
      { id: "b-phantom-dawn", n: "Phantom Dawn", p: 520, c1: "#FB7185", c2: "#9F1239" },
      { id: "b-phantom-dusk", n: "Phantom Dusk", p: 640, c1: "#F97316", c2: "#9A3412" },
      { id: "b-phantom-storm", n: "Phantom Storm", p: 760, c1: "#FBBF24", c2: "#92400E" },
      { id: "b-phantom-veil", n: "Phantom Veil", p: 900, c1: "#FDE047", c2: "#854D0E" },
      { id: "b-phantom-bloom", n: "Phantom Bloom", p: 1100, c1: "#A3E635", c2: "#3F6212" },
      { id: "b-phantom-pulse", n: "Phantom Pulse", p: 1300, c1: "#34D399", c2: "#065F46" },
      { id: "b-phantom-cascade", n: "Phantom Cascade", p: 1600, c1: "#10B981", c2: "#064E3B" },
      { id: "b-phantom-horizon", n: "Phantom Horizon", p: 2000, c1: "#2DD4BF", c2: "#115E59" },
      { id: "b-phantom-mirage", n: "Phantom Mirage", p: 2600, c1: "#22D3EE", c2: "#155E75" },
      { id: "b-titan-drift", n: "Titan Drift", p: 3200, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "b-titan-dawn", n: "Titan Dawn", p: 4200, c1: "#0EA5E9", c2: "#082F49" },
      { id: "b-titan-dusk", n: "Titan Dusk", p: 420, c1: "#818CF8", c2: "#3730A3" },
      { id: "b-titan-storm", n: "Titan Storm", p: 520, c1: "#6366F1", c2: "#312E81" },
      { id: "b-titan-veil", n: "Titan Veil", p: 640, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "b-titan-bloom", n: "Titan Bloom", p: 760, c1: "#A855F7", c2: "#581C87" },
      { id: "b-titan-pulse", n: "Titan Pulse", p: 900, c1: "#C084FC", c2: "#6B21A8" },
      { id: "b-titan-cascade", n: "Titan Cascade", p: 1100, c1: "#E879F9", c2: "#86198F" },
      { id: "b-titan-horizon", n: "Titan Horizon", p: 1300, c1: "#F472B6", c2: "#9D174D" },
      { id: "b-titan-mirage", n: "Titan Mirage", p: 1600, c1: "#FB923C", c2: "#7C2D12" },
      { id: "b-zenith-drift", n: "Zenith Drift", p: 2000, c1: "#F43F5E", c2: "#881337" },
      { id: "b-zenith-dawn", n: "Zenith Dawn", p: 2600, c1: "#FB7185", c2: "#9F1239" },
      { id: "b-zenith-dusk", n: "Zenith Dusk", p: 3200, c1: "#F97316", c2: "#9A3412" },
      { id: "b-zenith-storm", n: "Zenith Storm", p: 4200, c1: "#FBBF24", c2: "#92400E" },
      { id: "b-zenith-veil", n: "Zenith Veil", p: 420, c1: "#FDE047", c2: "#854D0E" },
      { id: "b-zenith-bloom", n: "Zenith Bloom", p: 520, c1: "#A3E635", c2: "#3F6212" },
      { id: "b-zenith-pulse", n: "Zenith Pulse", p: 640, c1: "#34D399", c2: "#065F46" },
      { id: "b-zenith-cascade", n: "Zenith Cascade", p: 760, c1: "#10B981", c2: "#064E3B" },
      { id: "b-zenith-horizon", n: "Zenith Horizon", p: 900, c1: "#2DD4BF", c2: "#115E59" },
      { id: "b-zenith-mirage", n: "Zenith Mirage", p: 1100, c1: "#22D3EE", c2: "#155E75" },
      { id: "b-radiant-drift", n: "Radiant Drift", p: 1300, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "b-radiant-dawn", n: "Radiant Dawn", p: 1600, c1: "#0EA5E9", c2: "#082F49" },
      { id: "b-radiant-dusk", n: "Radiant Dusk", p: 2000, c1: "#818CF8", c2: "#3730A3" },
      { id: "b-radiant-storm", n: "Radiant Storm", p: 2600, c1: "#6366F1", c2: "#312E81" },
      { id: "b-radiant-veil", n: "Radiant Veil", p: 3200, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "b-radiant-bloom", n: "Radiant Bloom", p: 4200, c1: "#A855F7", c2: "#581C87" },
      { id: "b-radiant-pulse", n: "Radiant Pulse", p: 420, c1: "#C084FC", c2: "#6B21A8" },
      { id: "b-radiant-cascade", n: "Radiant Cascade", p: 520, c1: "#E879F9", c2: "#86198F" },
      { id: "b-radiant-horizon", n: "Radiant Horizon", p: 640, c1: "#F472B6", c2: "#9D174D" },
      { id: "b-radiant-mirage", n: "Radiant Mirage", p: 760, c1: "#FB923C", c2: "#7C2D12" },
    ],
    sizes: [
      { id: "standard", n: "Standard", p: 0, d: "The clean default layout." },
      { id: "wide", n: "Wide Canvas", p: 500, d: "More room for your profile cards." },
      { id: "full", n: "Full Width", p: 1100, d: "Edge-to-edge profile workspace." },
      { id: "cinema", n: "Cinema Mode", p: 1800, d: "Maximum size — the whole screen is yours." }
    ],
    walls: [
      { id: "none", n: "No Wallpaper", p: 0, d: "Clean background." },
      { id: "grid", n: "Grid Lines", p: 400 },
      { id: "dots", n: "Dot Field", p: 400 },
      { id: "aurora", n: "Aurora Wash", p: 800 },
      { id: "carbon", n: "Carbon Weave", p: 600 },
      { id: "rings", n: "Orbit Rings", p: 1000 },
      { id: "starfield", n: "Starfield", p: 1400 },
      { id: "live-aurora", n: "Live Aurora", p: 2600, live: true, d: "Drifting polar lights." },
      { id: "live-stars", n: "Shooting Stars", p: 2200, live: true, d: "Endless slow star drift." },
      { id: "live-waves", n: "Ocean Waves", p: 2400, live: true, d: "Rolling deep-sea waves." },
      { id: "live-neon", n: "Neon Grid", p: 2600, live: true, d: "Endless synthwave grid." },
      { id: "live-sunset", n: "Sunset Ridge", p: 2000, live: true, d: "Slow golden hour shift." },
      { id: "live-galaxy", n: "Galaxy Orbit", p: 3200, live: true, d: "Nebula clouds in orbit." },
      { id: "live-rain", n: "Neon Rain", p: 2400, live: true, d: "Falling cyber rain." },
      { id: "live-fireflies", n: "Fireflies", p: 2200, live: true, d: "Warm floating lights." },
      { id: "live-snow", n: "Snowfall", p: 2000, live: true, d: "Quiet alpine snowfall." },
      { id: "live-lava", n: "Lava Flow", p: 2800, live: true, d: "Molten glow pulses." },
      { id: "live-bubbles", n: "Bubble Drift", p: 1800, live: true, d: "Soft rising bubbles." },
      { id: "w-grid-studio", n: "Grid Studio", p: 420, c1: "#10B981", c2: "#064E3B" },
      { id: "w-grid-loft", n: "Grid Loft", p: 520, c1: "#2DD4BF", c2: "#115E59" },
      { id: "w-grid-arena", n: "Grid Arena", p: 640, c1: "#22D3EE", c2: "#155E75" },
      { id: "w-grid-vault", n: "Grid Vault", p: 760, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "w-grid-haven", n: "Grid Haven", p: 900, c1: "#0EA5E9", c2: "#082F49" },
      { id: "w-grid-deck", n: "Grid Deck", p: 1100, c1: "#818CF8", c2: "#3730A3" },
      { id: "w-grid-suite", n: "Grid Suite", p: 1300, c1: "#6366F1", c2: "#312E81" },
      { id: "w-grid-lounge", n: "Grid Lounge", p: 1600, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "w-grid-corner", n: "Grid Corner", p: 2000, c1: "#A855F7", c2: "#581C87" },
      { id: "w-grid-nest", n: "Grid Nest", p: 2600, c1: "#C084FC", c2: "#6B21A8" },
      { id: "w-mesh-studio", n: "Mesh Studio", p: 3200, c1: "#E879F9", c2: "#86198F" },
      { id: "w-mesh-loft", n: "Mesh Loft", p: 4200, c1: "#F472B6", c2: "#9D174D" },
      { id: "w-mesh-arena", n: "Mesh Arena", p: 420, c1: "#FB923C", c2: "#7C2D12" },
      { id: "w-mesh-vault", n: "Mesh Vault", p: 520, c1: "#F43F5E", c2: "#881337" },
      { id: "w-mesh-haven", n: "Mesh Haven", p: 640, c1: "#FB7185", c2: "#9F1239" },
      { id: "w-mesh-deck", n: "Mesh Deck", p: 760, c1: "#F97316", c2: "#9A3412" },
      { id: "w-mesh-suite", n: "Mesh Suite", p: 900, c1: "#FBBF24", c2: "#92400E" },
      { id: "w-mesh-lounge", n: "Mesh Lounge", p: 1100, c1: "#FDE047", c2: "#854D0E" },
      { id: "w-mesh-corner", n: "Mesh Corner", p: 1300, c1: "#A3E635", c2: "#3F6212" },
      { id: "w-mesh-nest", n: "Mesh Nest", p: 1600, c1: "#34D399", c2: "#065F46" },
      { id: "w-fade-studio", n: "Fade Studio", p: 2000, c1: "#10B981", c2: "#064E3B" },
      { id: "w-fade-loft", n: "Fade Loft", p: 2600, c1: "#2DD4BF", c2: "#115E59" },
      { id: "w-fade-arena", n: "Fade Arena", p: 3200, c1: "#22D3EE", c2: "#155E75" },
      { id: "w-fade-vault", n: "Fade Vault", p: 4200, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "w-fade-haven", n: "Fade Haven", p: 420, c1: "#0EA5E9", c2: "#082F49" },
      { id: "w-fade-deck", n: "Fade Deck", p: 520, c1: "#818CF8", c2: "#3730A3" },
      { id: "w-fade-suite", n: "Fade Suite", p: 640, c1: "#6366F1", c2: "#312E81" },
      { id: "w-fade-lounge", n: "Fade Lounge", p: 760, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "w-fade-corner", n: "Fade Corner", p: 900, c1: "#A855F7", c2: "#581C87" },
      { id: "w-fade-nest", n: "Fade Nest", p: 1100, c1: "#C084FC", c2: "#6B21A8" },
      { id: "w-field-studio", n: "Field Studio", p: 1300, c1: "#E879F9", c2: "#86198F" },
      { id: "w-field-loft", n: "Field Loft", p: 1600, c1: "#F472B6", c2: "#9D174D" },
      { id: "w-field-arena", n: "Field Arena", p: 2000, c1: "#FB923C", c2: "#7C2D12" },
      { id: "w-field-vault", n: "Field Vault", p: 2600, c1: "#F43F5E", c2: "#881337" },
      { id: "w-field-haven", n: "Field Haven", p: 3200, c1: "#FB7185", c2: "#9F1239" },
      { id: "w-field-deck", n: "Field Deck", p: 4200, c1: "#F97316", c2: "#9A3412" },
      { id: "w-field-suite", n: "Field Suite", p: 420, c1: "#FBBF24", c2: "#92400E" },
      { id: "w-field-lounge", n: "Field Lounge", p: 520, c1: "#FDE047", c2: "#854D0E" },
      { id: "w-field-corner", n: "Field Corner", p: 640, c1: "#A3E635", c2: "#3F6212" },
      { id: "w-field-nest", n: "Field Nest", p: 760, c1: "#34D399", c2: "#065F46" },
      { id: "w-wave-studio", n: "Wave Studio", p: 900, c1: "#10B981", c2: "#064E3B" },
      { id: "w-wave-loft", n: "Wave Loft", p: 1100, c1: "#2DD4BF", c2: "#115E59" },
      { id: "w-wave-arena", n: "Wave Arena", p: 1300, c1: "#22D3EE", c2: "#155E75" },
      { id: "w-wave-vault", n: "Wave Vault", p: 1600, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "w-wave-haven", n: "Wave Haven", p: 2000, c1: "#0EA5E9", c2: "#082F49" },
      { id: "w-wave-deck", n: "Wave Deck", p: 2600, c1: "#818CF8", c2: "#3730A3" },
      { id: "w-wave-suite", n: "Wave Suite", p: 3200, c1: "#6366F1", c2: "#312E81" },
      { id: "w-wave-lounge", n: "Wave Lounge", p: 4200, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "w-wave-corner", n: "Wave Corner", p: 420, c1: "#A855F7", c2: "#581C87" },
      { id: "w-wave-nest", n: "Wave Nest", p: 520, c1: "#C084FC", c2: "#6B21A8" },
      { id: "w-mosaic-studio", n: "Mosaic Studio", p: 640, c1: "#E879F9", c2: "#86198F" },
      { id: "w-mosaic-loft", n: "Mosaic Loft", p: 760, c1: "#F472B6", c2: "#9D174D" },
      { id: "w-mosaic-arena", n: "Mosaic Arena", p: 900, c1: "#FB923C", c2: "#7C2D12" },
      { id: "w-mosaic-vault", n: "Mosaic Vault", p: 1100, c1: "#F43F5E", c2: "#881337" },
      { id: "w-mosaic-haven", n: "Mosaic Haven", p: 1300, c1: "#FB7185", c2: "#9F1239" },
      { id: "w-mosaic-deck", n: "Mosaic Deck", p: 1600, c1: "#F97316", c2: "#9A3412" },
      { id: "w-mosaic-suite", n: "Mosaic Suite", p: 2000, c1: "#FBBF24", c2: "#92400E" },
      { id: "w-mosaic-lounge", n: "Mosaic Lounge", p: 2600, c1: "#FDE047", c2: "#854D0E" },
      { id: "w-mosaic-corner", n: "Mosaic Corner", p: 3200, c1: "#A3E635", c2: "#3F6212" },
      { id: "w-mosaic-nest", n: "Mosaic Nest", p: 4200, c1: "#34D399", c2: "#065F46" },
      { id: "w-vector-studio", n: "Vector Studio", p: 420, c1: "#10B981", c2: "#064E3B" },
      { id: "w-vector-loft", n: "Vector Loft", p: 520, c1: "#2DD4BF", c2: "#115E59" },
      { id: "w-vector-arena", n: "Vector Arena", p: 640, c1: "#22D3EE", c2: "#155E75" },
      { id: "w-vector-vault", n: "Vector Vault", p: 760, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "w-vector-haven", n: "Vector Haven", p: 900, c1: "#0EA5E9", c2: "#082F49" },
      { id: "w-vector-deck", n: "Vector Deck", p: 1100, c1: "#818CF8", c2: "#3730A3" },
      { id: "w-vector-suite", n: "Vector Suite", p: 1300, c1: "#6366F1", c2: "#312E81" },
      { id: "w-vector-lounge", n: "Vector Lounge", p: 1600, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "w-vector-corner", n: "Vector Corner", p: 2000, c1: "#A855F7", c2: "#581C87" },
      { id: "w-vector-nest", n: "Vector Nest", p: 2600, c1: "#C084FC", c2: "#6B21A8" },
      { id: "w-static-studio", n: "Static Studio", p: 3200, c1: "#E879F9", c2: "#86198F" },
      { id: "w-static-loft", n: "Static Loft", p: 4200, c1: "#F472B6", c2: "#9D174D" },
      { id: "w-static-arena", n: "Static Arena", p: 420, c1: "#FB923C", c2: "#7C2D12" },
      { id: "w-static-vault", n: "Static Vault", p: 520, c1: "#F43F5E", c2: "#881337" },
      { id: "w-static-haven", n: "Static Haven", p: 640, c1: "#FB7185", c2: "#9F1239" },
      { id: "w-static-deck", n: "Static Deck", p: 760, c1: "#F97316", c2: "#9A3412" },
      { id: "w-static-suite", n: "Static Suite", p: 900, c1: "#FBBF24", c2: "#92400E" },
      { id: "w-static-lounge", n: "Static Lounge", p: 1100, c1: "#FDE047", c2: "#854D0E" },
      { id: "w-static-corner", n: "Static Corner", p: 1300, c1: "#A3E635", c2: "#3F6212" },
      { id: "w-static-nest", n: "Static Nest", p: 1600, c1: "#34D399", c2: "#065F46" },
      { id: "w-echo-studio", n: "Echo Studio", p: 2000, c1: "#10B981", c2: "#064E3B" },
      { id: "w-echo-loft", n: "Echo Loft", p: 2600, c1: "#2DD4BF", c2: "#115E59" },
      { id: "w-echo-arena", n: "Echo Arena", p: 3200, c1: "#22D3EE", c2: "#155E75" },
      { id: "w-echo-vault", n: "Echo Vault", p: 4200, c1: "#38BDF8", c2: "#0C4A6E" },
      { id: "w-echo-haven", n: "Echo Haven", p: 420, c1: "#0EA5E9", c2: "#082F49" },
      { id: "w-echo-deck", n: "Echo Deck", p: 520, c1: "#818CF8", c2: "#3730A3" },
      { id: "w-echo-suite", n: "Echo Suite", p: 640, c1: "#6366F1", c2: "#312E81" },
      { id: "w-echo-lounge", n: "Echo Lounge", p: 760, c1: "#A78BFA", c2: "#4C1D95" },
      { id: "w-echo-corner", n: "Echo Corner", p: 900, c1: "#A855F7", c2: "#581C87" },
      { id: "w-echo-nest", n: "Echo Nest", p: 1100, c1: "#C084FC", c2: "#6B21A8" },
      { id: "w-matrix-studio", n: "Matrix Studio", p: 1300, c1: "#E879F9", c2: "#86198F" },
      { id: "w-matrix-loft", n: "Matrix Loft", p: 1600, c1: "#F472B6", c2: "#9D174D" },
      { id: "w-matrix-arena", n: "Matrix Arena", p: 2000, c1: "#FB923C", c2: "#7C2D12" },
      { id: "w-matrix-vault", n: "Matrix Vault", p: 2600, c1: "#F43F5E", c2: "#881337" },
      { id: "w-matrix-haven", n: "Matrix Haven", p: 3200, c1: "#FB7185", c2: "#9F1239" },
      { id: "w-matrix-deck", n: "Matrix Deck", p: 4200, c1: "#F97316", c2: "#9A3412" },
      { id: "w-matrix-suite", n: "Matrix Suite", p: 420, c1: "#FBBF24", c2: "#92400E" },
      { id: "w-matrix-lounge", n: "Matrix Lounge", p: 520, c1: "#FDE047", c2: "#854D0E" },
      { id: "w-matrix-corner", n: "Matrix Corner", p: 640, c1: "#A3E635", c2: "#3F6212" },
      { id: "w-matrix-nest", n: "Matrix Nest", p: 760, c1: "#34D399", c2: "#065F46" },
    ],
    nameglow: [
      { id: "none", n: "No Glow", p: 0 },
      { id: "cyan", n: "Cyan Halo", p: 300, c: "#22D3EE" },
      { id: "violet", n: "Violet Halo", p: 300, c: "#A78BFA" },
      { id: "gold", n: "Gold Halo", p: 500, c: "#FDE047" },
      { id: "rose", n: "Rose Halo", p: 500, c: "#FB7185" },
      { id: "rainbow", n: "Prism Halo", p: 1200, c: "#A78BFA" },
      { id: "emerald", n: "Emerald Halo", p: 400, c: "#34D399" },
      { id: "sky", n: "Sky Halo", p: 400, c: "#7DD3FC" },
      { id: "amber", n: "Amber Halo", p: 500, c: "#FBBF24" },
      { id: "white", n: "White Halo", p: 700, c: "#F8FAFC" },
      { id: "g-cyan-glow", n: "Cyan Glow", p: 420, c: "#22D3EE" },
      { id: "g-violet-glow", n: "Violet Glow", p: 520, c: "#A78BFA" },
      { id: "g-gold-glow", n: "Gold Glow", p: 640, c: "#FDE047" },
      { id: "g-rose-glow", n: "Rose Glow", p: 760, c: "#FB7185" },
      { id: "g-mint-glow", n: "Mint Glow", p: 900, c: "#34D399" },
      { id: "g-aqua-glow", n: "Aqua Glow", p: 1100, c: "#F472B6" },
      { id: "g-sky-glow", n: "Sky Glow", p: 1300, c: "#38BDF8" },
      { id: "g-lilac-glow", n: "Lilac Glow", p: 1600, c: "#C084FC" },
      { id: "g-peach-glow", n: "Peach Glow", p: 2000, c: "#F97316" },
      { id: "g-lime-glow", n: "Lime Glow", p: 2600, c: "#4ADE80" },
      { id: "g-fuchsia-glow", n: "Fuchsia Glow", p: 3200, c: "#E879F9" },
      { id: "g-azure-glow", n: "Azure Glow", p: 4200, c: "#60A5FA" },
      { id: "g-amber-glow", n: "Amber Glow", p: 420, c: "#FBBF24" },
      { id: "g-teal-glow", n: "Teal Glow", p: 520, c: "#2DD4BF" },
      { id: "g-coral-glow", n: "Coral Glow", p: 640, c: "#F87171" },
      { id: "g-emerald-glow", n: "Emerald Glow", p: 760, c: "#A3E635" },
      { id: "g-indigo-glow", n: "Indigo Glow", p: 900, c: "#818CF8" },
      { id: "g-cherry-glow", n: "Cherry Glow", p: 1100, c: "#F43F5E" },
      { id: "g-ice-glow", n: "Ice Glow", p: 1300, c: "#67E8F9" },
      { id: "g-orchid-glow", n: "Orchid Glow", p: 1600, c: "#D946EF" },
      { id: "g-lemon-glow", n: "Lemon Glow", p: 2000, c: "#FACC15" },
      { id: "g-sea-glow", n: "Sea Glow", p: 2600, c: "#5EEAD4" },
      { id: "g-blue-glow", n: "Blue Glow", p: 3200, c: "#93C5FD" },
      { id: "g-pink-glow", n: "Pink Glow", p: 4200, c: "#F0ABFC" },
      { id: "g-mango-glow", n: "Mango Glow", p: 420, c: "#FDA4AF" },
      { id: "g-cyan-shimmer", n: "Cyan Shimmer", p: 520, c: "#22D3EE" },
      { id: "g-violet-shimmer", n: "Violet Shimmer", p: 640, c: "#A78BFA" },
      { id: "g-gold-shimmer", n: "Gold Shimmer", p: 760, c: "#FDE047" },
      { id: "g-rose-shimmer", n: "Rose Shimmer", p: 900, c: "#FB7185" },
      { id: "g-mint-shimmer", n: "Mint Shimmer", p: 1100, c: "#34D399" },
      { id: "g-aqua-shimmer", n: "Aqua Shimmer", p: 1300, c: "#F472B6" },
      { id: "g-sky-shimmer", n: "Sky Shimmer", p: 1600, c: "#38BDF8" },
      { id: "g-lilac-shimmer", n: "Lilac Shimmer", p: 2000, c: "#C084FC" },
      { id: "g-peach-shimmer", n: "Peach Shimmer", p: 2600, c: "#F97316" },
      { id: "g-lime-shimmer", n: "Lime Shimmer", p: 3200, c: "#4ADE80" },
      { id: "g-fuchsia-shimmer", n: "Fuchsia Shimmer", p: 4200, c: "#E879F9" },
      { id: "g-azure-shimmer", n: "Azure Shimmer", p: 420, c: "#60A5FA" },
      { id: "g-amber-shimmer", n: "Amber Shimmer", p: 520, c: "#FBBF24" },
      { id: "g-teal-shimmer", n: "Teal Shimmer", p: 640, c: "#2DD4BF" },
      { id: "g-coral-shimmer", n: "Coral Shimmer", p: 760, c: "#F87171" },
      { id: "g-emerald-shimmer", n: "Emerald Shimmer", p: 900, c: "#A3E635" },
      { id: "g-indigo-shimmer", n: "Indigo Shimmer", p: 1100, c: "#818CF8" },
      { id: "g-cherry-shimmer", n: "Cherry Shimmer", p: 1300, c: "#F43F5E" },
      { id: "g-ice-shimmer", n: "Ice Shimmer", p: 1600, c: "#67E8F9" },
      { id: "g-orchid-shimmer", n: "Orchid Shimmer", p: 2000, c: "#D946EF" },
      { id: "g-lemon-shimmer", n: "Lemon Shimmer", p: 2600, c: "#FACC15" },
      { id: "g-sea-shimmer", n: "Sea Shimmer", p: 3200, c: "#5EEAD4" },
      { id: "g-blue-shimmer", n: "Blue Shimmer", p: 4200, c: "#93C5FD" },
      { id: "g-pink-shimmer", n: "Pink Shimmer", p: 420, c: "#F0ABFC" },
      { id: "g-mango-shimmer", n: "Mango Shimmer", p: 520, c: "#FDA4AF" },
      { id: "g-cyan-aura", n: "Cyan Aura", p: 640, c: "#22D3EE" },
      { id: "g-violet-aura", n: "Violet Aura", p: 760, c: "#A78BFA" },
      { id: "g-gold-aura", n: "Gold Aura", p: 900, c: "#FDE047" },
      { id: "g-rose-aura", n: "Rose Aura", p: 1100, c: "#FB7185" },
      { id: "g-mint-aura", n: "Mint Aura", p: 1300, c: "#34D399" },
      { id: "g-aqua-aura", n: "Aqua Aura", p: 1600, c: "#F472B6" },
      { id: "g-sky-aura", n: "Sky Aura", p: 2000, c: "#38BDF8" },
      { id: "g-lilac-aura", n: "Lilac Aura", p: 2600, c: "#C084FC" },
      { id: "g-peach-aura", n: "Peach Aura", p: 3200, c: "#F97316" },
      { id: "g-lime-aura", n: "Lime Aura", p: 4200, c: "#4ADE80" },
      { id: "g-fuchsia-aura", n: "Fuchsia Aura", p: 420, c: "#E879F9" },
      { id: "g-azure-aura", n: "Azure Aura", p: 520, c: "#60A5FA" },
      { id: "g-amber-aura", n: "Amber Aura", p: 640, c: "#FBBF24" },
      { id: "g-teal-aura", n: "Teal Aura", p: 760, c: "#2DD4BF" },
      { id: "g-coral-aura", n: "Coral Aura", p: 900, c: "#F87171" },
      { id: "g-emerald-aura", n: "Emerald Aura", p: 1100, c: "#A3E635" },
      { id: "g-indigo-aura", n: "Indigo Aura", p: 1300, c: "#818CF8" },
      { id: "g-cherry-aura", n: "Cherry Aura", p: 1600, c: "#F43F5E" },
      { id: "g-ice-aura", n: "Ice Aura", p: 2000, c: "#67E8F9" },
      { id: "g-orchid-aura", n: "Orchid Aura", p: 2600, c: "#D946EF" },
      { id: "g-lemon-aura", n: "Lemon Aura", p: 3200, c: "#FACC15" },
      { id: "g-sea-aura", n: "Sea Aura", p: 4200, c: "#5EEAD4" },
      { id: "g-blue-aura", n: "Blue Aura", p: 420, c: "#93C5FD" },
      { id: "g-pink-aura", n: "Pink Aura", p: 520, c: "#F0ABFC" },
      { id: "g-mango-aura", n: "Mango Aura", p: 640, c: "#FDA4AF" },
    ],
    avglow: [
      { id: "none", n: "No Ring", p: 0 },
      { id: "cyan", n: "Cyan Ring", p: 300, c: "#22D3EE" },
      { id: "violet", n: "Violet Ring", p: 300, c: "#A78BFA" },
      { id: "mint", n: "Mint Ring", p: 400, c: "#34F5C5" },
      { id: "amber", n: "Amber Ring", p: 500, c: "#FBBF24" },
      { id: "rose", n: "Rose Ring", p: 600, c: "#FB7185" },
      { id: "sky", n: "Sky Ring", p: 400, c: "#7DD3FC" },
      { id: "emerald", n: "Emerald Ring", p: 450, c: "#34D399" },
      { id: "gold", n: "Gold Ring", p: 650, c: "#FDE047" },
      { id: "blood", n: "Blood Ring", p: 650, c: "#EF4444" },
      { id: "r-ice-ring", n: "Ice Ring", p: 420, c: "#F06C4B" },
      { id: "r-gold-ring", n: "Gold Ring", p: 520, c: "#F0794B" },
      { id: "r-neon-ring", n: "Neon Ring", p: 640, c: "#F0874B" },
      { id: "r-pearl-ring", n: "Pearl Ring", p: 760, c: "#F0944B" },
      { id: "r-ruby-ring", n: "Ruby Ring", p: 900, c: "#F0A14B" },
      { id: "r-topaz-ring", n: "Topaz Ring", p: 1100, c: "#F0AE4B" },
      { id: "r-jade-ring", n: "Jade Ring", p: 1300, c: "#F0BB4B" },
      { id: "r-cobalt-ring", n: "Cobalt Ring", p: 1600, c: "#F0C84B" },
      { id: "r-coral-ring", n: "Coral Ring", p: 2000, c: "#F0D64B" },
      { id: "r-silver-ring", n: "Silver Ring", p: 2600, c: "#F0E34B" },
      { id: "r-bronze-ring", n: "Bronze Ring", p: 3200, c: "#F0F04B" },
      { id: "r-plasma-ring", n: "Plasma Ring", p: 4200, c: "#E3F04B" },
      { id: "r-quartz-ring", n: "Quartz Ring", p: 420, c: "#D6F04B" },
      { id: "r-aurora-ring", n: "Aurora Ring", p: 520, c: "#C8F04B" },
      { id: "r-frost-ring", n: "Frost Ring", p: 640, c: "#BBF04B" },
      { id: "r-magma-ring", n: "Magma Ring", p: 760, c: "#AEF04B" },
      { id: "r-zen-ring", n: "Zen Ring", p: 900, c: "#A1F04B" },
      { id: "r-pulse-ring", n: "Pulse Ring", p: 1100, c: "#94F04B" },
      { id: "r-halo-ring", n: "Halo Ring", p: 1300, c: "#87F04B" },
      { id: "r-edge-ring", n: "Edge Ring", p: 1600, c: "#79F04B" },
      { id: "r-glow-ring", n: "Glow Ring", p: 2000, c: "#6CF04B" },
      { id: "r-shine-ring", n: "Shine Ring", p: 2600, c: "#5FF04B" },
      { id: "r-beam-ring", n: "Beam Ring", p: 3200, c: "#52F04B" },
      { id: "r-flux-ring", n: "Flux Ring", p: 4200, c: "#4BF052" },
      { id: "r-spark-ring", n: "Spark Ring", p: 420, c: "#4BF05F" },
      { id: "r-ice-band", n: "Ice Band", p: 520, c: "#4BF06C" },
      { id: "r-gold-band", n: "Gold Band", p: 640, c: "#4BF079" },
      { id: "r-neon-band", n: "Neon Band", p: 760, c: "#4BF087" },
      { id: "r-pearl-band", n: "Pearl Band", p: 900, c: "#4BF094" },
      { id: "r-ruby-band", n: "Ruby Band", p: 1100, c: "#4BF0A1" },
      { id: "r-topaz-band", n: "Topaz Band", p: 1300, c: "#4BF0AE" },
      { id: "r-jade-band", n: "Jade Band", p: 1600, c: "#4BF0BB" },
      { id: "r-cobalt-band", n: "Cobalt Band", p: 2000, c: "#4BF0C8" },
      { id: "r-coral-band", n: "Coral Band", p: 2600, c: "#4BF0D6" },
      { id: "r-silver-band", n: "Silver Band", p: 3200, c: "#4BF0E3" },
      { id: "r-bronze-band", n: "Bronze Band", p: 4200, c: "#4BF0F0" },
      { id: "r-plasma-band", n: "Plasma Band", p: 420, c: "#4BE3F0" },
      { id: "r-quartz-band", n: "Quartz Band", p: 520, c: "#4BD6F0" },
      { id: "r-aurora-band", n: "Aurora Band", p: 640, c: "#4BC8F0" },
      { id: "r-frost-band", n: "Frost Band", p: 760, c: "#4BBBF0" },
      { id: "r-magma-band", n: "Magma Band", p: 900, c: "#4BAEF0" },
      { id: "r-zen-band", n: "Zen Band", p: 1100, c: "#4BA1F0" },
      { id: "r-pulse-band", n: "Pulse Band", p: 1300, c: "#4B94F0" },
      { id: "r-halo-band", n: "Halo Band", p: 1600, c: "#4B87F0" },
      { id: "r-edge-band", n: "Edge Band", p: 2000, c: "#4B79F0" },
      { id: "r-glow-band", n: "Glow Band", p: 2600, c: "#4B6CF0" },
      { id: "r-shine-band", n: "Shine Band", p: 3200, c: "#4B5FF0" },
      { id: "r-beam-band", n: "Beam Band", p: 4200, c: "#4B52F0" },
      { id: "r-flux-band", n: "Flux Band", p: 420, c: "#524BF0" },
      { id: "r-spark-band", n: "Spark Band", p: 520, c: "#5F4BF0" },
      { id: "r-ice-hoop", n: "Ice Hoop", p: 640, c: "#6C4BF0" },
      { id: "r-gold-hoop", n: "Gold Hoop", p: 760, c: "#794BF0" },
      { id: "r-neon-hoop", n: "Neon Hoop", p: 900, c: "#874BF0" },
      { id: "r-pearl-hoop", n: "Pearl Hoop", p: 1100, c: "#944BF0" },
      { id: "r-ruby-hoop", n: "Ruby Hoop", p: 1300, c: "#A14BF0" },
      { id: "r-topaz-hoop", n: "Topaz Hoop", p: 1600, c: "#AE4BF0" },
      { id: "r-jade-hoop", n: "Jade Hoop", p: 2000, c: "#BB4BF0" },
      { id: "r-cobalt-hoop", n: "Cobalt Hoop", p: 2600, c: "#C84BF0" },
      { id: "r-coral-hoop", n: "Coral Hoop", p: 3200, c: "#D64BF0" },
      { id: "r-silver-hoop", n: "Silver Hoop", p: 4200, c: "#E34BF0" },
      { id: "r-bronze-hoop", n: "Bronze Hoop", p: 420, c: "#F04BF0" },
      { id: "r-plasma-hoop", n: "Plasma Hoop", p: 520, c: "#F04BE3" },
      { id: "r-quartz-hoop", n: "Quartz Hoop", p: 640, c: "#F04BD6" },
      { id: "r-aurora-hoop", n: "Aurora Hoop", p: 760, c: "#F04BC8" },
      { id: "r-frost-hoop", n: "Frost Hoop", p: 900, c: "#F04BBB" },
      { id: "r-magma-hoop", n: "Magma Hoop", p: 1100, c: "#F04BAE" },
      { id: "r-zen-hoop", n: "Zen Hoop", p: 1300, c: "#F04BA1" },
      { id: "r-pulse-hoop", n: "Pulse Hoop", p: 1600, c: "#F04B94" },
      { id: "r-halo-hoop", n: "Halo Hoop", p: 2000, c: "#F04B87" },
      { id: "r-edge-hoop", n: "Edge Hoop", p: 2600, c: "#F04B79" },
      { id: "r-glow-hoop", n: "Glow Hoop", p: 3200, c: "#F04B6C" },
      { id: "r-shine-hoop", n: "Shine Hoop", p: 4200, c: "#F04B5F" },
      { id: "r-beam-hoop", n: "Beam Hoop", p: 420, c: "#F04B52" },
      { id: "r-flux-hoop", n: "Flux Hoop", p: 520, c: "#F0524B" },
      { id: "r-spark-hoop", n: "Spark Hoop", p: 640, c: "#F05F4B" },
    ],
    badges: [
      { id: "none", n: "No Badge", p: 0 },
      { id: "star", n: "Star Badge", p: 300, icon: "star" },
      { id: "flame", n: "Flame Badge", p: 500, icon: "flame" },
      { id: "zap", n: "Volt Badge", p: 500, icon: "zap" },
      { id: "shield", n: "Shield Badge", p: 700, icon: "shield" },
      { id: "gem", n: "Gem Badge", p: 900, icon: "gem" },
      { id: "crown", n: "Crown Badge", p: 1200, icon: "crown" },
      { id: "medal", n: "Medal Badge", p: 600, icon: "medal" },
      { id: "trophy", n: "Trophy Badge", p: 1100, icon: "trophy" },
      { id: "spark", n: "Spark Badge", p: 800, icon: "sparkles" },
      { id: "sun", n: "Sun Badge", p: 700, icon: "sun" },
      { id: "moon", n: "Moon Badge", p: 700, icon: "moon" },
      { id: "dot", n: "Focus Badge", p: 500, icon: "check" },
      { id: "bd-ace-crest", n: "Ace Crest", p: 420, icon: "star" },
      { id: "bd-bolt-crest", n: "Bolt Crest", p: 520, icon: "flame" },
      { id: "bd-viper-crest", n: "Viper Crest", p: 640, icon: "zap" },
      { id: "bd-falcon-crest", n: "Falcon Crest", p: 760, icon: "shield" },
      { id: "bd-ranger-crest", n: "Ranger Crest", p: 900, icon: "gem" },
      { id: "bd-pilot-crest", n: "Pilot Crest", p: 1100, icon: "crown" },
      { id: "bd-ace2-crest", n: "Ace2 Crest", p: 1300, icon: "star" },
      { id: "bd-storm-crest", n: "Storm Crest", p: 1600, icon: "flame" },
      { id: "bd-blaze-crest", n: "Blaze Crest", p: 2000, icon: "zap" },
      { id: "bd-frost-crest", n: "Frost Crest", p: 2600, icon: "shield" },
      { id: "bd-iron-crest", n: "Iron Crest", p: 3200, icon: "gem" },
      { id: "bd-royal-crest", n: "Royal Crest", p: 4200, icon: "crown" },
      { id: "bd-swift-crest", n: "Swift Crest", p: 420, icon: "star" },
      { id: "bd-ultra-crest", n: "Ultra Crest", p: 520, icon: "flame" },
      { id: "bd-prime-crest", n: "Prime Crest", p: 640, icon: "zap" },
      { id: "bd-apex-crest", n: "Apex Crest", p: 760, icon: "shield" },
      { id: "bd-vanguard-crest", n: "Vanguard Crest", p: 900, icon: "gem" },
      { id: "bd-elite-crest", n: "Elite Crest", p: 1100, icon: "crown" },
      { id: "bd-turbo-crest", n: "Turbo Crest", p: 1300, icon: "star" },
      { id: "bd-nova-crest", n: "Nova Crest", p: 1600, icon: "flame" },
      { id: "bd-zenith-crest", n: "Zenith Crest", p: 2000, icon: "zap" },
      { id: "bd-titan-crest", n: "Titan Crest", p: 2600, icon: "shield" },
      { id: "bd-cosmic-crest", n: "Cosmic Crest", p: 3200, icon: "gem" },
      { id: "bd-quantum-crest", n: "Quantum Crest", p: 4200, icon: "crown" },
      { id: "bd-photon-crest", n: "Photon Crest", p: 420, icon: "star" },
      { id: "bd-ace-mark", n: "Ace Mark", p: 520, icon: "flame" },
      { id: "bd-bolt-mark", n: "Bolt Mark", p: 640, icon: "zap" },
      { id: "bd-viper-mark", n: "Viper Mark", p: 760, icon: "shield" },
      { id: "bd-falcon-mark", n: "Falcon Mark", p: 900, icon: "gem" },
      { id: "bd-ranger-mark", n: "Ranger Mark", p: 1100, icon: "crown" },
      { id: "bd-pilot-mark", n: "Pilot Mark", p: 1300, icon: "star" },
      { id: "bd-ace2-mark", n: "Ace2 Mark", p: 1600, icon: "flame" },
      { id: "bd-storm-mark", n: "Storm Mark", p: 2000, icon: "zap" },
      { id: "bd-blaze-mark", n: "Blaze Mark", p: 2600, icon: "shield" },
      { id: "bd-frost-mark", n: "Frost Mark", p: 3200, icon: "gem" },
      { id: "bd-iron-mark", n: "Iron Mark", p: 4200, icon: "crown" },
      { id: "bd-royal-mark", n: "Royal Mark", p: 420, icon: "star" },
      { id: "bd-swift-mark", n: "Swift Mark", p: 520, icon: "flame" },
      { id: "bd-ultra-mark", n: "Ultra Mark", p: 640, icon: "zap" },
      { id: "bd-prime-mark", n: "Prime Mark", p: 760, icon: "shield" },
      { id: "bd-apex-mark", n: "Apex Mark", p: 900, icon: "gem" },
      { id: "bd-vanguard-mark", n: "Vanguard Mark", p: 1100, icon: "crown" },
      { id: "bd-elite-mark", n: "Elite Mark", p: 1300, icon: "star" },
      { id: "bd-turbo-mark", n: "Turbo Mark", p: 1600, icon: "flame" },
      { id: "bd-nova-mark", n: "Nova Mark", p: 2000, icon: "zap" },
      { id: "bd-zenith-mark", n: "Zenith Mark", p: 2600, icon: "shield" },
      { id: "bd-titan-mark", n: "Titan Mark", p: 3200, icon: "gem" },
      { id: "bd-cosmic-mark", n: "Cosmic Mark", p: 4200, icon: "crown" },
      { id: "bd-quantum-mark", n: "Quantum Mark", p: 420, icon: "star" },
      { id: "bd-photon-mark", n: "Photon Mark", p: 520, icon: "flame" },
    ]
  };
  /* generated apply-CSS for custom banners/walls (profile + WC chat) */
  function injectCustomCosCss() {
    try {
      var out = [];
      (CUSTOM.banners || []).forEach(function (b) {
        if (!b.c1) return;
        out.push('[data-nova-banner="' + b.id + '"] .nv-cover,[data-nova-banner="' + b.id + '"].nv-cover{background:linear-gradient(118deg,' + b.c1 + ',' + b.c2 + ' 55%,' + b.c1 + ')!important}');
        out.push('.chat-page.nv-wc-wall-' + b.id + '{background:linear-gradient(118deg,' + b.c1 + ',' + b.c2 + ')!important}');
      });
      (CUSTOM.walls || []).forEach(function (w) {
        if (!w.c1) return;
        out.push('[data-nova-wall="' + w.id + '"] .nova-profile,[data-nova-wall="' + w.id + '"].nova-profile{background:radial-gradient(150px 100px at 12% 4%,' + w.c1 + ',transparent 72%),radial-gradient(150px 100px at 92% 96%,' + w.c2 + ',transparent 72%),linear-gradient(160deg,' + w.c1 + '22,' + w.c2 + '22)!important}');
        out.push('.chat-page.nv-wc-wall-' + w.id + '{background:radial-gradient(150px 100px at 12% 4%,' + w.c1 + ',transparent 72%),radial-gradient(150px 100px at 92% 96%,' + w.c2 + ',transparent 72%)!important}');
      });
      var st = document.createElement("style");
      st.id = "nv-custom-cos-css";
      if (!document.getElementById("nv-custom-cos-css")) { st.textContent = out.join("\n"); document.head.appendChild(st); }
    } catch (e) {}
  }
  setTimeout(injectCustomCosCss, 400);

  var CUSTOM_DEFAULT = { banners: "none", sizes: "standard", walls: "none", nameglow: "none", avglow: "none", badges: "none" };
  Object.keys(CUSTOM).forEach(function (cat) {
    CUSTOM[cat].forEach(function (it) {
      if (it.p > 0) {
        it.__orig = it.p;
        it.p = Math.max(20, Math.round(it.p * 0.4 / 10) * 10);
      }
    });
  });

  var CATS = [
    { id: "colors", n: "Name Colors", ic: "palette", blurb: "Color your name across chat, battles and comments." },
    { id: "avatars", n: "Avatars", ic: "user", blurb: "Realistic portrait avatars — swap your face anytime." },
    { id: "frames", n: "Avatar Frames", ic: "grid", blurb: "Animated borders that wrap your avatar." },
    { id: "titles", n: "Titles", ic: "star", blurb: "A badge of status next to your display name." },
    { id: "effects", n: "Name Effects", ic: "sparkles", blurb: "Motion on your name — glow, pulse, glitch." },
    { id: "themes", n: "Profile Themes", ic: "monitor", blurb: "Gradient identities for your profile." },
    { id: "fonts", n: "Text Fonts", ic: "book-open", blurb: "Change how your name is typeset." },
    { id: "stickers", n: "Chat Stickers", ic: "message-square", blurb: "Reaction packs for world chat." },
    { id: "bubbles", n: "Chat Bubbles", ic: "message-square", blurb: "Custom message bubble colors." },
    { id: "banners", n: "Profile Banners", ic: "image", blurb: "A cinematic cover above your profile." },
    { id: "sizes", n: "Profile Size", ic: "monitor", blurb: "Standard, wide, full width or cinema mode." },
    { id: "walls", n: "Wallpapers", ic: "grid", blurb: "Textures and fields behind your profile." },
    { id: "nameglow", n: "Name Glow", ic: "zap", blurb: "A halo of light around your display name." },
    { id: "avglow", n: "Avatar Rings", ic: "sun", blurb: "Neon rings around your portrait." },
    { id: "badges", n: "Profile Badges", ic: "medal", blurb: "A sharp icon beside your name." }
  ];
  var CAT_MAP = {};
  CATS.forEach(function (c) { CAT_MAP[c.id] = c; });

  /* ---------- expand the store: hundreds of unlocks ---------- */
  function extendShop() {
    var S = appShop();
    if (!S) return;
    function add(cat, arr) {
      if (!S[cat]) S[cat] = [];
      var has = {};
      S[cat].forEach(function (i) { has[i.id] = 1; });
      arr.forEach(function (i) { if (!has[i.id]) { S[cat].push(i); has[i.id] = 1; } });
    }
    add("colors", [
      { id: "nv-aqua", c: "#06B6D4", n: "Aqua", p: 900 }, { id: "nv-navy", c: "#1E3A8A", n: "Navy", p: 1000 },
      { id: "nv-peach", c: "#FDBA74", n: "Peach", p: 900 }, { id: "nv-lavender", c: "#C4B5FD", n: "Lavender", p: 1100 },
      { id: "nv-lemon", c: "#FDE047", n: "Lemon", p: 1000 }, { id: "nv-forest", c: "#166534", n: "Forest", p: 1100 },
      { id: "nv-steel", c: "#64748B", n: "Steel", p: 800 }, { id: "nv-copper", c: "#B45309", n: "Copper", p: 1200 },
      { id: "nv-neon", c: "#39FF14", n: "Neon Green", p: 2000 }, { id: "nv-hotpink", c: "#FF69B4", n: "Hot Pink", p: 1500 },
      { id: "nv-ice", c: "#A5F3FC", n: "Arctic Ice", p: 1400 }, { id: "nv-sapphire", c: "#1D4ED8", n: "Sapphire", p: 1800 },
      { id: "nv-ruby", c: "#BE123C", n: "Ruby", p: 1800 }, { id: "nv-jade", c: "#047857", n: "Jade", p: 1600 },
      { id: "nv-pearl", c: "#F5F5F4", n: "Pearl", p: 2200 }, { id: "nv-sunrise", c: "#FF8A3D", n: "Sunrise", p: 1300 },
      { id: "nv-midnight", c: "#312E81", n: "Midnight", p: 1700 }, { id: "nv-sand", c: "#E7C9A9", n: "Sand", p: 900 }
    ]);
    add("bubbles", [
      { id: "nb-sky", c: "#0EA5E9", n: "Sky", p: 1200 }, { id: "nb-mint", c: "#10B981", n: "Mint", p: 1200 },
      { id: "nb-grape", c: "#8B5CF6", n: "Grape", p: 1400 }, { id: "nb-peach", c: "#FB923C", n: "Peach", p: 1400 },
      { id: "nb-cherry", c: "#E11D48", n: "Cherry", p: 1600 }, { id: "nb-lime", c: "#84CC16", n: "Lime", p: 1300 },
      { id: "nb-ink", c: "#0F172A", n: "Ink", p: 2000 }, { id: "nb-snow", c: "#E2E8F0", n: "Snow", p: 1500 },
      { id: "nb-bronze", c: "#92400E", n: "Bronze", p: 1500 }, { id: "nb-cyan", c: "#06B6D4", n: "Cyan", p: 1700 },
      { id: "nb-fuchsia", c: "#C026D3", n: "Fuchsia", p: 1800 }, { id: "nb-forest", c: "#166534", n: "Forest", p: 1400 },
      { id: "nb-sunset", c: "#F97316", n: "Sunset", p: 1600 }, { id: "nb-navy", c: "#1E3A8A", n: "Navy", p: 1900 },
      { id: "nb-royal", c: "#6D28D9", n: "Royal", p: 2100 }, { id: "nb-coral", c: "#F43F5E", n: "Coral", p: 1500 },
      { id: "nb-teal", c: "#0D9488", n: "Teal", p: 1400 }, { id: "nb-gold", c: "#D97706", n: "Gold", p: 2400 }
    ]);
    add("titles", [
      { id: "nv-SAGE", n: "SAGE", p: 1800 }, { id: "nv-HERO", n: "HERO", p: 1500 },
      { id: "nv-MYTH", n: "MYTH", p: 3200 }, { id: "nv-NOVA", n: "NOVA", p: 2600 },
      { id: "nv-ORBIT", n: "ORBIT", p: 2200 }, { id: "nv-PILOT", n: "PILOT", p: 1700 },
      { id: "nv-SCOUT", n: "SCOUT", p: 1400 }, { id: "nv-ACE", n: "ACE", p: 1900 },
      { id: "nv-CHIEF", n: "CHIEF", p: 2400 }, { id: "nv-RULER", n: "RULER", p: 4000 },
      { id: "nv-LUMEN", n: "LUMEN", p: 3000 }, { id: "nv-PHOENIX", n: "PHOENIX", p: 5000 }
    ]);
    add("effects", [
      { id: "nv-sway", n: "Sway", p: 2000 }, { id: "nv-ripple", n: "Ripple", p: 2400 },
      { id: "nv-bounce2", n: "Bounce", p: 2200 }, { id: "nv-flicker2", n: "Flicker", p: 2600 },
      { id: "nv-drift", n: "Drift", p: 2000 }, { id: "nv-pendulum", n: "Pendulum", p: 2400 },
      { id: "nv-glide", n: "Glide", p: 2200 }, { id: "nv-pulse2", n: "Heart Pulse", p: 2800 },
      { id: "nv-spin2", n: "Slow Spin", p: 3000 }, { id: "nv-shimmer", n: "Shimmer", p: 3600 }
    ]);
    add("themes", [
      { id: "nv-lava", n: "Lava", c1: "#F97316", c2: "#7F1D1D", p: 3000 },
      { id: "nv-mint", n: "Mint", c1: "#34D399", c2: "#064E3B", p: 2800 },
      { id: "nv-night", n: "Night", c1: "#1E1B4B", c2: "#020617", p: 2600 },
      { id: "nv-rose", n: "Rose", c1: "#FB7185", c2: "#881337", p: 2800 },
      { id: "nv-steel", n: "Steel", c1: "#94A3B8", c2: "#1E293B", p: 2400 },
      { id: "nv-cyber", n: "Cyber", c1: "#22D3EE", c2: "#4F46E5", p: 3400 },
      { id: "nv-peach", n: "Peach", c1: "#FDBA74", c2: "#C2410C", p: 2600 },
      { id: "nv-solar", n: "Solar", c1: "#FDE047", c2: "#B45309", p: 3200 }
    ]);
    add("fonts", [
      { id: "nv-trebuchet", n: "Trebuchet", font: "'Trebuchet MS',sans-serif", p: 1600 },
      { id: "nv-consolas", n: "Consolas", font: "Consolas,monospace", p: 1600 },
      { id: "nv-palatino", n: "Palatino", font: "'Palatino Linotype',serif", p: 1800 },
      { id: "nv-verdana", n: "Verdana", font: "Verdana,sans-serif", p: 1500 },
      { id: "nv-tahoma", n: "Tahoma", font: "Tahoma,sans-serif", p: 1500 },
      { id: "nv-arialblack", n: "Arial Black", font: "'Arial Black',sans-serif", p: 2000 }
    ]);
    add("stickers", [
      { id: "nv-star", n: "Star Pack", emoji: "⭐", p: 1600 }, { id: "nv-moon", n: "Moon Pack", emoji: "🌙", p: 1500 },
      { id: "nv-sun", n: "Sun Pack", emoji: "☀️", p: 1500 }, { id: "nv-tree", n: "Nature Pack", emoji: "🌲", p: 1700 },
      { id: "nv-wave", n: "Ocean Pack", emoji: "🌊", p: 1700 }, { id: "nv-rainbow", n: "Rainbow Pack", emoji: "🌈", p: 2200 }
    ]);
    add("frames", [
      { id: "nv-neon2", n: "Neon Pulse", p: 3000 }, { id: "nv-sakura", n: "Sakura", p: 2600 },
      { id: "nv-ocean", n: "Ocean Glow", p: 2600 }, { id: "nv-sunset2", n: "Sunset", p: 2400 },
      { id: "nv-gold2", n: "Royal Gold", p: 3400 }, { id: "nv-emerald2", n: "Emerald", p: 2800 },
      { id: "nv-violet2", n: "Violet Aura", p: 3000 }, { id: "nv-ice2", n: "Glacier", p: 2400 }
    ]);
    var FX = window.FX_MAP;
    if (FX) {
      var map = { "nv-sway": "fx-wiggle", "nv-ripple": "fx-pulse", "nv-bounce2": "fx-bob", "nv-flicker2": "fx-blink", "nv-drift": "fx-float", "nv-pendulum": "fx-wiggle", "nv-glide": "fx-bob", "nv-pulse2": "fx-heart", "nv-spin2": "fx-spin3d", "nv-shimmer": "q9-shine" };
      Object.keys(map).forEach(function (k) { if (!FX[k]) FX[k] = map[k]; });
    }
  }
  extendShop();

  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) {}
    if (!s.owned) s.owned = {};
    if (!s.equipped) s.equipped = {};
    return s;
  }
  var COS = load();
  function saveCos() { try { localStorage.setItem(LS, JSON.stringify(COS)); } catch (e) {} }
  function isCustom(cat) { return !!CUSTOM[cat]; }
  function customItems(cat) { return CUSTOM[cat] || []; }
  function customDefault(cat) { return CUSTOM_DEFAULT[cat] || "none"; }
  function customItem(cat, id) { var a = customItems(cat); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function customEquipped(cat) { var id = COS.equipped[cat] || customDefault(cat); return customItem(cat, id) ? id : customDefault(cat); }
  function owned(cat, id) {
    if (isCustom(cat)) {
      var it = customItem(cat, id);
      if (!it) return false;
      if (it.p === 0 || id === customDefault(cat)) return true;
      return !!COS.owned[cat + "_" + id];
    }
    var u = user();
    return !!(u && u.shop && u.shop.owned && u.shop.owned[cat + "_" + id]);
  }
  function equippedApp(cat) { var u = user(); return u && u.shop ? u.shop[cat] : null; }
  function catItems(cat) {
    if (isCustom(cat)) return customItems(cat);
    var s = appShop();
    return (s && s[cat]) || [];
  }
  function itemPrice(it) { return Number(it && it.p) || 0; }
  function tier(xp) {
    if (xp >= 1e5) return { n: "Platinum", l: 12, c: "#E5E7EB" };
    if (xp >= 5e4) return { n: "Diamond", l: 10, c: "#67E8F9" };
    if (xp >= 25e3) return { n: "Gold", l: 8, c: "#FBBF24" };
    if (xp >= 1e4) return { n: "Silver", l: 6, c: "#CBD5E1" };
    if (xp >= 5e3) return { n: "Bronze", l: 4, c: "#FDBA74" };
    return { n: "Rookie", l: 1, c: "#A78BFA" };
  }
  function rarity(p) {
    if (p >= 3e3) return { t: "LEGENDARY", c: "#A855F7" };
    if (p >= 2e3) return { t: "EPIC", c: "#EC4899" };
    if (p >= 1e3) return { t: "RARE", c: "#3B82F6" };
    if (p >= 400) return { t: "UNCOMMON", c: "#10B981" };
    return { t: "STANDARD", c: "#64748B" };
  }

  function patchPrices() {
    var s = appShop();
    if (!s) return;
    Object.keys(s).forEach(function (k) {
          try { Object.keys(s[k] || {}).forEach(function (_ik) { var _it = s[k][_ik]; if (_it && _it.p && _it.__orig == null) _it.__orig = _it.p; }); } catch (_e) {}
      var arr = s[k];
      if (!arr || !arr.length) return;
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (it && it.p && !it.__nv40) {
          it.p = Math.max(20, Math.round(it.p * 0.4 / 10) * 10);
          it.__nv40 = 1;
        }
      }
    });
  }

  /* ---------- previews ---------- */
  function preview(cat, it, big) {
    var av = (user() || {}).avatar || avatars()[0] || portrait("me");
    if (cat === "colors") {
      if (it.id === "rainbow") return '<span class="q9-shine nvx-pv-name">Your Name</span>';
      if (it.id === "galaxy") return '<span class="q9-galaxy nvx-pv-name">Your Name</span>';
      return '<span class="nvx-pv-name" style="color:' + esc(it.c || "#fff") + '">Your Name</span><span class="nvx-pv-dot" style="background:' + esc(it.c || "#fff") + '"></span>';
    }
    if (cat === "avatars") return '<img class="nvx-pv-av" src="' + esc(it.u || av) + '" alt="" data-nv-av="1">';
    if (cat === "frames") return '<img class="nvx-pv-av shopframe-' + esc(it.id) + '" src="' + esc(av) + '" alt="" data-nv-av="1">';
    if (cat === "titles") return '<span class="nvx-pv-name">Your Name<span class="shop-title">' + esc(strip(it.n) || it.id) + '</span></span>';
    if (cat === "effects") { var fx = fxMap(); return '<span class="nvx-pv-name ' + esc(fx[it.id] || "") + '">Your Name</span>'; }
    if (cat === "themes") return '<span class="nvx-pv-theme" style="background:linear-gradient(135deg,' + esc(it.c1 || "#6366F1") + "," + esc(it.c2 || "#8B5CF6") + ')">THEME</span>';
    if (cat === "fonts") return '<span class="nvx-pv-name" style="font-family:' + esc(it.font || "Sora") + '">Your Name</span>';
    if (cat === "stickers") return '<span class="nvx-pv-sticker">' + (it.emoji || "") + '</span>';
    if (cat === "bubbles") return '<span class="nvx-pv-bubble" style="background:' + esc(it.c || "#0E9F6E") + '">Hello!</span>';
    if (cat === "banners") return '<span class="nvx-pv-banner nv-banner-' + esc(it.id) + '"></span>';
    if (cat === "sizes") {
      var w = { standard: 46, wide: 68, full: 88, cinema: 100 }[it.id] || 46;
      return '<span class="nvx-pv-size"><i style="width:' + w + '%"></i><i style="width:' + (w - 10) + '%"></i><i style="width:' + (w - 20) + '%"></i></span>';
    }
    if (cat === "walls") return '<span class="nvx-pv-wall nv-wall-' + esc(it.id) + '"></span>';
    if (cat === "nameglow") return '<span class="nvx-pv-name nv-glow-' + esc(it.id) + '">Your Name</span>';
    if (cat === "avglow") return '<span class="nvx-pv-ring nv-ring-' + esc(it.id) + '"><img src="' + esc(av) + '" alt="" data-nv-av="1"></span>';
    if (cat === "badges") return '<span class="nvx-pv-name">' + esc((user() || {}).name || "You") + (it.id === "none" ? "" : '<span class="nv-user-badge nv-badge-' + esc(it.id) + '">' + svg(it.icon || "star") + '</span>') + '</span>';
    return '<span class="nvx-pv-name">' + esc(strip(it.n)) + '</span>';
  }

  /* ---------- purchase / equip ---------- */
  function buy(cat, id) {
    var u = user();
    if (!u || !u.uid) { toastMsg("Sign in to buy cosmetics.", "error"); return; }
    if (owned(cat, id)) { equip(cat, id); return; }
    var it = null, arr = catItems(cat);
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) it = arr[i];
    if (!it) return;
    var price = itemPrice(it);
    if (price > 0 && (u.xp || 0) < price) { toastMsg("Not enough XP — need " + fmtN(price) + " XP.", "error"); return; }
    if (isCustom(cat)) {
      u.xp = Math.max(0, (u.xp || 0) - price);
      COS.owned[cat + "_" + id] = Date.now();
      COS.equipped[cat] = id;
      saveCos();
      var r = dbRef("users/" + u.uid);
      if (r) {
        var up = { xp: u.xp };
        up["shop/owned/" + cat + "_" + id] = Date.now();
        up["shop/" + cat] = id;
        try { r.update(up).catch(function () {}); } catch (e) {}
      }
      toastMsg("Purchased " + strip(it.n) + " — applied to your profile.");
      applyCosmetics(); render(); try { paint(); } catch (e) {}
      return;
    }
    var fn = window.buyShop;
    if (typeof fn !== "function") { toastMsg("Shop service unavailable.", "error"); return; }
    var p = fn(cat, id);
    Promise.resolve(p).then(function () {
      setTimeout(function () {
        if (owned(cat, id) && typeof window.equipShop === "function") {
          try { Promise.resolve(window.equipShop(cat, id)).catch(function () {}); } catch (e) {}
        }
        render(); applyCosmetics(); try { paint(); } catch (e) {}
      }, 320);
    }).catch(function () { toastMsg("Purchase failed.", "error"); });
  }

  function equip(cat, id) {
    if (!owned(cat, id)) { buy(cat, id); return; }
    var u = user();
    if (isCustom(cat)) {
      COS.equipped[cat] = id;
      saveCos();
      var r = u && u.uid ? dbRef("users/" + u.uid + "/shop/" + cat) : null;
      if (r) { try { r.set(id).catch(function () {}); } catch (e) {} }
      toastMsg(strip((customItem(cat, id) || {}).n || id) + " applied.");
      render(); applyCosmetics();
      return;
    }
    if (!u || !u.uid) { toastMsg("Sign in to equip.", "error"); return; }
    if (typeof window.equipShop === "function") {
      try { Promise.resolve(window.equipShop(cat, id)).then(function () { setTimeout(function () { render(); applyCosmetics(); }, 220); }).catch(function () {}); } catch (e) {}
    }
  }

  function unequip(cat) {
    var u = user();
    if (isCustom(cat)) {
      COS.equipped[cat] = customDefault(cat);
      saveCos();
      var r = u && u.uid ? dbRef("users/" + u.uid + "/shop/" + cat) : null;
      if (r) { try { r.set(customDefault(cat)).catch(function () {}); } catch (e) {} }
      toastMsg("Reset to default.");
      render(); applyCosmetics();
      return;
    }
    if (typeof window.unequipShop === "function") {
      try { Promise.resolve(window.unequipShop(cat)).then(function () { setTimeout(function () { render(); applyCosmetics(); }, 220); }).catch(function () {}); } catch (e) {}
    }
  }

  /* ---------- shell ---------- */
  var VIEW = "shop", CUR = "colors";

  function build() {
    if (document.getElementById("nova-shop")) return;
    var el = document.createElement("div");
    el.id = "nova-shop";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Nova XP Shop");
    el.innerHTML =
      '<div class="nvx-back" data-nvx-close></div>' +
      '<div class="nvx-shell">' +
        '<header class="nvx-head">' +
          '<div class="nvx-brand"><span class="nvx-logo">' + logo("shop") + '</span><span class="nvx-brandtx"><b>NOVA SHOP</b><span>Everything 40% off</span></span></div>' +
          '<div class="nvx-head-right" id="nvx-head-right"></div>' +
          '<div class="nvx-actions">' +
            '<button type="button" class="nvx-pill" data-nvx-collection>' + svg("star") + '<span>My Collection</span></button>' +
            '<button type="button" class="nvx-pill" data-nvx-games>' + svg("gamepad-2") + '<span>Arcade</span></button>' +
            '<button type="button" class="nvx-close" data-nvx-close aria-label="Close shop">' + svg("x") + '</button>' +
          '</div>' +
        '</header>' +
        '<div class="nvx-cats" id="nvx-cats"></div>' +
        '<div class="nvx-main" id="nvx-main"></div>' +
        '<footer class="nvx-foot"><span>' + svg("zap") + 'Earn XP by voting, winning battles, daily streaks and gifts.</span><span class="nvx-save40">40% OFF · 15 CATEGORIES</span></footer>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener("click", onShellClick);
  }

  function onShellClick(e) {
    if (e.target.closest("[data-nvx-close]")) { close(); return; }
    var c = e.target.closest("[data-nvx-cat]");
    if (c) { CUR = c.getAttribute("data-nvx-cat"); VIEW = "shop"; paint(); return; }
    if (e.target.closest("[data-nvx-collection]")) { openCollection(); return; }
    if (e.target.closest("[data-nvx-shop]")) { VIEW = "shop"; paint(); return; }
    if (e.target.closest("[data-nvx-games]")) { close(); try { window.NovaArcade && window.NovaArcade.open(); } catch (x) {} return; }
    if (e.target.closest("[data-nvx-profile]")) { close(); try { window.navTo("profile"); } catch (x) {} return; }
    var b = e.target.closest("[data-nvx-buy]");
    if (b) { buy(b.getAttribute("data-nvx-buy"), b.getAttribute("data-nvx-id")); return; }
    var q = e.target.closest("[data-nvx-equip]");
    if (q) { equip(q.getAttribute("data-nvx-equip"), q.getAttribute("data-nvx-id")); return; }
    var un = e.target.closest("[data-nvx-unequip]");
    if (un) { unequip(un.getAttribute("data-nvx-unequip")); return; }
  }

  function open(cat) {
    build();
    if (cat && CAT_MAP[cat]) CUR = cat;
    VIEW = "shop";
    paint();
    var el = document.getElementById("nova-shop");
    el.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }
  function openCollection() {
    build();
    VIEW = "collection";
    paint();
    document.getElementById("nova-shop").classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }
  function close() {
    var el = document.getElementById("nova-shop");
    if (el) el.classList.remove("open");
    document.documentElement.style.overflow = "";
  }

  function paint() {
    var el = document.getElementById("nova-shop");
    if (!el) return;
    var u = user() || {};
    var xp = u.xp || 0, t = tier(xp);
    var head = document.getElementById("nvx-head-right");
    if (head) {
      head.innerHTML = '<div class="nvx-bal"><span>XP</span><b>' + fmtN(xp) + '</b></div>' +
        '<div class="nvx-tier" style="--tc:' + t.c + '"><span>' + svg("star") + '</span>Tier ' + t.l + ' · ' + t.n + '</div>';
    }
    var cats = document.getElementById("nvx-cats");
    if (!cats) return;
    var showCats = VIEW === "shop";
    cats.style.display = showCats ? "" : "none";
    if (showCats) {
      cats.innerHTML = CATS.map(function (c) {
        return '<button type="button" class="nvx-cat' + (c.id === CUR ? " on" : "") + '" data-nvx-cat="' + c.id + '">' +
          svg(c.ic) + '<span>' + c.n + '</span><i>' + ownedCount(c.id) + '</i></button>';
      }).join("");
    }
    var main = document.getElementById("nvx-main");
    main.innerHTML = VIEW === "collection" ? collectionHTML() : shopHTML();
    main.scrollTop = 0;
  }

  function ownedCount(cat) {
    var n = 0, arr = catItems(cat);
    for (var i = 0; i < arr.length; i++) if (owned(cat, arr[i].id)) n++;
    return n;
  }

  function miniPreview() {
    var u = user() || {};
    var av = u.avatar || portrait("mini");
    var size = customEquipped("sizes"), banner = customEquipped("banners"), wall = customEquipped("walls");
    var glow = customEquipped("nameglow"), avglow = customEquipped("avglow"), badge = customEquipped("badges");
    var bd = customItem("badges", badge);
    return '<div class="nvx-mini nv-data" data-banner="' + esc(banner) + '" data-wall="' + esc(wall) + '" data-size="' + esc(size) + '">' +
      '<div class="nvx-mini-cover nv-banner-' + esc(banner) + '"></div>' +
      '<div class="nvx-mini-body"><span class="nvx-mini-av nv-ring-' + esc(avglow) + '"><img src="' + esc(av) + '" alt="" data-nv-av="1"></span>' +
      '<div><b class="nv-glow-' + esc(glow) + '">' + esc(u.name || "You") + (badge !== "none" && bd ? '<span class="nv-user-badge nv-badge-' + esc(badge) + '">' + svg(bd.icon || "star") + '</span>' : "") + '</b><span>Level ' + (u.xp ? Math.floor(Math.sqrt((u.xp || 0) / 50)) + 1 : 1) + ' · ' + fmtN(u.xp || 0) + ' XP</span></div></div>' +
      '<div class="nvx-mini-meta"><span>Banner: <b>' + esc(nameOf("banners", banner)) + '</b></span><span>Size: <b>' + esc(nameOf("sizes", size)) + '</b></span></div></div>';
  }
  function nameOf(cat, id) {
    var it = isCustom(cat) ? customItem(cat, id) : null;
    if (it) return strip(it.n);
    if (cat === "banners" && id === "none") return "None";
    return id || "None";
  }

  function shopHTML() {
    var c = CAT_MAP[CUR] || CATS[0];
    var arr = catItems(CUR);
    var cards = arr.map(function (it, i) {
      var own = owned(CUR, it.id);
      var eq = isCustom(CUR) ? customEquipped(CUR) === it.id : equippedApp(CUR) === it.id;
      var p = itemPrice(it);
      var r = rarity(Math.max(p, it.__orig || 0));
      var action;
      if (eq) action = '<button type="button" class="nvx-buy on" data-nvx-unequip="' + CUR + '">' + svg("check") + (isCustom(CUR) ? "Applied" : "Equipped") + '</button>';
      else if (own) action = '<button type="button" class="nvx-buy own" data-nvx-equip="' + CUR + '" data-nvx-id="' + esc(it.id) + '">' + (isCustom(CUR) ? "Apply" : "Equip") + '</button>';
      else action = '<button type="button" class="nvx-buy" data-nvx-buy="' + CUR + '" data-nvx-id="' + esc(it.id) + '"><span>' + fmtN(p) + ' XP</span><i>Buy</i></button>';
      return '<div class="nvx-card' + (eq ? " equipped" : "") + '" style="--rc:' + r.c + ';animation-delay:' + Math.min(i * 18, 260) + 'ms">' +
        (own ? '<span class="nvx-own">' + svg("check") + '</span>' : "") +
        '<span class="nvx-rar" style="--rc:' + r.c + '">' + r.t + '</span>' +
        (own ? "" : p > 0 ? '<span class="nvx-off">40% OFF</span>' : "") +
        '<div class="nvx-pv">' + preview(CUR, it) + '</div>' +
        '<div class="nvx-name">' + esc(strip(it.n) || it.id) + '</div>' +
        '<div class="nvx-line"></div>' +
        '<div class="nvx-buyrow">' + action + '</div></div>';
    }).join("");
    return '<div class="nvx-hero">' +
        '<div class="nvx-hero-left">' + miniPreview() + '</div>' +
        '<div class="nvx-hero-tx"><span class="nvx-kicker">' + svg(c.ic) + 'Category ' + (CATS.map(function (x) { return x.id; }).indexOf(CUR) + 1) + ' / 15</span>' +
        '<h2>' + c.n + '</h2><p>' + c.blurb + '</p>' +
        '<div class="nvx-hero-tags"><span>40% off</span><span>' + ownedCount(CUR) + ' owned</span><span>One-tap apply</span></div>' +
        '<button type="button" class="nvx-pill wide" data-nvx-profile>' + svg("user") + 'View my profile</button></div>' +
      '</div>' +
      '<div class="nvx-grid">' + cards + '</div>';
  }

  function collectionHTML() {
    var total = 0, sections = "";
    CATS.forEach(function (c) {
      var arr = catItems(c.id), list = [];
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (!isCustom(c.id) || itemPrice(it) === 0) { if (owned(c.id, it.id)) list.push(it); }
        else if (owned(c.id, it.id)) list.push(it);
      }
      if (!list.length) return;
      total += list.length;
      var cards = list.map(function (it) {
        var eq = isCustom(c.id) ? customEquipped(c.id) === it.id : equippedApp(c.id) === it.id;
        return '<div class="nvx-card small' + (eq ? " equipped" : "") + '" style="--rc:#10B981">' +
          '<div class="nvx-pv">' + preview(c.id, it) + '</div>' +
          '<div class="nvx-name">' + esc(strip(it.n) || it.id) + '</div>' +
          '<div class="nvx-buyrow"><button type="button" class="nvx-buy ' + (eq ? "on" : "own") + '" ' + (eq ? 'data-nvx-unequip="' + c.id + '"' : 'data-nvx-equip="' + c.id + '" data-nvx-id="' + esc(it.id) + '"') + '>' +
          (eq ? svg("check") + (isCustom(c.id) ? "Applied" : "Equipped") : (isCustom(c.id) ? "Apply" : "Equip")) + '</button></div></div>';
      }).join("");
      sections += '<section class="nvx-sec"><div class="nvx-sec-head"><span>' + svg(c.ic) + '</span><b>' + c.n + '</b><i>' + list.length + '</i>' +
        '<button type="button" class="nvx-link" data-nvx-cat="' + c.id + '">Browse →</button></div><div class="nvx-grid tight">' + cards + '</div></section>';
    });
    var applied = '<div class="nvx-applied">' +
      appliedChip("banners", "Profile Banner") + appliedChip("sizes", "Profile Size") +
      appliedChip("walls", "Wallpaper") + appliedChip("nameglow", "Name Glow") +
      appliedChip("avglow", "Avatar Ring") + appliedChip("badges", "Badge") + '</div>';
    return '<div class="nvx-col-head"><div><span class="nvx-kicker">' + svg("star") + 'Your unlocks</span><h2>My Collection</h2>' +
      '<p>' + total + ' items owned across 15 categories. Everything you bought, ready to apply.</p></div>' +
      '<div class="nvx-col-actions"><button type="button" class="nvx-pill" data-nvx-shop>' + svg("shopping-bag") + 'Shop</button>' +
      '<button type="button" class="nvx-pill" data-nvx-games>' + svg("gamepad-2") + 'Arcade</button>' +
      '<button type="button" class="nvx-pill" data-nvx-profile>' + svg("user") + 'My profile</button></div></div>' +
      applied + (sections || '<div class="nvx-empty">' + svg("shopping-bag") + '<b>Nothing here yet</b><span>Buy colors, frames, banners and more in the shop — then apply them all from this screen.</span><button type="button" class="nvx-pill" data-nvx-shop>Browse the shop</button></div>');
  }

  function appliedChip(cat, label) {
    var id = customEquipped(cat);
    var it = customItem(cat, id);
    return '<div class="nvx-chip"><span>' + esc(label) + '</span><b>' + esc(strip((it && it.n) || (id === "none" ? "None" : id))) + '</b>' +
      '<button type="button" data-nvx-cat="' + cat + '">Change</button></div>';
  }

  /* ---------- profile integration ---------- */
  var profileTab = "overview";

  function profileRoot() {
    var v = document.querySelector("#app > .main-content") || document.querySelector("#app .main-content");
    if (!v || !v.querySelector("#pf-name")) return null;
    var w = v.querySelector(".nova-profile") || v.querySelector(".max-w-3xl") || v.firstElementChild;
    if (!w || !w.querySelector) return null;
    return { v: v, w: w };
  }

  function compactProfile() {
    var root = profileRoot();
    if (!root) {
      document.body.classList.remove("nova-profile-lock");
      var views = document.querySelectorAll(".nova-profile-view");
      for (var i = 0; i < views.length; i++) views[i].classList.remove("nova-profile-view");
      return;
    }
    var v = root.v, w = root.w;
    document.body.classList.add("nova-profile-lock");
    v.classList.add("nova-profile-view");
    if (w.getAttribute("data-nova-pc")) { applyCosmetics(); return; }

    var kids = Array.prototype.slice.call(w.children);
    var hero = null, cards = [], save = null, extras = [], h2s = [];
    kids.forEach(function (el) {
      if (el.tagName === "H2") { h2s.push(el); return; }
      if (el.classList && el.classList.contains("pf2-card")) {
        cards.push(el);
        if (el.querySelector(".pf2-save")) save = el;
      } else if (!hero && el.classList && el.classList.contains("glass-strong")) {
        hero = el;
      }
    });
    extras = kids.filter(function (el) {
      return el !== save && el !== hero && el.tagName !== "H2" && cards.indexOf(el) < 0;
    });

    var grid = document.createElement("div");
    grid.className = "nvp-grid";
    cards.forEach(function (card) {
      if (card === save) return;
      var ttl = ((card.querySelector(".pf2-title") || {}).textContent || "").toLowerCase();
      var sec = /identity/.test(ttl) ? "overview" : /photo/.test(ttl) ? "photo" : /basic|detail/.test(ttl) ? "details" : /bio/.test(ttl) ? "bio" : /link/.test(ttl) ? "links" : "overview";
      card.setAttribute("data-nova-sec", sec);
      grid.appendChild(card);
    });

    var toolbar = document.createElement("div");
    toolbar.className = "nvp-tabs";
    toolbar.innerHTML =
      '<div class="nvp-tabset">' +
        '<button type="button" data-nvp-tab="overview">' + svg("user") + 'Overview</button>' +
        '<button type="button" data-nvp-tab="photo">' + svg("image") + 'Avatar</button>' +
        '<button type="button" data-nvp-tab="details">' + svg("clipboard") + 'Details</button>' +
        '<button type="button" data-nvp-tab="bio">' + svg("book-open") + 'Bio</button>' +
        '<button type="button" data-nvp-tab="links">' + svg("globe") + 'Links</button>' +
      '</div>' +
      '<div class="nvp-quick">' +
        '<button type="button" data-nvp-act="collection">' + svg("star") + '<span>Collection</span></button>' +
        '<button type="button" data-nvp-act="customize">' + svg("palette") + '<span>Customize</span></button>' +
        '<button type="button" data-nvp-act="arcade">' + svg("gamepad-2") + '<span>Arcade</span></button>' +
        '<button type="button" data-nvp-act="activity">' + svg("chart") + '<span>Activity</span></button>' +
      '</div>';

    var store = document.createElement("div");
    store.className = "nvp-store";
    store.hidden = true;
    extras.forEach(function (n) { store.appendChild(n); });
    h2s.forEach(function (n) { store.appendChild(n); }); /* keep (was: dropped) */
    h2s.forEach(function (n) { store.appendChild(n); }); /* keep (was: dropped) */

    w.innerHTML = "";
    w.classList.add("nova-profile");
    w.setAttribute("data-nova-pc", "1");
    w.setAttribute("data-tab", profileTab);
    var cover = document.createElement("div");
    cover.className = "nv-cover";
    cover.innerHTML = '<div class="nv-cover-in"><span class="nv-cover-logo">' + logo("cover") + '</span><div><b>DOXILO</b><span>PLAYER PROFILE</span></div><span class="nv-cover-tag">NOVA</span></div>';
    w.appendChild(cover);
    if (hero) { hero.classList.add("nvp-hero"); w.appendChild(hero); }
    w.appendChild(toolbar);
    w.appendChild(grid);
    if (save) w.appendChild(save);
    w.appendChild(store);
    w.addEventListener("click", function (e) {
      var tb = e.target.closest("[data-nvp-tab]");
      if (tb) {
        profileTab = tb.getAttribute("data-nvp-tab");
        w.setAttribute("data-tab", profileTab);
        var all = w.querySelectorAll("[data-nvp-tab]");
        for (var i = 0; i < all.length; i++) all[i].classList.toggle("on", all[i] === tb);
        applyCosmetics();
        return;
      }
      var act = e.target.closest("[data-nvp-act]");
      if (!act) return;
      var a = act.getAttribute("data-nvp-act");
      if (a === "collection") { window.NovaShop.openCollection(); }
      else if (a === "customize") { window.NovaShop.open("banners"); }
      else if (a === "arcade") { try { window.NovaArcade.open(); } catch (x) {} }
      else if (a === "activity") { openActivity(w, store); }
    });
    var tabs = w.querySelectorAll("[data-nvp-tab]");
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.toggle("on", tabs[t].getAttribute("data-nvp-tab") === profileTab);
    applyCosmetics();
  }

  function openActivity(w, store) {
    var old = document.getElementById("nova-activity");
    if (old) old.remove();
    var m = document.createElement("div");
    m.id = "nova-activity";
    m.className = "nva2";
    m.innerHTML = '<div class="nva2-back" data-nva2-close></div><div class="nva2-panel"><header><div><span class="nvx-kicker">' + svg("chart") + 'Profile activity</span><h2>Your activity</h2></div><button type="button" class="nvx-close" data-nva2-close>' + svg("x") + '</button></header><div class="nva2-body" id="nva2-body"></div></div>';
    document.body.appendChild(m);
    var body = m.querySelector("#nva2-body");
    var nodes = Array.prototype.slice.call(store.children);
    if (!nodes.length) body.innerHTML = '<div class="nvx-empty">' + svg("chart") + '<b>No activity yet</b><span>Saved battles, your battles, visitors and collection will show up here.</span></div>';
    nodes.forEach(function (n) { body.appendChild(n); });
    m.addEventListener("click", function (e) {
      if (e.target.closest("[data-nva2-close]")) closeActivity(store, body);
    });
    requestAnimationFrame(function () { m.classList.add("open"); });
  }
  function closeActivity(store, body) {
    var nodes = Array.prototype.slice.call(body.children);
    nodes.forEach(function (n) { store.appendChild(n); });
    var m = document.getElementById("nova-activity");
    if (m) m.remove();
  }

  function badgeIcon(id) {
    for (var i = 0; i < CUSTOM.badges.length; i++) if (CUSTOM.badges[i].id === id) return CUSTOM.badges[i].icon || "star";
    return "star";
  }

  function applyCosmetics() {
    var root = profileRoot();
    if (!root) return;
    var w = root.w;
    if (!w.classList.contains("nova-profile")) return;
    var banner = customEquipped("banners"), wall = customEquipped("walls"), size = customEquipped("sizes");
    var glow = customEquipped("nameglow"), avglow = customEquipped("avglow"), badge = customEquipped("badges");
    w.setAttribute("data-nova-banner", owned("banners", banner) ? banner : "none");
    w.setAttribute("data-nova-wall", owned("walls", wall) ? wall : "none");
    w.setAttribute("data-nova-size", owned("sizes", size) ? size : "standard");
    var old = w.querySelector(".nv-cover");
    if (old) old.style.display = banner === "none" || !owned("banners", banner) ? "none" : "";
    var nameEl = w.querySelector(".nvp-hero .font-display, .nvp-hero b");
    var bd = w.querySelector(".nv-user-badge");
    if (bd) bd.remove();
    if (nameEl) {
      customItems("nameglow").forEach(function (it) { nameEl.classList.remove("nv-glow-" + it.id); });
      if (glow !== "none" && owned("nameglow", glow)) nameEl.classList.add("nv-glow-" + glow);
    }
    var heroAv = w.querySelector(".nvp-hero img");
    if (heroAv) {
      customItems("avglow").forEach(function (it) { heroAv.classList.remove("nv-ring-" + it.id); });
      if (avglow !== "none" && owned("avglow", avglow)) heroAv.classList.add("nv-ring-" + avglow);
    }
    if (nameEl && badge !== "none" && owned("badges", badge)) {
      var sp = document.createElement("span");
      sp.className = "nv-user-badge nv-badge-" + badge;
      sp.innerHTML = svg(badgeIcon(badge));
      nameEl.appendChild(sp);
    }
    try { window.novaStyleChat && window.novaStyleChat(); } catch (e) {}
  }

  /* ---------- welcome tour ---------- */
  var TOUR_STEPS = [
    { ic: "sparkles", t: "Welcome to the arena", b: "Your profile is fresh, your XP is zero and everything is unlocked by playing. Let's take a 60-second tour." },
    { ic: "grid", t: "One dock. Five moves.", b: "Home, Discover, Create, Chat and Profile live in the bottom dock. The sidebar holds the rest — diary, shop, quiz, arcade and settings.", a: "Show me", act: "drawer" },
    { ic: "shopping-bag", t: "XP Shop — 40% off", b: "15 categories, every price cut to 40%. Colors, frames, titles, effects, bubbles and exclusive profile banners.", a: "Open shop", act: "shop" },
    { ic: "star", t: "My Collection", b: "Everything you buy lands in My Collection — grouped by category, with one-tap apply and reset controls.", a: "Open collection", act: "collection" },
    { ic: "gamepad-2", t: "Nova Arcade", b: "Four fully playable games: Doodle Jump, Snake, Ludo with bots and Chess with an AI opponent.", a: "Play now", act: "arcade" },
    { ic: "user", t: "Make it yours", b: "Open your profile to change avatar, details and links. Add a banner, wallpaper, name glow or cinema-size layout.", a: "Go to profile", act: "profile" },
    { ic: "check", t: "You're ready", b: "Earn XP, climb tiers and flex your collection. The tour is always available again from Appearance → Replay tour.", a: "", act: "" }
  ];
  var tourIndex = 0;

  function buildTour() {
    if (document.getElementById("nova-tour")) return;
    var el = document.createElement("div");
    el.id = "nova-tour";
    el.innerHTML = '<div class="nvt-card"><div class="nvt-glow"></div>' +
      '<div class="nvt-top"><span class="nvt-logo">' + logo("tour") + '</span><span class="nvt-step" id="nvt-step">Step 1 / 7</span><button type="button" class="nvx-close" data-nvt-skip aria-label="Skip tour">' + svg("x") + '</button></div>' +
      '<div class="nvt-art" id="nvt-art"></div>' +
      '<div class="nvt-tx"><h2 id="nvt-title">Welcome</h2><p id="nvt-body"></p></div>' +
      '<div class="nvt-dots" id="nvt-dots"></div>' +
      '<div class="nvt-actions"><button type="button" class="nvt-skip" data-nvt-skip>Skip tour</button>' +
      '<div><button type="button" class="nvt-back" id="nvt-back">Back</button><button type="button" class="nvt-next" id="nvt-next">Next</button></div></div>' +
      '<div class="nvt-bar"><i id="nvt-bar"></i></div></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-nvt-skip]")) { finishTour(); return; }
      if (e.target.closest("#nvt-next")) { tourNext(); return; }
      if (e.target.closest("#nvt-back")) { tourPrev(); return; }
      if (e.target.closest("[data-nvt-act]")) { tourAction(e.target.closest("[data-nvt-act]").getAttribute("data-nvt-act")); }
    });
    document.addEventListener("keydown", tourKeys);
  }

  function tourKeys(e) {
    if (!document.getElementById("nova-tour") || !document.getElementById("nova-tour").classList.contains("open")) return;
    if (e.key === "ArrowRight") tourNext();
    if (e.key === "ArrowLeft") tourPrev();
    if (e.key === "Escape") finishTour();
  }

  function paintTour() {
    var step = TOUR_STEPS[tourIndex];
    var u = user() || {};
    var el = document.getElementById("nova-tour");
    if (!el) return;
    el.querySelector("#nvt-step").textContent = "Step " + (tourIndex + 1) + " / " + TOUR_STEPS.length;
    var title = step.t.replace("{name}", u.name || "player");
    var body = step.b.replace("{name}", u.name || "player");
    el.querySelector("#nvt-title").textContent = title;
    el.querySelector("#nvt-body").textContent = body;
    el.querySelector("#nvt-art").innerHTML = '<span class="nvt-ic">' + svg(step.ic) + '</span>' + (step.a ? '<button type="button" class="nvt-go" data-nvt-act="' + step.act + '">' + esc(step.a) + ' →</button>' : '<span class="nvt-go ghost">' + (tourIndex === TOUR_STEPS.length - 1 ? "Ready" : "Keep going") + '</span>');
    el.querySelector("#nvt-dots").innerHTML = TOUR_STEPS.map(function (s, i) { return '<i class="' + (i === tourIndex ? "on" : i < tourIndex ? "done" : "") + '"></i>'; }).join("");
    el.querySelector("#nvt-bar").style.width = ((tourIndex + 1) / TOUR_STEPS.length * 100) + "%";
    el.querySelector("#nvt-back").style.visibility = tourIndex ? "visible" : "hidden";
    el.querySelector("#nvt-next").textContent = tourIndex === TOUR_STEPS.length - 1 ? "Start exploring" : "Next";
  }

  function showTour() {
    buildTour();
    var el = document.getElementById("nova-tour");
    if (el.classList.contains("open")) return;
    tourIndex = 0;
    paintTour();
    el.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }
  function finishTour() {
    var el = document.getElementById("nova-tour");
    if (el) el.classList.remove("open");
    document.documentElement.style.overflow = "";
    try { localStorage.removeItem("nova_tour_pending"); localStorage.setItem("nova_tour_done", "1"); } catch (e) {}
    try { if (typeof window.fireConfetti === "function") window.fireConfetti(); } catch (e) {}
    try { window.navTo("home"); } catch (e) {}
  }
  function tourNext() {
    if (tourIndex >= TOUR_STEPS.length - 1) { finishTour(); return; }
    tourIndex++;
    paintTour();
  }
  function tourPrev() { if (tourIndex > 0) { tourIndex--; paintTour(); } }
  function tourAction(a) {
    if (a === "drawer") {
      try { window.openDrawer && window.openDrawer(); setTimeout(function () { try { window.closeDrawer && window.closeDrawer(); } catch (e) {} }, 1800); } catch (e) {}
      return;
    }
    if (a === "shop") { finishTour(); setTimeout(function () { open(); }, 160); return; }
    if (a === "collection") { finishTour(); setTimeout(function () { openCollection(); }, 160); return; }
    if (a === "arcade") { finishTour(); setTimeout(function () { try { window.NovaArcade.open(); } catch (e) {} }, 160); return; }
    if (a === "profile") { finishTour(); setTimeout(function () { try { window.navTo("profile"); } catch (e) {} }, 160); }
  }

  function maybeTour() {
    if (document.getElementById("nova-tour") || document.getElementById("nova-auth")) return;
    var pending = false;
    try { pending = localStorage.getItem("nova_tour_pending") === "1"; } catch (e) {}
    if (!pending) return;
    if (!document.querySelector("#app .view.active")) return;
    setTimeout(function () {
      showTour();
      try { localStorage.removeItem("nova_tour_pending"); } catch (e) {}
    }, 650);
  }

  /* ---------- appearance sheet replay button ---------- */
  function enhanceSheet() {
    var p = document.querySelector(".nova-panel");
    if (!p || p.querySelector("#nova-tour-replay")) return;
    var ver = p.querySelector(".nova-ver");
    var b = document.createElement("button");
    b.type = "button";
    b.id = "nova-tour-replay";
    b.className = "nova-reset";
    b.style.marginTop = "8px";
    b.textContent = "Replay welcome tour";
    b.addEventListener("click", function () {
      try { window.NovaUI.close(); } catch (e) {}
      setTimeout(showTour, 120);
    });
    if (ver) p.insertBefore(b, ver); else p.appendChild(b);
  }

  /* ---------- init ---------- */
  patchPrices();
  try {
    if (typeof NAV_EXTRA !== "undefined" && !NAV_EXTRA.some(function (x) { return x.v === "arcade"; })) {
      NAV_EXTRA.push({ v: "arcade", ic: "gamepad-2", l: "Nova Arcade", c: "#F97316" });
    }
  } catch (e) {}

  function wallsList() { return CUSTOM.walls.slice(); }
  function wallOwned(id) {
    var it = customItem("walls", id);
    if (!it) return false;
    return owned("walls", id);
  }
  function applyWall(id) {
    var it = customItem("walls", id);
    if (!it) return false;
    if (it.p > 0 && !owned("walls", id)) { toastMsg("Unlock this wallpaper in the XP Shop.", "error"); return false; }
    COS.equipped.walls = id;
    saveCos();
    var u = user();
    var r = u && u.uid ? dbRef("users/" + u.uid + "/shop/walls") : null;
    if (r) { try { r.set(id).catch(function () {}); } catch (e) {} }
    applyCosmetics();
    try { render(); } catch (e) {}
    try { window.novaStyleChat && window.novaStyleChat(); } catch (e) {}
    toastMsg(strip(it.n || id) + " applied to profile & chat.");
    return true;
  }
  window.NovaShop = { open: open, close: close, openCollection: openCollection, apply: applyCosmetics, buy: buy, equip: equip, walls: wallsList, wallOwned: wallOwned, applyWall: applyWall };
  window.NovaTour = { show: showTour, replay: showTour, finish: finishTour };

  window.NovaHooks.push(function () {
    patchPrices();
    compactProfile();
    enhanceSheet();
    maybeTour();
  });
  setTimeout(function () { patchPrices(); compactProfile(); enhanceSheet(); maybeTour(); }, 900);
  setTimeout(function () { patchPrices(); compactProfile(); }, 2600);
  setTimeout(function () {
    try {
      var q = new URLSearchParams(location.search).get("nova");
      if (q === "shop" && window.NovaShop) open();
      else if (q === "arcade" && window.NovaArcade) window.NovaArcade.open();
    } catch (e) {}
  }, 2800);
})();

