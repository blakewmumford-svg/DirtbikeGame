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
Branch for the initial import: main. The repository was empty before transfer; existing work was not overwritten. Start new Codex chats from this repository and read this file plus AGENTS.md. The root HTML remains byte-identical to the verified port package. Optional untrimmed recording videos were not added; playback audio and music are embedded. No deployment or repository visibility change was performed.
