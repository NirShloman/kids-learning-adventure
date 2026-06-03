# Firebase Setup

The app supports two modes:

- Local-only mode: no Firebase env vars are configured, and progress stays in `localStorage`.
- Cloud mode: Firebase Auth signs users in anonymously, progress syncs to Firestore, and `questionBank` loads from Firestore with local cache fallback.

## Environments

Use separate Firebase projects for development and production. Suggested names:

- `kidslearningadventure-dev`
- `kidslearningadventure-prod`

Create local env files that are not committed:

- `.env.development`
- `.env.production`

Each file should define the `VITE_FIREBASE_*` values shown in `.env.example`. Do not point local development at production Firestore.

## Auth

The default runtime uses Anonymous Auth so each browser/device gets its own Firebase uid. This isolates `players` and `sessions` per device. Cross-device sync requires a real login provider later, such as Google or email/password.

## Firestore

Public content:

- `questionBank/*` is readable by everyone and not writable by clients.
- New managed content uses `/questions`, `/pendingQuestionSubmissions`, `/questionReviewReports`, `/questionDuplicates`, `/contentVersions`, and `/auditLogs`. See `docs/FIREBASE_CONTENT_ARCHITECTURE.md`.

Private progress:

- `players/{playerId}` includes `ownerId`.
- `sessions/{sessionId}` includes `ownerId`.
- Rules require `request.auth.uid == ownerId`.

The app must not query all players or sessions without `where('ownerId', '==', uid)`.

## Seeding Question Bank

Run the local quality gate first:

```bash
npm run validate:questions
```

Run `npm run seed` from a trusted developer machine only. The seed script uses Firebase Admin SDK, so it bypasses client security rules without opening `questionBank` writes to browsers.

Use one of these credential options:

- Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path.
- Or set `FIREBASE_SERVICE_ACCOUNT_PATH` to a service account JSON path.

Keep service account JSON files outside git.

## App Check

`src/services/appCheck.ts` initializes App Check only when `VITE_FIREBASE_APPCHECK_SITE_KEY` is set. App Check is an extra protection layer and does not replace security rules.

## Remote Config

`src/services/remoteConfigService.ts` defines local defaults and fetches Remote Config opportunistically. The app never blocks on Remote Config.

## Analytics

`src/services/analyticsService.ts` sends product events only. Do not send child names, free text, email, or other personal data.

## Cloud Functions Plan

For public launch, add a server-side function that reacts to new sessions and updates a summary document:

- `users/{uid}/stats/summary`, or
- `players/{playerId}/stats/summary` with `ownerId`.

Recommended fields:

- `totalSessions`
- `totalCorrect`
- `totalQuestions`
- `averageScore`
- `starsTotal`
- `lastPlayedAt`
- `perGameStats`
- `perDifficultyStats`
- `weakAreas`
- `strongAreas`

The goal is for the parent dashboard to read one small summary document instead of scanning many sessions.
