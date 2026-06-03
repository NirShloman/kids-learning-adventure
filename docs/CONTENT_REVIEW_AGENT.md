# Content Review Agent

`src/services/contentReview/contentReviewAgent.ts` is a rule-based reviewer designed to be replaced or augmented by an AI reviewer later.

## Input

The agent accepts one complete `GameQuestion`.

## Output

The agent returns a structured `QuestionReviewReport` object only:

- approval status
- overall and category scores
- role reports
- issues
- suggestions
- final recommendation

## Current Checks

- Hebrew prompt exists and is short enough for the age range.
- Age range and difficulty fit.
- At least two options exist, with a valid `correctOptionId`.
- Options are not empty or duplicated.
- Safety-sensitive terms are blocked.
- Hint, audio text, parent explanation, and pedagogical goal are present.
- Duplicate flags prevent automatic approval.
- Safety score below 95 prevents automatic approval.

## Future AI Hook

Keep callers pointed at `reviewQuestionContent(question)`. A future server-side AI reviewer can call this rule-based pass first, then attach an AI report with the same output contract.
