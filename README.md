# Doxilo — Conquer Your Self · NOVA 3.0 Ultimate

Doxilo is a single-file debate-and-earn web app with a live arena, XP economy,
profile customization, World Chatter, Diamond Rooms, a **17-game Nova Arcade**,
a redesigned **Quiz Arena** and **real online multiplayer**. This package is
**Nova 3.0 Ultimate** — a full engineering pass over Nova 2.0: complete source
audit, 25+ verified bug fixes, dead-code cleanup, a restored modular build
system, 13 new games, rebuilt Ludo & Chess, a genuine cross-device multiplayer
layer with lobby/friends/invitations, a redesigned Quiz Arena, compact
navigation and a GitHub-ready structure.

> One HTML file in production. No build step to deploy. Works as a PWA on
> Android, iOS and desktop, offline included.

---

## Quick start

```bash
npx serve .            # or: python -m http.server 8080
# open http://localhost:8080/
```

Deploy → see `docs/DEPLOYMENT.md` (GitHub Pages in 4 steps + Firebase rules).

## What's inside

```
index.html            Production app (self-contained; built output)
index.original.html   Base document with NOVA_SLOT markers (dev source)
build.js              node build.js → injects nova/* into index.html
nova/
  nova.css            Design layer (tokens, themes, arcade/quiz/lobby skins)
  nova.js             Nova runtime (theming, auth screen, avatars, hooks)
  shop.js             XP Shop (15 categories) + My Collection
  multiplayer.js      NEW — Firebase rooms/lobby/friends/invites (+BC fallback)
  arcade.js           Arcade 3.0 — 17 games, sound engine, records
  quiz.js             NEW — Quiz Arena 2.0 (packs, daily, battles)
sw.js                 Offline shell (service worker v2)
manifest.webmanifest  PWA manifest (Arcade / Quiz / Shop shortcuts)
icons/                PWA icons (192/512/maskable/favicon/SVG mark)
docs/
  BUG_AUDIT.md        25+ verified bugs with exact original locations
  DEAD_CODE_REPORT.md Removals + verified-kept items
  CODE_CHANGES.md     Everything that changed
  TEST_REPORT.md      Executed browser test matrix + honest scope
  ARCHITECTURE.md     Module map, contracts, Firebase paths, protocol
  DEPLOYMENT.md       GitHub Pages + Firebase setup + recommended rules
```

## Nova Arcade — 17 games, 6 categories + Lobby

| Category | Games |
|---|---|
| Arcade Games | Doodle Jump · Snake · Pong · Breakout |
| Board Games | Ludo · Chess · Checkers · Connect Four · Tic-Tac-Toe |
| Puzzle Games | 2048 · Sudoku · Memory Match |
| Strategy Games | Minesweeper · Reversi |
| Racing Games | Neon Racer |
| Casual Games | Reaction Challenge · Simon Says |
| Lobby Games | Rooms + invites for Ludo, Chess, Checkers, Connect Four, Tic-Tac-Toe |

- Full Ludo rules (safe stars, blockades, home lanes, exact roll, extra turns,
  three-sixes forfeit) on an animated DOM board with bots, 2P/4P hot-seat and
  online play.
- Full chess rules (castling, en passant, promotion, 50-move, threefold,
  insufficient material) with **fixed** AI, 3 levels, chess clock, undo, hint,
  move history and draw/resign.
- Online play: create a challenge → share the `NX` code or invite link → your
  friend joins **from any device** when the Firebase backend is configured
  (same-browser tabs work offline via BroadcastChannel, labelled honestly).
- Every game: rules screen, restart, settings, best scores, W/L/D record,
  sound effects (toggleable, no assets), keyboard + touch controls.

## Quiz Arena 2.0

Hero + categories (General Knowledge, Science & Nature, Geography — powered by
the built-in country database, History, Sport, Movies & Music, Technology,
Mixed Bag), difficulties, timed questions, combo streaks, daily challenge,
**real-time quiz battles**, answer review, XP (local + account, transactional),
history, global leaderboard.

## Multiplayer & friends

Room codes (`NX*****`), shareable invite links (`?nova=arcade&g=…&m=…`),
public/private lobby rooms with player slots, friend search & requests,
in-app invite popups, presence with disconnect detection. Cross-device play
needs the Firebase backend (5-minute setup, `docs/DEPLOYMENT.md`); without it,
everything still works locally between tabs and the UI says so.

## Keyboard reference

`Ctrl/⌘+K` search · `Esc` close arcade/back · game keys shown per game
(arrows/WASD, `Space` roll dice, `H` chess hint, `U` undo, `F` minesweeper flag).

## Local data keys

`nova_ui_v2` (theme) · `nova_cos_v1` (collection) · `nova_arcade_hs_v1` (best
scores) · `nova_arcade_cfg_v1` (game settings) · `nova_arcade_stats_v1`
(record/history) · `nova_arcade_sound_v1` · `nova_wc_bubble` · `nova_tour_*` ·
`vq_*` (quiz XP/history/stats) · `doxilo_*` (session/admin/sound) · `wc_*`
(chat) · `vty_offline_db1` (offline database).

## Development

Edit `nova/*` (or the base document) and run:

```bash
node build.js        # → index.html (fails loudly on broken slots)
```

`index.original.html` + `nova/*` are the sources; `index.html` is generated
and is what you deploy. See `docs/ARCHITECTURE.md` for the module map and
`docs/BUG_AUDIT.md` / `docs/DEAD_CODE_REPORT.md` for the audit trail.

## License

MIT © 2026 Doxilo — see `LICENSE` (includes third-party notices: lucide
icons, Firebase SDK, Google Fonts, system emoji).
