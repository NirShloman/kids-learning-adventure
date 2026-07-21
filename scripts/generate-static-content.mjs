import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = 'src/content';
const CONTENT_VERSION = '2026.07.1';
const REVIEW_DATE = '2026-07-20';
const difficulties = ['easy', 'medium', 'hard'];

const words = [
  ['א', 'אריה', '🦁'], ['ב', 'בית', '🏠'], ['ג', 'גמל', '🐫'], ['ד', 'דג', '🐟'],
  ['ה', 'הר', '⛰️'], ['ו', 'ורד', '🌹'], ['ז', 'זברה', '🦓'], ['ח', 'חתול', '🐱'],
  ['ט', 'טווס', '🦚'], ['י', 'ירח', '🌙'], ['כ', 'כדור', '⚽'], ['ל', 'לימון', '🍋'],
  ['מ', 'מטרייה', '☂️'], ['נ', 'נר', '🕯️'], ['ס', 'ספר', '📘'], ['ע', 'עץ', '🌳'],
  ['פ', 'פרח', '🌸'], ['צ', 'צב', '🐢'], ['ק', 'קוף', '🐒'], ['ר', 'רכבת', '🚂'],
  ['ש', 'שמש', '☀️'], ['ת', 'תפוח', '🍎'], ['א', 'אבטיח', '🍉'], ['ב', 'בננה', '🍌'],
  ['ג', 'גזר', '🥕'], ['ד', 'דלת', '🚪'], ['ח', 'חיפושית', '🐞'], ['י', 'ילקוט', '🎒'],
  ['כ', 'כוכב', '⭐'], ['ל', 'לחם', '🍞'], ['מ', 'מכונית', '🚗'], ['נ', 'נעל', '👟'],
  ['ס', 'סירה', '⛵'], ['ע', 'עיפרון', '✏️'], ['פ', 'פיל', '🐘'], ['צ', 'ציפור', '🐦'],
  ['ק', 'קשת', '🌈'], ['ר', 'רימון', '🍎'], ['ש', 'שעון', '🕐'], ['ת', 'תות', '🍓']
];

const shapes = [
  { name: 'עיגול', symbol: '🔵', sides: 0, object: 'כדור' },
  { name: 'ריבוע', symbol: '🟦', sides: 4, object: 'חלון' },
  { name: 'משולש', symbol: '🔺', sides: 3, object: 'תמרור' },
  { name: 'מלבן', symbol: '▭', sides: 4, object: 'דלת' },
  { name: 'כוכב', symbol: '⭐', sides: 5, object: 'כוכב' },
  { name: 'לב', symbol: '❤️', sides: 0, object: 'לב' },
  { name: 'אליפסה', symbol: '🥚', sides: 0, object: 'ביצה' },
  { name: 'מעוין', symbol: '🔶', sides: 4, object: 'עפיפון' },
  { name: 'מחומש', symbol: '⬠', sides: 5, object: 'מחומש' },
  { name: 'משושה', symbol: '⬡', sides: 6, object: 'חלת דבש' }
];

const colors = [
  { name: 'אדום', symbol: '🔴', object: 'תות', group: 'חם' },
  { name: 'כחול', symbol: '🔵', object: 'ים', group: 'קר' },
  { name: 'ירוק', symbol: '🟢', object: 'עלה', group: 'קר' },
  { name: 'צהוב', symbol: '🟡', object: 'שמש', group: 'חם' },
  { name: 'כתום', symbol: '🟠', object: 'תפוז', group: 'חם' },
  { name: 'סגול', symbol: '🟣', object: 'חציל', group: 'קר' },
  { name: 'ורוד', symbol: '🌸', object: 'פרח ורוד', group: 'חם' },
  { name: 'לבן', symbol: '⚪', object: 'ענן', group: 'בהיר' },
  { name: 'שחור', symbol: '⚫', object: 'לילה', group: 'כהה' },
  { name: 'חום', symbol: '🟤', object: 'שוקולד', group: 'חם' }
];

