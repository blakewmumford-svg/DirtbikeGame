# Dirtbike Game

A browser-based Three.js dirtbike stunt game, continued from the November 14, 2026 Codex chat.

**Current game:** `dirtbike_wheelie_landing_fixed.html` — this is the source of truth, despite its old filename. All current reaction sounds and original DnB music are embedded. Start with `AGENTS.md` and `SESSION_HANDOFF.md`; detailed history is in `docs/CHAT_HISTORY_HANDOFF.md`.

## Already imported into GitHub

This project was transferred to https://github.com/blakewmumford-svg/DirtbikeGame on `main`. New Codex chats should open that repository and read `AGENTS.md` and `SESSION_HANDOFF.md`. `NEW_CHAT_PROMPT.txt` contains a ready-to-paste continuation message. The following import instructions are retained for future copies.

## Import into another GitHub/Codex project

1. Download and unzip the port package.
2. Upload the **contents inside `DirtbikeGame`** to your GitHub repository, then commit them. Do not upload only the ZIP or create an extra nested repository folder by accident. If your repository already contains work, ask the new Codex chat to inspect and merge the package instead of replacing files blindly.
3. In your Codex project/cloud environment, select this repository and the branch with those committed files. If the environment was created before the upload, have Codex check the latest repository revision.
4. Paste the contents of `NEW_CHAT_PROMPT.txt` into your new chat.

Alternative: attach the ZIP directly to the new Codex chat and ask it to extract the folder into its repository checkout, inspect the existing files, and commit the import. It needs access to your repository to save there. A ZIP attached to a chat is not automatically a GitHub commit.

## Run and test

Node.js 20+ is recommended. The game itself has no build step.

```sh
npm ci
npm run check
npm start
```

Open the environment's preview for port 8000, or `http://localhost:8000` on the machine running it. A cloud development preview is not automatically a publicly playable URL for a second device. Hosting over HTTPS may be needed for easy Android access and secure WebRTC.

Browser tests:

```sh
npx playwright install --with-deps chromium
npm test
```

If Chromium is already at `/usr/bin/chromium`, the tests use it. Otherwise they use Playwright's installed browser. Override with `CHROMIUM_PATH` when needed. Tests run sequentially and write to the ignored `reports/` folder. They serve test-instrumented copies; the real game HTML has no test hooks.

The Three.js and Trystero test fixtures were fetched through verified TLS so deterministic checks do not require live CDN downloads. Their use in tests does **not** make the shipped game offline: the game still loads Three.js and Trystero from CDNs.

`npm test` covers dust, wheelie behavior, independent bike/voice gain, uploaded-only reactions and long playback, menu/game music and mobile controls, plus **simulated** Trystero message delivery. It does not prove real public-relay or two-device networking.

```sh
npm run diagnose:trystero
```

This separately attempts real public-relay connections. Read `reports/trystero-live-results.json`; successful script completion alone does not mean a connection succeeded.

## Assets and saves

- `npm run extract:audio` recovers the embedded WAV reactions and original menu/riding MP3s into `assets/extracted-audio/`. Those extracted files are for editing; the game still uses embedded data.
- Generated reaction voices were removed. Only uploaded reactions are allowed. The full Mickey scream uses nearly nine seconds, not a short trim or a stretched synthetic substitute.
- Browser tuning/settings are saved per device/origin. Export your tuning JSON before moving to a different hosted URL. The repository cannot capture a user's browser storage automatically.
- `Dirtbike_Launcher.html` was mentioned but never uploaded to this chat, so it is not included. If you have it, add it separately without silently rewriting it.
- Raw screen-recording source videos are not included. For a new trim beyond the embedded audio, upload the original recording again.

## Current multiplayer status

Default: Trystero MQTT/WebRTC. Optional: Supabase direct Realtime WebSocket. **Neither has been confirmed working between the owner's real Chromebook and tablet.** The reported Trystero failure is all three relays closed. Supabase requires a real project URL and browser-safe publishable key, which have not been supplied. See `SESSION_HANDOFF.md` before changing this.

## Repository layout

- Root game HTML: current source; update this same file.
- `AGENTS.md`: durable instructions Codex should read.
- `SESSION_HANDOFF.md`: current state; update after meaningful work.
- `docs/CHAT_HISTORY_HANDOFF.md`: detailed historical context.
- `docs/previous-test-results/`: evidence from the previous workspace, including known network failures; not a guarantee all current tests were rerun there.
- `tests/`, `scripts/`, `package.json`, `package-lock.json`: portable check/run/test tools.
- `archive/original_V3Y.html`: untouched historical backup, not the current game.
- `IMPORT_MANIFEST.json`: initial file hashes, for verifying this transfer.

The game includes user-supplied media. No license for the game or those uploads is asserted by this package. Third-party test fixtures are described in `THIRD_PARTY_NOTICES.md`.
