# Current handoff — read before editing

Snapshot: November 14, 2026, America/Vancouver. Imported from the long projectless Codex chat. The owner has now created a GitHub repository and a Codex project. This package was transferred directly into `blakewmumford-svg/DirtbikeGame` for the repository import. Work from this checkout; no ZIP extraction is needed.

## Current source

`dirtbike_wheelie_landing_fixed.html` is the only current game source in the repository root. Import SHA-256: `50c1fdaf31fc972b74cccea399d645411e0edb66acc1dfd35203de1bc6bbe041` (2,701,988 bytes). Future valid edits will change this hash.

Read `docs/CHAT_HISTORY_HANDOFF.md` for the full feature/history/asset/save details. Its `/workspace/output` and `/workspace/work` references describe the previous chat, not this new repository. Use repository-relative paths here. Old helper generators were deliberately excluded: some would overwrite later work.

## Latest features

- Three.js dirtbike stunt game with menus, ten colors, three island themes, ramps, tuning/presets, ragdoll/deformation, debug tools, controller support, and moon-fall scene.
- Wheelie mode turns off at airborne touchdown or front-wheel return. Holding throttle does not automatically restart it.
- Uploaded crash voices only. Generated Oof/Ouch/Ow/etc clips were removed. Full Mickey recording is about 8.97 seconds; original Tyler clip remains seven seconds. Bubbles match clips, follow the rider, and cannot be interrupted by regular chatter.
- Procedural engine/gear/rev/impact sounds and original 172 BPM DnB music. Lighter menu loop changes to full riding loop. Separate Bike, Voices, and Music sliders save their settings. Global mute/pause/background behavior exists.
- Latest addition: rear-tire dust and dirt, visual only, pooled 40 sprites +18 chips. Grounded moving rear-tire contact emits; stationary/airborne/rear-off states do not. Menus/reset/space fall clear it. Three targeted browser checks passed; physical-device appearance/performance still needs the owner to try it.

## Main unresolved issue: multiplayer

Trystero is selected by default. Supabase remains available. The owner requested retrying Trystero before pursuing Supabase. Their actual log:

```
14:18:07 | Starting Trystero | hosting · 448
14:18:07 | Loading Trystero
14:18:08 | Relay status | test.mosquitto.org/mqtt:closed, broker.emqx.io/mqtt:closed, broker.hivemq.com/mqtt:closed
14:18:38 | No relay reachable | Try another network and copy connection details
```

Trystero 0.22.0/mqtt loads successfully. Relays are Mosquitto 8081, EMQX 8084, HiveMQ 8884, over WSS. No TURN service was configured. Real Chromebook/tablet joining is unconfirmed. Network type and results of a suggested hotspot comparison have not been supplied.

The previous test browser had public-relay TLS trust failures. With a real local MQTT broker, signaling offers/answers were exchanged but the environment produced no ICE candidates; an independent WebRTC probe also produced none. Simulated Trystero callbacks passed room/roster/map/pose/leave checks. Do not call that real cross-device success. The pinned MQTT `getRelaySockets()` may retain initial WebSocket references, potentially making retry reporting stale; investigate that as well as network reachability.

Supabase has no real project setup/credentials from the owner. Prior Phoenix-server tests were simulated. Do not treat the optional Supabase mode as a configured service.

## Import and next steps

1. Verify this root game matches the import hash, then read the docs.
2. Run `npm ci`, `npm run check`, and `npm test`; install Chromium if required.
3. Keep the current gameplay intact. Ask the owner what to work on next. For multiplayer, collect actual browser/relay errors and perform a real two-device test instead of blindly changing providers.
4. Commit the imported project and future handoff updates to the intended repository/branch. The previous chat connected to this repository to perform the import.

The complete playable audio/music is embedded in HTML. `npm run extract:audio` recovers working WAV/MP3 assets. Untrimmed source videos, launcher HTML, local tuning saves, accounts/credentials, and the old chat's full conversation do not automatically transfer.

## Port-package verification

The portable package was installed with `npm ci` and passed `npm run check` plus all six bundled browser suites (24 checks) in the original environment after replacing absolute paths with repository-relative paths. Embedded-audio extraction was also checked. This does not resolve the public-relay/physical-device multiplayer failure. Results of running the portable suites can be regenerated under `reports/` in the new project.

## Repository continuation

