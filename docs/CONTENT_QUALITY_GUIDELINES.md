# Content quality guidelines

The audience is Hebrew-speaking children ages 3–6. Prompts and spoken instructions must be short, concrete, positive, inclusive plural, and understandable without fluent reading.

Every item requires a unique id, explicit ages, difficulty, skill, valid game-specific answer data, and three approvals in `review-status.json`: linguistic, conceptual, and age fit.

Reject content containing fear, shame, failure language, violence, stereotypes, political persuasion, personal data, ambiguous answers, reading demands above the target age, or copied wording and assets.

Run before every release:

```bash
npm run validate:content
npm run test:unit
```

The build fails when structure, semantics, coverage, identifiers, answers, Hebrew constraints, or review status are invalid.
