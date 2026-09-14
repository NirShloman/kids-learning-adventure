# Detective upgrade — local acceptance report

Updated: 2026-09-15. Branch: `codex/trivia-detectives-upgrade`. Base: `codex/experiential-games-redesign` at `152418237597e0a8794725184337e8d96b4d1765`.

This report records actual checks, not a release approval. Paid narration is pending explicit user consent. No pull request, merge or deployment has been performed for this upgrade yet.

## Completed checks

* All 3,840 generated activities passed schema, independent semantic checks and hash-bound AI editorial review. Each of the 96 game/age/level cells contains 40 distinct rendered activities. See [content review](../../content-review/DETECTIVE_REVIEW.md).
* 191 unit tests and 3 integration tests passed in one complete run (194 total, no failures). They include every selection cell, corrupt-content rejection, retry/demonstration evidence, checkpoint compatibility, profile isolation, deterministic shuffled boards, resume without consuming another selection, missing/empty content recovery and delayed loading after unmount. An earlier concurrent run timed out in the existing audio-service test, which subsequently passed in isolation and in the complete suite.
* TypeScript and the production web build passed. The existing large-bundle warning remains (main bundle approximately 1.87 MB minified).
* Six final Chromium accessibility/lifecycle scenarios passed: all eight boards in four sizes, enlarged text, keyboard and separate audio controls, a second mistake/demonstration, reload/version invalidation, rapid Next activation, and distinct counting marks in narrow comparison/addition cards. Device sizes: 320×568, 740×360, 768×1024 and 1280×800; the additional quantity case uses widths 320 and 393 with 200% question/answer text.
* All eight game types passed reload and full completion with the browser network disabled on the updated production preview. This verifies cached activity operation; it does not claim missing narration files are available offline.
* All 192 phone/tablet game/age/level scenarios and 24 adaptive scenarios passed in a clean final-curriculum run (216 total). Every adaptive scenario also completed a replay. This run includes the corrected phonology, full number ceilings and distinct difficulty levels. Later narrow-screen CSS changes passed the six dedicated layout/lifecycle scenarios above.
* The seven browser/device regression configurations passed 374 scenarios, with 18 deliberate duplicate skips, zero flaky cases and zero global runner errors. They cover Chromium, Firefox, WebKit, Android-phone, iPhone, Android-tablet and iPad emulation, including all four existing adventure worlds. This run preceded the final curriculum refinement; the 216-scenario run above verifies the changed content and board sizes.
* Eleven updated accessibility/lifecycle scenarios passed across Chromium, Android-phone emulation and iPad emulation; four duplicate desktop-only cases were explicitly skipped. Rapid Next activation advances exactly one question.
* Android `testDebugUnitTest lintDebug assembleDebug` passed against the updated packaged web build: 232 Gradle tasks, 49 executed and 183 up-to-date. Existing SDK XML/deprecation/flat-directory warnings remain non-fatal. ADB reported no attached devices.
* Integration tests: 3 passed. Administrative narration TypeScript build, local-only privacy validation and mobile configuration verification passed.
* Production dependency audit: zero vulnerabilities. The final web bundle was synchronized into Android and `assembleDebug` passed again after the layout correction. No physical device was attached.
* The isolated adventure performance check passed: 120 animated frames, median/p95 frame interval 16.7 ms, mean 60.0 FPS, and 10 pointer-feedback samples with a maximum of 10.2 ms. These are Windows Chromium/Pixel 5 viewport measurements, not physical-phone performance claims.
* All 87 final delivery scenarios passed against a fixed build: 48 adventure missions, 22 Hebrew letter artwork checks, four recorded playthroughs, one touch protocol case, four adventure offline cases and eight detective offline cases. Compact totals, per-project results and source-report hashes are in [test-results.json](test-results.json).

## Defects found and corrected during acceptance