Repository: https://github.com/blakewmumford-svg/DirtbikeGame
Branch for the initial import: main. The repository was empty before transfer; existing work was not overwritten. Start new Codex chats from this repository and read this file plus AGENTS.md. The root HTML matched the verified port package at import; the rear-tire spray adjustment below changes that hash. Optional untrimmed recording videos were not added; playback audio and music are embedded. No deployment or repository visibility change was performed.

## Rear-tire spray visibility — November 14, 2026

Current source remains `dirtbike_wheelie_landing_fixed.html`. Increased the existing rear-tire dust slightly: larger, more visible puffs, modestly higher emission, and a little extra upward dust/dirt spray under throttle. Retains the 40-sprite/18-chip pool, terrain colors, contact gating, and cleanup. No physics or audio changes.

Validation: `npm run check` and all six `npm test` browser suites passed, including dust emission/excluded states/cleanup and bounded particle count. Physical Chromebook/tablet appearance and performance still need the owner's check. Real cross-device multiplayer remains unresolved. Next: try the updated HTML while accelerating on the ground and judge the spray amount.

## Debug dust-size control — November 14, 2026

Added **Rear-tire dust size** at the top of the Debug tab (G → Debug). Range 1×–12×; default/minimum 1× preserves the current spray. Higher values enlarge dust sprites and increase their upward launch speed for huge rising clouds. Dirt chips stay small; particle pools and physics remain unchanged. Uses the existing tuning schema, auto-save, presets, import/export and launcher profile bridge; old profiles default to 1×.

Validation: `npm run check`, all six browser suites, and a focused dust rerun passed. The new browser check verifies bounds, 12× cloud sizing, increased height, reload persistence and the unchanged 58-particle pool. Existing contact exclusions and cleanup still pass. Next: owner checks visual preference on the Chromebook/tablet; real cross-device multiplayer remains unresolved. Source remains `dirtbike_wheelie_landing_fixed.html`.

## Bike visual realism, throttle animation, rainbow paint — November 14, 2026

Current source remains `dirtbike_wheelie_landing_fixed.html`. Added 96 square rubber tread knobs per wheel (one instanced draw per tire), open spoked rims, hubs, brake discs/calipers, engine fins/covers/bolts, chain, foot pegs, suspension trim, tapered tank/shrouds and slimmer motocross fenders/number plate. Handlebars now include crossbar, grips, levers and cables. The original deformation/detachment references remain supported. These are procedural visual details within the existing stylized game; handling/collision dimensions are unchanged.

Mounted rider now has articulated arms and gloves. W/Up/controller throttle smoothly twists the right grip and wrist and dips the elbow; release returns to rest. Animation does not change engine/physics values. Added Rainbow as paint index 10, preserving existing color indexes and save key. It cycles about once every four seconds on painted parts in menus and riding; solid colors stay fixed. Rainbow selection uses existing menu save and room identity paths. Cloned remote paint uses explicit part tags so animated hues do not break later paint changes.

Validation: `npm run check` and all seven browser suites passed. Re-ran the visual suite after final bodywork changes; all four checks passed, including a running render loop with real W key press/release, tire tread, rainbow cycle, reload persistence and switching back to solid paint. Browser screenshot inspected under `reports/bike-realism.png`. Physical Chromebook/tablet appearance and performance still need the owner's check; multiplayer remains unverified across real devices. Next: try the updated HTML, choose Rainbow in bike colors, and use C for closer camera views of the throttle hand.

## Fixed first-person camera — November 14, 2026

First-person view now uses an exact bike-frame mount (local 0, 2.5, -0.30), forward of the helmet, aimed slightly down toward the front bike. Removed first-person position interpolation so acceleration, turns and switching views cannot make the camera trail backward into the rider. Camera orientation follows frame pitch/lean; external views, menus and the moon cutscene restore world-up. Other camera modes retain their existing follow smoothing.

Validation: syntax/audio check and the focused browser visual suite passed. A new camera check verifies identical local mount position after abrupt translation, yaw, pitch and lean, and world-up restoration on switching out. Inspected `reports/first-person.png`: unobstructed scene with front fender at the bottom, no helmet. Full regression result is recorded below after completion. Source remains `dirtbike_wheelie_landing_fixed.html`; real device performance and live multiplayer remain unverified.

