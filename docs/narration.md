# Hebrew narration architecture

## Approved Olamia voice and pronunciation

The owner approved **עולמיה / Olamia**, pronounced **עוֹלָמִיָּה**, and the
`he-IL-Chirp3-HD-Aoede` sample at `speakingRate=0.92` on 2026-09-17.
The accepted sample is `tmp/narration/pronunciation-variants/12-olamia-stress-review/`.
Public spelling belongs in `src/config/brand.ts`; frontend lookup and backend
normalization supply the same vocalized spelling. See `docs/branding/OLAMIA.md`.

The rebrand changes one of the 1,982 current catalog texts. Only that text was
regenerated; unchanged content keeps its existing immutable assets and version.
The cumulative local-generation ledger remained within USD 0.91 before tax
(USD 0.908280 conservatively reserved, including prior generation).

## Runtime and data flow

### Local release asset export

`npm run narration:local` inventories the catalog and missing recordings without generating audio. An authorized administrator can generate using Application Default Credentials and the configured Hebrew voice:

```powershell
$env:TTS_GENERATION_ENABLED = 'true'
npm run narration:local -- --apply --allow-generation --publish --max-usd <approved-cap>
npm run validate:narration:strict
```

This local path uses the same TTS gateway and hash/checksum rules without deploying a Function or changing the cloud generation switch. It checkpoints to `tmp/narration/local-generated-manifest.json`, retries transient requests and publishes only a completely validated catalog. Zero-length/silent recordings fail validation. Only audio paths referenced by the published manifest belong in a release; temporary samples and superseded outputs do not. Generation can incur the configured provider's charges and must remain an explicit administrative action.

Replace `<approved-cap>` with the explicitly approved dollar amount before tax. The CLI preflights the full batch and reserves spending before every request, including retries and attempts interrupted before their result is known. When correcting a catalog under the same authorization, pass `--budget-id <existing-ledger-id>` so prior spending still counts; do not start a fresh budget for the correction. The existing ledger must be present. SDK-level automatic retries are disabled in this CLI so all paid attempts remain visible to the budget guard.

The experiential catalog enumerates authored missions, age/difficulty variants and semantic object labels. `narration-symbols.json` converts decorative display symbols to spoken Hebrew before lookup, avoiding silent emoji-only synthesis.

The child-facing Web, Android and iOS applications remain local-first. They do
not import Firebase, call Google Cloud or contain cloud credentials. Authored
text is compiled into a narration catalog, generated server-side once, stored
in Firebase Storage and Firestore, and then synchronized into the application
as hash-named MP3 files plus `generatedNarrationManifest.json`.

```text
Static content and interface strings
  -> narration catalog
  -> narrationBindings (Firestore)
  -> Firebase Function
  -> normalize + SHA-256 cache key
  -> Google Cloud Text-to-Speech (cache miss only)
  -> narrationAssets + Firebase Storage
  -> narration:sync
  -> bundled local MP3 + generated manifest
  -> NarrationService
  -> browser/native speech fallback only when an asset is missing
```

The existing `audioText` field is the spoken override for content whose display
text should not be sent verbatim. It is intentionally not replaced by another
question field.

## Google Cloud and Firebase setup

1. Select the dedicated Firebase project and confirm it is on the Blaze plan.
2. In Google Cloud Console, open **APIs & Services > Library**, find **Cloud
   Text-to-Speech API**, and enable it.
3. Confirm billing is linked under **Billing > My projects**.
4. Create Firestore in Native mode and create the default Firebase Storage
   bucket. Use the existing project locations; the Function is configured for
   `europe-west1`.
5. Install and authenticate the CLIs:

   ```bash
   npm install --prefix functions
   gcloud auth application-default login
   npx --prefix functions firebase login
   npx --prefix functions firebase use --add
   ```

   `.firebaserc` is deliberately ignored. Project ID and bucket name are read
   from Firebase CLI configuration and Application Default Credentials.
