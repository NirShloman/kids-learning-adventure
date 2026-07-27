import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const contentDirectory = join(root, 'src', 'content');
const outputDirectory = join(root, 'docs', 'recording-assets');

const fixedLines = [
  ['ui-welcome-start', 'פתיחה', 'מתחילים לשחק וללמוד בכיף.', 'חובה'],
  ['entry-letters', 'כניסה למשחק', 'עכשיו משחקים באותיות.', 'חובה'],
  ['entry-numbers', 'כניסה למשחק', 'עכשיו משחקים במספרים.', 'חובה'],
  ['entry-shapes', 'כניסה למשחק', 'עכשיו משחקים בצורות.', 'חובה'],
  ['entry-colors', 'כניסה למשחק', 'עכשיו משחקים בצבעים.', 'חובה'],
  ['entry-matching', 'כניסה למשחק', 'עכשיו משחקים בהתאמה.', 'חובה'],
  ['entry-memory', 'כניסה למשחק', 'עכשיו משחקים בזיכרון.', 'חובה'],
  ['entry-patterns', 'כניסה למשחק', 'עכשיו משחקים ברצפים.', 'חובה'],
  ['entry-sorting', 'כניסה למשחק', 'עכשיו משחקים במיון ובסיווג.', 'חובה'],
  ['intro-letters', 'הוראת פתיחה: אותיות', 'ברוכים הבאים למשחק אותיות. הקשיבו לשאלה, הסתכלו על התמונה או המילה, ובחרו את התשובה המתאימה.', 'חובה'],
  ['intro-numbers', 'הוראת פתיחה: מספרים', 'ברוכים הבאים למשחק מספרים. ספרו לאט, הסתכלו על הפריטים, ובחרו את המספר הנכון.', 'חובה'],
  ['intro-shapes', 'הוראת פתיחה: צורות', 'ברוכים הבאים למשחק צורות. בדקו איזו צורה מופיעה, כמה צלעות יש לה, ובחרו תשובה.', 'חובה'],
  ['intro-colors', 'הוראת פתיחה: צבעים', 'ברוכים הבאים למשחק צבעים. הסתכלו על הפריט או על העיגול הצבעוני ובחרו את הצבע המתאים.', 'חובה'],
  ['intro-matching', 'הוראת פתיחה: התאמה', 'ברוכים הבאים למשחק התאמה. בחרו פריט בצד אחד ואז את בן הזוג המתאים בצד השני.', 'חובה'],
  ['intro-memory', 'הוראת פתיחה: זיכרון', 'ברוכים הבאים למשחק הזיכרון. הפכו שני קלפים בכל תור, נסו לזכור מה ראיתם, ומצאו זוגות.', 'חובה'],
  ['intro-patterns', 'הוראת פתיחה: רצפים', 'ברוכים הבאים למשחק רצפים. הסתכלו על הסדרה, חשבו מה בא אחר כך, ובחרו את ההמשך הנכון.', 'חובה'],
  ['intro-sorting', 'הוראת פתיחה: מיון וסיווג', 'ברוכים הבאים למשחק מיון וסיווג. הסתכלו על הפריט, חשבו לאיזו קבוצה הוא שייך, ובחרו את הסל המתאים.', 'חובה'],
  ['feedback-correct-01', 'משוב חיובי', 'כל הכבוד!', 'חובה'],
  ['feedback-correct-02', 'משוב חיובי', 'מצוין!', 'חובה'],
  ['feedback-correct-03', 'משוב חיובי', 'אלוף או אלופה!', 'חובה'],
  ['feedback-correct-04', 'משוב חיובי', 'מעולה!', 'חובה'],
  ['feedback-correct-05', 'משוב חיובי', 'נהדר!', 'חובה'],
  ['feedback-retry-01', 'ניסיון נוסף', 'כמעט!', 'חובה'],
  ['feedback-retry-02', 'ניסיון נוסף', 'נסו שוב.', 'חובה'],
  ['feedback-retry-03', 'ניסיון נוסף', 'עוד רגע מצליחים!', 'חובה'],
  ['feedback-retry-04', 'ניסיון נוסף', 'בואו ננסה שוב!', 'חובה'],
  ['matching-correct', 'התאמה', 'כל הכבוד, מצאתם התאמה!', 'חובה'],
  ['matching-retry', 'התאמה', 'כמעט, נסו שוב.', 'חובה'],
  ['memory-correct', 'זיכרון', 'מצוין, מצאתם זוג!', 'חובה'],
  ['memory-retry', 'זיכרון', 'לא זוג, נסו לזכור איפה הקלפים היו.', 'חובה'],
  ['summary-stars-3', 'סיום משחק', 'ביצוע מצוין! שמרתם על דיוק נהדר.', 'מומלץ'],
  ['summary-stars-2', 'סיום משחק', 'עבודה יפה מאוד. עוד קצת תרגול ותקבלו שלושה כוכבים.', 'מומלץ'],
  ['summary-stars-1', 'סיום משחק', 'כל הכבוד שסיימתם. ממשיכים להתאמן בקצב רגוע.', 'מומלץ'],
  ['summary-stars-0', 'סיום משחק', 'סיימתם את הפעילות. ננסה שוב ונצבור ביטחון.', 'מומלץ']
];

