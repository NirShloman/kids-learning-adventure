import type {
  AdventureMission,
  Activity,
  Shape,
  PaintColor,
} from "../types/adventure.types";
import type { ExperienceGameId, SkillId, EvidenceForm } from "../types";

export const adventureWorlds = {
  letters: {
    title: "בית המלאכה לאותיות",
    subtitle: "כל אות פותחת סיפור",
    color: "#7853ae",
    image: "/assets/experience/v2/letters.webp",
  },
  numbers: {
    title: "המטבח של המפלצות",
    subtitle: "מבשלים, סופרים ומשמחים",
    color: "#9d5033",
    image: "/assets/experience/v2/numbers.webp",
  },
  shapes: {
    title: "סדנת הצעצועים",
    subtitle: "מחברים צורות, ממציאים פלאים",
    color: "#267c80",
    image: "/assets/experience/v2/shapes.webp",
  },
  colors: {
    title: "גן הצבעים החי",
    subtitle: "נגיעה קטנה, עולם של צבע",
    color: "#a84d79",
    image: "/assets/experience/v2/colors.webp",
  },
} as const;

function family(
  gameId: ExperienceGameId,
  activity: Activity,
  skillIds: SkillId[],
  evidenceForm: EvidenceForm,
  rows: Array<[string, string, string, string, string?]>,
): AdventureMission[] {
  return rows.map(([id, title, story, reward, letterSet], variant) => ({
    id: `v2-${id}`,
    gameId,
    activity,
    skillIds,
    evidenceForm,
    title,
    story,
    reward,
    variant,
    letterSet,
    instruction: instructions[activity],
  }));
}
const instructions: Record<Activity, string> = {
  "letter-build": "נחבר את החלקים ונגלה איזו אות נוצרה.",
  "letter-find": "נקשיב לשם האות ונמצא אותה בין החלקים.",
  "letter-sign": "נמצא את האות הראשונה ונשלים את השלט.",
  order: "נשים בצלחת בדיוק את הכמות שהמפלצת ביקשה.",
  share: "נכין לכל חבר צלחת לפי ההזמנה שלו.",
  complete: "כבר יש אוכל בצלחת. נוסיף רק את מה שחסר.",
  "shape-fit": "נבחר צורה ונחבר אותה למקום המתאים.",
  "shape-turn": "נסובב את החלק, ואז נחבר אותו למקום.",
  "shape-build": "נבנה צעצוע מצורות ונראה אותו מתעורר.",
  paint: "נבחר צבע ונצבע במשיכות אצבע.",
  mix: "נערבב שני צבעים ונגלה צבע חדש.",
  "color-apply": "נבחר את הצבע המבוקש ונחזיר חיים לגן.",
};
export const adventureMissions: AdventureMission[] = [
  ...family(
    "letters",
    "letter-build",
    ["hebrew.letter-recognition"],
    "adventure-drag",
    [
      [
        "letter-bridge",
        "גשר של אותיות",
        "ניר רוצה לעבור לנמל. כל אות שנבנה תוסיף קשת לגשר.",
        "גשר האותיות",
        "אבגדהו",
      ],
      [
        "letter-lantern",
        "פנסים לחצר",
        "שיר מכינה ערב סיפורים. נרכיב אותיות ונדליק את הפנסים.",
        "פנס סיפורים",
        "זחטיכל",
      ],
      [
        "letter-train",
        "רכבת הסיפורים",
        "בכל קרון מסתתר סיפור. נבנה את האות שפותחת אותו.",
        "רכבת אותיות",
        "מנסעפ",
      ],
      [
        "letter-kite",
        "עפיפון בשמיים",
        "הרוח מוכנה. נחבר אותיות ונעזור לעפיפון להמריא.",
        "עפיפון אותיות",
        "צקרשת",
      ],
    ],
  ),
  ...family(
    "letters",
    "letter-find",
    ["hebrew.letter-recognition"],
    "listening-choice",
    [
      [
        "letter-post",
        "הדואר הגיע",
        "המכתבים התערבבו. נזהה את האותיות ונחזיר אותם לתיבות.",
        "תיבת דואר",
        "אבגדהו",
      ],
      [
        "letter-stars",
        "כוכבים לספרייה",
        "כל ספר מחכה לכוכב עם האות שלו. נקשיב ונבחר.",
        "כוכב הספרייה",
        "זחטיכל",
      ],
      [
        "letter-garden",
        "ערוגת האותיות",
        "נמצא זרעים עם האות הנכונה ונצמיח גן קטן.",
        "ערוגת אותיות",
        "מנסעפ",
      ],
      [
        "letter-tickets",
        "כרטיס לתיאטרון",
        "הבובות מחכות לקהל. נמצא את הכרטיסים ונפתח את המסך.",
        "תיאטרון בובות",
        "צקרשת",
      ],
    ],
  ),
  ...family(
    "letters",
    "letter-sign",
    ["hebrew.letter-recognition"],
    "matching",
    [
      [
        "letter-animal",
        "שלט לחברים",
        "החיות בונות בתים. נעזור להן למצוא את האות הראשונה בשם שלהן.",
        "בית לחברים",
        "אבגדהו",
      ],
      [
        "letter-market",
        "החנות הקטנה",
        "החנות נפתחת. נוסיף לכל מדף את האות הראשונה של החפץ.",
        "חנות צעצועים",
        "זחטיכל",
      ],
      [
        "letter-harbor",
        "שלטים בנמל",
        "הסירות הגיעו עם מתנות. נשלים את האות הראשונה על השלט.",
        "סירת הפתעות",
        "מנסעפ",
      ],
      [
        "letter-museum",
        "המוזיאון שלנו",
        "שיר אוספת חפצים מעניינים. נשלים את השלטים בתערוכה.",
        "מוזיאון קטן",
        "צקרשת",
      ],
    ],
  ),
  ...family("numbers", "order", ["math.quantity-sense"], "adventure-drag", [
    [
      "number-breakfast",
      "ארוחת בוקר",
      "מימו התעורר רעב. נכין לו תפוחים לפי ההזמנה.",
      "סל הבוקר",
    ],
    [
      "number-picnic",
      "פיקניק לחבר",
      "לולי יוצאת לפיקניק. נמלא לה קופסה עם תותים.",
      "סל פיקניק",
    ],
    [
      "number-party",
      "מסיבת הטעימות",
      "טוטו הכין שולחן חגיגי. נספור עוגיות לצלחת שלו.",
      "עוגת מסיבה",
    ],
    [
      "number-soup",
      "מרק של ערב",
      "בחוץ קריר. נוסיף למרק גזרים לפי הבקשה.",
      "סיר מרק",
    ],
  ]),
  ...family("numbers", "share", ["math.quantity-sense"], "adventure-drag", [
    [
      "number-twins",
      "שני אורחים",
      "שני חברים הגיעו. נכין לכל אחד את ההזמנה שלו.",
      "שולחן זוגי",
    ],
    [
      "number-tea",
      "שעת התה",
      "הקומקום כבר שר. נחלק עוגיות לשתי צלחות.",
      "ערכת תה",
    ],
    [
      "number-baskets",
      "סלים לטיול",
      "נצייד שני חברים בסלים ונבדוק איפה יש יותר.",
      "עגלה לטיול",
    ],
    [
      "number-feast",
      "סעודת החברים",
      "כל החברים עוזרים. נכין מנות ונשווה בין הצלחות.",
      "שולחן חגיגי",
    ],
  ]),
  ...family("numbers", "complete", ["math.quantity-sense"], "adventure-drag", [
    [
      "number-missing",
      "עוד קצת תפוחים",
      "מימו התחיל להכין צלחת. נעזור לו להשלים את ההזמנה.",
      "מגש תפוחים",
    ],
    [
      "number-box",
      "קופסת ההפתעה",
      "חלק מהתותים כבר בקופסה. נוסיף את הכמות החסרה.",
      "קופסת תותים",
    ],
    [
      "number-cookies",
      "תבנית העוגיות",
      "העוגיות נאפות. נשלים את התבנית בלי להוסיף יותר מדי.",
      "תבנית עוגיות",
    ],
    [
      "number-carrots",
      "סיר כמעט מוכן",
      "נבדוק כמה גזרים כבר בסיר ונוסיף עד הכמות המבוקשת.",
      "סיר החברים",
    ],
  ]),
  ...family("shapes", "shape-fit", ["concept.shape"], "matching", [
    [
      "shape-house",
      "בית לבובה",
      "נבנה לבובה בית קטן עם חלון וגג.",
      "בית בובות",
    ],
    ["shape-boat", "סירה לאגם", "נחבר מפרש וגוף ונשיט את הסירה.", "סירת מפרש"],
    ["shape-rocket", "טיסה לירח", "נחבר חלקים לחללית ונמריא לכוכבים.", "חללית"],
    [
      "shape-flower",
      "פרח מכני",
      "נרכיב פרח עם עלים וניתן לו להסתובב.",
      "פרח מסתובב",
    ],
  ]),
  ...family("shapes", "shape-turn", ["concept.shape"], "adventure-drag", [
    [
      "shape-windmill",
      "טחנת הרוח",
      "הכנפיים הסתובבו. נכוון אותן ונפעיל את הטחנה.",
      "טחנת רוח",
    ],
    [
      "shape-bridge",
      "גשר למכונית",
      "נסובב את הקורות ונבנה מעבר למכונית.",
      "גשר צעצוע",
    ],
    [
      "shape-fish",
      "דג קטן",
      "נכוון את הסנפירים ונשלח את הדג לשחות.",
      "דג שוחה",
    ],
    [
      "shape-arrow",
      "שבשבת לגינה",
      "נכוון את החלקים ונגלה לאן הרוח נושבת.",
      "שבשבת",
    ],
  ]),
  ...family("shapes", "shape-build", ["concept.shape"], "adventure-drag", [
    [
      "shape-car",
      "המכונית הראשונה",
      "נחבר גלגלים וגוף ונצא לנסיעת מבחן.",
      "מכונית",
    ],
    [
      "shape-robot",
      "חבר רובוט",
      "נבנה גוף, ראש וידיים. הרובוט כבר רוצה לרקוד.",
      "רובוט רוקד",
    ],
    [
      "shape-train",
      "רכבת צבעונית",
      "נחבר קטר וקרונות ונפעיל את הרכבת.",
      "רכבת צעצוע",
    ],
    [
      "shape-castle",
      "טירה בעננים",
      "נבנה מגדלים ושער ונפתח את הטירה לחברים.",
      "טירת צעצוע",
    ],
  ]),
  ...family("colors", "paint", ["concept.color"], "adventure-drag", [
    [
      "color-petals",
      "הפרחים התעוררו",
      "הפרחים מחכים לצבע. נצבע ונראה אותם נפתחים.",
      "ערוגת פרחים",
    ],
    [
      "color-wings",
      "כנפיים לפרפר",
      "הפרפר רוצה לעוף. נצבע לו כנפיים חדשות.",
      "פרפר",
    ],
    [
      "color-pots",
      "עציצים לחממה",
      "נכין עציצים צבעוניים לשתילים הקטנים.",
      "חממה",
    ],
    [
      "color-balloons",
      "בלונים לחגיגה",
      "נצבע את הבלונים ונשחרר אותם לשמיים.",
      "זר בלונים",
    ],
  ]),
  ...family("colors", "mix", ["concept.color"], "adventure-drag", [
    [
      "color-orange",
      "שמש כתומה",
      "נכין צבע כתום מהצבעים שעל השולחן.",
      "שמש כתומה",
    ],
    ["color-green", "עלים ירוקים", "נכין ירוק ונחזיר עלים לענפים.", "עץ ירוק"],
    ["color-purple", "פרחי ערב", "נכין סגול לפרחים שנפתחים בערב.", "פרחי ערב"],
    [
      "color-rainbow",
      "מעבדת הגן",
      "נכין צבעים חדשים ונמלא את הגן בהפתעות.",
      "גן הקשת",
    ],
  ]),
  ...family("colors", "color-apply", ["concept.color"], "matching", [
    [
      "color-birds",
      "בתים לציפורים",
      "נצבע לכל ציפור את הבית שהיא מבקשת.",
      "בית ציפורים",
    ],
    [
      "color-snail",
      "שביל החלזונות",
      "החלזונות מחפשים צבע לקונכייה שלהם.",
      "משפחת חלזונות",
    ],
    [
      "color-lights",
      "אורות בגן",
      "נתאים צבע לפנסים ונאיר את שביל הגן.",
      "פנסי גינה",
    ],
    [
      "color-festival",
      "חגיגת הגן",
      "נבחר צבעים לפי בקשות החברים ונכין חגיגה.",
      "במת הגן",
    ],
  ]),
];
const shapeRecipes: Shape[][] = [
  ["square", "triangle", "circle"],
  ["oval", "triangle", "rectangle"],
  ["rectangle", "triangle", "circle"],
  ["circle", "oval", "star"],
  ["rectangle", "triangle", "rectangle"],
  ["rectangle", "triangle", "rectangle"],
  ["oval", "triangle", "triangle"],
  ["triangle", "rectangle", "triangle"],
  ["rectangle", "circle", "circle"],
  ["square", "rectangle", "circle"],
  ["rectangle", "square", "circle"],
  ["rectangle", "triangle", "square"],
];
const colorRecipes: PaintColor[][] = [
  ["red", "yellow", "pink"],
  ["purple", "blue", "orange"],
  ["blue", "green", "brown"],
  ["pink", "yellow", "red"],
  ["orange", "orange", "orange"],
  ["green", "green", "green"],
  ["purple", "purple", "purple"],
  ["orange", "green", "purple"],
  ["blue", "red", "yellow"],
  ["orange", "purple", "green"],
  ["yellow", "pink", "blue"],
  ["green", "brown", "purple"],
];
adventureMissions
  .filter((m) => m.gameId === "shapes")
  .forEach((m, i) => {
    m.shapes = shapeRecipes[i];
  });
