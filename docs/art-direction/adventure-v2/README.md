# Adventure v2 art sources

The four PNG environments and monster chroma atlas were generated with the built-in ImageGen tool on 2026-09-10/11. Runtime derivatives live in `public/assets/experience/v2`; source images are retained here and never loaded by the app. No external stock, marketplace character rigs or remote runtime assets are used.

Shared art brief: premium preschool toy world, clay and wood materials, rounded objects, soft warm sunlight, 2.5D depth; empty cream work surface beneath decorated upper background; no embedded text, letters, digits or UI. Composition must remain usable with portrait cropping.

Environment prompts:
- Numbers: magical miniature kitchen, mint cabinets, terracotta details, arched window, ceramic bowls, copper pots, herbs, sunny gingham curtain. Empty table for interactive plates and food.
- Letters: cozy lilac letter workshop, miniature printing press, paper rolls and blank wooden blocks on outer shelves. Empty cream work surface.
- Shapes: teal toy inventor workshop, brass gears, wooden wheels and small tools around the edges. Empty cream work surface.
- Colors: sunny garden art studio, mint greenhouse, flowers and bushes at outer edges, blank hanging pots. Empty cream work surface.

Monster prompt: original round mint-green clay chef with kind eyes, small gold horns, peach cheeks, cream hat and peach apron; exact 2×2 grid containing idle, ready-to-eat, chewing and celebrating poses, identical identity and scale. The model's transparency attempt produced opaque pixels. A further ImageGen edit replaced the backdrop with uniform magenta for deterministic chroma extraction by the build script. The final runtime files have real alpha, verified by the asset validator.

Nir (with and without kippah) and Shir reuse the approved character identity and original atlas poses. The build extracts idle, helping and celebration cutouts; runtime animation supplies anticipation, floating and response to selection/completion. These are not new hand-rigged character models.

Rebuild with `npm run build:adventure-assets`. Sharp performs format conversion, atlas extraction, chroma-alpha extraction and runtime sizing. Runtime manifest records dimensions and distinguishes backgrounds from cutouts. Target maximum: 1 MB per runtime asset.
