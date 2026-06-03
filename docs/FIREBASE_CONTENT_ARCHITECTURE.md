# Firebase Content Architecture

## Canonical Collections

- `/questions/{questionId}`: approved or archived `GameQuestion` documents. Games read only approved records through `questionProvider`.
- `/pendingQuestionSubmissions/{submissionId}`: draft, pending, needs-changes, and rejected submissions. User content lands here first.
- `/questionReviewReports/{reportId}`: structured output from the content review agent.
- `/questionDuplicates/{duplicateId}`: duplicate and similarity decisions captured during submission/import.
- `/contentVersions/{versionId}`: content pack metadata, for example `content-v1-trial-2026-06`.
- `/auditLogs/{logId}`: admin status changes and imports.
- `/questionBank/{legacyDocId}`: legacy grouped bank retained as a read-only compatibility fallback.

## Runtime Boundary

Game components should not import Firebase. They call `questionService`, which calls `src/services/questions/questionProvider.ts`. The provider tries canonical Firestore questions, then falls back to the validated bundled bank.

## Environment

Use Vite variables only:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Admin import/export scripts use `FIREBASE_PROJECT_ID` and either `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_PATH`.

## Rules

The canonical rules live in `firebase/firestore.rules`. Public clients may read approved questions. Approved writes, review reports, duplicate records, content versions, and audit logs require Admin/custom claims.