adventureMissions
  .filter((m) => m.gameId === "colors")
  .forEach((m, i) => {
    m.colors = colorRecipes[i];
  });

export const alphabet = [
  ["א", "אָלֶף", "אריה"],
  ["ב", "בֵּית", "בית"],
  ["ג", "גִּימֶל", "גמל"],
  ["ד", "דָּלֶת", "דג"],
  ["ה", "הֵא", "הר"],
  ["ו", "וָו", "ורד"],
  ["ז", "זַיִן", "זברה"],
  ["ח", "חֵית", "חתול"],
  ["ט", "טֵית", "טלה"],
  ["י", "יוֹד", "יד"],
  ["כ", "כָּף", "כדור"],
  ["ל", "לָמֶד", "לימון"],
  ["מ", "מֵם", "מטרייה"],
  ["נ", "נוּן", "נר"],
  ["ס", "סָמֶךְ", "סוס"],
  ["ע", "עַיִן", "עץ"],
  ["פ", "פֵּא", "פרח"],
  ["צ", "צָדִי", "צב"],
  ["ק", "קוֹף", "קוף"],
  ["ר", "רֵישׁ", "רכבת"],
  ["ש", "שִׁין", "שמש"],
  ["ת", "תָּו", "תוף"],
] as const;
export const colorNames: Record<PaintColor, string> = {
  red: "אדום",
  blue: "כחול",
  yellow: "צהוב",
  green: "ירוק",
  orange: "כתום",
  purple: "סגול",
  pink: "ורוד",
  brown: "חום",
};
export const colorHex: Record<PaintColor, string> = {
  red: "#ed5564",
  blue: "#439ce0",
  yellow: "#f6cc43",
  green: "#61b878",
  orange: "#f39842",
  purple: "#a074cf",
  pink: "#ee8cbb",
  brown: "#9c6c49",
};
export const shapeNames: Record<Shape, string> = {
  circle: "עיגול",
  square: "ריבוע",
  triangle: "משולש",
  rectangle: "מלבן",
  oval: "אליפסה",
  star: "כוכב",
};
export const mixRecipes: Partial<Record<PaintColor, PaintColor[]>> = {
  orange: ["red", "yellow"],
  green: ["blue", "yellow"],
  purple: ["red", "blue"],
};
