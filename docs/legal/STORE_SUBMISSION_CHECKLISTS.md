# Store submission checklists

Complete against the final signed binaries, not only source code.

## Apple App Privacy

- [ ] Re-scan the final IPA and every SDK for outbound data transfer.
- [ ] If behavior remains native/local-only, answer “Data Not Collected”; Apple says on-device-only processing is not collection.
- [ ] Confirm no diagnostics, analytics, ads, identifiers, accounts, cloud sync, or server-config endpoint was added.
- [ ] Provide a public HTTPS privacy-policy URL with controller identity and contact placeholders replaced.
- [ ] Confirm the policy describes nickname, age band, character preference, settings, gameplay history, recent content, local deletion, and OS speech service.
- [ ] Verify iOS privacy manifests and required-reason API declarations from Capacitor and all linked SDKs in the archive.

## Apple Kids Category

- [ ] Select the accurate “5 and under” band only if content/reviewer materials support it.
- [ ] Keep privacy, terms, notices, support, deletion, link-outs, and any future purchases behind the parental gate.
- [ ] Ensure no child-facing external links, social features, cross-promotion, advertising, or third-party analytics.
- [ ] Reviewer notes explain how to open the parent area and solve the adult multiplication gate.
- [ ] Any future purchase uses StoreKit, clear pricing, restore functionality, and the gate; no fake purchase UI.
- [ ] Screenshots/metadata contain no unverified superlatives, endorsements, expert/scientific claims, or Ministry affiliation.

## Google Play Data Safety

- [ ] Re-scan the final AAB and Play SDK Index report.
- [ ] If no off-device user data leaves the device, declare no data collected/shared; on-device-only access is not collection under Google’s form guidance.
- [ ] Confirm no AD_ID permission, location, device identifiers, analytics, crash reporting, or undeclared SDK behavior.
- [ ] Provide public privacy URL and in-app privacy access.
- [ ] Re-answer if a hosted web view, cloud content, remote TTS, telemetry, support form, or CDN logging is added.

## Google Target Audience / Families

- [ ] Select only age groups intentionally designed and tested. Current “3–6” positioning may not justify the full “6–8” band.
- [ ] Complete Target Audience and Content, IARC content rating, Data Safety, ads declaration, and app-access instructions consistently.
- [ ] Confirm appropriate child content and no prohibited APIs/SDKs, identifiers, precise location, or manipulative monetization.
- [ ] Keep external links and sensitive settings behind the parent gate.
- [ ] If ads or mixed audiences are ever added, stop and redesign against the then-current Families rules.
