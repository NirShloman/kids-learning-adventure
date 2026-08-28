# Content quality guidelines

The audience is Hebrew-speaking children ages 3–6. Prompts and spoken instructions must be short, concrete, positive, inclusive plural, and understandable without fluent reading.

Every item requires a unique id, one explicit age, difficulty, pedagogical metadata, valid game-specific answer data, and a hash-matched AI review in `review-status.json`: linguistic, conceptual, age fit, and clarity. This is not a human-professional endorsement.

Reject content containing fear, shame, failure language, violence, stereotypes, political persuasion, personal data, ambiguous answers, reading demands above the target age, or copied wording and assets.

Run before every release:

```bash
npm run validate:content
npm run test:unit
```

The build fails when structure, semantic signatures, coverage, identifiers, answers, Hebrew constraints, visual-leak rules, or AI review status are invalid. Review labels explicitly identify the result as an AI simulation rather than expert approval.
