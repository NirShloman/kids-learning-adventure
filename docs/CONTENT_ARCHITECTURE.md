# Static content architecture

Each game owns one versioned JSON envelope in `src/content`. Items share `id`, `ages`, `difficulty`, and `skill`; game-specific fields are validated by `scripts/validate-static-content.mjs` and `content-envelope.schema.json`.

The validator enforces exact totals, unique ids, Hebrew text constraints, valid answers, semantic arithmetic and sequence results, category consistency, unique memory pairs, and at least 15 eligible items for every game/age/difficulty combination. `review-status.json` must approve linguistic quality, conceptual correctness, and age fit for every id.

`staticContentRepository.ts` lazy-loads and memory-caches one bank at a time. `questionService.ts` performs exact filtering and balances the session by skill. It never falls back to content for another age or difficulty.

Content principles:

- Age 3: concrete visual recognition and short spoken instructions.
- Age 4: matching, counting, and simple comparisons.
- Age 5: sound awareness, patterns, and categories.
- Age 6: first-grade readiness without assuming fluent reading.
- Instructions use short, inclusive plural Hebrew.

External products may inform pacing and mechanics only. Questions, wording, visual compositions, characters, and assets must remain original.

Primary pedagogical references:

- [Hebrew language and early literacy curriculum, Ministry of Education](https://pop.education.gov.il/tchumey_daat/ivrit_chinhch_leshony/yesodi/pedagogy-hebrew-linguistic-education/curriculum/)
- [The concept of number in kindergarten, Ministry of Education](https://pop.education.gov.il/kindergarten/topics/math/teaching-materials-math/concept-number/)
