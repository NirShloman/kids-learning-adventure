# Intelligent UI

The shared interface lives in `src/intelligent-ui.css`, loaded after the base stylesheet in `src/main.tsx`. The `--ui-*` tokens define the canvas, surfaces, typography colors, borders, primary action and shadows. Existing world illustrations and answer, hint and success states retain their own meaning.

## Behavior

- Home shows the active profile’s nickname, persisted discovery counts and a direct entry to the existing adaptive session. An unfinished mixed round matching the selected age and difficulty changes the action to “ממשיכים לגלות”. The adaptive session still validates content before resuming.
- Cards show earned discoveries from `worldProgress`, using the same counting rules as the collection. No additional persistence or network service is introduced.
- Low portrait screens use a shorter invitation. Low landscape screens prioritize the game grid; adaptive practice remains available through “המסלול שלי”. Primary actions and pagination retain 56px touch targets.
- Setup shows three labeled steps. The parents’ area leads with an overview and the next activity suggestion, with section links to skills, profiles and accessibility.
- Motion honors the system preference and the existing per-profile reduced-motion setting. Keyboard focus, sound switches, large text and high contrast are supported.

## Verification

`tests/e2e/intelligent-ui.local.spec.ts` covers adaptive continuation, responsive home layouts, sound controls, keyboard operation, reduced motion, enlarged text and an axe accessibility audit of the home screen.

Existing smoke, child-layout and experience-visual suites cover profile creation, local settings, parent controls, all game entry points, activity feedback, result screens and portrait/landscape layouts. `npm run build` includes TypeScript, content, narration, asset and local privacy validation.
