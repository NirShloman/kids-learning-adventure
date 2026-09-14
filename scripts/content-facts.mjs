// Curated facts. These are product defaults, not a clinical assessment of children.
export const CONTENT_VERSION = "2026.09.detectives.1";
export const games = [
  "letters",
  "numbers",
  "shapes",
  "colors",
  "matching",
  "memory",
  "patterns",
  "sorting",
];
export const ages = [3, 4, 5, 6];
export const difficulties = ["easy", "medium", "hard"];
export function policy(age, difficulty) {
  return {
    max:
      age === 3
        ? 5
        : age === 4
          ? 10
          : age === 5
            ? difficulty === "hard"
              ? 15
              : 12
            : 20,
    choices: age <= 4 && difficulty === "easy" ? 2 : 3,
    sounds: age >= 4,
    addition: age >= 4 && difficulty !== "easy",
    properties: age >= 5 && difficulty !== "easy",
  };
}
export const alphabet = [..."אבגדהוזחטיכלמנסעפצקרשת"];
// Same initial syllable, explicitly authored; matching spelling alone is insufficient.
export const sounds = [
  ["ד", "דָ", ["דג", "🐟"], ["דלת", "🚪"]],
  ["ח", "חָ", ["חתול", "🐱"], ["חלון", "🪟"]],
  ["כ", "כַּ", ["כדור", "⚽"], ["כפית", "🥄"]],
  ["מ", "מַ", ["מתנה", "🎁"], ["מפתח", "🔑"]],
  ["ס", "סִ", ["סירה", "⛵"], ["סיפור", "📖"]],
  ["פ", "פַּ", ["פרפר", "🦋"], ["פרה", "🐄"]],
  ["צ", "צִ", ["ציפור", "🐦"], ["ציפורן", "💅"]],
  ["ק", "קוּ", ["קופסה", "📦"], ["קובייה", "🎲"]],
  ["ר", "רַ", ["רכבת", "🚂"], ["רדיו", "📻"]],
  ["ש", "שָׁ", ["שעון", "🕐"], ["שלום", "👋"]],
  ["ת", "תַּ", ["תפוח", "🍎"], ["תפוז", "🍊"]],
  ["ב", "בַּ", ["בננה", "🍌"], ["בלון", "🎈"]],
];
export const shapes = [
  { id: "circle", name: "עיגול", sides: 0 },
  { id: "square", name: "ריבוע", sides: 4 },
  { id: "triangle", name: "משולש", sides: 3 },
  { id: "rectangle", name: "מלבן", sides: 4 },
  { id: "diamond", name: "מעוין", sides: 4 },
  { id: "oval", name: "אליפסה", sides: 0 },
  { id: "pentagon", name: "מחומש", sides: 5 },
  { id: "hexagon", name: "משושה", sides: 6 },
];
export const colors = [
  ["red", "אדום", "#df3847"],
  ["blue", "כחול", "#2475db"],
  ["yellow", "צהוב", "#ffd338"],
  ["green", "ירוק", "#229653"],
  ["orange", "כתום", "#f07823"],
  ["purple", "סגול", "#884ec5"],
  ["pink", "ורוד", "#f28db5"],
  ["white", "לבן", "#ffffff"],
  ["black", "שחור", "#202735"],
  ["brown", "חום", "#895534"],
].map(([id, name, hex]) => ({ id, name, hex }));
// Avoid ambiguous symbols (toy train versus train, generic doors as wardrobes, etc.).
export const groups = {
  פירות: [
    ["תפוח", "🍎"],
    ["בננה", "🍌"],
    ["ענבים", "🍇"],
    ["תות", "🍓"],
    ["אבטיח", "🍉"],
    ["אגס", "🍐"],
    ["אפרסק", "🍑"],
    ["דובדבנים", "🍒"],
  ],
  ירקות: [
    ["גזר", "🥕"],
    ["מלפפון", "🥒"],
    ["ברוקולי", "🥦"],
    ["בצל", "🧅"],
    ["תפוח אדמה", "🥔"],
    ["חציל", "🍆"],
    ["חסה", "🥬"],
  ],
  חיות: [
    ["כלב", "🐶"],
    ["חתול", "🐱"],
    ["אריה", "🦁"],
    ["פיל", "🐘"],
    ["קוף", "🐒"],
    ["צב", "🐢"],
    ["ארנב", "🐰"],
    ["פרפר", "🦋"],
  ],
  "כלי תחבורה": [
    ["מכונית", "🚗"],
    ["אוטובוס", "🚌"],
    ["אופניים", "🚲"],
    ["מטוס", "✈️"],
    ["סירה", "⛵"],
    ["משאית", "🚚"],
    ["מסוק", "🚁"],
  ],
  בגדים: [
    ["חולצה", "👕"],
    ["מכנסיים", "👖"],
    ["שמלה", "👗"],
    ["גרב", "🧦"],
    ["מעיל", "🧥"],
    ["כפפה", "🧤"],
    ["צעיף", "🧣"],
  ],
  "כלי נגינה": [
    ["גיטרה", "🎸"],
    ["כינור", "🎻"],
    ["תוף", "🥁"],
    ["פסנתר", "🎹"],
    ["חצוצרה", "🎺"],
    ["סקסופון", "🎷"],
  ],
};
export const objects = Object.entries(groups).flatMap(([category, entries]) =>
  entries.map(([name, emoji]) => ({ name, emoji, category })),
);
export const tokens = objects.slice(0, 8);
export const atom = (kind, value, label = value, extra = {}) => ({
  kind,
  value: String(value),
  label: String(label),
  ...extra,
});
export const objectAtom = (object) => atom("emoji", object.emoji, object.name);
export const quantity = (count, token) =>
  atom("quantity", token.emoji, `${count} ${token.name}`, { count });
export const shapeAtom = (shape, rotation = 0) =>
  atom("shape", shape.id, shape.name, { rotation });
export const colorAtom = (color) => atom("color", color.hex, color.name);
