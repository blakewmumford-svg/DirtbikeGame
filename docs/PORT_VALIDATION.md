# Port validation

Checked in the original Codex cloud environment after making the package portable:

- `npm ci` succeeded with the included lockfile.
- `npm run check` passed: JavaScript syntax, 90 unique HTML IDs, seven uploaded voice entries, music data, no product test hooks.
- `npm test` passed all six suites / 24 checks: dust, wheelie, split bike/voice volumes, uploaded reactions and full Mickey playback, music, and simulated Trystero integration.
- `npm run extract:audio` recovered seven WAVs, two MP3s, and reaction metadata.
- Current root game is byte-identical to the latest downloadable game; see IMPORT_MANIFEST.json.

Not established: working public-relay WebRTC on the owner's two devices, a real configured Supabase project, physical gamepad behavior, or Chromebook/Android performance under all gameplay conditions. The real relay diagnostic remains separate from the regression suite.

The browser suites serve instrumented copies and verified local Three.js fixtures. They do not inject hooks into the shipped HTML. Network certificates and ICE behavior from the previous cloud runtime must not be treated as proof of identical problems on the owner's devices.
