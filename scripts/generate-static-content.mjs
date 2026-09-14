import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  CONTENT_VERSION,
  games,
  ages,
  difficulties,
  policy,
  alphabet,
  sounds,
  shapes,
  colors,
  groups,
  objects,
  tokens,
  atom,
  objectAtom,
  quantity,
  shapeAtom,
  colorAtom,
} from "./content-facts.mjs";

const text = (value) => atom("text", value);
const scene = (...items) => ({
  kind: items.length === 1 ? "single" : "row",
  items,
});
const rotate = (values, offset) => [
  ...values.slice(offset % values.length),
  ...values.slice(0, offset % values.length),
];
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
function choices(correct, pool, count, seed) {
  const others = rotate(
    pool.filter((value) => value.label !== correct.label),
    seed,
  );
  const distinct = [correct, ...others]
    .filter(
      (value, index, all) =>
        all.findIndex((other) => other.label === value.label) === index,
    )
    .slice(0, count);
  if (distinct.length !== count)
    throw new Error(`Insufficient domain distractors: ${correct.label}`);
  const options = rotate(distinct, seed).map((visualToken, i) => ({
    id: `option-${i + 1}`,
    label: visualToken.label,
    visualToken,
  }));
  return {
    options,
    correctOptionId: options.find((option) => option.label === correct.label)
      .id,
  };
}
const skills = {
  recognizeLetter: [
    "hebrew.letter-recognition",
    "foundation.visual-discrimination",
    "foundation.auditory-discrimination",
  ],
  letter: [
    "hebrew.letter-recognition",
    "hebrew.letter-sound",
    "hebrew.sound-position",
    "foundation.auditory-discrimination",
  ],
  count: ["math.quantity-sense", "math.numeral-recognition"],
  next: ["math.numeral-recognition", "cognition.sequence"],
  add: ["math.quantity-sense", "cognition.problem-solving"],
  compare: ["math.quantity-sense"],
  shape: ["concept.shape", "foundation.visual-discrimination"],
  sides: ["concept.shape", "cognition.problem-solving"],
  color: ["concept.color", "foundation.visual-discrimination"],
  pattern: ["cognition.sequence"],
  categories: ["cognition.sorting"],
};

