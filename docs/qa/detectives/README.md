# Detective upgrade — acceptance work in progress

Date: 2026-09-14. Branch: `codex/trivia-detectives-upgrade`.

This report records actual checks, not a release approval. Paid narration is pending explicit user consent. No pull request, merge or deployment has been performed for this upgrade yet.

## Completed checks

* All 3,840 generated activities passed schema, independent semantic checks and hash-bound AI editorial review. Each of the 96 game/age/level cells contains 40 distinct rendered activities. See [content review](../../content-review/DETECTIVE_REVIEW.md).
* 187 unit tests passed, including every selection cell, corrupt-content rejection, retry/demonstration evidence, checkpoint compatibility, profile isolation, deterministic shuffled boards and resume without consuming another question selection. The complete run uses one worker; an earlier concurrent run timed out in the existing audio-service test, which subsequently passed in isolation and in the complete suite.
* TypeScript and the production web build passed. The existing large-bundle warning remains (main bundle approximately 1.87 MB minified).
* Four initial Chromium accessibility/lifecycle scenarios passed: all eight boards in four sizes, enlarged text, keyboard and separate audio controls, a second mistake/demonstration, and reload/version invalidation. Device sizes: 320×568, 740×360, 768×1024 and 1280×800.
* All eight game types passed reload and full completion with the browser network disabled on the updated production preview. This verifies cached activity operation; it does not claim missing narration files are available offline.
* All 192 phone/tablet game/age/level scenarios passed in the initial complete matrix. The 72 affected letter/matching/memory scenarios are being repeated against the final phonology and shuffle implementation.
* Eleven updated accessibility/lifecycle scenarios passed across Chromium, Android-phone emulation and iPad emulation; four duplicate desktop-only cases were explicitly skipped. Rapid Next activation advances exactly one question.
* Android `testDebugUnitTest lintDebug assembleDebug` passed against the updated packaged web build: 232 Gradle tasks, 49 executed and 183 up-to-date. Existing SDK XML/deprecation/flat-directory warnings remain non-fatal. ADB reported no attached devices.
* Integration tests: 3 passed. Administrative narration TypeScript build, local-only privacy validation and mobile configuration verification passed.

## Defects found and corrected during acceptance

| Defect | Impact | Correction / evidence |
| --- | --- | --- |
| Same consonant but different vowel in three authored word pairs | Incorrect initial-syllable explanations | Replaced the pairs and added reviewed pronunciation fixtures; regenerated the bank and review hashes. |
| Hot-springs symbol used to represent an oven | Visual did not denote the spoken word | Replaced the word/image with תפוז/🍊 and reviewed תפוח/תפוז. |
| Quiz preload selected another round before resuming a checkpoint | Consumed recent-selection history unnecessarily | Restore validated saved IDs before selecting fresh questions; unit regression passes. |
| Preview CORS emitted `Vary: Origin` | Precached modules could miss on offline reload and receive HTML fallback | Same-origin preview disables CORS; all eight offline scenarios pass. Production service-worker logic was unchanged. |
| Two Next activations before a React commit could use a stale activity | Potential skipped question | Compare the live index against the rendered index before advancing; targeted browser regression added. |
| Maximum memory board was unnecessarily tall on wide tablets | Needed scrolling between rows | Use two rows for 12–14 cards at widths of at least 1100 CSS px; final visual verification pending. |
| Hash-sorting neighboring card indices clustered pairs | Predictable memory layouts | Seeded Fisher–Yates shuffle preserves checkpoints and distributes pairs; permutation/restoration/distribution tests pass. |
| Manual content version could stay unchanged after an edit | Saved IDs could refer to changed content | Derive the version suffix from a hash of all generated content; a mutation regression verifies invalidation. |
| Choice-solving test checked controls before the board/next step was ready | Intermittent false failure in patterns | Await actual board controls and completion of the step transition. The three affected scenarios passed twice in both phone and iPad configurations (12 executions). |

The first offline run stopped after two failures and six unrun cases. Those failures remain recorded in `qa-reports/detective-offline.json`; the corrective run `detective-offline-fixed.json` has eight passes. Interrupted earlier runs without final reports are not counted as completed acceptance.

The first broad browser run reached its last scenarios but stalled while closing Windows WebKit workers, with one page-setup timeout and one stalled welcome interaction. It did not produce a final JSON report and is not counted as a clean completed run. The complete rerun uses one worker and disables optional video recording; assertions, screenshots, traces and browser coverage remain enabled. Dedicated adventure recording tests retain their own video configuration.

## Reviewed captures

[Small-phone quantities](devices/numbers-320x568.png), [landscape sequence](devices/patterns-740x360.png), [tablet colors](devices/colors-1280x800.png), [maximum 14-card tablet board](devices/memory-1280x800.png). The maximum memory board was visually inspected after its two-row correction. These are browser screenshots, not physical-device captures.

## Pending delivery gates

* Complete the seven browser/device regression configurations, the tablet matrix, final change-specific browser checks and adventure-specific checks.
* Approve and generate the exact missing local narration entries in [the recording request](narration-request.json), then pass strict narration coverage and `build:release`.
* iOS compilation requires the macOS CI runner. Android local debug gates have passed; release packaging still requires strict narration coverage.
* Attach final screenshots and test totals, commit only related work, push and create a PR against `codex/experiential-games-redesign`, then inspect CI. No automatic merge or deployment.

## Environment limitations

Browser device emulation is not a physical-device test. No physical Android phone/tablet or iPhone/iPad test, native OS kill/relaunch test, child comprehension study, or professional pedagogical endorsement is claimed. Local Windows cannot compile the iOS target. These limitations remain explicit even if browser and CI gates pass.
