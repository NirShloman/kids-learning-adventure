# Security And Privacy

This app is for children ages 3-6, so content and data handling must stay conservative.

## Do Not Store

- unnecessary personal information
- family names
- addresses
- child photos
- raw user content in approved gameplay
- Firebase service account JSON files
- secrets or private keys in source

## Required Controls

- User-submitted questions go to `pendingQuestionSubmissions`.
- Approved gameplay content is separated into `/questions`.
- Admin approval requires custom claims before production.
- Audit logs are written for admin content changes.
- Firebase config uses environment variables.
- Admin import/export scripts use server-side credentials only.

## Rendering Safety

Do not use `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. Render user text through React text nodes after validation and sanitization.

## Production Checklist

- Enable Admin Auth/custom claims.
- Deploy `firebase/firestore.rules`.
- Use separate Firebase projects for development and production.
- Keep service accounts outside git.
- Run content validation, review, duplicate checks, build, and rules tests before release.