function makeChoice(game, age, difficulty, seed) {
  const p = policy(age, difficulty),
    tier = difficulties.indexOf(difficulty),
    count = p.choices;
  let prompt,
    hint,
    explanation,
    stimulus,
    correct,
    pool,
    rule,
    operands,
    skill,
    family;
  const answer = (value, candidates) => {
    correct = value;
    pool = candidates;
  };
  if (game === "letters") {
    if (age === 3 && difficulty === 'hard') {
      const letter=alphabet[seed%alphabet.length], other=alphabet[(seed+1+Math.floor(seed/alphabet.length))%alphabet.length];
      if(letter===other)return null;
      prompt='איזו אות מופיעה פעמיים?';hint='חפשו שני סימנים עם אותם קווים.';
      explanation=`האות ${letter} מופיעה פעמיים.`;
      stimulus=scene(...rotate([text(letter),text(letter),text(other)],seed));
      rule='repeated-letter';operands=stimulus.items.map(item=>item.value);skill='recognizeLetter';family=rule;
      answer(text(letter),alphabet.map(text));
    } else if (!p.sounds || (difficulty !== "hard" && seed % 3 === 0)) {
      const letter = alphabet[seed % alphabet.length];
      prompt = `מצאו את האות ${letter}`;
      hint = "הביטו בקווים של האות והקשיבו לשמה.";
      explanation = `זאת האות ${letter}.`;
      stimulus =
        difficulty === "easy"
          ? scene(text(letter))
          : scene(atom("emoji", "🔎", "חפשו את האות"));
      answer(text(letter), alphabet.map(text));
      rule = "letter-recognition";
      operands = [letter];
      skill = "recognizeLetter";
      family = rule;
    } else {
      const entry = sounds[Math.floor(seed / 3) % sounds.length],
        word = entry[2 + (Math.floor(seed / (sounds.length * 3)) % 2)],
        other = entry[word === entry[2] ? 3 : 2];
      if (seed % 3 === 1 || (difficulty === "hard" && seed % 3 === 0)) {
        prompt = `באיזו אות מתחילה המילה ${word[0]}?`;
        hint = `הקשיבו לתחילת המילה: ${word[0]}.`;
        explanation = `המילה ${word[0]} מתחילה באות ${entry[0]}.`;
        answer(text(entry[0]), alphabet.map(text));
        rule = "initial-letter";
      } else {
        prompt = `איזו מילה מתחילה באותו צליל כמו ${word[0]}?`;
        hint = `אמרו לאט: ${word[0]}. הקשיבו לצליל הראשון.`;
        explanation = `${word[0]} וגם ${other[0]} מתחילות בצליל ${entry[1]}.`;
        answer(
          atom("emoji", other[1], other[0]),
          sounds
            .filter((item) => item[0] !== entry[0])
            .map((item) => atom("emoji", item[2][1], item[2][0])),
        );
        rule = "same-sound";
      }
      operands = [word[0]];
      stimulus = scene(atom("emoji", word[1], word[0]));
      family = rule;
      skill = "letter";
    }
  } else if (game === "numbers") {
    const n = 1 + Math.floor((Math.floor(seed / 4) % 10) * (p.max - 1) / 9),
      token = tokens[Math.floor(seed / (p.max * 4)) % tokens.length];
    const modes = p.addition
      ? ["count", "compare", "next", "add"]
      : difficulty === "easy"
        ? ["count", "count", "compare", "count"]
        : ["count", "compare", "next", "count"];
    rule = modes[seed % modes.length];
    family = rule;
    skill = rule;
    const numericPool = Array.from({ length: p.max }, (_, i) => text(i + 1));
    if (rule === "count") {
      prompt = "כמה פריטים רואים?";
      hint = "נוגעים בכל פריט פעם אחת וסופרים לאט.";
      explanation = `ספרנו ${n} פריטים.`;
      stimulus = scene(quantity(n, token));
      operands = [n];
      answer(text(n), numericPool);
    } else if (rule === "compare") {
      const m = 1 + ((n + Math.floor(seed / (p.max * 4))) % p.max);
      if (m === n) return null;
      const fewer=difficulty==='hard'&&Math.floor(seed/4)%2===1;
      if(fewer){rule='compare-less';family=rule;}
      prompt = fewer ? 'באיזו קבוצה יש פחות פריטים?' : "באיזו קבוצה יש יותר פריטים?";
      hint = "ספרו כל קבוצה, או התאימו פריט מול פריט.";
      const first = quantity(n, token),
        second = quantity(
          m,
          tokens[(tokens.indexOf(token) + 1) % tokens.length],
        );
      stimulus = { kind: "groups", items: [first, second] };
      operands = [n, m];
      const options = [
        atom("quantity", first.value, "הקבוצה הראשונה", { count: n }),
        atom("quantity", second.value, "הקבוצה השנייה", { count: m }),
      ];
      const firstCorrect=fewer?n<m:n>m;
      answer(options[firstCorrect?0:1], options);
      explanation = `בקבוצה ${firstCorrect ? "הראשונה" : "השנייה"} יש ${fewer?Math.min(n,m):Math.max(n,m)} פריטים. זה ${fewer?'פחות':'יותר'} מ־${fewer?Math.max(n,m):Math.min(n,m)}.`;
    } else if (rule === "next") {
      const start = Math.min(n, p.max - 1);
      prompt = `איזה מספר בא אחרי ${start}?`;
      hint = `מתחילים ב־${start} ומתקדמים צעד אחד בספירה.`;
      explanation = `אחרי ${start} בא ${start + 1}.`;
      stimulus = { kind: "sequence", items: [text(start), text("?")] };
      operands = [start];
      answer(text(start + 1), numericPool);
    } else {
      const a = Math.min(n, p.max - 1),
        b =
          1 + (Math.floor(seed / 4) % Math.min(tier + 1, p.max - a));
      prompt = "כמה פריטים יש יחד?";
      hint = "סופרים את הקבוצה הראשונה וממשיכים לספור בקבוצה השנייה.";
      explanation = `${a} ועוד ${b} הם ${a + b}.`;
      stimulus = {
        kind: "addition",
        items: [quantity(a, token), quantity(b, token)],
      };
      operands = [a, b];
      answer(text(a + b), numericPool);
    }
  } else if (game === "shapes") {
    const available = shapes.slice(0, age <= 3 ? 4 : age === 4 ? 6 : 8);
    const shape = available[seed % available.length],
      offset = Math.floor(seed / available.length),
      other =
        available[
          (seed + 1 + (offset % (available.length - 1))) % available.length
        ];
    if (p.properties && seed % 3 === 0) {
      rule = "sides";
      skill = "sides";
      prompt = "כמה צלעות ישרות יש לצורה?";
      hint = "עברו על קו המתאר וספרו רק את הקטעים הישרים.";
      explanation = shape.sides
        ? `ל${shape.name} יש ${shape.sides} צלעות ישרות.`
        : `ל${shape.name} יש קו מעוגל, בלי צלעות ישרות.`;
      stimulus = scene(shapeAtom(shape));
      answer(text(shape.sides), [0, 3, 4, 5, 6, 7].map(text));
      operands = [shape.id];
    } else if (difficulty === 'hard' || difficulty !== "easy" && offset % 2) {
      rule = "odd-shape";
      skill = "shape";
      prompt = "איזו צורה שונה מהאחרות?";
      hint = "חפשו את הצורה שמופיעה רק פעם אחת.";
      stimulus = scene(
        ...rotate(
          [...Array.from({length:difficulty==='hard'?4:2},()=>shapeAtom(shape)), shapeAtom(other)],
          offset,
        ),
      );
      answer(
        shapeAtom(other),
        available.map((s) => shapeAtom(s)),
      );
      operands = stimulus.items.map((item) => item.value);
      explanation = `הצורה מסוג ${other.name} מופיעה פעם אחת. השאר מסוג ${shape.name}.`;
    } else {
      rule = offset % 3 === 2 ? "find-shape" : "shape";
      skill = "shape";
      prompt =
        rule === "shape"
          ? "איזו צורה מופיעה כאן?"
          : `מצאו את הצורה ${shape.name}`;
      hint = "הביטו בקו המתאר: האם הוא מעוגל או בנוי מצלעות?";
      stimulus =
        rule === "shape"
          ? scene(shapeAtom(shape, (offset % 4) * 90))
          : scene(atom("emoji", "🔎", "מחפשים צורה"));
      answer(
        shapeAtom(shape),
        available.map((s) => shapeAtom(s)),
      );
      operands = [shape.id];
      explanation = `זאת צורת ${shape.name}.`;
    }
    family = rule;
  } else if (game === "colors") {
    const available = colors.slice(0, age === 3 ? 6 : 10),
      color = available[seed % available.length],
      offset = Math.floor(seed / available.length),
      other =
        available[
          (seed + 1 + (offset % (available.length - 1))) % available.length
        ];
    skill = "color";
    if (difficulty === 'hard' || difficulty !== "easy" && offset % 2) {
      rule = "odd-color";
      prompt = "איזה צבע שונה מהאחרים?";
      hint = "חפשו את הדוגמית שצבעה מופיע רק פעם אחת.";
      stimulus = scene(
        ...rotate(
          [...Array.from({length:difficulty==='hard'?4:2},()=>colorAtom(color)), colorAtom(other)],
          offset,
        ),
      );
      operands = stimulus.items.map((item) => item.value);
      answer(colorAtom(other), available.map(colorAtom));
      explanation = `הצבע ${other.name} מופיע פעם אחת. שאר הדוגמיות בצבע ${color.name}.`;
    } else {
      rule = offset % 3 === 2 ? "find-color" : "color";
      prompt =
        rule === "color" ? "איזה צבע מופיע כאן?" : `מצאו את הצבע ${color.name}`;
      hint = "הקשיבו לשם הצבע והביטו בדוגמיות.";
      stimulus =
        rule === "color"
          ? scene(colorAtom(color))
          : scene(atom("emoji", "🎨", "בוחרים צבע"));
      operands = [color.id];
      answer(colorAtom(color), available.map(colorAtom));
      explanation = `זהו הצבע ${color.name}.`;
    }
    family = rule;
  } else if (game === "patterns") {
    const a = objects[seed % objects.length],
      b =
        objects[
          (seed + 1 + Math.floor(seed / objects.length)) % objects.length
        ],
      c = objects[(seed + 9) % objects.length];
    if (new Set([a.name, b.name, c.name]).size < 3) return null;
    const motif =
      age === 3 || difficulty === "easy"
        ? [a, b]
        : difficulty === "medium"
          ? [a, a, b]
          : [a, b, c];
    rule = "repeat";
    family =
      motif.length === 2
        ? "ab-pattern"
        : difficulty === "medium"
          ? "aab-pattern"
          : "abc-pattern";
    skill = "pattern";
    const full = [...motif, ...motif, ...motif].map(objectAtom),
      missing = full.length - (difficulty === "hard" ? 3 : 1);
    prompt = "מה משלים את הרצף?";
    hint = `מתחילים בצד החץ ומחפשים את הקבוצה שחוזרת: ${motif.map((x) => x.name).join(", ")}.`;
    explanation = `הקבוצה ${motif.map((x) => x.name).join(", ")} חוזרת באותו סדר.`;
    stimulus = {
      kind: "sequence",
      items: full.map((v, i) => (i === missing ? text("?") : v)),
    };
    operands = [...motif.map((x) => x.name), missing];
    answer(full[missing], [objectAtom(a), objectAtom(b), objectAtom(c)]);
    if (age >= 5 && difficulty !== "easy" && seed % 3 === 0) {
      const step = difficulty === "hard" ? 2 : 1,
        start = 1 + (seed % Math.max(1, p.max - step * 4)),
        values = Array.from({ length: 5 }, (_, i) => start + i * step);
      rule = "number-pattern";
      family = rule;
      operands = [start, step, 2];
      stimulus = {
        kind: "sequence",
        items: values.map((v, i) => text(i === 2 ? "?" : v)),
      };
      hint = `מתקדמים בכל פעם ב־${step}.`;
      explanation = `מתקדמים ב־${step}: ${values.join(", ")}.`;
      answer(
        text(values[2]),
        Array.from({ length: p.max }, (_, i) => text(i + 1)),
      );
    }
  } else {
    const object = objects[seed % objects.length],
      names = Object.keys(groups);
    prompt = `ממיינים לפי סוג. לאיזו קבוצה שייך ${object.name}?`;
    hint = "חשבו מה הפריט: אוכל, חיה, בגד או חפץ שמשתמשים בו.";
    explanation = `${object.name} שייך לקבוצת ${object.category}.`;
    stimulus = scene(objectAtom(object));
    rule = "category";
    operands = [object.name];
    if(difficulty!=='easy') {
      const categoryObjects=objects.filter(item=>item.category===object.category), start=categoryObjects.findIndex(item=>item.name===object.name);
      const examples=Array.from({length:tier+1},(_,index)=>categoryObjects[(start+index)%categoryObjects.length]);
      stimulus=scene(...examples.map(objectAtom));operands=examples.map(item=>item.name);
      prompt='ממיינים לפי סוג. לאיזו קבוצה שייכים הפריטים?';
      hint='הביטו בכל הפריטים. מה משותף לסוג שלהם?';
      explanation=`כל הפריטים שייכים לקבוצת ${object.category}.`;
    }
    skill = "categories";
    family = "categories";
    const categoryToken = (name) => atom("emoji", groups[name][0][1], name);
    answer(categoryToken(object.category), names.map(categoryToken));
    if (difficulty === "hard" && age >= 4 && seed % 2 === 1) {
      const color = colors[Math.floor(seed / 2) % colors.length];
      rule = "sort-color";
      family = "feature-sort";
      skill = "categories";
      operands = [color.id];
      prompt = "הכלל עכשיו: ממיינים לפי צבע. לאיזו קבוצה הדוגמית שייכת?";
      hint = "הקשיבו לכלל: מחפשים את אותו הצבע, בלי קשר לשם הפריט.";
      explanation = `לפי כלל הצבע, הדוגמית שייכת לקבוצת ${color.name}.`;
      stimulus = scene(colorAtom(color));
      answer(colorAtom(color), colors.map(colorAtom));
    }
  }
  const skillIds = [...skills[skill]];
  if (game === "patterns" && rule === "number-pattern")
    skillIds.push(
      "math.numeral-recognition",
      "cognition.problem-solving",
      "readiness.grade-one",
    );
  if (game === "patterns" && age >= 4 && difficulty !== "easy")
    skillIds.push("cognition.problem-solving");
  const result = {
    taskFamily: family,
    skill: family,
    skillIds: [...new Set(skillIds)],
    prompt,
    audioText: prompt,
    hint,
    explanation,
    scene: stimulus,
    logic: { rule, operands },
    visualRole: "stimulus",
    evidenceForm:
      game === "letters"
        ? "listening-choice"
        : game === "patterns"
          ? "sequence"
          : game === "sorting"
            ? "sorting"
            : "visual-choice",
    ...choices(
      correct,
      pool,
      rule.startsWith('compare') ? 2 : count,
      seed + Math.floor(seed / 7),
    ),
  };
  if (["letters", "numbers", "shapes", "colors"].includes(game))
    result.category = game;
  if (game === "patterns")
    result.sequence = stimulus.items.map((item) => item.value);
  if (game === "sorting") {
    result.item = stimulus.items[0].value;
    result.itemName =
      rule === "sort-color" ? stimulus.items[0].label : operands[0];
  }
  return result;
}

