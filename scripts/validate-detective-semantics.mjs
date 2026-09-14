import {
  alphabet,
  sounds,
  shapes,
  colors,
  objects,
  tokens,
  groups,
  policy,
} from "./content-facts.mjs";

const soundFor = (word) =>
  sounds.find((row) => row.slice(2).some((entry) => entry[0] === word));
const objectFor = (name) => objects.find((object) => object.name === name);
const shapeFor = (id) => shapes.find((shape) => shape.id === id);
const colorFor = (id) => colors.find((color) => color.id === id);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Independent oracle: derive the answer from facts and operands, never correctOptionId. */
export function solveItem(item) {
  const { rule, operands: o } = item.logic ?? {};
  switch (rule) {
    case "letter-recognition":
      return alphabet.includes(o[0]) ? o[0] : undefined;
    case "repeated-letter":
      return o.find(
        (value) =>
          alphabet.includes(value) &&
          o.filter((other) => other === value).length === 2,
      );
    case "initial-letter":
      return soundFor(o[0])?.[0];
    case "same-sound":
      return soundFor(o[0])
        ?.slice(2)
        .find((entry) => entry[0] !== o[0])?.[0];
    case "count":
      return String(o[0]);
    case "compare":
      return o[0] === o[1]
        ? undefined
        : o[0] > o[1]
          ? "הקבוצה הראשונה"
          : "הקבוצה השנייה";
    case "compare-less":
      return o[0] === o[1]
        ? undefined
        : o[0] < o[1]
          ? "הקבוצה הראשונה"
          : "הקבוצה השנייה";
    case "next":
      return String(Number(o[0]) + 1);
    case "add":
      return String(Number(o[0]) + Number(o[1]));
    case "shape":
    case "find-shape":
      return shapeFor(o[0])?.name;
    case "sides":
      return String(shapeFor(o[0])?.sides);
    case "color":
    case "find-color":
    case "sort-color":
      return colorFor(o[0])?.name;
    case "odd-shape":
      return shapeFor(o.find((v) => o.filter((w) => w === v).length === 1))
        ?.name;
    case "odd-color":
      return colors.find(
        (c) => c.hex === o.find((v) => o.filter((w) => w === v).length === 1),
      )?.name;
    case "category":
      return objectFor(o[0])?.category;
    case "repeat":
      return o.slice(0, -1)[Number(o.at(-1)) % (o.length - 1)];
    case "number-pattern":
      return String(Number(o[0]) + Number(o[1]) * Number(o[2]));
    case "same-object":
      return objectFor(o[0])?.name;
    case "letter-picture":
      return o[0];
    case "number-quantity":
      return o[0]===1?'פריט אחד':`${o[0]} פריטים`;
    default:
      return undefined;
  }
}

