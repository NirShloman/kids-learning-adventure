# Illustrated worlds and keepsakes — 2026-09-23

Eight original game worlds and eight matching collectible figurines were generated with the built-in `image_gen` tool. Each asset was generated separately. There are no stock image dependencies or external image requests at runtime.

- Game covers: `public/assets/worlds/{letters,numbers,shapes,colors,matching,memory,patterns,sorting}.webp`
- Collectible figurines: `public/assets/worlds/{letters,numbers,shapes,colors,matching,memory,patterns,sorting}-keepsake.webp`
- Exact cover prompts, source paths and final output paths: [manifest.json](manifest.json).
- Exact collectible prompts, source paths and final output paths: [keepsakes.json](keepsakes.json).
- Visual overview: [covers](covers-contact.png) and [collectibles](keepsakes-contact.png).

Direction: tactile miniature storybook worlds, expressive animal companions, gentle lighting; ceramic and felt collectible figurines with gold accents. Text is rendered by the app, not baked into art. WebP copies preserve original proportions; originals remain in the generator output folder. All sixteen runtime files are bundled locally and included in the production service-worker precache.

The collection has eight worlds and three milestone keepsakes per world, earned after 1, 3 and 6 completed activities. Assisted play counts equally. Existing detective discoveries, adventure creations and legacy progress contribute without double-counting duplicate creations. Earned milestones are stored in the profile's existing journey decorations so they survive history trimming. Mixed discoveries are retained in the collection footer. No purchases, random drops, countdowns or streak requirements.

Typography: locally bundled Heebo Variable, including Hebrew, Latin and numerals. Canvas and SVG letter rendering use the same font. Standalone support/legal pages bundle the font too. The OFL notice is at `public/fonts/Heebo-OFL.txt`.
