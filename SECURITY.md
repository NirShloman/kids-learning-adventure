# Security and privacy

- The runtime has no authentication, database, analytics, remote configuration, or cloud synchronization.
- On the web, learner settings and game history stay in `localStorage`. Native builds use an atomic, no-backup file inside the application sandbox.
- The app asks for a first name for local personalization. It is never transmitted. It does not request an email address, location, camera, microphone, contacts, or advertising identifier.
- Static content is validated during the build and rendered through React without unsafe HTML or dynamic code evaluation.
- Service Worker caching is limited to same-origin GET requests.
- Production deployments require no secrets or environment variables.
- Native signing and store credentials exist only in protected CI environments and are never copied into the app bundle.

Report a security issue privately to the repository owner. Do not include child data in an issue or test fixture.
