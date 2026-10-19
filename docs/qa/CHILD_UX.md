# Child game experience — implementation and verification

Updated: 2026-09-23. No production deployment or store publication was performed.

## Implemented behavior

- The welcome movie preserves its full frame with `object-fit: contain`, separate text and start control, and static artwork when playback fails, autoplay is unavailable, or reduced motion is enabled. The lobby no longer loads a movie.
- Children get four game cards per phone page, or eight where width and height permit. Each card is one large button. Journey, shared play, collections and sound settings have separate destinations. Collections use pages. Profile setup has three short steps.
- Child layouts budget the available viewport height and safe areas, including orientation changes and the software-keyboard viewport. Normal layouts keep controls on screen; enlarged root text expands the stage and allows accessibility scrolling. Parent and legal pages retain scrolling.
- Memory has explicit first-card, second-card and feedback phases. Wrong pairs and hints close automatically; correct pairs stay visible. No manual continue button is needed. Seeded card positions and found pairs survive leaving and reloading, including the fourteen-card board.
- Choice games, adaptive practice, all four adventure worlds and shared play retain the current question after mistakes. Correct answers advance once after at least 1.5 seconds and completion of that specific narration request, with a ten-second audio watchdog. Round summaries remain open.
- Feedback jobs are cancelled on exit and suspended in the background. Returning restarts the pending visual/audio feedback without recording the answer twice. Native speech events carry request identifiers. Late audio callbacks cannot complete a different request.
- Shared turns switch only after a correct answer. Repeated mistakes are recorded with increasing attempt numbers; hints stay available. Rapid duplicate activation gives one reward. Drag activities retain tap-item/tap-target and keyboard alternatives, with forgiving nearest-target drop detection.
- Existing historical progress, branding and recorded narration are preserved. Old demonstration-only outcomes are reopened only in active resumed rounds, without deleting real successes or history.

## Verification

| Area | Evidence |
| --- | --- |
| Unit and integration | 213 passing tests in 21 files, including feedback minimum/maximum timing, stale callbacks, background/unmount cancellation, narration replacement, retries and active-round migration. Native availability race has a separate regression test. |
| Main browser regression | 66 passing Chromium tests: all eight games, adaptive practice, four adventure completions, hints/errors, keyboard, audio, setup, parent gate and summaries. |
| Memory matrix | 24 passing complete sessions: ages 3–6 × easy/medium/hard, each in phone Chromium and iPad WebKit emulation. |
| Child flows and touch | 22 passing tests covering shared turns/cooperation after three errors, double activation, background/resume, memory order restoration, collection pagination, reduced-motion/failure fallbacks, twelve adventure mechanics and browser touch protocol. |
| Responsive layouts | 320×568, 568×320, 393×851, 851×393, 768×1024, 1024×768 and 1280×800. Checks include document overflow, target bounds and 56-pixel touch targets. Larger text is tested separately with scrolling allowed. |
| Other browser engines | Firefox and mobile WebKit coverage for welcome/setup, memory errors/completion, shared turns, background/resume and four adventures. Firefox input width was corrected; the Safari immersive-layout check passed six consecutive cases after correction. |
| Offline | Prepared production sessions reload and finish offline in all eight games, adaptive mixed practice and all four adventure worlds. Packaged narration is checked in the detective sessions. |
| Content and release build | Strict narration catalog coverage; 3,840 content items, 17 skills, 1,982 narration assets, 48 authored missions and 17,280 generated age/difficulty/seed scenarios; privacy validation, TypeScript and Vite production build. |
| Android | `compileDebugJavaWithJavac` and mobile configuration validation passed. This verifies compilation, not physical-device behavior. |
| iOS | Native event code updated; native build/device validation was not performed on this Windows host. Apple tooling and a device/simulator are still required. |

The browser runs use emulated device viewports and input. They are not Android or iOS hardware certification. The content validator covers all generated scenarios; it does not mean every scenario was manually played in a browser.

## Reproduction and artifacts

Run `npm run build:release`, then keep an independent preview server running:

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4179 --strictPort
```

In the test shell:

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:4179'
$env:E2E_PREVIEW='1'
$env:E2E_VIDEO='off'
node node_modules/vitest/vitest.mjs run tests/unit tests/integration
node node_modules/@playwright/test/cli.js test tests/e2e/child-layout.local.spec.ts tests/e2e/child-flow.local.spec.ts --project=local-chromium
node node_modules/@playwright/test/cli.js test --project=detective-matrix-phone --project=detective-matrix-tablet --grep memory
node node_modules/@playwright/test/cli.js test --project=detective-offline --project=adventure-offline
```

Use a fixed production build during a run. Editing a dev-server module can interrupt a feedback job through hot reload; sharing a test-owned server across independent runs can stop that server before the other run finishes. Both affected early diagnostics and were separated from application failures. The offline preparation menu must be closed before interacting with a board underneath it.

Retained representative images:

- [Phone lobby](child-ux/home-phone.png)
- [Fourteen-card memory board](child-ux/memory-phone.png)
- [Persistent round summary](child-ux/summary-phone.png)
- Welcome movie at [10%](child-ux/welcome-start.png), [50%](child-ux/welcome-middle.png), and [90%](child-ux/welcome-end.png), visually checked for complete characters and an unobstructed start button.

Raw local Playwright reports are under `test-results/` (Git-ignored). Earlier failing reports are retained for diagnosis; later targeted passing runs supersede their resolved cases.