function makePair(game, age, difficulty, seed) {
  const object = objects[seed % objects.length];
  let leftVisual = objectAtom(object),
    rightVisual = objectAtom(object),
    rule = "same-object",
    operands = [object.name],
    hint = "חפשו שני ציורים של אותו הדבר.",
    explanation = `בשני הכרטיסים רואים ${object.name}.`;
  const skillIds = [
    game === "memory" ? "cognition.memory" : "cognition.matching",
    "foundation.visual-discrimination",
  ];
  if (age >= 4 && difficulty !== "easy" && seed % 3 === 1) {
    const entry = sounds[Math.floor(seed / 3) % sounds.length],
      word = entry[2];
    rule = "letter-picture";
    operands = [word[0]];
    leftVisual = text(entry[0]);
    rightVisual = atom("emoji", word[1], word[0]);
    hint = "הקשיבו לשם הציור וחפשו את האות הראשונה שלו.";
    explanation = `${word[0]} מתחילה באות ${entry[0]}.`;
    skillIds.push("hebrew.first-words", "hebrew.letter-recognition");
  } else if (difficulty !== "easy" && seed % 3 === 2) {
    const n = 1 + (Math.floor(seed / 3) % policy(age, difficulty).max),
      token = tokens[Math.floor(seed / 15) % tokens.length];
    rule = "number-quantity";
    operands = [n, token.name];
    leftVisual = text(n);
    rightVisual = quantity(n, token);
    hint = "ספרו את הפריטים וחפשו את הספרה המתאימה.";
    explanation = `הספרה ${n} מתאימה לכמות של ${n} פריטים.`;
    skillIds.push("math.quantity-sense", "math.numeral-recognition");
  }
  const family =
    game === "memory"
      ? rule === "same-object"
        ? "visual-memory"
        : rule === "number-quantity"
          ? "symbol-memory"
          : "word-memory"
      : rule === "letter-picture"
        ? "letter-word"
        : rule === "number-quantity"
          ? "number-word"
          : "same-object";
  const fields =
    game === "memory"
      ? { leftValue: leftVisual.label, rightValue: rightVisual.label }
      : { left: leftVisual.label, right: rightVisual.label };
  return {
    taskFamily: family,
    skill: family,
    skillIds,
    evidenceForm: game,
    visualRole: "none",
    logic: { rule, operands },
    leftVisual,
    rightVisual,
    hint,
    explanation,
    ...fields,
  };
}

