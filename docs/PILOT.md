# Web kindergarten pilot

The pilot is opt-in (`VITE_PILOT_ENABLED=1`). Local Web and native builds keep their existing storage behavior. This code does not create a production Firebase project or publish the site. Missing real operator details are intentionally not invented.

## Setup

1. Create a **separate** Firebase/Google Cloud project for the pilot, Firestore Standard in an EU location, Firebase Authentication email/password, and Identity Platform configuration permissions. Use Node 22 for Functions. Never reuse the narration project. Cloud Functions use `europe-west1`.
2. Install the root and `pilot-functions` dependencies with `npm ci` in each directory. Run `npm run build` in `pilot-functions`. Deploy using `firebase deploy --config firebase.pilot.json --project YOUR_PILOT_PROJECT --only functions,firestore:rules`. This config never deploys narration resources.
3. Copy `.env.example` to a local environment file, fill the Firebase Web app configuration and enable the pilot. These Web configuration values are public identifiers, not Admin credentials. Add the final Cloudflare domain to Auth authorized domains. Restrict the Web API key to the required services. Run `npm run build:release` and deploy the resulting `dist` to the existing Cloudflare worker. Do not enable emulator mode in production.
4. Provision each garden with ADC, using `npm run provision -- PILOT_PROJECT garden-email "גן לדוגמה"` from `pilot-functions`. Set `OLAMIA_NARRATION_PROJECT_ID` first. The tool disables public account signup via the Identity Platform Admin API before creating any account. It refuses to replace an existing account and prints a password-setup link for secure manual delivery; it sends no messages. Do not commit that link.
5. Confirm direct public signup is rejected in the real project. Configure Firebase password policy and the password-reset email template. Verify password reset on the final domain. The emulator cannot prove the real Identity Platform signup restriction.
6. Run `scripts/pilot-backups.ps1 -PilotProjectId ... -NarrationProjectId ...` after checking for an existing daily schedule. It creates a daily backup with 30-day retention. Restore one backup to a **separate test database**, never over the live database; verify sample profiles/events and isolation. Do not restore deleted children to active service. Scheduled backups and Functions require a configured billing account.
7. Configure a verified Cloud Monitoring notification channel. Run `scripts/pilot-monitoring.ps1` with the pilot/narration project IDs, channel resource name, billing account and operator-approved monthly budget/currency. It creates a Cloud Functions v2 server-error policy and project-scoped billing alerts at 50%, 90% and 100%; inspect existing policies before running it to avoid duplicates. Add an HTTPS uptime check for the final Cloudflare URL. Do not place child names, request bodies, PINs or passwords in logs. Google service logs still contain operational metadata. Test notification delivery and record evidence in `pilot/readiness.json`. Budget alerts notify; they do not cap spending.
8. Complete the operator fields, active-data retention policy and public privacy/terms/support pages. Record classroom hardware, teacher walkthrough, educational review and media-rights evidence in `pilot/readiness.json`. Run `node scripts/pilot-readiness.mjs`; missing evidence deliberately fails this release gate.

`npm run deploy` enforces this readiness gate whenever the Web pilot is enabled. Building and testing do not require invented deployment evidence; publishing the pilot does.

Cloud behavior references: [offline persistence and conflict behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline), [Identity Platform signup restriction](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config), [managed Firestore backups](https://firebase.google.com/docs/firestore/backups).

## Data and synchronization

- `memberships/{uid}` binds the shared garden account to exactly one kindergarten; only the Admin SDK can provision it. Disabled memberships lose server access.
- `kindergartens/{garden}/profiles` contains child settings and permanent anonymous deletion markers. `states` contains bounded display history and derived progress. Permanent `events`, `sessions`, per-session `checkpoints` and operation `receipts` are separate collections. Only authenticated members read their garden’s profiles, states and checkpoints. All direct client writes are denied.
- The staff PIN is an interface gate, not the cloud authorization boundary. The server stores a salted scrypt hash and rate limits verification. A trusted classroom computer stores a separate PBKDF2 verifier for offline access. Offline access cannot immediately learn remote PIN resets or account revocations; physically control trusted computers and reconnect them regularly.
- Each learning mutation is durably committed with its outbox entry in an account-specific IndexedDB transaction. Stable operation IDs and permanent event IDs prevent duplicate credit after lost responses. Profile leaf patches preserve unrelated settings. Earned collection arrays merge by identity. Live gameplay is never overwritten by a background cloud pull.
- Opening the staff screen after refresh is locked. Starting a child mounts a fresh game environment. Multiple saved sessions remain separately selectable. Remote reads occur at staff boundaries, after pending writes are flushed.
- Deletion commits a tombstone first, then removes events, sessions and checkpoints. A failed cleanup is retried with the same operation. Late operations cannot resurrect the child. Backups may retain deleted data until their 30-day expiration; isolated restores must reapply later deletions before any recovery to service.
- The local storage source is preserved during an explicitly approved migration. Unreadable legacy data is never silently replaced. Cloud confirmation is required before marking migration complete.
- Local history is bounded; permanent cloud events remain available for audit and rebuilding progress. Active-data deletion at the end of the pilot follows the completed operator retention policy.

## Testing and rollout

Run `npm run test:unit`, `npm run test:integration`, and the normal production browser matrix. The new tests cover 50-child persistence, offline outbox recovery, retry after lost response, independent preference patches, immutable deletion and profile isolation.

From `pilot-functions`, prepend the configured JDK 21 `bin` to the process PATH, then run `npm run build` and `npm run test:emulator`. The emulator suite tests callable authorization, event deduplication, PIN verification/rate limits, Firestore rules and deletion cleanup. All emulator tests use `demo-olamia-pilot`; never point them at production.

For the Web pilot browser suite, start the emulators and run `npm run pilot:test:browser`. It builds a dedicated Production artifact in `dist-pilot` using the isolated `pilot-test` mode and demo configuration, then runs `pilot-chrome`, `pilot-firefox` and `pilot-edge` projects at two desktop resolutions. Each test provisions synthetic accounts through the local emulators. Real Chrome and Edge channels must be installed. These tests must not run against real child data. Do not deploy `dist-pilot`.

Before the first real class: verify 1366×768 and 1920×1080, mouse/keyboard interaction, all eight games/four worlds, narration and accessibility, offline preparation, pending-backup indicators, second-computer resume, and a real backup restore. Classroom switch time should be ≤2 seconds after data is loaded. Record the actual computer/browser and measured results; automated desktop simulation is not classroom hardware approval.

Start with one garden. Expand to 2–5 only after five activity days with no lost progress, mixed profiles or blocking faults. Report failures using version, browser and operation description, without names or screenshots of the roster. Disable new sessions if necessary, preserve pending outboxes, and roll back the Web release only after checking schema compatibility.