| Defect | Impact | Correction / evidence |
| --- | --- | --- |
| Same consonant but different vowel in three authored word pairs | Incorrect initial-syllable explanations | Replaced the pairs and added reviewed pronunciation fixtures; regenerated the bank and review hashes. |
| Hot-springs symbol used to represent an oven | Visual did not denote the spoken word | Replaced the word/image with תפוז/🍊 and reviewed תפוח/תפוז. |
| Quiz preload selected another round before resuming a checkpoint | Consumed recent-selection history unnecessarily | Restore validated saved IDs before selecting fresh questions; unit regression passes. |
| Preview CORS emitted `Vary: Origin` | Precached modules could miss on offline reload and receive HTML fallback | Same-origin preview disables CORS; all eight offline scenarios pass. Production service-worker logic was unchanged. |
| Two Next activations before a React commit could use a stale activity | Potential skipped question | Compare the live index against the rendered index before advancing; targeted browser regression added. |
| Maximum memory board was unnecessarily tall on wide tablets | Needed scrolling between rows | Use two rows for 12–14 cards at widths of at least 1100 CSS px; visually verified in the final tablet capture. |
| Hash-sorting neighboring card indices clustered pairs | Predictable memory layouts | Seeded Fisher–Yates shuffle preserves checkpoints and distributes pairs; permutation/restoration/distribution tests pass. |
| Manual content version could stay unchanged after an edit | Saved IDs could refer to changed content | Derive the version suffix from a hash of all generated content; a mutation regression verifies invalidation. |
| Choice-solving test checked controls before the board/next step was ready | Intermittent false failure in patterns | Await actual board controls and completion of the step transition. The three affected scenarios passed twice in both phone and iPad configurations (12 executions). |
| Some medium/hard content was identical and number generation did not reach the age ceiling | Manual level did not reliably change the activity | Add explicit visual/quantitative differences within age bounds, monotonic pair-board sizes and complete number ranges; independent curriculum assertions and all 216 device scenarios pass. |
| Counting marks included bunches/slices and awkward plural labels | Ambiguous quantity and inaccurate spoken grammar | Use whole individual objects and grammatical generic quantity labels; reject incompatible marks during validation. |
| Narrow answer cards broke enlarged Hebrew words and compressed counting marks | Reduced readability at 320 CSS px | Stack narrow answers/comparison groups; quantity grids wrap while reserving each mark's full width. Maximum-count comparison/addition checks and captures pass. |

The first offline run stopped after two failures and six unrun cases. Those failures remain recorded in `qa-reports/detective-offline.json`; the corrective run `detective-offline-fixed.json` has eight passes. Interrupted earlier runs without final reports are not counted as completed acceptance.

The first broad browser run reached its last scenarios but stalled while closing Windows WebKit workers, with one page-setup timeout and one stalled welcome interaction. It did not produce a final JSON report and is not counted as a clean completed run. The complete rerun uses one worker and disables optional video recording; assertions, screenshots, traces and browser coverage remain enabled. Dedicated adventure recording tests retain their own video configuration.

An intermediate 72-scenario run completed its test cases but failed during Windows WebKit worker teardown; it is not counted as a clean run. The final 216-scenario run completed with exit code zero. Functional tests now block background service workers, while the dedicated production offline projects explicitly allow and exercise them.

The first 87-scenario delivery run overlapped a local rebuild: 86 passed and one failed. Its breakfast scenario requested a replaced asset (`adventure-8szpqoTN.js`, HTTP 404), so that run is not clean acceptance. The entire delivery group subsequently passed all 87 cases against a fixed build; no application change was inferred from this test-orchestration error.

## Reviewed captures

[Small-phone quantities with enlarged text](devices/numbers-320x700.png), [landscape sequence](devices/patterns-740x360.png), [tablet colors](devices/colors-1280x800.png), [maximum 14-card tablet board](devices/memory-1280x800.png). The narrow quantity and maximum memory layouts were visually inspected. These are browser screenshots, not physical-device captures.

## Pending delivery gates

* Approve and generate the 861 missing local narration entries in [the recording request](narration-request.json): 30,063 characters, approximately USD 0.90189 before tax at USD 30 per million characters. Strict narration validation currently fails for exactly these missing texts. No paid generation has been performed. After approval, generate/package them and pass strict coverage and `build:release`.
* iOS compilation requires the macOS CI runner. Android local debug gates have passed; release packaging still requires strict narration coverage.
* Attach final screenshots and test totals, commit only related work, push and create a PR against `codex/experiential-games-redesign`, then inspect CI. No automatic merge or deployment.

## Environment limitations

Browser device emulation is not a physical-device test. No physical Android phone/tablet or iPhone/iPad test, native OS kill/relaunch test, child comprehension study, or professional pedagogical endorsement is claimed. Local Windows cannot compile the iOS target. These limitations remain explicit even if browser and CI gates pass.
