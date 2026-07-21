# Runtime assets

Static visual assets live under `public/assets` and are addressed through `src/assets/assetManifest.ts`. Images are not embedded in the initial JavaScript bundle.

- Backgrounds: `public/assets/images/backgrounds`
- Characters: `public/assets/images/characters`
- Objects: `public/assets/images/objects`
- Rewards: `public/assets/images/rewards`
- Original Rive runtime exports: `src/assets/animations`

Use lowercase kebab-case names. Meaningful images require Hebrew alternative text; decorative images must be hidden from assistive technology. Runtime files and source provenance must be recorded in `ASSET_PROVENANCE.md`.
