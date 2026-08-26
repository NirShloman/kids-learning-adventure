# Gemini video provenance review

Review date: 2026-08-26

## Evidence received

The project owner supplied a factual summary from the saved Gemini conversation in which the videos were created. The summary identifies eight video generations, states that they were based on two uploaded reference images (`image_71333b.png` and `image_7132fe.png`), and states that music and sound effects were to be added separately.

The supplied generation records are:

| Generation ID | Reported scene |
| --- | --- |
| `16070179617261851286` | Introduction in a magical learning garden; Shir and Nir look at a golden sparkle. |
| `10551283437657691662` | Direct edit/continuation of generation `16070179617261851286`. |
| `11467556278305825859` | Letter-factory investigation with wooden tiles. |
| `5835421819319758938` | Picking and counting apples in a bright orchard. |
| `420904704021790009` | Building with geometric shapes in a workshop. |
| `3980917600571257642` | Painting flowers with a magical brush in a garden. |
| `5992000080493073566` | Walking on a sunny morning path with a pastoral view and butterfly. |
| `16816462411011663882` | A second generation of the same walking-scene instruction. |

Gemini's statement that it cannot itself issue a legal licence is correct and is not adverse evidence. Commercial-use authority must come from the Google terms applicable to the account, product, territory, and generation date, not from a statement generated inside the chat.

The summary is retained here as an owner-supplied evidence record. It is not yet backed by a hashed PDF/export or screenshots of the original conversation, account, plan, timestamps, or full prompts.

## Repository correlation

The three production videos are:

| Production file | SHA-256 | Embedded C2PA manifest URN | Correlation |
| --- | --- | --- | --- |
| `public/assets/video/counting-orchard.mp4` | `794ca51d92cfae5fe7ac3411c9ec86a77753903fd7923afea50e20867e6d9a7d` | `urn:c2pa:4528bb49-d8fd-0a1d-c1a4-442bf2fa5ded` | The reported orchard/counting generation is `5835421819319758938`; exact file-to-generation binding still requires the original download record. |
| `public/assets/video/learning-garden-lobby.mp4` | `e5a28309013655cfcccaa115c1aa64da31249dd34d5e8affeba730d01fe3ecae` | `urn:c2pa:b526ba52-91fc-1a2c-cd59-44336dea04e1` | The report proves that candidate scenes were generated, but does not bind this renamed file to one exact generation ID. |
| `public/assets/video/learning-garden-welcome.mp4` | `7eba4e7b658eda09edddbfcd72b865f52d45e50862c8dbae0e60d115af44bbb9` | `urn:c2pa:66e08b3b-9db4-90e4-f8b1-4b1dbd5e90fc` | Likely one of the introduction/continuation generations, but the report alone does not establish which renamed file corresponds to which ID. |

All three MP4 files contain embedded C2PA manifest structures identifying `Google LLC`, `Created by Google Generative AI`, `Applied imperceptible SynthID watermark`, `trainedAlgorithmicMedia`, and a unique signed claim. These structures were inspected locally. Cryptographic trust-chain validation has not yet been captured with a conforming C2PA verifier or Google's official verification flow.

The generated poster files are locally derived release assets and inherit the rights classification of their corresponding video. They do not independently contain the video C2PA record.

## Reference-image chain

The exact files `image_71333b.png` and `image_7132fe.png` are not present under those names in the repository. The repository contains several renamed Nir and Shir source, master, and production images, but no evidence currently binds either reported upload name to one of those files by hash.

Because the videos were generated from uploaded references, lawful distribution depends on the right to use those two reference images. The remaining material gap is therefore the input-image chain, not whether Google generated the MP4 output.

To close it, retain either:

1. the two original reference files with their hashes and evidence of how they were generated or licensed; or
2. screenshots/export from the Gemini conversation showing the uploaded thumbnails, together with a visual and hash mapping to the retained project masters.

If the references are OpenAI ImageGen outputs made by the project owner, retain the original OpenAI generation conversation/export and map each original output to the project master and subsequent edits.

## Distribution assessment

- **Google generation provenance:** supported by the conversation summary plus embedded C2PA/SynthID structures.
- **Exact production-file-to-generation-ID mapping:** partially supported; original download names or conversation screenshots are still required.
- **Commercial-use basis:** provisionally consistent with Google's current public terms and Flow/Gemini guidance, but retain the terms effective on the actual generation date and the account/plan evidence.
- **Input/reference rights:** pending for `image_71333b.png` and `image_7132fe.png`.
- **Current decision for the three MP4s:** `PROVENANCE_SUPPORTED_INPUT_RIGHTS_PENDING`.

Relevant current provider materials:

- Google Terms of Service: <https://policies.google.com/terms>
- Google Flow commercial-use FAQ: <https://support.google.com/flow/answer/16353333?hl=en>
- Google AI-content verification guidance: <https://support.google.com/gemini/answer/16722517?hl=en>

This record documents provenance and release readiness; it is not a legal opinion or a guarantee of non-infringement.
