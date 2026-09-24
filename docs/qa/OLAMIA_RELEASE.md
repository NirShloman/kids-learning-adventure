# Olamia rebrand and narration verification — 2026-09-18

## Implemented

- Public brand: עולמיה / Olamia. Approved narration: עוֹלָמִיָּה,
  `he-IL-Chirp3-HD-Aoede`, rate 0.92, version 1.
- Hebrew and Latin wordmarks retain the supplied owl/lotus/glossy-letter style.
  The text-free owl icon is intentionally unchanged. Platform launch images,
  PWA assets, UI, accessible labels and public/legal pages use the new name.
- Application IDs, storage keys and cloud project identity are unchanged.
- The active catalog contains 1,982 unique texts from 22,271 references.
  Only the new welcome sentence required synthesis (35 characters); the rest
  reuse existing files. Historical sources and recordings were not deleted.
- Imported all 1,982 existing MP3s (45,364,800 bytes) into Cloud Storage and
  Firestore without invoking synthesis. Active assets and bindings are ready.
- Sync reused all 1,982 local MP3s, downloading zero files. Manifest records
  local playback paths, cloud archive URLs, checksums, duration and voice config.
- A public Storage URL returned HTTP 200, audio/mpeg and matching SHA-256.
  Two cloud cache lookups returned the same asset, made zero synthesis calls
  and left synthesis usage unchanged.
- Updated the deployed narration Function. The cloud API reported ACTIVE and
  `TTS_GENERATION_ENABLED=false` after deployment. Old input events cannot
  overwrite output after a newer edit.
- Bounded narration preload/cache; local slow playback; no runtime cloud calls.
  Service worker caches complete MP3s on demand and serves byte ranges offline.

## Checks

- 201 unit tests, 3 in-memory integration tests, 6 emulator-backed tests passed.
- 18 Playwright smoke tests passed (desktop Chromium and mobile Chrome),
  including the new name, logo, local MP3 and no external runtime requests.
- Production offline smoke passed, including identical MP3 bytes after
  disconnecting the network.
- Release build, strict narration validation, content validation (3,840 items),
  TypeScript, Functions build, Capacitor sync and mobile verification passed.
- Android `assembleDebug` succeeded. The APK is generated under
  `android/app/build/outputs/apk/debug/app-debug.apk`.
- iOS resources/configuration were synchronized and verified. An iOS archive
  was not built on Windows; that requires macOS/Xcode and signing.

## Deployment boundaries and remaining operator choices

The Functions deploy reported successful update, followed by a nonzero exit
because the container-image cleanup policy was not configured. Independent
Cloud Functions API verification confirmed the deployed function is ACTIVE.
No cleanup policy or deletion was applied without owner approval. Container
build artifacts can incur storage charges until a retention policy is chosen;
this is separate from MP3 asset cleanup, which remains dry-run only.

The public Web site and app-store releases have not been deployed in this
change. A Git commit was not created. New source images, active MP3s and the
manifest must be included when committing the release. Existing unrelated
workspace changes were preserved.

Firebase and Vite emitted non-blocking SDK/chunk-size advisories. Android
reported existing Gradle/SDK-format warnings but built successfully.

Asset provenance and editing prompts: `docs/branding/OLAMIA.md`.