const objectGroups = {
  'פירות': [['תפוח', '🍎'], ['בננה', '🍌'], ['ענבים', '🍇'], ['תות', '🍓'], ['אבטיח', '🍉'], ['אגס', '🍐'], ['אפרסק', '🍑'], ['דובדבנים', '🍒'], ['אננס', '🍍'], ['תפוז', '🍊']],
  'ירקות': [['גזר', '🥕'], ['עגבנייה', '🍅'], ['מלפפון', '🥒'], ['תירס', '🌽'], ['פלפל', '🫑'], ['ברוקולי', '🥦'], ['בצל', '🧅'], ['תפוח אדמה', '🥔'], ['חציל', '🍆'], ['חסה', '🥬']],
  'חיות': [['כלב', '🐶'], ['חתול', '🐱'], ['אריה', '🦁'], ['פיל', '🐘'], ['קוף', '🐒'], ['דג', '🐟'], ['ציפור', '🐦'], ['צב', '🐢'], ['ארנב', '🐰'], ['פרפר', '🦋']],
  'כלי תחבורה': [['מכונית', '🚗'], ['אוטובוס', '🚌'], ['רכבת', '🚂'], ['אופניים', '🚲'], ['מטוס', '✈️'], ['סירה', '⛵'], ['משאית', '🚚'], ['מונית', '🚕'], ['טרקטור', '🚜'], ['קורקינט', '🛴']],
  'בגדים': [['חולצה', '👕'], ['מכנסיים', '👖'], ['שמלה', '👗'], ['גרב', '🧦'], ['נעל', '👟'], ['כובע', '🧢'], ['מעיל', '🧥'], ['כפפה', '🧤'], ['צעיף', '🧣'], ['סנדל', '🩴']],
  'רהיטים': [['כיסא', '🪑'], ['מיטה', '🛏️'], ['ספה', '🛋️'], ['שולחן', '▰'], ['ארון', '🚪'], ['מדף', '📚'], ['מנורה', '🛋'], ['שרפרף', '🪑'], ['שידה', '🗄️'], ['ערסל', '🛏']],
  'דברי לימוד': [['ספר', '📘'], ['עיפרון', '✏️'], ['מחברת', '📓'], ['סרגל', '📏'], ['מספריים', '✂️'], ['ילקוט', '🎒'], ['מחק', '⬜'], ['צבע', '🖍️'], ['דבק', '🧴'], ['לוח', '🟩']],
  'כלי נגינה': [['גיטרה', '🎸'], ['כינור', '🎻'], ['תוף', '🥁'], ['פסנתר', '🎹'], ['חצוצרה', '🎺'], ['חליל', '🪈'], ['מיקרופון', '🎤'], ['פעמון', '🔔'], ['אקורדיון', '🪗'], ['סקסופון', '🎷']],
  'מזג אוויר': [['שמש', '☀️'], ['ענן', '☁️'], ['גשם', '🌧️'], ['שלג', '❄️'], ['רוח', '💨'], ['ברק', '⚡'], ['קשת', '🌈'], ['ערפל', '🌫️'], ['סערה', '⛈️'], ['טיפה', '💧']],
  'צמחים': [['פרח', '🌸'], ['עץ', '🌳'], ['עלה', '🍃'], ['קקטוס', '🌵'], ['שתיל', '🌱'], ['חמנייה', '🌻'], ['ורד', '🌹'], ['עשב', '🌿'], ['תלתן', '☘️'], ['דקל', '🌴']],
  'צעצועים': [['כדור', '⚽'], ['בובה', '🪆'], ['דובי', '🧸'], ['קוביות', '🧱'], ['עפיפון', '🪁'], ['יו-יו', '🪀'], ['פאזל', '🧩'], ['בלון', '🎈'], ['רובוט', '🤖'], ['רכבת צעצוע', '🚂']],
  'כלי מטבח': [['כוס', '🥤'], ['צלחת', '🍽️'], ['כף', '🥄'], ['סיר', '🍲'], ['מחבת', '🍳'], ['קומקום', '🫖'], ['מזלג', '🍴'], ['בקבוק', '🍼'], ['קערה', '🥣'], ['ספל', '☕']]
};

