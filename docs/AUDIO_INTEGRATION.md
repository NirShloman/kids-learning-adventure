# Audio integration

The runtime music package contains six user-approved 44.1 kHz stereo MP3
tracks under `public/assets/audio/music`. Their roles are documented in
`audio-manifest.json` and mapped in `src/assets/audioManifest.ts`.

Run `npm run validate:audio` to verify the expected files, headers, sizes,
unique IDs and manifest entries.

Runtime behavior is centralized in `src/services/audioService.ts`. Hebrew
narration deliberately uses browser Speech Synthesis: music generation is not
used for speech. The existing small Web Audio feedback palette remains in use
until dedicated one-shot effects are supplied.
