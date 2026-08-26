# Brand vNext — foundations and implementation brief

Status: approved production direction — ידעלה / Yedale  
Created: 2026-08-26

## Decision gate

`ידעלה / Yedale` is the approved public name. It passed the preliminary availability screen on 2026-08-26: no exact app-store listing or exact Israeli trademark-database hit was found. This is not a legal opinion; a similarity search and trademark filing remain release gates.

The bundle identifier and local-data keys remain unchanged to preserve the existing installed app and learner progress. Public-facing name, store listing, legal pages, and production icon use `ידעלה / Yedale`.

1. Apple App Store and Google Play exact and similarity searches.
2. Israeli trademark exact, contains, phonetic, transliteration, translation, and visual-similarity searches.
3. WIPO/TMview and target-market searches for classes 9 and 41; class 42 if online services are added.
4. Web, company-name, domain, social-handle, and common-law marketplace searches.
5. Hebrew and English pronunciation, spelling, meaning, and confusion testing with parents.
6. Written approval from trademark counsel for the intended goods, services, and territories.

## Brand strategy

### Audience

- User: Hebrew-speaking children aged 3-6.
- Buyer and trust gatekeeper: parents who want useful, calm, safe screen time.
- Future secondary audience: educators and therapeutic/learning professionals, only if the product is expanded for them.

### Positioning

An imaginative Hebrew-first learning adventure that turns every short game into visible progress, adapts to the child, and protects the family's privacy.

### Brand promise

כל משחק מקדם מיומנות אמיתית — בעברית, בקצב של הילד.

### Brand essence

סקרנות שהופכת להתקדמות.

### Supporting proof

- Designed first for Hebrew rather than translated into Hebrew.
- Learning through interactive worlds and actions, not worksheet-like tapping.
- Child-level progression and recommendations that can become adaptive over time.
- Parent-facing explanations of what was practised and what comes next.
- Local-first, no advertising, no account, and no tracking as long as the implementation continues to support those claims.

### Personality

- Curious, warm, clever, calm, and encouraging.
- Imaginative without looking chaotic or babyish.
- Educational without resembling a school worksheet.
- Confident and specific with parents; playful and concise with children.

### Voice

For children, use short verbs and supportive language: `בואו ננסה`, `גיליתם`, `עוד צעד קטן`. Do not label the child as wrong or weak.

For parents, use concrete claims: what the child practised, how the product works, what data is or is not used, and what is planned next. Avoid unprovable claims such as "guaranteed improvement" or "the best learning app".

## Naming brief

The next name should be a coined, ownable master brand rather than a descriptive phrase. It should:

- Be 2-4 syllables and easy to say after hearing it once.
- Be readable in Hebrew and have one unambiguous Latin spelling.
- Avoid the dominant roots `Noni`, `Nony`, `Nimi`, and other close child-education brands.
- Avoid generic combinations of `learn`, `kids`, `play`, `fun`, `smart`, `לומדים`, or `ילדים` as the distinctive element.
- Work as a spoken recommendation: `הילדה שלי משחקת ב___`.
- Support a character, a world, and future products without tying the brand to one curriculum topic.
- Have realistic domain and social-handle options, even if a qualified domain is used.

The personal story behind “Noni” can remain the internal origin of the project. It should not be the public name or a named child character unless counsel later approves that use.

## Visual direction

### Core idea: עלה הידע

The identity expresses knowledge that grows. The primary symbol is a luminous leaf: its central vein branches into a subtle Y-shaped learning path, a gold seed marks the Hebrew י׳, and a small spark represents the next discovery. It is a visual reading of `ידעלה` — the warmth of knowledge with the growth of a leaf — without placing Latin text or a letter inside the icon. It must remain recognisable at 24 px and should not depend on text.

Avoid the current category clichés: open book, `א`, `123`, rainbow, multiple unrelated symbols, and a full pastel spectrum inside one icon. Those elements explain “education” but do not create an ownable memory structure.

### Colour system

Use one trust-building core colour, one warm signature colour, and limited supporting colours. Pale colours remain backgrounds, not the identity itself.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Core | `brand-blueberry` | `#4338A8` | Logo, primary actions, navigation |
| Signature | `brand-coral` | `#FF796B` | Warm highlights and rewards |
| Discovery | `brand-mint` | `#63D3B1` | Progress and positive accents |
| Spark | `brand-sun` | `#FFD45A` | Small focal points only |
| Canvas | `brand-cream` | `#FFF9EE` | Warm backgrounds |
| Ink | `brand-ink` | `#26324A` | Text and dark UI elements |
| Muted ink | `brand-slate` | `#60708A` | Secondary text |

