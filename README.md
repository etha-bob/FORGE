# FORGE — iPhone Workout PWA

A no-build workout logger for an adjustable bench, dumbbells, and pull-up bar.
It is designed for GitHub Pages and an iPhone home-screen install.

## What it does
- Follow a rolling Upper A / Lower A / Upper B / Lower B rotation
- Walk through each exercise one at a time
- Log weight + reps per set with 5 lb tap steppers
- Auto-fill from the same exercise on the same A/B day
- Show a day-specific progression target
- Auto-starts a rest timer after every set (with beeps + phone vibration)
- Offers an optional iPhone Lock Screen rest timer through the Now Playing card
- Safely merge v1/v2 backups without overwriting existing history
- Work fully offline, including locally stored exercise start/finish guides

## Deploy free on GitHub Pages (2 minutes)
1. Create a new public repo on GitHub (e.g. `forge`).
2. Upload the repository contents (`index.html`, `forge-core.js`, `sw.js`,
   `manifest.webmanifest`, and `assets/`) to the root of the repo.
3. Go to **Settings → Pages**.
4. Under "Build and deployment", set **Source = Deploy from a branch**,
   **Branch = main**, **Folder = / (root)**. Save.
5. Wait ~1 minute. Your site is live at:
   `https://YOUR-USERNAME.github.io/forge/`

## Make it feel like a real app on your iPhone
1. Open the live URL in **Safari** on your iPhone 16 Pro Max.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the icon — it opens full-screen with no browser bars.
4. In FORGE, open **Program** and enable **Lock Screen timer** if you want rest
   countdowns in iPhone's Now Playing area. This can temporarily take over media
   controls and pause music while a rest timer is active.

## Notes
- All logs live in your phone's browser storage (localStorage). They persist
  between sessions but are tied to that browser. Don't "clear website data" for the
  site unless you want to wipe your history.
- Deploy updates at the same GitHub Pages URL to retain local data. If the URL or
  device changes, use **Data → Export** on the old install and **Data → Import**
  on the new one. Import merges safely and creates a restorable snapshot first.
- The rest timer keeps your screen awake during a workout (where supported).
- A GitHub Pages PWA cannot create native Live Activities or guarantee a future
  local notification after iOS fully suspends it. Lock Screen mode uses silent
  media playback to keep a system-visible countdown active and attempts a normal
  completion notification when the OS permits it.
- See [ROADMAP.md](ROADMAP.md) for the routine rationale, media research, and
  planned enhancements.

## Check the core logic

```powershell
node tests/forge-core.test.js
```
