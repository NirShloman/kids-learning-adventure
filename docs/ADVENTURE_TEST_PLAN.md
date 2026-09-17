# Adventure v2 acceptance scripts

Run against the commit identified in `ADVENTURE_TEST_RESULTS.md`. Each automated test name includes its stable requirement ID or mission ID. A passing browser simulation is not a physical-device or child usability study.

## Preconditions and environments

Use a fresh isolated browser profile, local app URL, local assets, age 4/manual medium unless a case specifies otherwise, a seeded session (`137`) and a test child. The browser fixtures create their own isolated learner data; they do not touch the user's profile. Restore an existing profile only inside an isolated test context.

Browser matrix: Chromium, Firefox, WebKit; Pixel 5 / Android Chrome, iPhone 12 / WebKit, Android tablet 1280×800, iPad Pro. Portrait/landscape transitions must retain the active task. Mobile devices named in Playwright are simulations.

## Curriculum and mechanics

| ID | Preconditions and steps | Expected result | Automation |
|---|---|---|---|
| CUR-01 | For each of the 48 mission IDs, enter its world, submit an incorrect first answer, request a hint, then complete every step using selection and target taps. | Incorrect evidence is recorded once; corrected success is guided, every task finishes and produces its own completion and saved reward. | `adventure-content.spec.ts`, 48 cases |
| CUR-02 | Generate every mission for ages 3–6, all three difficulties and seeds 0–29. | Reachable correct answers, valid choices, unique steps and safe quantities; all 22 letters reachable. | `validate-adventures.mts`, 17,280 combinations |
| CUR-03 | Complete a three-mission round; inspect the collection, activate a reward, replay. | Three different mechanics; collection persists; next round avoids immediate repetition. | `experience.local.spec.ts` |
| LET-01 | Rasterize and inspect every segment of all 22 glyphs, assemble them, then identify the completed letter. | Every segment contains visible ink; segments form the actual glyph; motor actions and recognition have distinct evidence. | `adventure-glyphs.spec.ts`, curriculum and unit cases |
| LET-02 | Listen/identify letters and complete the first letter in a familiar word. | Correct target changes per seed; all 22 standard letters are reachable. | curriculum and unit cases |
| NUM-01 | Select a fruit, tap plate repeatedly, remove excess, submit under/over/exact quantity. | Only exact quantity succeeds; adding/removing alone is not scored. | curriculum and interaction cases |
| NUM-02 | Prepare two orders and compare plates; complete a partly filled plate. | Previous amounts remain represented correctly; initial food is not removable; no forced counting by auto-completion. | curriculum and unit cases |
| SHP-01 | Fit shapes, submit incorrect orientation, rotate 90°, place and finish toy. | Incorrect orientation is rejected; correct placement reveals part; completed toy moves. | rotation and curriculum cases |
| COL-01 | Select requested color, draw in canvas, cancel contact, continue; also use tap painting. | Paint stays inside object; contact cancellation does not score an error; either input can finish. | paint and curriculum cases |
| COL-02 | Mix red/yellow, blue/yellow, red/blue; try wrong pair and clear bowl. | Orange, green and purple recipes are exact; correction is possible without losing the task. | curriculum and unit cases |

## Interaction, accessibility and life cycle

| ID | Preconditions and steps | Expected result | Automation |
|---|---|---|---|
| INT-01 | Drag fruit to plate, then outside it; cancel a pointer; touch with another finger. | Valid drop adds once; missed/cancelled drop and extra finger do not score or duplicate actions. | pointer cases |
| INT-02 | Use taps and keyboard to select and place; measure targets. | Every drag has a non-drag alternative; targets are at least 56 CSS px. | interaction cases |
| INT-03 | Rotate viewport during an active task and inspect control bounds and hit targets. | No loss of state, clipped controls or overlap that blocks activation. | orientation cases |
| A11Y-01 | Run axe; enable reduced motion, large targets, strong guidance, fewer items and high contrast. | Valid accessible names/roles; settings apply; guided evidence is marked; no required timed gesture. | axe, layout and profile cases |
| LIFE-01 | Submit a wrong answer twice, request hint, succeed, refresh and re-enter. | Attempt count and hint are retained; checkpoint resumes after completed stage; no duplicated evidence. | persistence cases |
| LIFE-02 | Switch app to background with food on plate, then resume. | Pause overlay; no overlapping narration; food and current task remain. | life-cycle case |
| LIFE-03 | Load v4 data without adventures, save new progress, switch and delete profiles. | History is preserved; profiles are isolated; deleted profile is not recreated. | unit cases |
| OFF-01 | Build production, prepare a world online, disable network and reload/re-enter. | Shell, world art, mechanics and prepared narration remain usable offline. | offline production case |
| ERR-01 | Fail an image request; restore it and select retry. | Clear recoverable loading state; no blank or permanently stuck scene. | asset failure case |

