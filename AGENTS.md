# Dirtbike Game — instructions for Codex

Read `SESSION_HANDOFF.md` and `README.md` before editing. Consult `docs/CHAT_HISTORY_HANDOFF.md` for detailed history. If the owner supplies a newer HTML, inspect it before choosing a starting point.

The current source of truth is `dirtbike_wheelie_landing_fixed.html`. The filename is historical: it includes later sound, music, multiplayer, and dust work. `archive/original_V3Y.html` is a backup, not the current game. Do not reconstruct from old handoffs or start the game over.

The owner uses a Chromebook and Android tablet through the browser. Keep instructions simple. Prefer updating the same distributable HTML. Preserve maps, tuning, saves/launcher bridge, controls, moon cutscene, physics, wheelie touchdown behavior, dust, embedded audio, and the three independent volume sliders.

Crash voices must use only the owner's uploaded recordings. No generated Oof/Ouch/etc. The Mickey scream (`recorded_wallace`, historical internal key) uses almost nine seconds at its original speed, with its matching bubble lasting for the clip. Preserve priority so other reactions cannot interrupt it. Engine/impact synthesis and original DnB music were explicitly requested and remain.

Current default multiplayer is Trystero MQTT/WebRTC; Supabase is selectable. Real cross-device play is NOT verified. Diagnose the owner's all-relays-closed log before switching providers. A relay reaching OPEN, a host being READY, or simulated tests passing do not prove a friend joined. Keep claims consistent with actual evidence.

Preserve localStorage keys and the launcher postMessage bridge. Launcher HTML was not provided in this port. Do not put secret/service-role keys in browser code. No real Supabase project credentials are included.

Validation:
- `npm run check`: JavaScript syntax, duplicate IDs, embedded audio sanity.
- `npm ci`, then `npm test`: portable Playwright suites; tests are sequential.
- If Chromium is absent: `npx playwright install --with-deps chromium`, or set `CHROMIUM_PATH` to an installed browser.
- `npm run diagnose:trystero`: real-relay diagnostic, separate from deterministic tests. Inspect its JSON results, not only process exit status.
- `npm start`: development preview on port 8000.

After meaningful changes, update `SESSION_HANDOFF.md`: what changed, which checks ran, unresolved issues, current source filename, and next useful step. Keep historical handoffs as history. Update the current state before committing so new chats can continue from it. Do not publish the game or change repository sharing solely to test it.
