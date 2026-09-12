import { narrationAssetForText } from "../../../assets/narrationManifest";
import { adventureMissions } from "../../../content/adventureMissions";
import type { CharacterSkin, ExperienceGameId } from "../../../types";
import { adventureAssetUrls } from "./adventurePreload";
import { itemLabel, missionSteps } from "./adventureEngine";

/** Prepare the chosen world, including every age/difficulty variant, before
 * reporting offline readiness. This does not upload any learner information. */
export async function prepareAdventureOffline(
  gameId: ExperienceGameId,
  skin: CharacterSkin,
): Promise<void> {
  if (!("serviceWorker" in navigator))
    throw new Error("Offline preparation requires the installed web app.");
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error("Reload once to activate offline storage.");
  const urls = new Set(adventureAssetUrls(gameId, skin));
  const texts = new Set(["מצוין!", "ננסה שוב. אפשר להיעזר ברמז."]);
  for (const mission of adventureMissions.filter((m) => m.gameId === gameId)) {
    [
      mission.story,
      mission.instruction,
      `${mission.title}. ${mission.story}`,
      `הצלחנו! ${mission.reward} נוספה לאוסף שלנו.`,
    ].forEach((text) => texts.add(text));
    for (const age of [3, 4, 5, 6] as const)
      for (const difficulty of ["easy", "medium", "hard"] as const)
        for (let seed = 0; seed < 30; seed++) {
          for (const step of missionSteps(mission, { age, difficulty }, seed)) {
            texts.add(step.prompt);
            step.options.forEach((value) => texts.add(itemLabel(value)));
          }
        }
  }
  for (const text of texts) {
    const asset = narrationAssetForText(text);
    if (!asset) throw new Error("Required narration is not packaged.");
    urls.add(asset.localPath);
  }
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(new Error("Offline preparation timed out."));
    }, 120_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      event.data?.ok
        ? resolve()
        : reject(new Error("Some files could not be saved."));
    };
    worker.postMessage({ type: "PREPARE_ADVENTURE_OFFLINE", urls: [...urls] }, [
      channel.port2,
    ]);
  });
}
