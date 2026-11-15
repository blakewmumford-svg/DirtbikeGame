# Move this package into your project

## Easiest: let the new Codex chat import it

1. Download `DirtbikeGame_Port_2026-11-14.zip` from the old chat.
2. Start a chat in the new Codex project with your intended GitHub repository selected.
3. Attach the ZIP and paste `NEW_CHAT_PROMPT.txt` (also shown in the old chat's final response).
4. Ask Codex to inspect the checkout, extract the package into the repository root, run its checks, and save/commit the import. Existing files must be reviewed before overwriting them.
5. Confirm that the game HTML, `AGENTS.md`, and `SESSION_HANDOFF.md` are visible in GitHub on the branch future chats will use. A task's local changes are not automatically available in every new task.

## If the new chat cannot take the ZIP

On your Chromebook, open Files, open the ZIP and copy out `DirtbikeGame`. On GitHub, open the repository, choose Add file > Upload files, and upload the folder's CONTENTS into the repository root, then commit. Ensure hidden files such as `.gitignore` are included when your file picker supports them; Codex can recreate those from the ZIP if necessary. Then ask the new Codex chat to refresh/check out that committed branch and read the handoff.

If your repository has existing files, ask Codex to merge deliberately rather than replacing everything. If your project environment cached an empty repository, have Codex check the latest remote revision or refresh the environment; do not assume the old workspace updated itself.

## Optional original videos

`Dirtbike_Original_Recordings_2026-11-14.zip` contains the five original screen recordings. The main game needs none of those files to run: its current voices and music are embedded. Add the optional videos under `assets/original-recordings/` if you want the new chat to make future trims from the raw sources. Unzip them before uploading to GitHub; each individual video is under 25 MB. See `assets/source-recordings.json` for names and checksums.

No launcher HTML, browser tuning JSON, Supabase account settings, or repository credentials were supplied in the old chat. Add your launcher or exported tuning separately if you want them available. No account setup or deployment is performed by this package.
