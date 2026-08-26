# Dependency license audit

Audit date: 2026-08-22; versions are from `package-lock.json`.

## Shipped web/runtime components

| Component | Version | License | Notice action |
| --- | ---: | --- | --- |
| React / React DOM | 18.3.1 | MIT | Included in `THIRD_PARTY_NOTICES` |
| Scheduler | 0.23.2 | MIT | Included |
| Motion / Framer Motion / motion-dom / motion-utils | 12.42.2 / 12.39.0 | MIT | Included |
| Matter.js | 0.20.0 | MIT | Included |
| Rive React WebGL2 / WebGL2 runtime | 4.29.5 / 2.38.5 | MIT | Upstream Rive notices included; installed npm package omitted a license file |
| Capacitor core/android/ios | 8.5.0 | MIT | Included |
| Capacitor App / Splash Screen | 8.0.1 | MIT | Included |
| Rubik via `@fontsource/rubik` | 5.3.0 | SIL OFL 1.1 | Full OFL and copyright included; font may not be sold by itself |
| tslib | 2.8.1 | 0BSD | Included |
| loose-envify / js-tokens | 1.4.0 / 4.0.0 | MIT | Included |

Native builds also resolve AndroidX/Android/Cordova and Apple/SPM platform components. Their exact transitive set must be exported from the final AAB/IPA build; do not reuse this list after a lockfile, Gradle, CocoaPods, or SwiftPM change.

## Build/development-only tooling

Vite, TypeScript, the Vite React plugin, React type packages, Playwright, Vitest, jsdom, Wrangler, Sharp, AJV, tsx, and their transitive dependencies are used to build/test/deploy but are not copied as Node packages into the application bundle. The package currently places several build tools in `dependencies`, so `npm --omit=dev` is not a reliable description of shipped code. The classification above is based on source imports and the built artifact, not merely package.json sections.

No GPL/AGPL or unknown license was found in the identified application runtime. Re-run the audit on the exact release artifact.