6. Create a dedicated runtime service account and grant only:

   - `roles/serviceusage.serviceUsageConsumer` (Cloud TTS synthesis uses the enabled API and OAuth scope; Google does not expose a project-scoped `roles/texttospeech.user` role for this request path)
   - `roles/datastore.user`
   - `roles/storage.objectAdmin` scoped to the narration bucket
   - `roles/eventarc.eventReceiver`
   - `roles/logging.logWriter`

   Configure the deployed Function to run as that account. The identity used
   for deployment also needs the normal Cloud Functions deployment roles and
   permission to act as the runtime account; it should not be embedded in the
   application.
7. Review `firestore.rules` and `storage.rules`, then deploy them. Firestore is
   denied to every client. Storage permits public reads only below
   `narration/**`; all client writes are denied.

Never download a service-account key into the repository. ADC, Workload
Identity Federation or the managed Function identity are the supported paths.

## Configuration

Copy `functions/.env.example` to the Firebase environment file appropriate for
the selected project. The values are not secrets:

```text
TTS_LANGUAGE=he-IL
TTS_VOICE=he-IL-Chirp3-HD-Aoede
TTS_SPEAKING_RATE=0.92
TTS_VERSION=1
TTS_GENERATION_ENABLED=false
TTS_SERVICE_ACCOUNT=narration-runtime@PROJECT_ID.iam.gserviceaccount.com
```

Aoede is approved for Olamia. `TTS_GENERATION_ENABLED` stays `false` unless an
explicit cloud-generation run is requested. Voice, speaking rate, audio format, version and
normalized text are included in the asset hash. Changing any of them creates a
new immutable object.

## Voice discovery and review

List the voices currently returned by Google rather than relying on a stale
hard-coded list:

```bash
npm run narration:voices
```

Generate the nine Hebrew quality samples for the default candidate set:

```bash
TTS_GENERATION_ENABLED=true npm run narration:samples -- --allow-generation
```

On PowerShell:

```powershell
$env:TTS_GENERATION_ENABLED='true'
npm run narration:samples -- --allow-generation
```

The candidates are Aoede, Leda, Achernar, Sulafat and Zephyr, but the command
first verifies each through `listVoices`. Output is written below
`tmp/narration/samples/` and is ignored by Git. Review warmth, clarity, pacing,
pronunciation and consistency across all sentences. Then set `TTS_VOICE` to the
selected full voice name.

## Catalog, backfill and synchronization

For approved assets already generated locally, `archive-local` validates the
entire active catalog, then imports MP3s and metadata under leases and immutable
Storage preconditions. It never invokes TTS. Without `--apply` it is a local
dry run. Use explicit deployment values; no project/bucket IDs are committed:

```bash
npm --prefix functions run cli -- archive-local
npm --prefix functions run cli -- archive-local --apply --project PROJECT_ID --bucket BUCKET_NAME
npm run narration:sync -- --apply --project PROJECT_ID --bucket BUCKET_NAME
```

The import is resumable and idempotent. Existing ready assets must have matching
checksums. Bindings are only changed when their content or metadata differs.
Imports are not counted as synthesis usage. Keep the local generation ledger
for historical synthesis costs; cloud `ttsUsage` describes cloud-service calls.
Sync selects only active catalog bindings with matching text, voice, version,
immutable path and checksum. Any missing or stale binding aborts publication.

Build and inspect the catalog without contacting Google:

```bash
npm run narration:catalog
```

After the selected voice is approved and the deployed Function has generation
enabled, enqueue the bindings:

```bash
npm run narration:backfill -- --apply --approved-voice --voice he-IL-Chirp3-HD-Aoede
```

The command reports scanned, unchanged, queued and unique counts. Function logs
show `TTS_GENERATION_STARTED`, `TTS_GENERATION_COMPLETED`, `TTS_CACHE_HIT`,
`TTS_UPLOAD_COMPLETED` and `TTS_GENERATION_FAILED`. Wait until binding documents
are ready, then copy the active immutable assets into the offline application:

```bash
npm run narration:sync -- --apply
npm run validate:narration:strict
```

Commit the active files under `public/assets/audio/narration/` and the generated
manifest. Normal `npm run dev` and `npm run build` never generate speech.
Production Web deployment and signed mobile beta use `npm run build:release`,
which refuses to build while any catalog narration is missing.

