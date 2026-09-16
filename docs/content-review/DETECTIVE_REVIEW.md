# Detective content review — 2026-09-14

This is an AI editorial review of authored templates, vocabulary and facts, combined with executable checks of every generated item. It is not a human focus group, a teacher's endorsement or a developmental assessment. Reusing a task across age/level cells is intentional; each cell must contain 40 distinct rendered challenges.

## Product curriculum

| Age | Number ceiling | Language | Patterns and properties |
| --- | --- | --- | --- |
| 3 | 5 | Spoken letter names and visual identification; no phonological comparison | AB; familiar circle, square, triangle, rectangle |
| 4 | 10 | Initial letter and explicitly authored initial-syllable comparisons | AB/AAB/ABC by level; no side-count questions |
| 5 | 12, or 15 on hard | The same language skills with increased discrimination | Bounded numeric sequences, simple addition, straight sides |
| 6 | 20 | Initial letter/syllable discrimination | Longer numeric range and explicit classification rules |

Easy choice tasks for ages 3–4 have two answers. Others have three, except two-group comparison: exactly two answers identify the displayed groups. Numbers, totals and numeric distractors remain inside the age ceiling. Difficulty never silently changes during a session. Age three hard remains inside age-three skills.

## Editorial decisions and corrected defects

* Letter names are not presented as isolated phonemes. Initial-syllable tasks use the explicit pairs in `content-facts.mjs`; the answer is a different word. Each option can be spoken separately. The formerly misleading apple image for pomegranate was removed. Pictures supplement spoken words, not the other way around.
* Counting uses countable elements; group answers reproduce their group; addition uses bounded operands and totals. Numeric sequences contain numeric distractors only. The answer is independently recomputed during validation.
* Geometry uses deterministic SVG contours. A rhombus is drawn distinctly from a rotated square. Side questions concern straight sides, and only the curated shapes are used; the former zero-sided star/heart claims and inferred shapes of unseen everyday objects are removed.
* Color swatches use explicit fixed values, including pink and a bordered white swatch. Identification, finding a named color, and odd-one-out have clear targets. Equal-looking decorative Unicode color glyphs are no longer the source of truth.
* Repeating sequences show two complete motif repetitions before the final gap on easy/medium; hard can place the gap inside the third repetition. Reading direction is explicitly left to right with an arrow. Every displayed position is checked against the authored rule.
* Sorting states its rule. Hard ages 4–6 can alternate category and color rules. The vocabulary excludes ambiguous toy/vehicle twins, microphones as instruments, generic door images as wardrobes and food items with competing classifications.
* Pair boards use one relationship at a time. Picture/picture pairs are identical; numeral/quantity pairs agree; letter/picture pairs use the explicit word map. Selection rejects interchangeable pair values and requires a full board.
* Prompts are short, concrete, in inclusive plural Hebrew. Errors invite another approach. Hints and explanations are specific to the rule. The UI distinguishes an independent solution, a solution with help and a demonstration.

## Evidence and limitations

The final difficulty audit found identical medium/hard cells and numeric generation that stopped before reaching the age ceiling. Difficulty now changes rendered activities: age-three hard letters find a repeated symbol; hard comparisons mix more/fewer and use larger addition increments where permitted; hard visual odd-one-out shows five samples; category sorting uses one/two/three examples by level. Normal pair boards increase from easy to medium to hard at every age (2–4, 3–5, 4–6, 5–7 pairs for ages 3–6). Adaptive boards retain their separate two/three-pair limit. Number examples span the entire authored ceiling. These differences and ceilings are executable acceptance assertions.

The final phonology pass replaced מכונית/מפתח, קוף/קופסה and רכבת/רגל: their initial consonants match but their initial vowels do not. The reviewed pairs are מתנה/מפתח (מַ), קופסה/קובייה (קוּ), and רכבת/רדיו (רַ). This is an editorial check of pronunciation; the executable oracle alone cannot establish pronunciation from spelling.

The pair תפוח/תפוז replaces תפוח/תנור because the hot-springs symbol did not actually depict an oven. Both fruit images now denote the spoken words.

Counting marks are restricted to individual whole apples, bananas, strawberries, pears, peaches, carrots, onions and eggplants. Grape bunches, cherry pairs and watermelon slices are excluded from quantities. Spoken quantity labels use "פריט אחד" or "N פריטים", avoiding incorrect singular/plural fruit names. These exclusions are enforced by the visual oracle.

The recording pass on 2026-09-16 also corrected eight distinct singular explanations that still said "1 פריטים". Counting and pair explanations now use "פריט אחד"; a one-item comparison names the smaller group explicitly. The discovery summary uses one recorded celebration of completing the picture, which also covers adaptive sessions and two-pair boards; detailed outcome counts remain visible and available to screen readers.

The generator resets reviews to pending. `validate-static-content.mjs --unreviewed` checks schema, age/level coverage, unique content, domain options, visual consistency and independently derived answers without waiving any content checks. The explicit editorial-record command then checks that a review document exists and records the exact content hashes. Later edits invalidate those hashes.

`detective-content.test.ts` recomputes all 3,840 generated items, covers all 96 selections, and deliberately corrupts answers, quantities, group visuals, shapes, words, sequences and pairs to verify rejection. Browser tests separately exercise actual rendering and interaction. These checks cannot establish children's comprehension; no human usability study is claimed.
