# Question Submission Flow

1. A parent, teacher, or content editor opens the protected Admin area.
2. `QuestionSubmissionForm` collects prompt, answers, correct answer, world, skill, age range, difficulty, question type, hint, parent explanation, and tags.
3. The form trims input and strips unsafe angle brackets.
4. `duplicateQuestionDetector` checks existing approved/pending content.
5. `contentReviewAgent` creates a structured review report.
6. `submitQuestionForReview` stores the question under `/pendingQuestionSubmissions`.
7. The question is never placed directly into `/questions`.
8. `QuestionReviewPanel` lets Admin approve, reject, request changes, archive, or edit.
9. Only approved records in `/questions` are returned by `questionProvider` to gameplay.

Critical issues block automatic approval. Duplicate questions are not imported as approved content. Similar questions are kept for manual review.