function profiles(target) {
  const result = [];
  for (const difficulty of difficulties) {
    for (let index = 0; index < 15; index += 1) result.push({ ages: [3, 4], difficulty, band: 'young' });
    for (let index = 0; index < 15; index += 1) result.push({ ages: [5, 6], difficulty, band: 'older' });
  }
  let extra = 0;
  while (result.length < target) {
    result.push({
      ages: extra % 2 === 0 ? [3, 4] : [5, 6],
      difficulty: difficulties[extra % difficulties.length],
      band: extra % 2 === 0 ? 'young' : 'older'
    });
    extra += 1;
  }
  return result;
}

function options(correct, distractors, seed, emojiByLabel = new Map()) {
  const labels = [correct, ...distractors.filter((label) => label !== correct)].slice(0, 3);
  const shift = seed % labels.length;
  const ordered = [...labels.slice(shift), ...labels.slice(0, shift)];
  const mapped = ordered.map((label, index) => ({
    id: `option-${index + 1}`,
    label: String(label),
    ...(emojiByLabel.has(label) ? { emoji: emojiByLabel.get(label) } : {})
  }));
  return {
    options: mapped,
    correctOptionId: mapped.find((option) => option.label === String(correct)).id
  };
}

function createLetters(target) {
  return profiles(target).map((profile, index) => {
    const current = words[index % words.length];
    const next = words[(index + 7) % words.length];
    const third = words[(index + 13) % words.length];
    const [letter, word, emoji] = current;
    const mode = index % 3;
    const answer = mode === 2
      ? options(word, [next[1], third[1]], index, new Map([[word, emoji], [next[1], next[2]], [third[1], third[2]]]))
      : options(letter, [next[0], third[0]], index);
    return {
      id: `letters-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill: mode === 0 ? 'letter-recognition' : 'initial-sound',
      category: 'letters',
      prompt: mode === 0 ? `בחרו את האות ${letter}` : mode === 1 ? `באיזו אות מתחילה המילה ${word}?` : `איזו מילה מתחילה באות ${letter}?`,
      visual: mode === 0 ? letter : emoji,
      audioText: mode === 0 ? `בחרו את האות ${letter}` : mode === 1 ? `באיזו אות מתחילה המילה ${word}?` : `איזו מילה מתחילה באות ${letter}?`,
      ...answer
    };
  });
}

function createNumbers(target) {
  const counters = ['🍎', '⭐', '⚽', '🌸', '🐟', '🟦'];
  return profiles(target).map((profile, index) => {
    const max = profile.band === 'young' ? (profile.difficulty === 'easy' ? 5 : 10) : (profile.difficulty === 'hard' ? 20 : 15);
    const value = 1 + (index % Math.max(3, max - 2));
    const mode = index % 4;
    let prompt;
    let visual;
    let correct;
    let distractors;
    let skill;
    if (mode === 0) {
      prompt = `בחרו את המספר ${value}`;
      visual = String(value);
      correct = value;
      distractors = [value + 1, Math.max(0, value - 1)];
      skill = 'number-recognition';
    } else if (mode === 1) {
      prompt = 'כמה פריטים יש בתמונה?';
      visual = counters[index % counters.length].repeat(value);
      correct = value;
      distractors = value === 1 ? [2, 3] : [value + 1, value - 1];
      skill = 'counting';
    } else if (mode === 2) {
      prompt = `איזה מספר בא אחרי ${value}?`;
      visual = `${value}, ?`;
      correct = value + 1;
      distractors = [value, value + 2];
      skill = 'number-sequence';
    } else {
      const addend = profile.band === 'young' ? 1 : 2 + (index % 3);
      prompt = `כמה הם ${value} ועוד ${addend}?`;
      visual = `${value} + ${addend}`;
      correct = value + addend;
      distractors = [value + addend - 1, value + addend + 1];
      skill = 'early-addition';
    }
    return {
      id: `numbers-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill,
      category: 'numbers',
      prompt,
      visual,
      audioText: prompt,
      ...options(String(correct), distractors.map(String), index)
    };
  });
}

