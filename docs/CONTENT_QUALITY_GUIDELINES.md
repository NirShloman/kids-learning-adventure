# Content Quality Guidelines

## Audience

Questions are for Hebrew-speaking children ages 3-6. Prompts should be short, concrete, positive, and easy to read aloud.

## Required Fields

Every seed or submitted question must include:

- prompt
- 2-4 options
- one valid correct option
- world
- skill
- age range
- difficulty
- question type
- hint
- parent explanation
- pedagogical goal
- tags
- status

## Safety

Avoid fear, shame, violence, stereotypes, political content, sensitive religious content, and any personal information. User content must always go through pending review.

## Duplicate Policy

- `>= 0.92`: duplicate, do not approve.
- `0.78-0.92`: similar, manual review.
- `< 0.78`: continue to agent review.

## Seed Workflow

Run:

```bash
npm run validate:content
npm run review:content
npm run check:duplicates
```

The current trial seed has 120 reviewed canonical questions in `shared-content/seed/questions.seed.json`.
