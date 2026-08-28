# Static content architecture

Each game owns one versioned JSON envelope in `src/content`. Version 2 items have one explicit target age, a difficulty, and stable pedagogical metadata: `taskFamily`, `conceptKey`, `variantKey`, and `visualRole`.

The validator enforces 480 items per game and exactly 40 items for every game/age/difficulty combination. It rejects duplicate challenge signatures, invalid answers, out-of-age skills, and answer-revealing visuals above the easy direct-recognition tier. `review-status.json` records a hash-matched, transparent AI-simulation review for every item; it is not represented as human professional approval.

`staticContentRepository.ts` lazy-loads and memory-caches one bank at a time. `questionService.ts` performs exact filtering and balances the session by skill and semantic signature. It never falls back to content for another age or difficulty.

Content principles:

- Age 3: concrete visual recognition and short spoken instructions.
- Age 4: matching, counting, and simple comparisons.
- Age 5: sound awareness, patterns, and categories.
- Age 6: first-grade readiness without assuming fluent reading.
- Instructions use short, inclusive plural Hebrew.

External products may inform pacing and mechanics only. Questions, wording, visual compositions, characters, and assets must remain original.

Primary pedagogical references:

These links are background references to general educational concepts only. They do not indicate Ministry of Education approval, endorsement, partnership, curriculum certification, or review of this application.

- [Hebrew language and early literacy curriculum, Ministry of Education](https://pop.education.gov.il/tchumey_daat/ivrit_chinhch_leshony/yesodi/pedagogy-hebrew-linguistic-education/curriculum/)
- [The concept of number in kindergarten, Ministry of Education](https://pop.education.gov.il/kindergarten/topics/math/teaching-materials-math/concept-number/)
