# Security and privacy

- The runtime has no authentication, database, analytics, remote configuration, or cloud synchronization.
- Learner settings and game history stay in the current browser's `localStorage`.
- The app does not request a child's name, email address, location, or other identifying information.
- Static content is validated during the build and rendered through React without unsafe HTML or dynamic code evaluation.
- Service Worker caching is limited to same-origin GET requests.
- Production deployments require no secrets or environment variables.

Report a security issue privately to the repository owner. Do not include child data in an issue or test fixture.
