# FORGE enhancement roadmap

## Shipped in this release

- Context-aware history: an exercise now recalls only the matching A/B day,
  using `dayKey + exercise id`, so Upper A fatigue never sets expectations for
  Upper B.
- Safe data migration: legacy v1 backups remain supported, imports merge and
  de-duplicate instead of replacing data, a pre-import safety snapshot can be
  restored, and v2 exports include history, settings, and an active workout.
- A rolling four-session plan for a three-day floor and four-day target. The
  dashboard identifies the next session and tracks Monday-to-Sunday progress.
- A reassessed routine for a bench, 10+ lb dumbbells in 5 lb increments, and a
  pull-up bar. Volume is more sustainable, lower days have less duplication,
  and progression guidance is shown against the correct day-specific result.
- Pull-ups added twice per rotation: first on Upper A (pull priority) and after
  incline press on Upper B (press priority).
- Public-domain start/finish photos replace the custom stick-figure animation
  for every current movement. Assets are local so guides work offline.
- Installable PWA support: app manifest, home-screen icons, safe-area layout,
  offline service worker, and local caching of all exercise guides.
- Active workout duration now counts foreground training time instead of hours
  spent with an unfinished session in the background.

## Next: training quality

- Add optional per-set reps-in-reserve and session notes without making the
  default logging flow slower.
- Add a routine editor with movement substitutions constrained to the available
  equipment and stable ids so historical charts remain valid.
- Add deload suggestions based on repeated performance regression, not a fixed
  calendar alert.
- Add set-level editing and deletion for completed workouts with an audit-safe
  undo window.

## Then: useful analytics

- Exercise trend charts scoped by workout day, plus estimated rep-max and
  best-set markers.
- Weekly hard-set estimates by movement pattern and a consistency view based on
  the 3-session floor / 4-session target.
- A lightweight readiness prompt that can adjust suggestions while never
  silently rewriting the plan.

## Later: static-host-friendly portability

- Use the Web Share API where iOS supports it to send encrypted backup files to
  Files, AirDrop, or iCloud Drive.
- Add periodic backup reminders. Any real multi-device sync would require an
  external account/backend and is intentionally outside the GitHub Pages-only
  constraint.
- Add a versioned migration registry and automated browser tests for every
  published backup schema.

## Research notes

Exercise-order research indicates that movements performed earlier receive
better repetition performance and tend to gain more strength. The practical
rule is to put the priority movement first, not blindly order by muscle size.
That is why pull-ups lead Upper A while incline pressing leads Upper B:

- [Exercise order in resistance training (Sports Medicine, 2012)](https://pubmed.ncbi.nlm.nih.gov/22292516/)
- [Influence of exercise order on upper-body strength gains](https://pubmed.ncbi.nlm.nih.gov/23701174/)

The plan uses multiple weekly exposures and moderate per-session volume. The
evidence favors multi-set resistance training, while consistency matters more
than chasing a theoretically perfect prescription:

- [Resistance training prescription network meta-analysis (BJSM, 2023)](https://bjsm.bmj.com/content/57/18/1211)
- [Weekly volume and muscle-mass dose response](https://pubmed.ncbi.nlm.nih.gov/27433992/)

For media, FORGE uses the local, Unlicense/public-domain
[Free Exercise DB](https://github.com/yuhonas/free-exercise-db). Other options
reviewed were [wger](https://wger.de/) (strong open-source platform, but mixed
per-asset attribution/share-alike obligations) and
[RepDB Free](https://github.com/RepDB/exercise-dataset) (polished static art,
attribution required, animations are paid). Re-hosted “free GIF” repositories
with unclear source ownership were deliberately rejected.
