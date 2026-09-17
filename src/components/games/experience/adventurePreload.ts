import manifest from "../../../content/adventure-assets.json";
import type { CharacterSkin, ExperienceGameId } from "../../../types";
const loaded = new Map<string, Promise<void>>();
export function adventureAssetUrls(
  gameId: ExperienceGameId,
  skin: CharacterSkin,
): string[] {
  return [
    ...manifest.assets
      .filter(
        (asset) =>
          asset.id === gameId ||
          asset.id.startsWith(skin) ||
          (gameId === "numbers" && asset.id.startsWith("monster")),
      )
      .map((asset) => asset.path),
    ...(gameId === "numbers"
      ? [
          "/assets/images/objects/apple.png",
          "/assets/images/objects/strawberry.png",
        ]
      : []),
  ];
}
export async function preloadAdventure(
  gameId: ExperienceGameId,
  skin: CharacterSkin,
): Promise<void> {
  const urls = adventureAssetUrls(gameId, skin);
  await Promise.all(
    urls.map((url) => {
      if (!loaded.has(url))
        loaded.set(
          url,
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            const timer = setTimeout(() => {
              loaded.delete(url);
              reject(new Error(`Loading timed out: ${url}`));
            }, 15000);
            img.onload = () => {
              clearTimeout(timer);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timer);
              loaded.delete(url);
              reject(new Error(`Unable to load ${url}`));
            };
            img.src = url;
          }),
        );
      return loaded.get(url)!;
    }),
  );
  navigator.serviceWorker?.controller?.postMessage({
    type: "WARM_ADVENTURE_CACHE",
    urls,
  });
}
