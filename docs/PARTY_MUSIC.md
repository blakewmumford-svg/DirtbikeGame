# Neon Overdrive

Original K-pop-style instrumental composed for Dirtbike Game, November 15, 2026.
Tempo: 128 BPM. Duration: 120 seconds. Stereo MP3: 160 kbps, 44.1 kHz.

Intro (0:00), Verse 1 (0:07.5), Pre-chorus (0:22.5), Chorus (0:37.5), Dance break (0:52.5), Verse 2 (1:00), Build (1:15), Bridge (1:22.5), Final chorus (1:30), Outro (1:52.5).

The original melody, chord voicings, bass patterns, percussion and arrangement are defined in `scripts/compose-party.py`. Drums and stereo leads are synthesized; piano, strings, bell and picked-instrument layers use FluidSynth with TimGM6mb. Production includes sidechain-style envelopes, stereo delays, room reflections, a short outro fade and a loudness-normalized master. No commercial song, uploaded screen recording or generated human voice is used. The seven uploaded crash reactions remain separate.

The game embeds the finished MP3 as PARTY_MUSIC_DATA, with PARTY_TRACK holding its section metadata. Decode occurs asynchronously after audio unlock. Playback starts at shared party-event time rather than at an arbitrary point in a continuously running short loop. The source is stopped/disconnected while inactive and recreated on resume/new events.

Instrument-bank credit: TimGM6mb, copyright 2004 Tim Brechbill and 2010 David Bolton, distributed under GPL version 2. Source: https://github.com/musescore/musescore-old/commit/90c33ef9d87b3f5ff92efd3b07d89eb455fb1fef . The bank itself is not bundled in this repository. Credit and license text are in `licenses/TimGM6mb.txt`.

To reproduce: install Python NumPy/SciPy, libfluidsynth, timgm6mb-soundfont and FFmpeg, then run `python scripts/compose-party.py`. It writes a WAV master, MP3 and track.json under ignored `reports/party-production/`. Re-embedding an updated master requires replacing the JSON string PARTY_MUSIC_DATA with its base64 bytes and updating PARTY_TRACK from track.json. Runtime remains the single distributable HTML.
