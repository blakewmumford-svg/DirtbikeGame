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

In the game, open **Enter → Debug → Publish defaults (owner only)** and press **Copy settings & open GitHub**. Your current tuning and hitbox/contact view choices are copied. In GitHub, sign in as `blakewmumford-svg`, choose **Run workflow** on **main**, paste into **Settings copied from game**, and confirm **Run workflow**. If clipboard access is blocked, the game shows selected text you can copy manually. You do not need to download a JSON file.

The **Publish owner defaults** workflow permits only the repository owner on `main`. It validates every setting against the game's current schema, commits the defaults to the game HTML, and deploys the updated site in the same run. Invalid/outdated settings fail without a commit. GitHub branch protections or denied Actions write permissions can block the push; inspect the failed workflow rather than assuming publication succeeded.

This is an explicit publishing action, not automatic publication of every slider movement. Ordinary players can only save their own settings. Existing browser settings are preserved; **Defaults** loads the latest published values. No GitHub token or password goes into the game. The copy button itself is visible to everyone, but GitHub enforces ownership before the workflow runs. No live owner-default publish has been executed during development.

## Debug access and steering

Press **Enter** while riding to open the Debug tab; press it again to close. Text-entry fields keep their normal Enter behavior. Mobile has no Garage button or Debug shortcut prompt. Sideways tabletop tilt has been removed from arrow keys, touch buttons and controllers. A/D and the controller left stick retain steering/air yaw spins; right stick controls the camera.

## Modifier tricks and natural disasters

Airborne tricks: hold **Shift** for a no-hander, tap **Ctrl** for a superman, or tap **Alt** for a can-can. Ctrl/Alt taps play a short pose, so release those modifier keys before pressing other browser shortcut keys. Landing returns the rider to the normal pose. Shift remains ground boost; boosted takeoff speed carries into the jump.

Automatic disasters start every ten minutes and last two minutes: thunderstorms, dust storms, earthquakes, shallow floods, wildfires and meteor showers. Party mode adds colorful confetti and is manual only. Events preserve rideable routes and existing bike handling; first-person stays steady. Solo timing follows active riding. In multiplayer the host keeps the room clock running even in menus/pause, with elapsed-time catch-up after background throttling; the host must keep the game open. Local moon-fall visuals take priority.

For immediate testing: **Enter → Debug → Natural disasters**, choose an event and press **Start now**. In multiplayer, the host starts/stops it for everyone; guests cannot override it. **Stop event** clears it across the room. Host announcements carry the current event and timers for late joins/reconnects. The host’s Automatic events checkbox controls automatic room events. Thunder gets an initial rumble when started (subject to sound settings/browser audio unlock). Party mode is excluded from the random pool.

## Touch, keyboard and connected controllers

Phones/tablets automatically show multi-touch controls in portrait or landscape. Steer and hold Gas with separate fingers; Gas/Brake also control airborne flips. Wheelie is a tap, and Boost remains the ground boost control. The single Random trick button picks Superman, Can-can or No-hander while airborne. Camera/Pause/Repair are pinned to the bottom-left edge; Random trick is directly above Brake at the same size, with the center kept clear. Use **Info → Touch controls** to choose Automatic, Show or Hide. Sound sliders are inside Info on touch devices.

Keyboard controls remain available at the same time. Standard Bluetooth/USB controllers work through the browser's Gamepad API: RT/R2 throttle, LT/L2 brake, left stick steering/air yaw, A/Cross wheelie, Y/Triangle camera, X/Square reset. RB/R1 is ground boost/air no-hander; LB/L1 is ground pause/air superman; B/Circle is ground contact probes/air can-can. Right stick orbits the camera. L3 pauses anywhere. D-pad left repairs; Start/Options opens the garage. Press a controller button after connecting so the browser can discover it.

Touch holds release on pointer cancellation, menu entry, pause, reset, tab hiding, lost focus or orientation change. Releasing touch does not release a physical keyboard key; disconnecting a controller clears its analog input. Touch preference saves separately on each device. Browser emulation and a mocked standard Gamepad API have been tested; physical Android/Chromebook/controller combinations still need player testing.


## Rider poses and finding friends

The rider automatically crouches forward under throttle and leans back while braking forward travel. At a stop, both boots lower to the terrain. Reversing alternates walking steps with hands still on the handlebars; the feet return to the pegs when riding forward or airborne. These poses are visual and preserve existing steering, physics and deliberate wheelie controls.

Active multiplayer riders have paint-colored direction arrows with names and distances. Off-screen/behind-camera friends get edge arrows; visible friends get a marker pointing down toward them. Rainbow riders get cycling arrow colors. Indicators hide for stale/non-riding peers and clear on leave. This uses existing peer-position messages and does not establish that real cross-device connectivity is working.


## Shared room tuning

In multiplayer, the host's tuning applies to everyone in that room, including late joiners. Guest tuning/preset controls are read-only and non-host tuning messages are ignored by the normal client. Leaving restores the guest's local solo tuning; temporary room tuning is not written over it. Host announcements periodically refresh settings. This is room-level host authority, not account authentication or a server-side anti-cheat system. Publishing built-in defaults for every future player remains the separate GitHub-owner workflow.


## Expanded stunt park and wildlife

All three maps now have fifteen ramps (the original seven plus eight new jumps) and six jump-through stunt rings. New ramp approaches are cleared of scattered rocks/hills.

Bears chase nearby riders and can cause damage/ragdoll on contact. Foxes flee approaching riders. Two wolf packs have 5–15 wolves each: they howl/growl nearby and attack only within four meters. A pack-wide cooldown limits repeated bites. Use **J** to repair/recover or **R** to reset. Calls are synthesized and follow the existing effects volume/mute rules. Wildlife uses instanced meshes for mobile efficiency. Animals and damage are simulated locally on each client; wildlife AI is not a shared authoritative multiplayer simulation. Shared disasters are synchronized separately.