An opt-in real-cloud smoke test generates one unique MP3, validates its Storage
metadata, calls the service again and asserts a cache hit:

```bash
TTS_GENERATION_ENABLED=true npm run narration:smoke -- --allow-generation --approved-voice
```

## Regeneration, versioning and cleanup

Normal regeneration rechecks the cache:

```bash
npm run narration:regenerate -- --apply --id content.numbers.example
```

Regenerating every binding is explicit:

```bash
npm run narration:regenerate -- --apply --all
```

Forced generation must create a new immutable revision and cannot overwrite a
cached URL. Sync preserves that revision per asset, including when only one
binding is regenerated; release validation includes it in the expected hash:

```bash
npm run narration:regenerate -- --apply --all --force --revision voice-review-2026-09
```

For a normal global pronunciation or normalizer change, increment
`TTS_VERSION`, deploy, run backfill and sync. Old cloud objects remain available
until a separately reviewed cleanup. The v1 cleanup command is report-only:

```bash
npm run narration:cleanup
```

## Usage and troubleshooting

Monthly totals are stored in `ttsUsage/YYYY-MM` as `charactersSent`, `requests`,
`cacheHits` and `failedRequests`. Individual idempotency markers are stored in
`ttsUsageEvents`. Playback never writes usage because it is not synthesis.

- `Narration generation is disabled`: enable it only in the deployed
  environment or use the double-consent sample command locally.
- `UNAUTHENTICATED`/`PERMISSION_DENIED`: verify ADC, the Function runtime
  account and IAM roles; do not add a key to the frontend.
- `RESOURCE_EXHAUSTED`: review quota and billing. Retries are bounded; the game
  continues with its local fallback.
- `Voice not returned by listVoices`: choose one from `narration:voices` and
  regenerate with a new version if production assets already exist.
- A binding remains `generating`: leases expire after five minutes and a later
  request can recover it.
- Build lacks narration: run sync and strict validation. Development can still
  use browser or native speech fallback.

## Production checklist

### Verification commands

`npm run test:narration:emulator` starts Firestore and Storage emulators against
the isolated `demo-olamia-narration` project (Java 21+ required). It invokes the
exported binding handler with real emulator document snapshots and substitutes
only the synthesis gateway with an existing MP3 fixture. It covers duplicate
events/text, output-only writes, failure cleanup, stale events, transaction
leases, expired lease recovery, metadata and idempotent usage. No Google TTS
request is made. Because the Storage emulator does not implement generation
preconditions, that test simulates GCS's 412 response and verifies the resulting
metadata check against emulator Storage.

`npm run test:offline` verifies the production app shell and a cached MP3 byte
range after network disconnection. Narration recordings are cached on demand;
the service worker does not pre-download the whole narration catalog. Native
packages include the full active catalog for first-launch offline playback.

The 2026-09-18 implementation and cloud verification results are recorded in
`docs/qa/OLAMIA_RELEASE.md`.

### Operator checklist

- [ ] Enable Cloud Text-to-Speech API in the exact Firebase/Google project.
- [ ] Confirm Blaze billing and Text-to-Speech quota.
- [ ] Confirm Firestore Native mode and the default Storage bucket.
- [ ] Create/select the least-privilege Function runtime service account.
- [ ] Grant Service Usage Consumer, Datastore User, Eventarc Event Receiver, Logs Writer and bucket-scoped Storage Object Admin. Cloud TTS's normal synthesis API is authorized by OAuth scope and the enabled API; there is no project-scoped "Text-to-Speech User" role to grant for it.
- [ ] Authenticate Firebase CLI and ADC without creating repository credentials.
- [ ] Deploy Firestore and Storage rules.
- [ ] Deploy Functions once with `TTS_GENERATION_ENABLED=false`.
- [ ] Run `narration:voices` and generate/listen to all candidate samples.
- [ ] Set the approved full voice name and speaking rate.
- [ ] Enable generation in the deployed Functions environment and redeploy.
- [ ] Run backfill and wait for all bindings to reach `ready`.
- [ ] Run sync and strict validation; commit manifest and active MP3 files.
- [ ] Run tests, Web build and mobile verification.
- [ ] Deploy the Cloudflare Web build and build the offline mobile packages.
