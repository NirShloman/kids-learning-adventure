# Audio integration

The runtime music package contains six user-supplied 44.1 kHz stereo MP3
tracks under `public/assets/audio/music`. Their roles are documented in
`audio-manifest.json` and mapped in `src/assets/audioManifest.ts`.

Run `npm run validate:audio` to verify the expected files, headers, sizes,
unique IDs and manifest entries.

Runtime music and effects remain centralized in `src/services/audioService.ts`.
Hebrew narration is centralized in `src/services/narrationService.ts`: bundled,
content-addressed Google Chirp 3 HD MP3 files are the primary path. Browser
Speech Synthesis and the native AVSpeechSynthesizer/Android TextToSpeech drivers
are retained only as failure and not-yet-generated fallbacks. The application
never calls Google or Firebase while a child is playing. Full generation,
storage, synchronization and operations documentation is in `narration.md`.