Full first-person regression run: all seven `npm test` suites passed after the camera change. Next: owner tries C → first-person in the updated HTML.

## Stable hosting preparation — November 14, 2026

User requested a bookmarkable hosted address. Added `.github/workflows/pages.yml` using the official GitHub Pages actions. On main game changes or manual dispatch it stages only the current game HTML as `_site/index.html` and deploys that artifact, preserving the single HTML source of truth. README documents one-time Pages activation, expected address, per-device browser autosave, and a one-time JSON transfer from old downloads if needed.

Git read works through the existing platform proxy; `gh api repos/blakewmumford-svg/DirtbikeGame/pages` was denied. Runtime network policy excludes api.github.com, so CLI auth status cannot establish usable API credentials. No token was requested, copied or embedded, no network configuration was changed, and repository visibility was not changed. The owner must choose Settings → Pages → Source: GitHub Actions, then manually rerun the workflow if necessary. Hosting remains unverified until a successful deployment and an HTTP check of the public address. No automatic GitHub commit of browser tuning is implemented.

## Owner-default publishing and engine sound — November 14, 2026

Owner requested an in-game way to publish local tuning. Debug now has **Publish defaults (owner only)** → **Copy settings & open GitHub**. It snapshots tuning/debug choices, copies them (or exposes a selectable fallback), and opens the owner publishing workflow. User confirms in GitHub by pasting into **Settings copied from game** and running on main. This is an explicit two-site publishing flow, not silent slider auto-push. No credential is stored or requested by the HTML. The UI button is visible to everyone; the workflow only runs for `github.actor == github.repository_owner` on main.

Added `scripts/publish-defaults.mjs`: strictly validates the complete numeric schema and boolean debug views, then updates only built-in values and DEFAULT_DEBUG in the single game HTML. Added `.github/workflows/publish-defaults.yml`: validates/checks, commits, pushes, and deploys Pages in the same serialized run (GITHUB_TOKEN pushes do not trigger another workflow). Existing browser saves remain intact; the Defaults button now applies published debug-view defaults too. Actual GitHub dispatch with the owner's local settings has not been run; owner must confirm the first publish. README documents this flow and branch/Actions permission failure possibilities.

Owner also requested more realistic engine audio. Replaced the static harmonic exhaust tone with a generated, looping 16-cycle single-cylinder four-stroke combustion-pressure buffer, including small firing variations, exhaust resonance and high-frequency attack texture. Added DC filtering; reduced the pure crank tone and intake hiss; load-dependent exhaust filtering/level; slightly uneven idle; smoother RPM rise/fall; brief muted overrun burble on throttle release. Airborne free rev still follows throttle, sound-only shifts remain, and drivetrain/handling, uploaded-only voices, music and independent gains are unchanged. No external engine recordings were supplied or downloaded; this remains synthesized audio, tuned for a more natural exhaust character.

Validation in progress: syntax and publishing validation tests passed; focused engine browser checks passed for audible idle, bounded waveform, throttle response, airborne release despite high travel speed, gear selection, bike mute and pause. Full regression result follows after completion. Real device sound quality still needs the owner's audition. Source remains `dirtbike_wheelie_landing_fixed.html`.

Final validation: `npm run check`, publisher input/repeatability tests, both workflow YAML parses, and all nine bundled test suites passed, including browser settings-copy flow and existing audio/music/voice, wheelie, dust, camera, and simulated multiplayer regressions. Changes are being committed and pushed for the existing Pages deployment; live deployment cannot be verified here because the runtime network policy blocks the Pages/API destinations.

## Photo-reference bodywork and airborne tabletops — November 14, 2026

Owner supplied blue motocross/pit-bike references and a mountain-bike tabletop photo to clarify left/right arrow behavior. Updated the procedural bike to use thin shaped fender/tank/seat shells, angular radiator shrouds with white/cyan graphics, a tapered tail, aluminum twin-spar frame details, more upright forks, radiator slats, colored rim beads and 99 race plates. Existing paint choices (including Rainbow), knobby tread, sound, tuning and saves remain. This improves the stylized model silhouette; it is not a photorealistic scan or licensed brand replica.