export function validateSemantics(item) {
  const errors = [],
    fail = (message) => errors.push(`${item.id}: ${message}`),
    p = policy(item.ages[0], item.difficulty);
  const expected = solveItem(item),
    { rule, operands: o } = item.logic ?? {},
    visuals = item.scene?.items ?? [];
  if (!expected) fail("no unique independently derived answer");
  for (const key of ["hint", "explanation"])
    if (
      !item[key]?.trim() ||
      item[key].length > 260 ||
      /[A-Za-z]/.test(item[key])
    )
      fail(`invalid Hebrew ${key}`);
  const option = item.options?.find(
    (value) => value.id === item.correctOptionId,
  );
  if (item.options) {
    if (option?.label !== expected)
      fail(`answer must be ${expected}, found ${option?.label}`);
    if (item.options.filter((value) => value.label === expected).length !== 1)
      fail("answer must occur exactly once");
    if (item.options.length !== (rule.startsWith("compare") ? 2 : p.choices))
      fail("wrong choice count for age and level");
    if (new Set(item.options.map((v) => v.id)).size !== item.options.length)
      fail("duplicate option ids");
    if (!visuals.length) fail("missing visible stimulus");
    for (const value of item.options)
      if (!value.visualToken || value.visualToken.label !== value.label)
        fail("answer visual and spoken label differ");
  }
  const allVisuals = [
    ...visuals,
    ...(item.options ?? []).map((v) => v.visualToken),
    item.leftVisual,
    item.rightVisual,
  ].filter(Boolean);
  for (const v of allVisuals) {
    if (!v.label || !v.value) fail("empty visual token");
    if (
      v.kind === "quantity" &&
      (!Number.isInteger(v.count) || v.count < 1 || v.count > p.max)
    )
      fail("quantity outside age bounds");
    if(v.kind==='quantity'&&!tokens.some(token=>token.emoji===v.value))fail('counting mark must depict one whole object');
    if (v.kind === "shape" && shapeFor(v.value)?.name !== v.label)
      fail("shape label disagrees with contour");
    if (
      v.kind === "color" &&
      !colors.some((c) => c.hex === v.value && c.name === v.label)
    )
      fail("color label disagrees with swatch");
    if (v.kind === "text" && v.value !== v.label)
      fail("text differs from spoken label");
    if (v.kind === "emoji") {
      const word = soundFor(v.label)
        ?.slice(2)
        .find((entry) => entry[0] === v.label);
      const expectedImage =
        objectFor(v.label)?.emoji ??
        word?.[1] ??
        groups[v.label]?.[0]?.[1] ??
        { "חפשו את האות": "🔎", "מחפשים צורה": "🔎", "בוחרים צבע": "🎨" }[
          v.label
        ];
      if (v.value !== expectedImage)
        fail("picture does not denote its spoken label");
    }
    if (
      v.kind === "quantity" &&
      !["הקבוצה הראשונה", "הקבוצה השנייה"].includes(v.label)
    ) {
      if (
        v.label !== (v.count===1?'פריט אחד':`${v.count} פריטים`)
      )
        fail("quantity label disagrees with count or picture");
    }
  }
  const optionDomain = {
    "letter-recognition": (v) =>
      v.kind === "text" && alphabet.includes(v.value),
    "repeated-letter": (v) => v.kind === "text" && alphabet.includes(v.value),
    "initial-letter": (v) => v.kind === "text" && alphabet.includes(v.value),
    "same-sound": (v) => v.kind === "emoji" && Boolean(soundFor(v.label)),
    shape: (v) => v.kind === "shape",
    "find-shape": (v) => v.kind === "shape",
    "odd-shape": (v) => v.kind === "shape",
    sides: (v) =>
      v.kind === "text" && /^[0-9]+$/.test(v.value) && Number(v.value) <= 8,
    color: (v) => v.kind === "color",
    "find-color": (v) => v.kind === "color",
    "odd-color": (v) => v.kind === "color",
    "sort-color": (v) => v.kind === "color",
    category: (v) => v.kind === "emoji" && Object.hasOwn(groups, v.label),
    repeat: (v) => v.kind === "emoji" && Boolean(objectFor(v.label)),
    count: (v) => v.kind === "text",
    next: (v) => v.kind === "text",
    add: (v) => v.kind === "text",
    "number-pattern": (v) => v.kind === "text",
    compare: (v) => v.kind === "quantity",
    "compare-less": (v) => v.kind === "quantity",
  }[rule];
  for (const answer of item.options ?? [])
    if (!answer.visualToken || !optionDomain?.(answer.visualToken))
      fail("distractor is outside the task domain");
  if (
    rule === "next" &&
    !equal(
      visuals.map((v) => v.value),
      [String(o[0]), "?"],
    )
  )
    fail("displayed counting step differs from question");
  if (
    rule === "letter-recognition" &&
    visuals[0]?.kind === "text" &&
    visuals[0].value !== o[0]
  )
    fail("displayed letter differs from question");
  if (
    rule === "repeated-letter" &&
    (o.length !== 3 ||
      new Set(o).size !== 2 ||
      !equal(
        visuals.map((v) => v.value),
        o,
      ))
  )
    fail("repeated-letter display differs from the rule");
  if (
    ["initial-letter", "same-sound"].includes(rule) &&
    visuals[0]?.label !== o[0]
  )
    fail("displayed word differs from spoken question");
  if (["count", "next", "add", "number-pattern"].includes(rule)) {
    for (const value of item.options)
      if (
        !/^\d+$/.test(value.label) ||
        Number(value.label) < 1 ||
        Number(value.label) > p.max
      )
        fail("numeric distractor outside domain");
  }
  if (
    ["initial-letter", "same-sound", "letter-picture"].includes(rule) &&
    !p.sounds
  )
    fail("phonological task below authored age");
  if (rule === "add" && !p.addition) fail("addition outside curriculum");
  if (rule === "sides" && !p.properties)
    fail("shape properties outside curriculum");
  if (rule === "same-sound" && item.options.some((v) => v.label === o[0]))
    fail("question word reused as answer");
  if (rule === "count" && (visuals.length !== 1 || visuals[0].count !== o[0]))
    fail("count stimulus disagrees with answer");
  if (
    ["compare", "compare-less", "add"].includes(rule) &&
    !equal(
      visuals.map((v) => v.count),
      o,
    )
  )
    fail("group counts differ from operands");
  if (rule.startsWith("compare"))
    for (const [i, label] of ["הקבוצה הראשונה", "הקבוצה השנייה"].entries()) {
      const v = item.options.find((v) => v.label === label)?.visualToken;
      if (v?.count !== o[i] || v?.value !== visuals[i].value)
        fail("comparison answer does not identify its group");
    }
  if (["shape", "sides"].includes(rule) && visuals[0]?.value !== o[0])
    fail("wrong displayed shape");
  if (
    ["color", "sort-color"].includes(rule) &&
    visuals[0]?.value !== colorFor(o[0])?.hex
  )
    fail("wrong displayed color");
  if (
    rule.startsWith("odd-") &&
    (!equal(
      visuals.map((v) => v.value),
      o,
    ) ||
      new Set(o).size !== 2)
  )
    fail("odd-one-out stimulus invalid");
  if (rule === "repeat") {
    const motif = o.slice(0, -1),
      missing = Number(o.at(-1));
    if (
      new Set(motif).size < 2 ||
      visuals.filter((v) => v.value === "?").length !== 1
    )
      fail("invalid repeating pattern");
    visuals.forEach((v, i) => {
      if (i === missing ? v.value !== "?" : v.label !== motif[i % motif.length])
        fail("sequence does not follow its rule");
    });
    if (item.ages[0] === 3 && motif.length !== 2)
      fail("age three needs simple AB patterns");
  }
  if (rule === "number-pattern") {
    if (item.ages[0] < 5) fail("numeric sequence below curriculum age");
    visuals.forEach((v, i) => {
      if (
        i === o[2]
          ? v.value !== "?"
          : Number(v.value) !== Number(o[0]) + Number(o[1]) * i
      )
        fail("numeric sequence inconsistent");
    });
    if (visuals.some((v) => v.value !== "?" && Number(v.value) > p.max))
      fail("sequence exceeds range");
  }
  if (
    rule === "category" &&
    (item.itemName !== o[0] ||
      visuals.length !== o.length ||
      visuals.some(
        (visual, index) =>
          visual.value !== objectFor(o[index])?.emoji ||
          objectFor(o[index])?.category !== expected,
      ))
  )
    fail("sorting stimulus differs from object");
  if (item.leftVisual) {
    if (item.rightVisual?.label !== expected)
      fail("pair right side does not express the relation");
    if (
      rule === "same-object" &&
      (!equal(item.leftVisual, item.rightVisual) ||
        item.leftVisual.value !== objectFor(o[0])?.emoji)
    )
      fail("visual pair is not identical");
    if (
      rule === "number-quantity" &&
      (Number(item.leftVisual.value) !== item.rightVisual.count ||
        item.rightVisual.count !== o[0])
    )
      fail("numeral and quantity differ");
    if (
      rule === "letter-picture" &&
      item.leftVisual.value !== soundFor(o[0])?.[0]
    )
      fail("letter and picture differ");
  }
  return errors;
}
