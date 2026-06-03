# Question Bank Upgrade Plan

## Current State

- Questions are currently stored in source modules under `src/data/questions/*` for quiz games and `src/data/activityData.ts` for matching, memory, patterns, and sorting.
- `scripts/validateQuestionBank.ts` already runs a rule-based `speechTherapistAgent` check over the bundled content. Current validation passes with 509 total game items: 310 quiz questions, 47 matching pairs, 104 memory cards, 24 pattern puzzles, and 24 sorting challenges.
- `scripts/seedFirestore.ts` writes the existing bank into Firestore under `questionBank/*` documents, grouped by game/category rather than as individual managed questions.
- Runtime question loading goes through `questionService.ts`, which calls `questionCacheService.ts`. The cache service tries Firestore first, then localStorage, then bundled source data.
- Firestore client setup already exists in `src/services/firebase.ts`, with Vite environment variables and a no-Firebase local fallback.
- The game UI does not directly call Firestore, which is a good boundary to keep. Quiz games consume `QuizQuestion[]`; other games use typed activity data.
- There is no dedicated Admin content dashboard or question review workflow yet. The existing parent dashboard is for progress and cloud sync.
- `adaptiveEngine` is not present as a standalone module. Current adaptation is simpler: `questionService.ts` filters by age and difficulty, falls back to age-only content, shuffles, and limits the result count.
- Existing Firestore rules allow public reads and block client writes for `questionBank/*`; private progress is protected by `ownerId`.

## Proposed Firebase Structure

Use Firestore as the canonical managed content source while preserving the current bundled bank as offline fallback.

```text
/questions/{questionId}
/pendingQuestionSubmissions/{submissionId}
/questionReviewReports/{reportId}
/questionDuplicates/{duplicateId}
/contentVersions/{versionId}
/auditLogs/{logId}
/questionBank/{legacyDocId}
```

- `questions`: only `approved` or `archived` canonical `GameQuestion` documents used by games.
- `pendingQuestionSubmissions`: user/admin submissions with `pending_review`, `needs_changes`, or `rejected` status.
- `questionReviewReports`: structured reports from the review agent.
- `questionDuplicates`: duplicate/similarity check records.
- `contentVersions`: metadata for published content packs such as `content-v1-trial-2026-06`.
- `auditLogs`: admin-only status and content changes.
- `questionBank`: retained as legacy grouped content for backwards compatibility during migration.

## Question Submission Flow

1. User/admin enters a question through a UI form.
2. Client performs required-field validation and trims/sanitizes free text.
3. Repository runs duplicate detection against approved and pending questions.
4. Repository runs the content review agent.
5. Critical failures cannot be saved as approved content.
6. User-submitted content is always stored as `pending_review`.
7. Admin can approve, reject, request changes, or archive.
8. Only approved questions in `/questions` are returned to the games.

## Content Review Agent Flow

- The first implementation is deterministic and rule-based so it can run locally, in scripts, and in the browser admin flow.
- The agent returns only structured JSON matching `QuestionReviewReport`.
- It checks clarity, age fit, difficulty, one valid answer, option quality, Hebrew language, text length, safety, hint, parent explanation, accessibility, and pedagogical alignment.
- The service is designed behind one function so a future AI-backed reviewer can replace or supplement the rules without changing repository/UI callers.

## Duplicate Prevention Flow

- Normalize Hebrew by removing niqqud, punctuation, extra whitespace, and common presentation differences.
- Build a prompt fingerprint from normalized prompt plus world/skill/age.
- Compare exact fingerprints first.
- Compare similarity with token overlap, Levenshtein ratio, option overlap, same correct answer, same skill, and same pedagogical goal.
- Scores `>= 0.92` are duplicates, scores `0.78-0.92` are similar and require manual approval, lower scores continue to agent review.

## Type Structure

Add canonical content types in `src/types/index.ts` or re-exported type modules:

- `GameQuestion`
- `GameOption`
- `QuestionReviewReport`
- `ReviewRoleReport`
- `ReviewIssue`
- `DuplicateCheckResult`
- `ContentVersion`
- `QuestionStatus`
- `AgeRange`
- `SkillId`
- `LearningWorldId`

Keep existing `QuizQuestion`, `MatchingPair`, `MemoryCard`, `PatternPuzzle`, and `SortingChallenge` to avoid breaking current game components. Add conversion helpers from existing quiz data to canonical `GameQuestion`.

## Security Risks And Mitigations

- Public writes to approved content: block client writes to `/questions`.
- User content appearing to children: submissions go only to `/pendingQuestionSubmissions`.
- Secrets in code: keep Firebase values in env vars, blank `.env.example`, service accounts outside git.
- Personal data in child app: do not store names beyond local/player progress needs; never store child free text in approved content without review.
- Unsafe rendering: avoid `dangerouslySetInnerHTML`, `innerHTML`, and `eval`; render text through React.
- Admin spoofing: require custom claims or an allowlist helper before production. Until full Admin Auth exists, rules should default to blocking privileged client writes.

## Implementation Stages

1. Add canonical types and a Firebase client wrapper.
2. Add duplicate detector and content review agent services.
3. Add Firestore question repository and provider facade with bundled fallback.
4. Route existing quiz loading through `questionProvider` while keeping current game behavior.
5. Add Admin dashboard components for submission, duplicate warnings, review reports, filtering, and status changes.
6. Add seed JSON and scripts for validation, review, duplicate checks, import, and export.
7. Update Firestore rules for canonical collections and keep legacy `questionBank` read-only.
8. Add docs for Firebase architecture, review agent, submission flow, quality guidelines, and security.
9. Run `npm run build`, `npm run validate:content`, `npm run review:content`, and `npm run check:duplicates`.