Left/right keyboard arrows now control a sideways tabletop roll ONLY while airborne (roughly 80 degrees held). Bike and mounted rider lean as one frame; heading and horizontal travel remain unchanged. Release eases back upright. A/D and controller left stick retain ground steering/air yaw spins; up/down arrows still throttle/brake. Left/right arrows have no ground steering action. Help and jump-test instructions explain this split. A severe sideways landing uses the body-impact path rather than falsely counting as a clean tire landing. Reset/J repair restore roll; first-person and remote pose rendering use the same frame roll. Tire contact probes still approximate pitch-based two-wheel contact; this is not a full six-axis rigid-body solver.

Focused tabletop tests passed both directions, neutralization on release, unchanged yaw/travel, disabled ground arrows with working A steering, sideways landing/body collision, and repair/reset. Browser model screenshot inspected in reports/bike-realism.png. Current source remains dirtbike_wheelie_landing_fixed.html. Full regression outcome follows. Next: owner tries airborne arrows in the hosted game and judges resemblance and tabletop feel. Real multiplayer and physical device behavior remain unverified.

Final tabletop/model validation: `npm run check` and all ten browser/validation suites passed. Changes prepared for commit and push to main, which triggers the existing Pages workflow; live deployment status cannot be checked through this runtime's network policy.

## Solid ramps, modifier tricks and timed events — November 14, 2026

Owner reported see-through ramps. Root cause: the earlier shell winding correction had inadvertently also reversed the original ramp deck indices. Removed that reversal only inside addRamp; all seven decks now have upward normals and can be ray-hit from above. Added bases/end lips to close the existing side-skirt volumes. Verified a browser rendering in reports/solid-ramps.png. Bike shell winding is unchanged.

Added airborne rider tricks: Shift no-hander, Ctrl superman, Alt can-can, with articulated arms/legs and an upper-body rig. Ctrl/Alt support quick taps (1.2-second pose window) to avoid needing to hold a browser modifier with W; ordinary key combinations may remain browser-reserved. Landing/reset/menus/crashes return the pose to neutral. Shift still boosts on dirt. Airborne speed limits preserve boosted takeoff momentum when releasing Shift. Existing tabletop arrow and A/D controls remain.

Added non-destructive natural events: thunderstorm (rain/low thunder), dust storm (pooled drifting dust/mild haze), earthquake (low rumble/ground dust/gentle external-camera shake). First-person has no quake shake. Events do not remove objects or change drivetrain/terrain collision. First random event starts after 600 seconds of active riding, lasts 120 seconds, and next event starts 600 seconds after the prior start (480 seconds after its end). Menus, pause, hidden tabs and moon-fall suspend the timer/effects. Debug → Natural disasters provides a type selector, Start now, Stop event and locally saved Automatic events toggle. Stop reschedules the next automatic event in ten minutes. Weather is local per browser, not synchronized across multiplayer peers.

Focused tests passed upward/ray-visible decks on all seven ramps, distinct airborne poses and neutral landings, quick Ctrl/Alt taps, timing/cadence, manual start/stop, pause/menu freezing, and driving during every disaster. Full regression outcome follows. Physical-device appearance/performance and real multiplayer still need owner testing. Current source remains dirtbike_wheelie_landing_fixed.html.

Final validation: `npm run check`, `git diff --check`, and all eleven regression/validation suites passed. Ready for push to main and the existing Pages workflow. Hosted deployment cannot be independently checked from this runtime's blocked Pages/API network routes.

## Multi-touch controls, input parity, bottom-edge layout — November 14, 2026

Owner requested mobile, keyboard and controllers on mobile, then explicitly asked to move the utility buttons from the middle to the VERY bottom. Touch UI auto-detects coarse pointers/maxTouchPoints; per-device Info → Touch controls offers Automatic/Show/Hide. Multi-touch pointer capture uses an independent state/map, merged with keyboard and Gamepad values for throttle, braking, steering, tilt, boost, animation and audio. Gas/brake flip pitch in air. Tap Wheelie; Boost is ground boost/air no-hands. Tricks drawer offers all three stunt poses.

Camera/Pause/Repair sit flush against the bottom-left edge; Garage/Tricks against the bottom-right edge (safe-area inset honored). Primary riding pads sit just above them at the outer edges; no floating center toolbar remains. Tricks drawer is on the left edge. Mobile sound sliders moved into Info and the closed garage header is hidden, leaving the road view clear. Info is interactive and scrollable. Portrait/landscape screenshots inspected at reports/mobile-390.png and mobile-844.png. Touch holds clear on pointerup/cancel/lostcapture, menu, pause, reset, hidden tab, blur, pagehide, orientation change and hiding the controls. Keyboard and touch state are not conflated.

