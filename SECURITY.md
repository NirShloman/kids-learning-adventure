# Security and privacy

- Local Web and native modes have no authentication or cloud synchronization. The optional Web kindergarten pilot uses Firebase Auth and Firestore in a separate project, with a shared staff account and isolated child profiles. There is no analytics or advertising runtime.
- Local Web stores data in `localStorage`; native builds use an atomic private file. Pilot Web uses account-specific IndexedDB records and an atomic durable outbox; cloud writes pass through validated, idempotent Functions. Direct Firestore writes are denied. Membership rules isolate gardens.
- The pilot transmits child nicknames, age bands, settings and learning records to the garden's cloud project. Children have no email or password. Only staff accounts use email. No mode requests location, camera, microphone, contacts or advertising identifiers.
- Static content is validated during the build and rendered through React without unsafe HTML or dynamic code evaluation.
- Service Worker caching is limited to same-origin GET requests.
- The staff PIN gates the interface; account membership authorizes cloud access. Server hashes use scrypt, trusted-device offline verifiers use PBKDF2. An offline device cannot immediately observe PIN resets or revoked access. Do not mark public computers trusted. Logout refuses to discard pending writes.
- Local/native builds require no cloud configuration. Pilot Web uses public Firebase app identifiers; Admin credentials are never bundled. Provisioning, narration administration and deployment use ADC or managed workload identity; service-account JSON files are forbidden in the repository and application bundle.
- Native signing and store credentials exist only in protected CI environments and are never copied into the app bundle.

Report a security issue privately to the repository owner. Do not include child data in an issue or test fixture.
