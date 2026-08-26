# Audio integration

The runtime music package contains six user-supplied 44.1 kHz stereo MP3
tracks under `public/assets/audio/music`. Their roles are documented in
`audio-manifest.json` and mapped in `src/assets/audioManifest.ts`.

Run `npm run validate:audio` to verify the expected files, headers, sizes,
unique IDs and manifest entries.

Runtime behavior is centralized in `src/services/audioService.ts`. Hebrew
narration uses browser Speech Synthesis in the PWA and the operating system's
AVSpeechSynthesizer/Android TextToSpeech service in native builds. Android
explicitly filters out voices that report a network requirement; browser and
iOS voice behavior remains subject to the device, browser, and OS provider.
The existing small Web Audio feedback palette remains in use until dedicated
one-shot effects are supplied.
