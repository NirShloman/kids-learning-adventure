# Dependency license audit

Audit date: 2026-08-22; versions are from `package-lock.json`.

Update 2026-10-19: the optional kindergarten Web pilot adds Firebase JavaScript SDK 12.19.0 (Apache-2.0) and its idb dependency (ISC). Firebase copyright notices and the full Apache/ISC licenses were appended to both shipped notice files. Zod's MIT notice is included for the pilot validation/tooling code. The pilot adapter is dynamically loaded only when explicitly enabled on Web; native/local runtime network behavior remains local. Production dependency audits for the root, pilot Functions and narration Functions report zero known vulnerabilities after compatible patches. The Firebase CLI development dependency chain still reports seven development-only findings; no forced major downgrade was applied. These dependency checks do not establish media distribution rights.

Update 2026-10-10: Capacitor core/android/ios/CLI moved to 8.5.3 to fix GHSA-rvm3-566m-v7fv; runtime notices now identify 8.5.3. Heebo has replaced Rubik and its full OFL notice is included in the shipped notices. Development transitive packages were patched; xcode's UUID dependency is overridden to CommonJS-compatible uuid 11.1.1 (xcode uses only v4). A full npm audit after these updates reported zero vulnerabilities. The table below is the historical August audit, not the current resolved dependency list. Final native binary review remains required.

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