Blueberry and ink are the text-capable colours. Coral, mint, and sun must not be used for small text on light backgrounds without contrast testing. Every production pairing must meet WCAG AA for its text size.

### Typography

- Keep Rubik for the product UI because it supports Hebrew well and is already integrated.
- Create custom lettering for the final Hebrew wordmark so the logo does not look like ordinary UI text.
- Use Rubik 800/900 for short child-facing headings, 500/700 for controls, and 400/500 for parent explanations.
- Keep line lengths and hierarchy calmer in the parent area than in game screens.

### Logo system to produce after name clearance

1. Hebrew primary wordmark.
2. Latin secondary wordmark.
3. Knowledge-leaf symbol.
4. Horizontal and stacked lockups.
5. One-colour, reversed, and accessibility-safe variants.
6. App icon at 1024 px plus Android adaptive foreground/background assets.
7. Small-size tests at 16, 24, 32, 48, and 64 px.
8. Clear-space, minimum-size, colour, and misuse rules.

### Characters

Keep Nir and Shir as the product's learning companions during the first rebrand phase; replacing them would discard existing production work without improving name ownership. Define consistent proportions, expressions, outline weight, lighting, and motion rules. Add a new mascot only when it has a product role that Nir and Shir cannot serve.

Do not base a child character on a real child's likeness without documented guardian consent, scope, duration, territories, and rights for advertising, store assets, animation, and derivative works.

## Messaging system

### Recommended descriptor

`הרפתקת למידה בעברית לגילאי 3–6`

### Working tagline

`משחקים. מגלים. מתקדמים.`

### Store title pattern

`[השם החדש] — למידה בעברית`

### Store subtitle

`משחקי עברית וחשיבה לגילאי 3–6`

### Parent-facing lead

`זמן מסך עם מטרה: משחקים קצרים בעברית, התקדמות ברורה ופרטיות כברירת מחדל.`

All phrases remain working copy until trademark, advertising-claim, store-policy, and product-truth review.

## Repository migration map

The public name currently appears in the web metadata, PWA manifest, Capacitor configuration, iOS and Android display names, legal pages, store metadata, README, app shell, landing page, logo accessibility label, tests, and release documentation.

Implementation rules:

- Introduce one typed brand configuration module for visible name, descriptors, accessibility label, and URLs; UI components should not hard-code the name.
- Keep existing local-storage keys and migration aliases so a rebrand does not delete learner profiles or progress.
- Do not change the production bundle/application ID merely to match the new name. Treat that as a separate release-engineering decision.
- Replace the current SVG and generated mobile icons only after the final mark is approved.
- Update legal documents and store metadata together so no legacy or conflicting name remains in a release.
- Regenerate iOS/Android assets and run web, unit, E2E, mobile-config, and store-metadata checks before release.

## Work sequence

### Phase 1 — naming and clearance

Completed: `ידעלה / Yedale` selected. Complete an Israeli phonetic-similarity search and file the approved word marks before public launch.

### Phase 2 — identity prototypes

Design three clearly different routes around the approved name, each shown as an app icon, landing lockup, game-header mark, parent-area header, and store screenshot. Select one route based on recall, trust, child appeal, and small-size recognition.

### Phase 3 — design system and production assets

Finalize tokens, wordmarks, app icons, character rules, illustration rules, motion, sound identity, store templates, and a concise brand guide. Record authorship and licences for every asset.

### Phase 4 — app migration

Centralize brand strings, apply the chosen tokens and logo, update web/mobile/store/legal surfaces, preserve user data, regenerate assets, and run the complete release checklist.

### Phase 5 — launch validation

Test icon recognition and store-page comprehension with parents, verify all privacy and educational claims, confirm trademark filing strategy, and monitor store search results and user confusion after launch.

## Current completion

- Completed: preliminary `Noni / נוני` availability and conflict screen.
- Completed: existing brand-surface inventory.
- Completed: brand positioning, promise, voice, visual direction, colour foundation, messaging, logo brief, and migration sequence.
- Completed: public naming, runtime rename, discovery-path symbol, updated PWA/native icon assets, and initial visual token migration.
- Remaining release gates: trademark filing, domain/social-handle registration, legal-page owner/support details, and final store listing assets.
