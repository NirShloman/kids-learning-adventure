import type {
  DetectiveItem,
  DetectiveRound,
  DetectiveStep,
  DetectiveOutcome,
} from "../../../types/detective.types";
import type { Age, Difficulty } from "../../../types";

export function newRound(
  steps: DetectiveStep[],
  contentVersion: string,
  age: Age,
  difficulty: Difficulty,
): DetectiveRound {
  return {
    id: `detective-${crypto.randomUUID()}`,
    contentVersion,
    age,
    difficulty,
    startedAt: new Date().toISOString(),
    steps,
    index: 0,
    outcomes: {},
    attempts: {},
    hinted: [],
    wrongOptions: {},
  };
}
export function canResume(
  round: DetectiveRound | undefined,
  version: string,
  age: Age,
  difficulty: Difficulty,
  items: DetectiveItem[],
): round is DetectiveRound {
  const eligible = new Set(
    items
      .filter(
        (item) => item.ages.includes(age) && item.difficulty === difficulty,
      )
      .map((item) => item.id),
  );
  if (
    !round ||
    typeof round.id !== "string" ||
    round.contentVersion !== version ||
    round.age !== age ||
    round.difficulty !== difficulty ||
    !Array.isArray(round.steps) ||
    !round.steps.length ||
    !Array.isArray(round.hinted) ||
    !round.outcomes ||
    !round.attempts ||
    !round.wrongOptions ||
    !Number.isInteger(round.index) ||
    round.index < 0 ||
    round.index >= round.steps.length
  )
    return false;
  const ids: string[] = [];
  for (const step of round.steps) {
    if (
      !step ||
      !Array.isArray(step.ids) ||
      !step.ids.length ||
      !step.ids.every(
        (id) =>
          typeof id === "string" &&
          eligible.has(id) &&
          id.startsWith(`${step.gameId}-`),
      )
    )
      return false;
    ids.push(...step.ids);
  }
  return (
    new Set(ids).size === ids.length &&
    Object.entries(round.outcomes).every(
      ([id, value]) =>
        ids.includes(id) &&
        ["independent", "assisted", "demonstrated"].includes(value),
    ) &&
    Object.entries(round.attempts).every(
      ([id, value]) =>
        ids.includes(id) && Number.isInteger(value) && value >= 1,
    ) &&
    Object.entries(round.wrongOptions).every(
      ([id, value]) => ids.includes(id) && Array.isArray(value),
    ) &&
    round.steps
      .slice(0, round.index)
      .every((step) => step.ids.every((id) => Boolean(round.outcomes[id])))
  );
}
export function useHint(round: DetectiveRound, id: string): DetectiveRound {
  return round.hinted.includes(id)
    ? round
    : { ...round, hinted: [...round.hinted, id] };
}
export function answerChoice(
  round: DetectiveRound,
  item: DetectiveItem,
  optionId: string,
): DetectiveRound {
  if (
    round.outcomes[item.id] ||
    !item.options?.some((option) => option.id === optionId) ||
    round.wrongOptions[item.id]?.includes(optionId)
  )
    return round;
  const attempt = (round.attempts[item.id] ?? 0) + 1,
    correct = optionId === item.correctOptionId;
  const outcome: DetectiveOutcome | undefined = correct
    ? attempt === 1 && !round.hinted.includes(item.id)
      ? "independent"
      : "assisted"
    : attempt >= 2
      ? "demonstrated"
      : undefined;
  return {
    ...round,
    attempts: { ...round.attempts, [item.id]: attempt },
    hinted:
      !correct && !round.hinted.includes(item.id)
        ? [...round.hinted, item.id]
        : round.hinted,
    wrongOptions: correct
      ? round.wrongOptions
      : {
          ...round.wrongOptions,
          [item.id]: [...(round.wrongOptions[item.id] ?? []), optionId],
        },
    outcomes: outcome
      ? { ...round.outcomes, [item.id]: outcome }
      : round.outcomes,
  };
}
export function answerPair(
  round: DetectiveRound,
  id: string,
  correct: boolean,
): DetectiveRound {
  if (round.outcomes[id]) return round;
  const attempt = (round.attempts[id] ?? 0) + 1;
  return {
    ...round,
    attempts: { ...round.attempts, [id]: attempt },
    outcomes: correct
      ? {
          ...round.outcomes,
          [id]:
            attempt === 1 && !round.hinted.includes(id)
              ? "independent"
              : "assisted",
        }
      : round.outcomes,
  };
}
export function orderBySeed<T>(values: T[], seed: string): T[] {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  // Fisher–Yates mixes both sides of each pair, while a saved seed restores
  // exactly the same board. Sorting hashes of consecutive indices clustered pairs.
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