function cleanSpokenValue(value) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const rows = [...fixedLines];
const seen = new Set(rows.map(([, , text]) => text));

for (const fileName of readdirSync(contentDirectory).filter((name) => name.endsWith('.json') && !['content-envelope.schema.json', 'review-status.json'].includes(name))) {
  const bank = JSON.parse(readFileSync(join(contentDirectory, fileName), 'utf8'));
  for (const item of bank.items ?? []) {
    const text = cleanSpokenValue(item.audioText ?? item.right ?? item.value ?? '');
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const category = item.audioText ? `שאלה: ${bank.gameId}` : bank.gameId === 'matching' ? 'מילת התאמה' : 'קלף זיכרון';
    rows.push([`content-${item.id}`, category, text, 'חובה']);
  }
}

mkdirSync(outputDirectory, { recursive: true });
const csv = [
  ['id', 'category', 'text_he', 'priority'],
  ...rows
].map((row) => row.map(csvCell).join(',')).join('\n');
writeFileSync(join(outputDirectory, 'recording-list.csv'), `${csv}\n`, 'utf8');

const focusRows = rows.filter(([, category]) => ['כניסה למשחק', 'משוב חיובי', 'ניסיון נוסף', 'התאמה', 'זיכרון'].includes(category));
const focusCsv = [
  ['id', 'category', 'text_he', 'priority'],
  ...focusRows
].map((row) => row.map(csvCell).join(',')).join('\n');
writeFileSync(join(outputDirectory, 'priority-feedback-and-game-entry.csv'), `${focusCsv}\n`, 'utf8');

const summary = [
  '# רשימת הקלטות לאפליקציה',
  '',
  `נוצרו ${rows.length} שורות ייחודיות.`,
  '',
  'הקובץ `recording-list.csv` הוא המקור המלא להקלטה. הקליטו כל שורה בקובץ נפרד בשם ה־id שלה.',
  '',
  'להתחלה מהירה, הקובץ `priority-feedback-and-game-entry.csv` כולל רק ברכות, ניסיון נוסף ושמות משחקים בכניסה.',
  '',
  '## כללי הקלטה',
  '',
  '- עברית תקנית בלבד, בקול נשי צעיר, חם וברור.',
  '- קצב רגוע לילדים בגילי 3–6; משפט משוב קצר ושמח, ללא צעקה.',
  '- WAV מונו, 48kHz, 16-bit; להשאיר כ־250ms שקט בתחילת ובסוף הקובץ.',
  '- לא לומר אימוג׳ים או מזהי קבצים.',
  '- השם האישי של הילד/ה אינו מוקלט ואינו נאמר בקול.',
  '',
  '## הקלטות דינמיות',
  '',
  'סיכום הניקוד כולל מספרים ותוצאות משתנות ולכן נשאר כרגע בהקראת המכשיר. גם לחצני hover/מיקוד הם משניים ואינם נכללים ברשימת החובה.'
].join('\n');
writeFileSync(join(outputDirectory, 'README.md'), `${summary}\n`, 'utf8');
console.log(`Wrote ${rows.length} recording lines to docs/recording-assets/recording-list.csv`);
