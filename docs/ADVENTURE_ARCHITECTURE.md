# Experiential worlds

`ExperienceGame` coordinates a three-mission round, local checkpoints, narration, feedback and the active child's accessibility settings. Each world is a lazy React module. `adventureMissions.ts` defines 48 authored missions across twelve activities; `adventureEngine.ts` builds age/difficulty variants and evaluates meaningful answers independently of animation.

## Content and learning

Numbers are capped at 3 for age 3, 5 for age 4 and 10 for ages 5–6. Manual difficulty remains authoritative. Selection prefers unseen content, then weaker demonstrated skills, with recent-content avoidance. Letter exposure progresses through the 22 regular Hebrew letters. Final forms and handwriting precision are outside this release.

Food placement, missed drops, animation completion and unsubmitted painting do not create recognition evidence. Submitting an answer creates an attempt; hints mark subsequent success as guided. Glyph assembly records a motor skill, with a separate recognition choice. Checkpoint and event are saved together and duplicate attempts are rejected. Older profiles receive optional defaults without resetting history.

Creations retain mission ID and generation seed so the collection can recreate and activate the finished toy. Repeated creations are retained up to 120 per world. Freehand stroke history within an unfinished step is transient; a completed step is the resume boundary.

## Input and presentation

`Toy` uses primary pointer capture with lifted drag feedback and forgiving target bounds. Tap-select/tap-target and keyboard activation use the same evaluation path. Pointer cancellation, viewport changes and secondary fingers do not submit answers. Color painting uses Canvas clipped to the same object paths as `GardenArtwork`; educational shapes use SVG and glyph pieces use measured font ink bounds.

The scene occupies the fullscreen layout below a small toolbar. Portrait and landscape rules move the work surface and controls; targets start at 56 CSS pixels. The selected Nir/Shir identity, mute, reduced motion, reduced particles, larger targets, fewer choices and stronger guidance carry into the world. `ActivityDemo` previews each mechanic and the collection uses interactive `WorldCreation` objects.

## Assets and offline use

The checked-in image-generation sources and processing provenance are in `art-direction/adventure-v2`. `build:adventure-assets` creates compressed backgrounds, transparent monster poses and crops of the established guide identities. Assets load per world; the next mission's narration is prepared in advance.

`OfflinePreparation` requests the service worker to cache every required URL for the selected world, including narration variants. The worker validates local asset paths and rejects unsuccessful/HTML responses. It acknowledges readiness only when every request succeeds. Capacitor builds package the same local files and do not use this browser preparation flow.

Narration uses the pre-existing administrative generation pipeline. Runtime playback has a generation token so a rejected, obsolete audio play promise cannot stop or overlap a newer instruction. No child data is sent to the generation service. See `narration.md` for administrative operation.

## Validation

`npm run test:e2e` runs the device/browser matrix, every authored mission, glyph raster checks and real browser touch-protocol coverage. `npm run test:adventure:performance` measures simulated frame/feedback behavior. After `npm run build:release`, `npm run test:adventure:offline` tests production preparation and disconnected reloads. Platform builds and physical-device limitations are recorded separately in the acceptance report.