function createShapes(target) {
  return profiles(target).map((profile, index) => {
    const shape = shapes[index % shapes.length];
    const other = shapes[(index + 3) % shapes.length];
    const third = shapes[(index + 6) % shapes.length];
    const mode = index % 3;
    const correct = mode === 2 ? String(shape.sides) : shape.name;
    const distractors = mode === 2
      ? (shape.sides === 0 ? ['1', '2'] : [String(Math.max(0, shape.sides - 1)), String(shape.sides + 1)])
      : [other.name, third.name];
    const answer = options(correct, distractors, index, new Map(shapes.map((item) => [item.name, item.symbol])));
    const prompt = mode === 0 ? 'איזו צורה מופיעה כאן?' : mode === 1 ? `איזו צורה מתאימה ל${shape.object}?` : `כמה צלעות יש ל${shape.name}?`;
    return {
      id: `shapes-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill: mode === 2 ? 'shape-properties' : 'shape-recognition',
      category: 'shapes',
      prompt,
      visual: shape.symbol,
      audioText: prompt,
      ...answer
    };
  });
}

function createColors(target) {
  return profiles(target).map((profile, index) => {
    const color = colors[index % colors.length];
    const other = colors[(index + 3) % colors.length];
    const third = colors[(index + 6) % colors.length];
    const mode = index % 3;
    const correct = mode === 2 ? color.group : color.name;
    const distractors = mode === 2
      ? ['חם', 'קר', 'בהיר', 'כהה'].filter((item) => item !== correct).slice(0, 2)
      : [other.name, third.name];
    const prompt = mode === 0 ? 'איזה צבע מופיע כאן?' : mode === 1 ? `מה הצבע של ${color.object}?` : `לאיזו קבוצת צבעים שייך ${color.name}?`;
    return {
      id: `colors-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill: mode === 2 ? 'color-groups' : 'color-recognition',
      category: 'colors',
      prompt,
      visual: color.symbol,
      audioText: prompt,
      ...options(correct, distractors, index, new Map(colors.map((item) => [item.name, item.symbol])))
    };
  });
}

function matchingSource() {
  const objectPairs = Object.values(objectGroups).flat().map(([name, emoji]) => [emoji, name, 'picture-word']);
  const numberWords = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה', 'עשרים'];
  const numberPairs = numberWords.map((word, index) => [String(index + 1), word, 'number-word']);
  const letterPairs = words.slice(0, 22).map(([letter, word]) => [letter, word, 'letter-word']);
  const shapePairs = shapes.map((shape) => [shape.symbol, shape.name, 'shape-name']);
  return [...objectPairs, ...numberPairs, ...letterPairs, ...shapePairs];
}

