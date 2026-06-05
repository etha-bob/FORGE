# FORGE — Mobile Workout App

A self-contained workout logger for the dumbbell + bench lean-muscle program.
Single file, no build step, no dependencies, works offline once loaded.

## What it does
- Pick a training day (Upper A / Lower A / Upper B / Lower B)
- Walk through each exercise one at a time
- Log weight + reps per set with tap steppers (no fiddly keyboard)
- Auto-fills each set with what you lifted last time
- Auto-starts a rest timer after every set (with beeps + phone vibration)
- Saves a full training history (stored on your phone)
- Tracks streak, weekly count, and total volume

## Deploy free on GitHub Pages (2 minutes)
1. Create a new public repo on GitHub (e.g. `forge`).
2. Upload `index.html` to the root of the repo.
3. Go to **Settings → Pages**.
4. Under "Build and deployment", set **Source = Deploy from a branch**,
   **Branch = main**, **Folder = / (root)**. Save.
5. Wait ~1 minute. Your site is live at:
   `https://YOUR-USERNAME.github.io/forge/`

## Make it feel like a real app on your iPhone
1. Open the live URL in **Safari** on your iPhone 16 Pro Max.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the icon — it opens full-screen with no browser bars.

## Notes
- All your logs live in your phone's browser storage (localStorage). They persist
  between sessions but are tied to that browser. Don't "clear website data" for the
  site unless you want to wipe your history.
- The rest timer keeps your screen awake during a workout (where supported).
- Want to tweak the program? Edit the `PLAN` array near the top of the `<script>`
  in `index.html` — each exercise has name, sets, rep range, rest seconds, and a
  starting weight/reps.
