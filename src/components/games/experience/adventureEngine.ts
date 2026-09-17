import {
  adventureMissions,
  alphabet,
  colorNames,
  mixRecipes,
  shapeNames,
} from "../../../content/adventureMissions";
import type {
  AdventureMission,
  AdventureSettings,
  AdventureStep,
  PaintColor,
  Shape,
} from "../../../types/adventure.types";
import type { ExperienceGameId, LearningEvent } from "../../../types";

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function selectAdventureMissions(
  game: ExperienceGameId,
  recent: string[],
  seed: number,
  evidence: LearningEvent[] = [],
): AdventureMission[] {
  const pool = adventureMissions.filter((m) => m.gameId === game);
  const exposure = Math.min(3, Math.floor(new Set(recent).size / 3));
  const needsPractice = (id: string) => {
    const latest = evidence
      .filter((e) => e.contentId.startsWith(`${id}.`))
      .slice(-6);
    return latest.filter((e) => !e.correct || e.hintUsed).length;
  };
  return [...new Set(pool.map((m) => m.activity))].map((activity, i) => {
    const candidates = shuffled(
      pool.filter(
        (m) =>
          m.activity === activity &&
          (game !== "letters" || m.variant <= exposure),
      ),
      seed + i * 79,
    );
    return candidates.sort((a, b) => {
      const aIndex = recent.indexOf(a.id),
        bIndex = recent.indexOf(b.id);
      return (
        (aIndex < 0 ? -100 : aIndex - needsPractice(a.id) * 3) -
        (bIndex < 0 ? -100 : bIndex - needsPractice(b.id) * 3)
      );
    })[0];
  });
}
export function quantityLimit(settings: AdventureSettings): number {
  const cap = settings.age === 3 ? 3 : settings.age === 4 ? 5 : 10;
  return Math.min(
    cap,
    settings.fewerItems
      ? 3
      : settings.difficulty === "easy"
        ? 3
        : settings.difficulty === "medium"
          ? 5
          : 10,
  );
}
export function missionSteps(
  mission: AdventureMission,
  settings: AdventureSettings,
  seed: number,
): AdventureStep[] {
  const { activity, variant } = mission;
  const optionsCount =
    settings.age === 3 || settings.fewerItems
      ? 2
      : settings.difficulty === "hard"
        ? 4
        : 3;
  const choose = (
    id: string,
    prompt: string,
    answer: string,
    options: string[],
    target = answer,
  ): AdventureStep => ({
    id,
    kind: "choose",
    prompt,
    answer,
    options: shuffled(
      [
        ...new Set([
          answer,
          ...options.filter((o) => o !== answer).slice(0, optionsCount - 1),
        ]),
      ],
      seed + id.length + variant,
    ),
    target,
  });
  if (mission.gameId === "letters") {
    const set = [...(mission.letterSet ?? "אבג")];
    const letter = set[Math.abs(seed) % set.length];
    const entry = alphabet.find((e) => e[0] === letter)!;
    const distractors = shuffled(
      alphabet.map((e) => e[0]),
      seed + 31,
    );
    if (activity === "letter-build") {
      const parts = settings.age === 3 ? 2 : 3;
      return [
        ...Array.from(
          { length: parts },
          (_, part): AdventureStep => ({
            id: `part-${part}`,
            kind: "place",
            prompt: "נחבר את החלק למקום המואר.",
            answer: `part-${part}`,
            options: shuffled(
              Array.from({ length: parts }, (_, i) => `part-${i}`),
              seed,
            ),
            target: letter,
            part,
            parts,
          }),
        ),
        choose(
          "recognize",
          `איזו אות בנינו? מצאו ${entry[1]}.`,
          letter,
          distractors,
        ),
      ];
    }
    if (activity === "letter-find")
      return [
        choose("listen", `מצאו את האות ${entry[1]}.`, letter, distractors),
        choose(
          "transfer",
          `נמצא שוב ${entry[1]} בין אותיות חדשות.`,
          letter,
          shuffled(distractors, seed + 4),
        ),
      ];
    return [
      {
        ...choose(
          "sign",
          `המילה ${entry[2]} מתחילה באות ${entry[1]}. נשלים את השלט.`,
          letter,
          distractors,
        ),
        word: entry[2],
      },
      choose(
        "recognize",
        `נמצא את האות ${entry[1]} גם כאן.`,
        letter,
        shuffled(distractors, seed + 10),
      ),
    ];
  }
  if (mission.gameId === "numbers") {
    const cap = quantityLimit(settings);
    const amount =
      activity === "order"
        ? 1 + ((variant + Math.abs(seed)) % cap)
        : Math.min(
            cap,
            2 + ((variant + Math.abs(seed)) % Math.max(1, cap - 1)),
          );
    const count = (id: string, n: number, initial = 0): AdventureStep => ({
      id,
      kind: "count",
      prompt: initial
        ? `כבר יש ${initial}. נשלים עד ${n}.`
        : `נכין בדיוק ${n} פריטים.`,
      answer: String(n),
      options: ["food"],
      target:
        activity === "share" && variant === 1
          ? "cookie"
          : ["apple", "strawberry", "cookie", "carrot"][variant],
      count: n,
      initial,
    });
    const numberOptions = Array.from({ length: cap + 1 }, (_, i) => String(i));
    if (activity === "share") {
      const other = Math.max(1, amount - 1);
      const first = seed % 2 ? amount : other,
        second = seed % 2 ? other : amount;
      return [
        count("friend-one", first),
        count("friend-two", second),
        {
          ...choose(
            "compare",
            settings.age === 3 ? "באיזו צלחת יש יותר?" : "למי הכנו יותר אוכל?",
            first > second ? "first" : "second",
            ["first", "second"],
            "compare",
          ),
          count: first,
          initial: second,
        },
      ];
    }
    return [
      count(
        "plate",
        amount,
        activity === "complete" ? Math.max(1, amount - 2) : 0,
      ),
      choose(
        "quantity",
        `כמה פריטים הכנו?`,
        String(amount),
        shuffled(numberOptions, seed + 9),
        "quantity",
      ),
    ];
  }
  if (mission.gameId === "shapes") {
    const shapes = mission.shapes!;
    const available = shuffled(Object.keys(shapeNames) as Shape[], seed);
    return [
      ...shapes.map(
        (shape, i): AdventureStep => ({
          ...choose(
            `piece-${i}`,
            activity === "shape-turn"
              ? "נסובב את החלק עד שיתאים לתבנית."
              : `נחבר ${shapeNames[shape]} לצעצוע.`,
            shape,
            available,
          ),
          kind: "place",
          target: shape,
          rotation: activity === "shape-turn" ? -90 : 0,
          part: i,
          parts: shapes.length,
        }),
      ),
      choose(
        "recognize",
        `איזו צורה היא ${shapeNames[shapes[0]]}?`,
        shapes[0],
        available,
      ),
    ];
  }
  const colors = mission.colors!;
  if (activity === "mix") {
    const color = colors[variant === 3 ? Math.abs(seed) % 3 : 0];
    return [
      {
        id: "mix",
        kind: "mix",
        prompt: `נערבב שני צבעים כדי להכין ${colorNames[color]}.`,
        answer: mixRecipes[color]!.slice().sort().join("+"),
        options: ["red", "blue", "yellow"],
        target: color,
      },
      choose("discover", `איזה צבע הכנו? מצאו ${colorNames[color]}.`, color, [
        "orange",
        "green",
        "purple",
      ]),
    ];
  }
  return colors.slice(0, settings.fewerItems ? 2 : 3).map((color, i) => ({
    ...choose(
      `color-${i}`,
      `נבחר ${colorNames[color]} ונצבע.`,
      color,
      shuffled(Object.keys(colorNames), seed + i),
    ),
    kind: activity === "paint" ? "paint" : "place",
    target: color,
    part: i,
    parts: 3,
  }));
}
export function isCorrectAction(
  step: AdventureStep,
  value: string,
  rotation = 0,
): boolean {
  if (step.rotation && ((rotation % 360) + 360) % 360 !== 0) return false;
  return value === step.answer;
}
export function itemLabel(value: string): string {
  if (value.startsWith("part-")) return `חלק ${Number(value.slice(5)) + 1}`;
  if (value === "food") return "פרי";
  if (value === "first") return "הצלחת הראשונה";
  if (value === "second") return "הצלחת השנייה";
  return (
    colorNames[value as PaintColor] ??
    shapeNames[value as Shape] ??
    alphabet.find((e) => e[0] === value)?.[1] ??
    value
  );
}