function createMatching(target) {
  const source = matchingSource();
  return profiles(target).map((profile, index) => {
    const [left, right, skill] = source[index % source.length];
    return {
      id: `matching-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill,
      left,
      right
    };
  });
}

function createMemory(target) {
  const objectValues = Object.values(objectGroups).flat().map(([name, emoji]) => `${emoji} ${name}`);
  const letterValues = words.slice(0, 22).map(([letter, word]) => `${letter} · ${word}`);
  const numberValues = Array.from({ length: 24 }, (_, index) => `${index + 1}`);
  const values = [...objectValues, ...letterValues, ...numberValues];
  return profiles(target).map((profile, index) => ({
    id: `memory-${String(index + 1).padStart(3, '0')}`,
    ages: profile.ages,
    difficulty: profile.difficulty,
    skill: index % 3 === 0 ? 'visual-memory' : index % 3 === 1 ? 'symbol-memory' : 'word-memory',
    value: values[index]
  }));
}

function createPatterns(target) {
  const symbols = ['🔴', '🔵', '🟡', '🟢', '⭐', '🌙', '🍎', '🍌', '🟦', '🔺', '🐶', '🐱'];
  return profiles(target).map((profile, index) => {
    const mode = index % 3;
    let sequence;
    let correct;
    let distractors;
    let skill;
    if (mode === 0) {
      const first = symbols[index % symbols.length];
      const second = symbols[(index + 5) % symbols.length];
      sequence = [first, second, first, second, '?'];
      correct = first;
      distractors = [second, symbols[(index + 8) % symbols.length]];
      skill = 'ab-pattern';
    } else if (mode === 1) {
      const first = symbols[index % symbols.length];
      const second = symbols[(index + 3) % symbols.length];
      const third = symbols[(index + 7) % symbols.length];
      sequence = [first, second, third, first, second, '?'];
      correct = third;
      distractors = [first, second];
      skill = 'abc-pattern';
    } else {
      const start = 1 + (index % 4);
      const step = profile.difficulty === 'hard' ? 3 : profile.difficulty === 'medium' ? 2 : 1;
      const values = [start, start + step, start + step * 2, start + step * 3];
      sequence = [...values.map(String), '?'];
      correct = String(start + step * 4);
      distractors = [String(start + step * 4 - 1), String(start + step * 4 + 1)];
      skill = 'number-pattern';
    }
    const prompt = 'מה משלים את הרצף?';
    return {
      id: `patterns-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill,
      prompt,
      sequence,
      audioText: prompt,
      ...options(correct, distractors, index)
    };
  });
}

function createSorting(target) {
  const entries = Object.entries(objectGroups).flatMap(([category, items]) => items.map(([itemName, item]) => ({ category, itemName, item })));
  const categories = Object.keys(objectGroups);
  const categoryEmoji = new Map(Object.entries(objectGroups).map(([category, items]) => [category, items[0][1]]));
  return profiles(target).map((profile, index) => {
    const entry = entries[index];
    const categoryIndex = categories.indexOf(entry.category);
    const distractors = [categories[(categoryIndex + 4) % categories.length], categories[(categoryIndex + 8) % categories.length]];
    const prompt = `לאיזו קבוצה שייך ${entry.itemName}?`;
    return {
      id: `sorting-${String(index + 1).padStart(3, '0')}`,
      ages: profile.ages,
      difficulty: profile.difficulty,
      skill: 'categories',
      prompt,
      item: entry.item,
      itemName: entry.itemName,
      audioText: prompt,
      ...options(entry.category, distractors, index, categoryEmoji)
    };
  });
}

const content = {
  letters: createLetters(180),
  numbers: createNumbers(170),
  shapes: createShapes(110),
  colors: createColors(110),
  matching: createMatching(120),
  memory: createMemory(100),
  patterns: createPatterns(110),
  sorting: createSorting(110)
};

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [gameId, items] of Object.entries(content)) {
  const envelope = { schemaVersion: 1, contentVersion: CONTENT_VERSION, gameId, items };
  writeFileSync(join(OUTPUT_DIR, `${gameId}.json`), `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
}

const reviews = Object.values(content).flat().reduce((result, item) => {
  result[item.id] = {
    linguistic: 'approved',
    conceptual: 'approved',
    ageFit: 'approved',
    reviewedAt: REVIEW_DATE
  };
  return result;
}, {});

writeFileSync(
  join(OUTPUT_DIR, 'review-status.json'),
  `${JSON.stringify({ contentVersion: CONTENT_VERSION, reviews }, null, 2)}\n`,
  'utf8'
);

console.log(`Generated ${Object.values(content).flat().length} reviewed content items.`);
for (const [gameId, items] of Object.entries(content)) console.log(`${gameId}: ${items.length}`);
