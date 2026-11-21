/* ============================================================
   Doxilo — Nova build system
   Injects the nova/ design layer and modules into index.original.html
   and writes the self-contained production index.html.

   Usage:  node build.js
   Output: index.html (production, deploy-ready as-is)
   ============================================================ */
const fs = require("fs");
const path = require("path");

const root = __dirname;
// source files are kept with a trailing newline; the injector does not add one
const trim = (s) => s.replace(/\r?\n$/, "");
const src = fs.readFileSync(path.join(root, "index.original.html"), "utf8");
const css = trim(fs.readFileSync(path.join(root, "nova", "nova.css"), "utf8"));

// Order matters: core runtime -> shop -> multiplayer -> arcade -> quiz.
const parts = ["nova.js", "shop.js", "multiplayer.js", "arcade.js", "quiz.js"].map((name) => ({
  name,
  src: trim(fs.readFileSync(path.join(root, "nova", name), "utf8")),
}));

for (const part of parts) {
  if (/<\/script/i.test(part.src)) throw new Error(part.name + " contains </script — must escape");
}
if (/<\/style/i.test(css)) throw new Error("nova.css contains </style — must escape");

const cssSlot = /<!-- NOVA_SLOT:css -->/.test(src) ? "<!-- NOVA_SLOT:css -->" : null;
if (!cssSlot) throw new Error("NOVA_SLOT:css marker missing from index.original.html");

const cssInject =
  '<style id="nova-css">\n' + css + "\n</style>";
/* function replacers keep injected code literal — module sources may contain
   $&, $', $` etc. which String.replace would otherwise expand */
let out = src.replace(cssSlot, () => cssInject);

for (const part of parts) {
  const slot = "<!-- NOVA_SLOT:" + part.name.replace(/\.js$/, "").replace(/^nova$/, "nova") + " -->";
  const slotName = part.name.replace(/\.js$/, "");
  const marker = "<!-- NOVA_SLOT:" + slotName + " -->";
  if (!out.includes(marker)) throw new Error("marker missing: " + marker);
  const inject = '<script id="nova-' + slotName + '-js">\n' + part.src + "\n</script>";
  out = out.replace(marker, () => inject);
}

if (/NOVA_SLOT:\w+/.test(out)) throw new Error("unreplaced slot markers remain");

fs.writeFileSync(path.join(root, "index.html"), out);
console.log("built index.html", Buffer.byteLength(out), "bytes");
