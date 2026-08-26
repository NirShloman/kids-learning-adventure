# Mobile release runbook

## Fixed application contract

- Display name: `ידעלה` / `Yedale`
- Bundle/Application ID: `com.nirshloman.lomdimbekef`
- Marketing version: `1.2.0`
- Android: min API 28, compile/target API 36, AAB with Play App Signing
- Apple: iOS/iPadOS 16 minimum, Xcode 26.6/iOS 26 SDK, universal iPhone/iPad
- Runtime network services, OTA updates, analytics, ads and purchases: none

Run locally before every beta:

```bash
npm ci
npm run validate:content
npm run typecheck
npm run test:unit
npm run build:native
npm run mobile:verify
```

Android can additionally be verified with `android/gradlew testDebugUnitTest lintDebug assembleDebug`. iOS requires macOS 26/Xcode 26 and is verified with an unsigned simulator build in CI.

## One-time store setup

Create matching app records in App Store Connect and Google Play Console before the first automated upload. Use Education as the primary category and Games as secondary, no price, ads or in-app purchases. Select Apple Made for Kids / 5 and under and Google target groups 5 and under plus 6–8. Host `/privacy.html` from the PWA deployment and enter its public HTTPS URL in both stores.

Enable Play App Signing and create a dedicated upload key. Create an App Store distribution certificate, App Store provisioning profile, App Store Connect API key, and the `Internal Testers` TestFlight group.

Configure protected GitHub environments with required reviewers:

- `mobile-beta-android`: `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
- `mobile-beta-ios`: `APPLE_DISTRIBUTION_CERT_P12_BASE64`, `APPLE_DISTRIBUTION_CERT_PASSWORD`, `APPLE_PROVISIONING_PROFILE_BASE64`, `APPLE_PROVISIONING_PROFILE_NAME`, `APPLE_TEAM_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_P8_BASE64`.
- Optional iOS environment variable: `TESTFLIGHT_INTERNAL_GROUP`; it defaults to `Internal Testers`.

Keep the original keystore, certificate and API key in an approved password manager. Never commit them, paste them into issues, or expose them in test fixtures.

## Publishing a signed beta

Push a tag matching `mobile-v1.2.0-beta.N`, where `N` increases for every beta. The protected `Signed mobile beta` workflow:

1. Rebuilds and validates all static content and bundled media.
2. Uses the GitHub run number as Android `versionCode` and Apple build number.
3. Produces a signed AAB and publishes it to Google Play Internal Testing.
4. Produces a signed IPA and uploads it to the internal TestFlight group.
5. Retains the signed artifacts for 30 days.

Before widening distribution, test both store-installed builds in airplane mode on Android API 28 and 36 and iOS 16 and 26, in portrait and landscape. Complete all eight games, rotate during a game, background and resume, verify Hebrew narration fallback, media playback, Back behavior, profile persistence after upgrade, and deletion from the Parent Area.
