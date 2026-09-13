# Post-upload CI evidence

PR: [#2 — experiential games redesign](https://github.com/NirShloman/kids-learning-adventure/pull/2). Its CI section records the final checked revision and links the latest completed runs.

## First uploaded revision: 02d18cb6c28c53304d8963c2d5a5ff1a76d745a2

| Check | Actual result | Evidence |
|---|---|---|
| Web release/content/privacy/unit/audit gates | Passed | [Web job](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34679272590/job/103514711998) |
| iOS simulator compilation on macOS / Xcode 26.6 | Passed | [iOS job](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34679272590/job/103514712075) |
| Android Linux build | Failed before Gradle started: exit 126, `./gradlew: Permission denied` | [Android job](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34679272590/job/103514712122) |
| Browser shards 1, 3 and 4 | Passed, including the shard-1 performance/offline gates | [Browser run](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34679272595) |
| Browser shard 2 | 98 passed, 2 failed, 1 duplicate skipped | [Shard 2](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34679272595/job/103514712112) |

The two browser failures were enlarged-control geometry comparisons in Firefox/Linux for `v2-letter-bridge` and `v2-color-orange`. A 56 CSS px control was reported as 55.999969482421875 or 55.99998474121094 after transforms. Both failures persisted on the two automatic test retries; these retries were not attempted code fixes.

## Corrections

- Record `android/gradlew` as executable in Git (100755). Its LF script contents are unchanged.
- Compare measured control dimensions at 0.001 CSS px precision, retaining the 56 CSS px minimum and all screen-boundary, hit-testing and axe assertions.
- Repeat all five enlarged-control scenarios on all seven local browser/device configurations, then rerun CI on the correction commit. The application bundle is unchanged by these CI compatibility fixes.

The final outcome is linked in the PR's CI section. Earlier failed runs remain available and are not relabeled as successful. Physical-device checks remain separate from successful simulator compilation and browser tests.

## Revision 9c1ce569e1d5f5e3847792f80f15421b9b42536d

[Web, Android and iOS gates](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34715811309) all passed. Android executed all 232 Gradle tasks and uploaded the debug APK. [All four browser shards](https://github.com/NirShloman/kids-learning-adventure/actions/runs/34715811315) also finished successfully, but log review found two intermittent ERR-01 failures in iPhone/iPad simulations that passed on their first retry. The other 396 matrix cases passed directly; six duplicate screenshots were skipped. The additional smoke, performance and offline gates passed.

The recovery assertion was launched concurrently with navigation, so its eight-second budget could expire before the app reached the deliberately broken image. The corrected test awaits the adventure shell, checks the error within the loader's actual fallback deadline, retries, and then starts play. No product assertion is removed, and no pending navigation promise is left behind. The shared ordinary-entry helper retains its original behavior and is exercised alongside repeated recovery cases.

Recovery and ordinary entry subsequently passed three repetitions in each of the seven local configurations: 42 executions, zero failures. CI now enables `failOnFlakyTests`, retaining retries for diagnosis while rejecting a run that only succeeds on retry. The PR CI section links the subsequent strict run and its actual result.
