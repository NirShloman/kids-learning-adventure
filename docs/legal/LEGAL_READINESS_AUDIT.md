# Legal and copyright readiness audit

Audit date: 2026-08-26
Product reviewed: “ידע׳לה” / “Yedale” (formerly “לומדים בכיף” / “Kids Learning Adventure”)
Target stores: Apple App Store and Google Play

## Conclusion

The application is **not ready for public release** because the chain of rights for material runtime media is unverified. No file was deleted or replaced. The application and legal UI were improved safely, but release remains `NO-GO` until the blocker evidence is supplied or the affected assets are replaced with cleared alternatives.

This is a technical and commercial risk-reduction review, not a legal opinion, trademark clearance opinion, or guarantee against claims.

## What was verified in the repository

- Runtime mobile manifests request no camera, microphone, location, contacts, or advertising-ID permission.
- No Analytics, Ads, Firebase, Sentry, crash-reporting, or tracking SDK is present in current application source/runtime imports.
- Native profile/progress data is stored in app-private local files and excluded from backup; the web version uses local storage.
- Android narration selects a Hebrew TTS voice only when it does not require a network connection. iOS uses the operating-system speech API.
- The service worker handles same-origin requests only. A hosted Web/PWA deployment still creates ordinary HTTP requests and may create infrastructure logs; it must not be described as fully network-free.
- All discovered media/font files are hashed in `ASSET_RIGHTS_REGISTER.csv`.
- Runtime open-source licenses found are permissive (MIT, 0BSD, OFL 1.1; native platform libraries may also carry Apache-2.0 notices). No copyleft restriction was found in the application runtime bundle.
- Searches found no unsupported marketing claims such as “הראשונה בישראל”, “הטובה ביותר”, “מוכח מדעית”, expert authorship, Ministry approval, or curriculum endorsement.

## Evidence gaps and risks

| Severity | Finding | Required action |
| --- | --- | --- |
| `BLOCKER` | Six MP3 tracks now have Gemini/Lyria report evidence and embedded Google C2PA/SynthID, but the original chat/download mapping, generation-date/account terms, and two duration/edit chains are incomplete | Retain the original saved conversation/export, account/plan evidence and historical terms; map each original download to the production hash and document the shortened variants |
| `BLOCKER` | Three Gemini/Veo MP4s now have eight generation IDs plus embedded Google C2PA/SynthID, but their renamed-file mapping and the rights chain for `image_71333b.png` and `image_7132fe.png` are incomplete | Retain the original conversation/download records and the two exact reference files; prove their origin/licence and bind them by hash to the retained Nir/Shir masters |
| `BLOCKER` | Nir/Shir ImageGen character chain lacks generation records and real-person/guardian declarations | Obtain prompts, IDs, inputs, terms snapshot, human-edit record, and signed likeness declaration/release if based on a real person or minor |
| `BLOCKER` | Claude Design source sheet referenced as `uploads/pasted-1785302721105-0.png` is absent | Recover the exact source file and its evidence, including input rights; preserve hash and generation receipt |
| `HIGH` | “Project-owned” claims were unsupported | Owner and every contributor/contractor must sign authorship/assignment declarations; commissioned work is not automatically owned in every case |
| `HIGH` | Current English store name exactly matches an existing App Store app | Choose a more distinctive mark and obtain professional clearance before changing the product name |
| `HIGH` | Contact/controller identity is missing | Replace all owner/business/email/address placeholders before store submission and host the privacy URL publicly |
| `MEDIUM` | Google metadata targets both “5 and under” and “6–8” while the product description says ages 3–6 | Confirm whether 6–8 was intentionally designed/tested; otherwise declare only the accurate audience band |
| `MEDIUM` | Web/PWA hosting logs are not documented | Decide whether the public web version will ship; document hosting logs, retention, processors, and deletion separately |
| `MEDIUM` | Native transitive notices can vary after Gradle/SPM resolution | Regenerate an AAB/IPA dependency report and notices for the exact release build |
| `LOW` | No `.riv` assets are currently shipped | If added later, retain editable source, author identity, export permission, date, and runtime license evidence |

## AI-output limitation

Current OpenAI and Anthropic terms generally assign provider rights in output to the user/customer to the extent permitted by law; Google says it does not claim ownership of original generated content. None of those statements establishes that an output is unique, copyrightable, free of third-party similarity, or generated from inputs the operator had permission to use. The actual product, account type, territory, and terms in force on the generation date must be proven.

## Privacy and store-policy posture

- Apple states that data processed only on device is not “collected” for App Privacy answers. The current native build can therefore use “Data Not Collected” only if the final binary and every included SDK are rechecked and no off-device transfer is introduced.
- Apple Kids Category apps must put link-outs, purchases, and similar adult actions behind a parental gate and generally should not include third-party analytics or advertising.
- Google requires accurate Families, Target Audience, Data Safety, and content-rating declarations. Solely child-directed apps must not transmit persistent device identifiers and must not request prohibited permissions.
- Local-only storage still deserves data minimization. The app now asks for an optional nickname and optional character preference, never a full birth date, and exposes confirmed deletion of local profile, settings, recent content, and gameplay history.

## Legal sources used

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Kids](https://developer.apple.com/kids/)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [Google Play Target Audience and Content](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en)
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Israel Copyright Law, 2007 — official publication](https://fs.knesset.gov.il/17/law/17_lsr_300007.pdf)
- [Israel Privacy Protection Authority — children’s privacy review](https://www.gov.il/he/pages/gpen-kids-safety)
- [Privacy Protection Regulations (Data Security), 2017](https://www.gov.il/BlobFolder/generalpage/1files/he/IT2017.pdf)
- [Israeli trademark search service](https://www.gov.il/he/service/search_israeli_trademarks_database)
- [Israeli trademark database](https://trademarks.justice.gov.il/TradeMarkSearch/TradeMarkSearch?lang=he)
- [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/)
- [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms)
- [Google Terms of Service](https://policies.google.com/terms)
- [Google labs/Flow FAQ](https://labs.google/fx/tools/flow/faq)

The repository findings must still be reviewed by Israeli counsel familiar with copyright, privacy, consumer protection, children’s products, and trademark law before publication.
