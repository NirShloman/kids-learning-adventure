# Olamia — active brand

Owner-approved name and pronunciation: 2026-09-17. Integrated: 2026-09-18.

- Public Hebrew name: **עולמיה**. Latin name: **Olamia**.
- Narration: **עוֹלָמִיָּה**, Google Chirp 3 HD Aoede, Hebrew, rate 0.92.
- Keep the original owl, lotus, foliage, purple base, glossy colorful letters,
  UI palette, typography and layout. The icon contains no lettering and is
  reused exactly; all platform sizes are exported by `npm run mobile:assets`.
- Preserve `com.nirshloman.lomdimbekef`, existing local-storage keys and cloud
  project IDs. Those identify installed apps/data, not the public brand.

## Source and output assets

`assets/brand/source/olamia_logo_horizontal.png` and `olamia_logo_latin.png`
are transparent production masters. The Hebrew logo is used at runtime;
the Latin companion is available for English-language collateral.
`olamia_app_icon_1024.png` and `olamia_small_icon_1024.png` are unchanged copies
of the owner's original text-free owl artwork.

`scripts/generate-mobile-assets.mjs` exports WebP logos, favicon, PWA icons,
Android launcher/adaptive icons and portrait/landscape splash images, and iOS
app-icon/splash assets. Old sources remain as historical references.

## Image editing record

Tool: built-in ImageGen, text-localization edit mode. Hebrew source: the owner's
`yadaale_logo_horizontal.png`. Latin source: the new Olamia Hebrew logo.

Hebrew prompt: Replace only the old wordmark with the exact six-letter Hebrew
word `עולמיה`, with no apostrophe or vowel marks. Preserve the friendly owl on
the left, coral lotus, teal/purple leaves, gold underline and dots, glossy 3D
lettering, deep-purple outlines, horizontal composition and genuine alpha.

Latin prompt: Replace only the Hebrew wordmark with `Olamia` (capital O), keeping
the same owl, lotus, foliage, gold underline, composition, colors and glossy
letter styling on a genuinely transparent background.

Generation outputs: `exec-c8d7594f-e8fe-44de-bc5d-607e26704248.png` (Hebrew) and
`exec-aaf0324c-c090-4161-8faf-a688cbc8e1cf.png` (Latin); copied into this repository.
These edits do not establish new rights in the supplied source art. Historical
clearance searches for other names do not cover Olamia.
