# Adventure v2 — actual acceptance results

Report generated 2026-09-12T06:51:45.938Z. Original acceptance application/test code: [a252f9aeb2ac111a4e7e8d55ed8836679c49b3b9](https://github.com/NirShloman/kids-learning-adventure/commit/a252f9aeb2ac111a4e7e8d55ed8836679c49b3b9). The report commit only adds results; CI verifies the final PR head. This is local acceptance evidence, not a claim that post-upload CI has already passed.

## Result

All available local acceptance checks passed after the corrections below. Across 409 unique browser scenarios, the latest actual results are **403 passed, 0 failed, 6 blocked/skipped duplicates**. There were 671 recorded executions including original failures and remedial reruns. The six skipped cases are duplicate star-reward screenshots on secondary projects; the identical deterministic case passed on Chromium. They are retained as blocked with their skip reason, never counted as passed.

| Browser run | Passed | Failed | Skipped | Global runner errors |
|---|---:|---:|---:|---:|
| acceptance.json | 354 | 44 | 6 | 3 |
| repair.json | 183 | 0 | 6 | 0 |
| visual.json | 28 | 0 | 0 | 0 |
| platform.json | 15 | 0 | 0 | 0 |
| ci-repair.json | 35 | 0 | 0 | 0 |

The initial matrix had 42 console-guard failures caused by suppressed service-worker registration, one sorting test synchronization failure, and one real iPhone menu overflow. All affected scenarios were actually repeated after correction. Two WebKit workers also required forced teardown (three reported runner errors); the affected scenarios were repeated with reduced concurrency and clean reports. Earlier results and errors remain in the [scenario register](qa/adventure-v2/cases.json) and [defect history](qa/adventure-v2/DEFECTS.md).

## Executed checks

| Check | Actual result | Evidence |
|---|---|---|
| All 48 missions, wrong answer, hint, correction and completion | Passed, all authored missions | CUR-01 cases in scenario register |
| Every segment of 22 regular Hebrew letters | Passed | LET-01 cases |
| Age 3–6 × easy/medium/hard × 30 seeds | Passed: 17,280 generated scenarios, age quantity caps and reachable content | [Release validation](qa/adventure-v2/logs/build-release.log) |
| Unit / integration | 79 / 3 passed | [Unit](qa/adventure-v2/logs/unit.log), [integration](qa/adventure-v2/logs/integration.log) |
| Touch, tap fallback, keyboard, cancelled/missed drops, second finger and orientation | Passed in browser environments | INT/A11Y/COL cases |
| Reload/checkpoint, profile isolation, legacy state, hints and attempt deduplication | Passed | LIFE cases and unit suite |
| Local narration | 2,059 valid MP3s; strict catalog coverage and actual decoding/playback tests passed | Release log and AUDIO-01 cases |
| Four complete animated rounds, including correction/hints and collection activation | Passed; sampled visual review completed | [Four videos and images](qa/adventure-v2/README.md) |
| Scene layout and art | Passed in both orientations across seven browser/device configurations | VIS cases and [selected device captures](qa/adventure-v2/devices/) |
| Prepared worlds without network | Four worlds passed production reload and mission completion | OFF-01 cases |
| TypeScript, content, asset and privacy validation; release web build | Passed | Release log |
| Narration administrative functions TypeScript build | Passed | [Functions build](qa/adventure-v2/logs/functions.log) |
| Native configuration and packaged media | Passed | [Mobile verification](qa/adventure-v2/logs/mobile.log) |
| Android unit tests, lint and debug APK | Passed: 232 Gradle tasks, 49 executed / 183 up-to-date | [Android log](qa/adventure-v2/logs/android.log) |
| Production dependency audit | Zero reported vulnerabilities with omit=dev | [Audit](qa/adventure-v2/logs/audit.log) |
| Existing quizzes, matching, memory, patterns, sorting, onboarding and parental controls | Passed | REG-01 and repair run |

## Performance and limitations

Measured on a Windows host in Chromium using the Pixel 5 viewport, with animation enabled: 120 frame samples, median **16.7 ms**, p95 **16.8 ms**, mean **60.00 fps**. Across 10 interactions, maximum pointer-to-next-frame feedback was **10.2 ms**, median **7.1 ms**. This browser instrumentation measures frame scheduling and visual update latency; it does not establish GPU presentation timing or performance on a physical phone.

| Unavailable check | Actual status | Reason / required environment |
|---|---|---|
| PHY-01: Physical Android phone/tablet touch and safe areas | Blocked | No Android devices connected to this host; requires representative hardware. |
| PHY-02: Physical iPhone/iPad touch and safe areas | Blocked | No Apple devices or macOS host available locally. |
| PHY-04: Native OS termination/relaunch/background lifecycle on physical devices | Blocked | Browser refresh/background scenarios passed; OS behavior requires installed native builds on real devices. |
| PHY-03: Sustained frame rate and touch latency on representative hardware | Blocked | No physical devices available; browser instrumentation cannot establish these results. |
| Local iOS simulator compilation | Blocked locally | Windows host. The authorized PR triggers the macOS CI build; its actual outcome is reported on the PR. |
| PHY-05: Child comprehension and estimated 3–5 minute session duration | Blocked | No child usability session was conducted. The curriculum and selection rules are tested; learning effectiveness is not inferred from test completion. |

The build retains a Vite warning for the existing large main bundle (about 1.86 MB minified / 363 KB gzip), and Gradle reports deprecation/flat-directory warnings. They do not fail the executed build gates. The dependency audit result above excludes development-only packages.

## Reproduction and delivery

Use the commands and preconditions in [ADVENTURE_TEST_PLAN.md](ADVENTURE_TEST_PLAN.md). The release was built once for the final repair/offline/performance runs. The initial recordings used the preceding release with the same adventure visuals; subsequent changes only guarded unavailable service-worker registration and wrapped the home navigation on narrow screens. Final orientation screenshots use the final release.

The branch is codex/experiential-games-redesign. Upload and PR creation are authorized after local gates; CI includes four browser shards and web/Android/iOS builds. The final PR validation section links the actual CI runs and commit. No merge, production deployment, cloud-generation deployment, or store publication is included.

## Post-upload CI corrections

The first uploaded revision passed web gates, iOS simulator compilation and three browser shards. Android stopped before Gradle with a missing executable bit; two Firefox/Linux geometry comparisons failed on floating-point noise below 0.001 CSS px. The corrective commit changes the Git executable mode and test comparison precision, with no application-bundle change. All 35 affected local browser/device scenarios passed again. See [CI evidence and corrections](qa/adventure-v2/CI.md) and the [PR CI section](https://github.com/NirShloman/kids-learning-adventure/pull/2) for the final checked revision and live run results.