Standard controllers retain existing driving/menu navigation. RB/R1 adds air no-hander; LB/L1 adds air superman (still ground pause); B/Circle adds air can-can (still ground contacts); right-stick X adds air tabletop (ground camera orbit retained). L3 pauses anywhere. Hot-unplug clears controller values. No real hardware connection has been tested; simulated Gamepad API tests cover analog response, airborne trick/roll and disconnect.

Validation: syntax/audio check and all twelve suites passed before the final bottom-edge/Info CSS refinement. Focused mobile tests rerun on final layout, including exact bottom-edge button position, portrait/landscape bounds, two-finger throttle/steer with independent release/cancel, keyboard coexistence, menu/pause release, wheelie/tabletop/trick access, mobile gamepad input/disconnect and touch preference persistence. Final result follows. Source remains dirtbike_wheelie_landing_fixed.html. Next: owner refreshes the hosted game and tests actual devices. Live two-device multiplayer remains unverified.

Final validation: all twelve regression suites passed, then the final-layout mobile suite passed all six checks after the last CSS refinement. Exact utility-button bottom positions were asserted in portrait and landscape; Info preference hit-testing passed. Final syntax and diff-whitespace checks passed. Commit/push to main uses the existing automatic Pages deployment; no live deployment verification is available through this runtime's network policy.

## Player indicators, balance/walking poses, random mobile trick — November 14, 2026

Owner explicitly scoped this request to: color-coded arrows toward peers; forward/back rider lean for throttle/braking; feet down at stops and reverse walking while holding bars; one random mobile trick button. Implemented only these gameplay/UI changes plus their tests/docs.

Added paint-colored indicators with rider names/distances, screen-edge arrows for off-screen/behind peers and downward markers for visible peers. Uses existing remote pose registry; updates after camera placement, hides stale/non-riding/disconnected peers, removes DOM on leave, cycles rainbow color. No transport/protocol changes and no live cross-device connection claim.

Visual rider balance blends forward under throttle and back while braking forward motion. Feet lower to terrain at stops and in reverse; reverse steps alternate feet, hands remain attached to grips. Forward/airborne poses return to footpegs. No drivetrain, wheelie/steering, map, sound or disaster parameters changed. Upper body is hidden locally in first-person so the new leaning helmet cannot enter the fixed camera; cloned remote upper bodies remain visible.

Replaced the mobile Tricks drawer with a single Random trick button in the same bottom-right slot. Airborne taps uniformly select No-hander, Superman or Can-can; ground/paused/crashed use is disabled. Mobile Boost remains ground boost and no longer also selects a particular airborne trick. Keyboard/controller trick controls are unchanged. Bottom-edge layout is preserved.

Focused tests passed lean directions without simulation changes, terrain-level boots, alternating reverse steps with fixed hands, return to riding/air poses, all three random selections, indicator color/side/behind-camera behavior, stale hiding and leave cleanup. Reverse pose screenshot inspected at reports/reverse-walk.png. Existing throttle-arm check now compares elbow dip relative to the other arm because the requested new balance pose changes its neutral height. Full regression result follows. Source remains dirtbike_wheelie_landing_fixed.html; real devices and live multiplayer still need owner testing.

Final validation: `npm run check`, whitespace checks and all thirteen suites passed. The focused rider/indicator suite also passed after the final arrow-label spacing adjustment. Existing mobile test advances the visual frame before tapping the airborne-only random button; all three random outcomes are covered separately. Changes prepared for push to main and existing Pages automation; the hosted deployment cannot be independently verified through this runtime's network policy.

## Enter Debug, host room tuning, remove tabletop controls — November 14, 2026

Owner prioritized Enter opening debug, no mobile Debug affordance/shortcut popup, host-controlled shared room changes, and removal of sideways arrow tilt. Enter/Numpad Enter opens the Debug tab while riding and closes it on the next press (normal text fields/buttons retain Enter). Removed G shortcut; desktop header/help now say Enter. Removed mobile Garage button; collapsed tuner and shortcut hints stay hidden on touch. Random trick remains at the bottom-right.

