# Acceptance evidence

The [scenario register](cases.json) records actual executions, environments, source locations, failures and reruns. The [acceptance report](../../ADVENTURE_TEST_RESULTS.md) identifies the tested code and separates browser simulation from unavailable physical-device checks. [Defect history](DEFECTS.md) explains corrections and earlier interrupted runs.

## Recorded rounds

These are actual Playwright recordings of the built app at a Pixel 5 viewport, with animation enabled. Each includes an incorrect first choice, a requested hint, three different mechanics and activation of a saved creation. Narration playback is tested separately with real MP3 decoding; these visual recordings use muted test profiles.

| World | Full recording | Sampled frames | Hint/correction | Final collection |
|---|---|---|---|---|
| Letters | [Video](letters/video.webm) | [Contact sheet](letters/round-contact-sheet.png) | [Screenshot](letters/letters-hint.png) | [Screenshot](letters/letters-collection.png) |
| Numbers | [Video](numbers/video.webm) | [Contact sheet](numbers/round-contact-sheet.png) | [Screenshot](numbers/numbers-hint.png) | [Screenshot](numbers/numbers-collection.png) |
| Shapes | [Video](shapes/video.webm) | [Contact sheet](shapes/round-contact-sheet.png) | [Screenshot](shapes/shapes-hint.png) | [Screenshot](shapes/shapes-collection.png) |
| Colors | [Video](colors/video.webm) | [Contact sheet](colors/round-contact-sheet.png) | [Screenshot](colors/colors-hint.png) | [Screenshot](colors/colors-collection.png) |

Each world directory also contains three completion screenshots (`*-success-0.png` through `*-success-2.png`). Contact sheets contain nine uniformly spaced frames extracted from the corresponding video. They preserve the real loading/transition states and are not generated artwork or reference-image replacements.

Visual inspection covered the four sampled recordings and the full-resolution correction/collection states. The backgrounds crop coherently in portrait; guide identities are consistent; the correction text now has its own opaque background; controls and collections remain reachable. Separate matrix screenshots and geometric/axe assertions cover landscape and tablet layouts. Automated run timing is not evidence that a child completes a round in that duration.

Runtime art provenance and alpha/size checks are documented in [art direction](../../art-direction/adventure-v2/README.md). CI uploads complete HTML reports, traces on failure and videos to per-shard artifacts; the PR's final validation section links those runs.