## Sound, visuals, performance and regression

| ID | Steps | Expected result |
|---|---|---|
| AUDIO-01 | Validate every catalog text against local MP3, checksum and duration. Play instructions, retry, hint, mute and resume. | No missing required recordings; coherent playback, one narration at a time, settings respected. |
| VIS-01 | Inspect recorded runs and screenshots for each world at phone/tablet dimensions in both orientations. | Decoded art, consistent characters, no baked checkerboards, readable prompt and reachable controls; scene ≥70% viewport height. |
| PERF-01 | Measure animation frame intervals and pointer-to-feedback latency during a representative active scene. | Target 60 fps and feedback within 100 ms; report machine and simulation limitations, never infer real phone performance. |
| REG-01 | Run existing quiz, matching, memory, patterns, sorting, onboarding, privacy, audio and learning suites. | No unintended changes to other modes or old learner data. |
| BUILD-01 | Run content/assets/narration/privacy validation, typecheck, unit/integration suites, web release build, mobile config checks and platform CI builds. | All required executable checks pass. Missing platform environments remain explicitly blocked. |

## Physical-device follow-up scripts

These cases require hardware or a facilitated child session and remain **blocked** until that environment is available. They are additional cases, separate from browser-project duplicates.

| ID / requirement | Preconditions and environment | Steps | Expected result |
|---|---|---|---|
| PHY-01 / INT-01, INT-03, VIS-01 | Install the tested Android APK on a representative phone and tablet; enable gesture navigation. | Complete one round in every world; drag near all screen edges; cancel and add a second finger; rotate mid-drag; repeat using taps and large controls. | Controls remain reachable, OS insets do not obscure them, state survives rotation, and cancelled gestures do not score. |
| PHY-02 / INT-01, INT-03, VIS-01 | Install the corresponding iOS build on an iPhone and iPad. | Repeat PHY-01 in both orientations, including home-indicator/notch edges and application return. | Same interaction and layout criteria, with correct Apple safe-area behavior. |
| PHY-03 / PERF-01 | Representative physical midrange devices; animations and sound enabled; frame/touch instrumentation connected. | Play each world for five minutes; record frame intervals and touch response during dragging, paint, mixing and success effects; repeat with reduced motion. | Aim for sustained 60 fps and visible response under 100 ms; record actual hardware, thermal state and measurements. |
| PHY-04 / LIFE-01, LIFE-02, OFF-01 | Native apps and installed PWA; isolated profile with completed stage, saved creation and prepared offline world. | Background/foreground, terminate/relaunch, rotate, switch profiles, enable airplane mode, re-enter the prepared world and activate its creation. | Completed checkpoint and creations persist without duplicate evidence; audio stops/resumes coherently; prepared content works without a network. |
| PHY-05 / CUR-03 and session-duration goal | Facilitated sessions with children in the intended age bands and appropriate guardian permission. | Let each child attempt a three-mission round without reading; observe demonstration comprehension, independent choices, requests for help and elapsed time. | Child can understand the interaction and make meaningful independent choices; record learning/usability findings and actual duration instead of assuming the 3–5 minute target was achieved. |

## Defect policy and delivery gate

`adventure-recordings.spec.ts` retains four complete animated rounds at phone dimensions, each including correction, an explicit hint, all three mechanics and activation of the collection. `experience-visual.local.spec.ts` waits for the interactive pieces before capturing; loading placeholders are not acceptance screenshots. Navigation waits for DOM readiness and then asserts the actual screen, rather than waiting for decorative media to finish loading.

Use the production preview for the final matrix: build with `npm run build:release`, then set `E2E_PREVIEW=1` and `E2E_BASE_URL=http://127.0.0.1:4179` before `npm run test:e2e`. Optional `PLAYWRIGHT_OUTPUT_DIR`, `PLAYWRIGHT_HTML_OUTPUT_DIR` and `PLAYWRIGHT_JSON_OUTPUT_NAME` keep independent runs from overwriting evidence. CI uses this same release-preview setup.

The machine-readable `qa/adventure-v2/cases.json` links each executed scenario to its source steps and environment, records its actual status and duration, and retains any prior runs when the scenario is repeated. Generate it with `node scripts/summarize-adventure-tests.mjs <report.json> [<later-report.json> ...]`. An interrupted run is never a passing matrix; any included later result must be an actual rerun.

For each failure record case ID, expected/actual behavior, environment, reproduction, evidence, impact, attempted fixes and rerun. Stop after three substantive unsuccessful fixes for one issue or one hour without progress and ask the owner to decide on the concrete gap. Do not remove assertions, silently skip failures or refresh reference images to hide a defect.

Upload code/assets/tests/docs to the planned feature branch only when local acceptance checks pass and no unapproved acceptance gap remains. Follow CI after upload; do not merge or deploy. Physical-device performance and child comprehension require actual corresponding evidence and cannot be claimed from emulator results.