export function semanticSignature(item) {
  return hash({
    rule: item.logic,
    scene: item.scene,
    choices: item.options
      ?.map((o) => o.visualToken)
      .sort((a, b) => a.label.localeCompare(b.label)),
    left: item.leftVisual,
    right: item.rightVisual,
  });
}
export function generateContent() {
  return Object.fromEntries(
    games.map((game) => [
      game,
      ages.flatMap((age) =>
        difficulties.flatMap((difficulty) => {
          const result = [],
            seen = new Set();
          for (let seed = 0; result.length < 40 && seed < 20000; seed++) {
            const item = ["matching", "memory"].includes(game)
              ? makePair(game, age, difficulty, seed)
              : makeChoice(game, age, difficulty, seed);
            if (!item) continue;
            const signature = semanticSignature(item);
            if (seen.has(signature)) continue;
            seen.add(signature);
            result.push({
              id: `${game}-a${age}-${difficulty}-d${String(result.length + 1).padStart(3, "0")}`,
              ages: [age],
              difficulty,
              conceptKey: `${item.logic.rule}:${item.logic.operands.join(":")}`,
              variantKey: signature.slice(0, 16),
              ...item,
            });
          }
          if (result.length !== 40)
            throw new Error(
              `Coverage ${game}/${age}/${difficulty}: ${result.length}`,
            );
          return result;
        }),
      ),
    ]),
  );
}
export function versionForContent(content) {
  return `${CONTENT_VERSION}.${hash(content).slice(0, 16)}`;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const content = generateContent();
  const contentVersion = versionForContent(content);
  for (const [gameId, items] of Object.entries(content))
    writeFileSync(
      `src/content/${gameId}.json`,
      JSON.stringify(
        { schemaVersion: 2, contentVersion, gameId, items },
        null,
        2,
      ) + "\n",
    );
  const reviews = Object.fromEntries(
    Object.values(content)
      .flat()
      .map((item) => [
        item.id,
        { status: "pending", reviewerType: null, contentHash: hash(item) },
      ]),
  );
  writeFileSync(
    "src/content/review-status.json",
    JSON.stringify({ contentVersion, reviews }, null, 2) +
      "\n",
  );
  console.log(
    "Generated 3,840 items. Semantic validation and editorial review are required.",
  );
}
