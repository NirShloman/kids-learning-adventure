// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import letters from "../../src/content/letters.json";
import { DetectiveGame } from "../../src/components/games/detective/DetectiveGame";
import { loadGameContent } from "../../src/services/staticContentRepository";
import { getQuizQuestions } from "../../src/services/questionService";
import {
  createProfile,
  getDetectiveProgress,
} from "../../src/services/learningStoreService";

vi.mock("../../src/services/staticContentRepository", () => ({
  loadGameContent: vi.fn(),
}));
vi.mock("../../src/services/questionService", () => ({
  getQuizQuestions: vi.fn(),
  getDetectivePairs: vi.fn(),
  getPatternPuzzles: vi.fn(),
  getSortingChallenges: vi.fn(),
  pairCount: () => 3,
}));
vi.mock("../../src/components/games/detective/DetectiveSession", () => ({
  DetectiveSession: () => <div data-testid="loaded-session" />,
}));

let host: HTMLDivElement;
let root: Root | undefined;
let profileId: string;
const items = letters.items
  .filter((item) => item.ages[0] === 4 && item.difficulty === "medium")
  .slice(0, 3);
const renderGame = () => (
  <DetectiveGame
    gameId="letters"
    age={4}
    difficulty="medium"
    voiceEnabled={false}
    onBack={vi.fn()}
    onFinish={vi.fn()}
  />
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  profileId = createProfile({ age: 4, manualDifficulty: "medium" }).id;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.mocked(loadGameContent).mockResolvedValue(letters as any);
  vi.mocked(getQuizQuestions).mockResolvedValue(items as any);
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it("offers a retry after a missing content pack without saving an empty round", async () => {
  vi.mocked(loadGameContent).mockRejectedValueOnce(
    new Error("pack unavailable"),
  );
  await act(async () => root!.render(renderGame()));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "לא הצלחנו",
  );
  expect(getDetectiveProgress(profileId).rounds.letters).toBeUndefined();
  await act(async () =>
    (host.querySelector("button") as HTMLButtonElement).click(),
  );
  expect(host.querySelector('[data-testid="loaded-session"]')).not.toBeNull();
  expect(getDetectiveProgress(profileId).rounds.letters?.steps).toHaveLength(3);
});

it("shows a recoverable error when the exact age/level selection is empty", async () => {
  vi.mocked(getQuizQuestions).mockResolvedValueOnce([]);
  await act(async () => root!.render(renderGame()));
  expect(host.querySelector('[role="alert"]')).not.toBeNull();
  expect(host.querySelector('[data-testid="loaded-session"]')).toBeNull();
  expect(getDetectiveProgress(profileId).rounds.letters).toBeUndefined();
});

it("does not create progress when delayed content resolves after leaving the game", async () => {
  let resolvePack!: (value: any) => void;
  vi.mocked(loadGameContent).mockReturnValueOnce(
    new Promise((resolve) => {
      resolvePack = resolve;
    }),
  );
  await act(async () => root!.render(renderGame()));
  expect(host.querySelector('[role="status"]')).not.toBeNull();
  await act(async () => {
    root!.unmount();
    root = undefined;
  });
  await act(async () => {
    resolvePack(letters);
  });
  expect(getDetectiveProgress(profileId).rounds.letters).toBeUndefined();
  expect(getDetectiveProgress(profileId).discoveries).toHaveLength(0);
});