Removed touch Tilt buttons and disabled arrow/controller tabletop roll. A/D/left-stick steering and air yaw spins remain; right stick again orbits the camera in air. Ground cornering lean is preserved.

Added shared tuning snapshots to existing host/welcome messages and a host tuning-update message. Guests accept tuning only through the already-selected-host message path, see disabled tuning/preset controls, and cannot change shared values via normal UI/applyValues. Host changes refresh all guests and periodic announcements catch late joiners. Local guest tuning is backed up and restored on leaving; room snapshots are not persisted over it. This is authority within the existing peer room, not authenticated backend/anti-cheat enforcement. Debug view toggles and local test actions are not a protocol for changing every peer's UI; room sharing covers tuning parameters. The separate GitHub-owner global-defaults workflow remains.

Validation: syntax and all thirteen suites passed. Extended simulated Trystero test checks real Enter key opening/closing, host-to-guest updates, guest read-only controls, ignored non-host updates, and local settings restored on leave. Updated mobile and arrow regression tests verify no Garage/Tilt buttons or sideways roll. Real-device/live cross-device network success remains unverified. Source remains dirtbike_wheelie_landing_fixed.html.

## Shared disasters, expanded course and reactive wildlife — November 14, 2026

Continuing all requests from the owner’s large world-expansion message: weather for everyone, new disasters/party, meteor showers, ten-minute cadence, random button above Brake, more jumps, animals, bear attacks, fleeing foxes, and wolf packs of 5–15 that attack only at close range.

Weather now uses immediate host `weather` messages plus current event snapshots on host announcements/welcome. Guests accept them only from the selected host through the existing validated-host path; cannot start/stop/override weather. Start/Stop and automatic checkbox updates broadcast. Late joins and periodic snapshots restore current effects and remaining time. Thunder has an immediate low rumble when started, respecting audio unlock/mute. Added shallow ride-through flood water, isolated animated wildfire patches/smoke, manual-only confetti party mode, and meteor showers with pooled glow/streaks. The automatic pool is storm/dust/quake/flood/fire/meteor; never party. Events last 120 seconds; automatic starts every 600 seconds. Solo counts active riding; room host uses a one-second elapsed-time clock that continues through menus/pause and catches up after background throttling. Host must keep the page open. Rendering interpolates between host ticks; local cutscene/hidden/pause visibility does not control the shared timer.

Random trick moved into the right riding pad in the same grid width/height directly above Brake. Bottom-left utility buttons remain at the bottom. Added eight ramps (15 total) and six jump-through rings; new approaches avoid scattered rocks/hills. Existing decks remain solid.

Added three bears, five foxes and two seeded wolf packs, each 5–15 wolves, with recognizable procedural meshes, roaming/gaits and instanced parts (40 draw batches rather than one draw per animal part). Bears chase within 65 meters and swipe within 2.3 meters, causing damage/ragdoll with a six-second cooldown. Foxes flee within 25 meters. Wolves warn within 25 meters, howl/growl by pack distance, and attack only within four meters; five-second pack cooldown prevents simultaneous repeated bites. Existing damage scaling and repair/reset remain. Wildlife calls use synthesized audio through effects gain, without changing uploaded human reactions. Wildlife AI/damage are local per browser; not authoritative shared server animals. Shared-event synchronization is separate.

Focused tests passed all new effects and cleanup, party exclusion/meteor inclusion, timing, driveability, 15 upward-facing ramps and clear new ramp centers, bear chase/damage/ragdoll/cooldown, fox fleeing, wolf warning versus close attack and pack cooldown, and 5–15 pack counts. Simulated multi-peer tests verify actual guest effect visibility for host events, guest start rejection, snapshot restoration, stop propagation, late-join meteor state and room clock progress while host is in a menu. Screenshots inspected for wildlife, meteor sky and mobile button layout. Full final regression result follows. Current source remains dirtbike_wheelie_landing_fixed.html. No production network/hardware multiplayer claim is made from simulated tests.

Final validation: `npm run check`, `git diff --check` and all fourteen test suites passed on the final implementation. This includes simulated guest effect visibility for storm/flood/fire/party/meteor, late joins, room clock progress in host menus, event timing/pool checks, animal behaviors/cooldowns, new ramp surfaces and the exact mobile Random-trick/Brake alignment. Physical-device performance and production relay/two-device connectivity still require owner verification. All clients need to reload the deployed version to understand the new shared-event messages.
