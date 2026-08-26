# Gemini audio provenance review

Review date: 2026-08-26

## Evidence received

- User-supplied text report titled `דוח Provenance ותודרך נכסי מדיה (Media Provenance & Asset Log)`.
- Attachment SHA-256: `0f74a50a6b091c714c21f938866b0148e7935c7835c24fc4b14182d06b528417`.
- The report states that seven music outputs were generated in a saved Gemini conversation using Google Lyria 3 (`music_gen`).
- The report states that no video was generated in that conversation.

The attachment is a generated summary, not the original conversation export. It contains no account identifier, plan evidence, generation/job IDs, or full prompts.

## Repository correlation

Six of the seven reported titles correlate by title with the six production MP3 files:

| Report title | Production file | SHA-256 |
| --- | --- | --- |
| משחק של גילויים | `public/assets/audio/music/game-of-discoveries.mp3` | `708c4f1ffb49ea1765bda1d6974d8f2d8864cc8e074ca164e33ae4c3527521c9` |
| The Garden Gate | `public/assets/audio/music/garden-gate.mp3` | `6f1d30886eddbb385638642134b6e7ef7838ec5c9ca4d8426e0fb9cd8d8aecad` |
| גן של אותיות | `public/assets/audio/music/letters-garden.mp3` | `55813a2f9dbf69079b7431d0f97efd8235e75f715d1be3ac5c4ad5639f9fbf91` |
| The Painted Garden Gate | `public/assets/audio/music/painted-garden-gate.mp3` | `0a6ca504ba2df7a828af9b5312e3c91713f37d014cfb577e6a26508e631f287c` |
| Polygons at Play | `public/assets/audio/music/polygons-at-play.mp3` | `44d35e5b92f523e7c4b725667f455095c5c0d01c9e85de3964dc630107e1c10e` |
| Sunlight on the Bookshelf | `public/assets/audio/music/sunlight-on-the-bookshelf.mp3` | `20cfe734521a1938320ee6845c6513542231325dc90e437d7d39edc6a4af375a` |

`Lessons in the Orchard` has no corresponding production MP3 in the reviewed application.

All six production MP3s contain an embedded C2PA manifest identifying `Google LLC`, a unique C2PA URN, `Created by Google Generative AI`, and `Applied imperceptible SynthID watermark`. The presence of these structures was inspected locally; cryptographic trust validation remains to be captured using a conforming verifier or Gemini's official verification flow.

## Discrepancies and limitations

- The report says creation occurred in August 2026, while all six production MP3 filesystem modification timestamps are 2026-07-29. The original conversation timestamp must resolve this discrepancy; filesystem timestamps alone are not authoritative creation dates.
- The reported 184-second duration for `משחק של גילויים` differs from the production manifest duration of 179.67 seconds.
- The reported 184-second `גן של אותיות` output differs from the 30.54-second production file. This may be an excerpt/export variant, but the derivation is not documented.
- The report does not reproduce the full prompts, negative prompts, generation IDs, account/plan, or original download names.
- The statement that no protected samples were included is a statement in the generated report, not an independent audio-similarity clearance.
- The report explicitly provides no evidence for the three production videos.

## Provisional decision

Audio provenance is technically supported and materially stronger than an unsupported user-supplied claim. Final distribution classification should be assigned after retaining the original saved conversation (PDF/export), resolving the date/file-variant mapping, recording the account or plan used, and capturing Google verification results. Video provenance must be documented from the separate conversation in which the videos were generated.

