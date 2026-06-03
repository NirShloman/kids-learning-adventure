# Assets

Static visual assets live under `public/assets` so they are not imported into the JavaScript bundle.

- Images: `public/assets/images/{characters,backgrounds,objects,rewards,ui}`
- Animations: lightweight CSS effects in `src/styles.css`
- Audio: `public/assets/audio/{sfx,voice}`
- Asset ids: `src/assets/assetManifest.ts`

Use lowercase, kebab-case filenames with descriptive names and no spaces. Add every new runtime asset to `assetManifest.ts`, then render it through `GameImage` or a component-local background style.

Firestore should store asset ids such as `apple` or `bgLetters`, not image files or hard-coded paths. If future admin uploads are needed, move binaries to Firebase Storage and keep metadata in Firestore.

`GameImage` accepts `assetId`, `alt`, `className`, and `decorative`. Meaningful images need Hebrew alt text; decorative images should use `decorative`.

Prefer small assets:

- Backgrounds: about 30-100KB as JPG/WebP when transparency is not needed.
- Objects and characters: about 50-150KB as transparent PNG/WebP.
- Animations: lightweight CSS effects.

Current runtime assets use a polished generated 3D-clay/paper-cut style:

- Backgrounds are JPG files generated in the shared learning-world style and referenced through the existing `bg*` ids. Each game has its own topic-specific background, including `bgMatching`, `bgMemory`, `bgPatterns`, and `bgSorting`.
- Large generated PNG source files and old SVG placeholders are kept under `docs/asset-sources/backgrounds` so they do not ship from `public`.
- Characters, objects, and reward art are transparent PNG cutouts generated as a cohesive icon sheet.
- SVG placeholders were removed after the upgraded raster assets became the runtime source of truth.
