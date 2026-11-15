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

## Stable hosted game (GitHub Pages)

The Pages workflow publishes only the current game HTML as the site's `index.html`; no build or secrets are required. One-time repository setup: **Settings → Pages → Build and deployment → Source → GitHub Actions**. After selecting that source, run **Actions → Publish game to GitHub Pages → Run workflow** if the first run failed before Pages was enabled.

Once that deployment succeeds, bookmark https://blakewmumford-svg.github.io/DirtbikeGame/ . Later updates to the main game HTML on `main` deploy automatically to that same address. Publication is public web hosting; it does not configure real multiplayer or change the repository's visibility. GitHub may require a suitable plan for Pages on a private repository.

Tuning and Debug sliders auto-save to browser storage at that stable origin. Keep using the same browser/profile and allow site storage. Settings survive game deployments but remain device-specific; clearing site data or using private browsing can remove them. This is not GitHub syncing. Old downloaded-file settings do not automatically transfer: import a tuning JSON once on the hosted site if needed. Rendering still loads Three.js from its existing CDN; this is not an offline installation.

## Publish your tuning as the defaults for new players

In the game, open **G → Debug → Publish defaults (owner only)** and press **Copy settings & open GitHub**. Your current tuning and hitbox/contact view choices are copied. In GitHub, sign in as `blakewmumford-svg`, choose **Run workflow** on **main**, paste into **Settings copied from game**, and confirm **Run workflow**. If clipboard access is blocked, the game shows selected text you can copy manually. You do not need to download a JSON file.

The **Publish owner defaults** workflow permits only the repository owner on `main`. It validates every setting against the game's current schema, commits the defaults to the game HTML, and deploys the updated site in the same run. Invalid/outdated settings fail without a commit. GitHub branch protections or denied Actions write permissions can block the push; inspect the failed workflow rather than assuming publication succeeded.

This is an explicit publishing action, not automatic publication of every slider movement. Ordinary players can only save their own settings. Existing browser settings are preserved; **Defaults** loads the latest published values. No GitHub token or password goes into the game. The copy button itself is visible to everyone, but GitHub enforces ownership before the workflow runs. No live owner-default publish has been executed during development.

## Airborne tabletop controls

Use **← / → only in midair** to lay the bike and rider sideways for a tabletop. Release to ease upright before landing. These arrows do not steer on the ground. **A / D** still steer on dirt and control flat yaw spins in the air; **W / S** (or up/down arrows) retain throttle/brake and airborne pitch control. Landing while strongly sideways causes a body impact; **J** repairs/rights the bike, **R** resets it.

## Modifier tricks and natural disasters

Airborne tricks: hold **Shift** for a no-hander, tap **Ctrl** for a superman, or tap **Alt** for a can-can. Ctrl/Alt taps play a short pose, so release those modifier keys before pressing other browser shortcut keys. Landing returns the rider to the normal pose. Shift remains ground boost; boosted takeoff speed carries into the jump.

Automatic events start every ten minutes of active riding and last two minutes. Thunderstorms bring rain and low thunder, dust storms bring drifting dust and mild haze, and earthquakes bring low rumbles, small dust puffs and gentle external-camera shake. These events do not destroy terrain, block ramps or change bike handling. First-person remains steady. Timers freeze in menus, while paused or while the tab is hidden; moon-fall effects take priority.

For immediate testing: **G → Debug → Natural disasters**, choose an event and press **Start now**. **Stop event** clears it. The Automatic events checkbox controls future automatic events and saves on this device. Weather timing/effects are local to each browser; they are not synchronized multiplayer disasters.
