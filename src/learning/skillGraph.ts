import type { Age, EvidenceForm, GameId, SkillDefinition, SkillId } from '../types';

const allAges: Age[] = [3, 4, 5, 6];

export const skillGraph: readonly SkillDefinition[] = [
  { id: 'foundation.visual-discrimination', name: 'הבחנה חזותית', description: 'הבחנה בין סמלים, פרטים וצורות דומים.', targetAges: allAges, prerequisites: [], levels: ['שונה או זהה', 'פרטים קטנים', 'סמלים דומים'], evidenceForms: ['visual-choice', 'matching', 'memory'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 15, 4: 15, 5: 15, 6: 15 }, offScreenIdea: 'בחרו שני חפצים דומים וחפשו יחד מה שונה ביניהם.' },
  { id: 'foundation.auditory-discrimination', name: 'הבחנה שמיעתית', description: 'הקשבה להבדלים בין מילים וצלילים בעברית.', targetAges: allAges, prerequisites: [], levels: ['הקשבה למילה', 'צליל פותח', 'צליל סוגר'], evidenceForms: ['listening-choice'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 3: 10, 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'אמרו שתי מילים ושאלו אם הן מתחילות באותו צליל.', evidenceLimit: 'partial' },
  { id: 'hebrew.letter-recognition', name: 'זיהוי אותיות', description: 'זיהוי אותיות עבריות בצורות ובהקשרים שונים.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['אות בודדת', 'אות בין מסיחים', 'אות במילה'], evidenceForms: ['visual-choice', 'matching', 'adventure-drag'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 15, 4: 15, 5: 15, 6: 15 }, offScreenIdea: 'חפשו יחד אות מוכרת על אריזה או שלט.' },
  { id: 'hebrew.letter-sound', name: 'אות וצליל', description: 'חיבור בין אות לצליל שהיא מייצגת.', targetAges: [4, 5, 6], prerequisites: ['hebrew.letter-recognition', 'foundation.auditory-discrimination'], levels: ['אות וצליל', 'בחירה לפי צליל', 'העברה למילה'], evidenceForms: ['listening-choice', 'matching'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'בחרו אות ואמרו יחד מילים שמתחילות בצליל שלה.', evidenceLimit: 'partial' },
  { id: 'hebrew.sound-position', name: 'צליל פותח וסוגר', description: 'זיהוי הצליל בתחילת מילה ובהמשך גם בסופה.', targetAges: [4, 5, 6], prerequisites: ['hebrew.letter-sound'], levels: ['צליל פותח', 'השוואת צלילים', 'צליל סוגר'], evidenceForms: ['listening-choice'], masteryThreshold: 80, reinforcementAfterDays: 7, minimumContentByAge: { 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'בחרו חפץ בבית ואמרו יחד באיזה צליל שמו מתחיל.', evidenceLimit: 'partial' },
  { id: 'hebrew.first-words', name: 'מילים ראשונות', description: 'קישור בין אות, תמונה ומילה לקראת קריאה.', targetAges: [4, 5, 6], prerequisites: ['hebrew.letter-recognition'], levels: ['תמונה ומילה', 'אות ומילה', 'מילה מוכרת'], evidenceForms: ['matching', 'memory'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 4: 8, 5: 8, 6: 8 }, offScreenIdea: 'בחרו מילה מוכרת וחפשו יחד את האות הראשונה שלה.' },
  { id: 'math.numeral-recognition', name: 'זיהוי ספרות', description: 'זיהוי ספרות ושמות מספרים.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['1–3', '1–10', 'מעבר ל־10'], evidenceForms: ['visual-choice', 'matching', 'memory'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 12, 4: 12, 5: 12, 6: 12 }, offScreenIdea: 'חפשו מספר מוכר על שעון, דלת או אריזה.' },
  { id: 'math.quantity-sense', name: 'מנייה וכמויות', description: 'מנייה, התאמת כמות למספר והשוואת כמויות.', targetAges: allAges, prerequisites: ['math.numeral-recognition'], levels: ['מנייה', 'כמות ומספר', 'השוואת כמויות'], evidenceForms: ['visual-choice', 'matching', 'adventure-drag'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 3: 12, 4: 12, 5: 12, 6: 12 }, offScreenIdea: 'ספרו שתי קבוצות קטנות ושאלו באיזו יש יותר.', evidenceLimit: 'partial' },
  { id: 'concept.shape', name: 'צורות', description: 'זיהוי צורות ותכונותיהן.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['צורות בסיסיות', 'תכונות', 'צורה בתוך עצם'], evidenceForms: ['visual-choice', 'matching', 'adventure-drag'], masteryThreshold: 80, reinforcementAfterDays: 21, minimumContentByAge: { 3: 15, 4: 15, 5: 15, 6: 15 }, offScreenIdea: 'מצאו בבית עיגול, ריבוע ומשולש.' },
  { id: 'concept.color', name: 'צבעים', description: 'זיהוי, שיוך וקיבוץ צבעים.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['צבע בסיסי', 'צבע של עצם', 'קבוצות צבע'], evidenceForms: ['visual-choice', 'sorting', 'adventure-drag'], masteryThreshold: 80, reinforcementAfterDays: 21, minimumContentByAge: { 3: 15, 4: 15, 5: 15, 6: 15 }, offScreenIdea: 'בחרו צבע וחפשו שלושה חפצים בצבע הזה.' },
  { id: 'cognition.matching', name: 'התאמה', description: 'חיבור בין ייצוגים השייכים זה לזה.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['זהה לזהה', 'סמל ושם', 'קשרים שונים'], evidenceForms: ['matching'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 12, 4: 12, 5: 12, 6: 12 }, offScreenIdea: 'התאימו זוגות גרביים או מכסים לקופסאות.' },
  { id: 'cognition.memory', name: 'זיכרון', description: 'שמירת מידע חזותי ושליפתו.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['שני זוגות', 'כמה זוגות', 'סמלים ומילים'], evidenceForms: ['memory'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 3: 10, 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'הניחו שלושה חפצים, כסו אחד ונסו לזכור מה חסר.' },
  { id: 'cognition.sequence', name: 'רצפים', description: 'זיהוי חוקיות והשלמת רצף.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['AB', 'ABC', 'רצף מספרי'], evidenceForms: ['sequence'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 3: 10, 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'צרו רצף כפית–מזלג–כפית ובקשו להשלים.' },
  { id: 'cognition.sorting', name: 'מיון וסיווג', description: 'קיבוץ עצמים לפי תכונה או קטגוריה.', targetAges: allAges, prerequisites: ['foundation.visual-discrimination'], levels: ['תכונה אחת', 'קטגוריה', 'כלל משתנה'], evidenceForms: ['sorting'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 10, 4: 10, 5: 10, 6: 10 }, offScreenIdea: 'מיינו צעצועים לפי צבע, סוג או גודל.' },
  { id: 'motor.fine', name: 'מוטוריקה עדינה', description: 'דיוק במגע, גרירה והנחה.', targetAges: allAges, prerequisites: [], levels: ['נגיעה', 'גרירה', 'הנחה מדויקת'], evidenceForms: ['adventure-drag', 'adventure-navigation'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 3: 1, 4: 1, 5: 1, 6: 1 }, offScreenIdea: 'העבירו חפצים קטנים בין שתי קערות בעזרת כף.' },
  { id: 'cognition.problem-solving', name: 'פתרון בעיות', description: 'בחירת דרך פעולה, בדיקה ותיקון.', targetAges: [4, 5, 6], prerequisites: ['cognition.matching'], levels: ['בחירה', 'שני שלבים', 'שינוי אסטרטגיה'], evidenceForms: ['sequence', 'sorting', 'adventure-navigation', 'shared-cooperation'], masteryThreshold: 80, reinforcementAfterDays: 10, minimumContentByAge: { 4: 8, 5: 8, 6: 8 }, offScreenIdea: 'בנו מגדל מחפצים וחשבו מה יעזור לו לעמוד.' },
  { id: 'readiness.grade-one', name: 'מוכנות לכיתה א׳', description: 'שילוב שפה, מספרים, זיכרון ופתרון בעיות.', targetAges: [5, 6], prerequisites: ['hebrew.first-words', 'math.quantity-sense', 'cognition.problem-solving'], levels: ['הוראה קצרה', 'שני שלבים', 'עבודה עצמאית'], evidenceForms: ['matching', 'sequence', 'sorting', 'shared-cooperation'], masteryThreshold: 80, reinforcementAfterDays: 14, minimumContentByAge: { 5: 8, 6: 8 }, offScreenIdea: 'תכננו יחד משימה קצרה בשני שלבים ובצעו לפי הסדר.', evidenceLimit: 'partial' }
] as const;

const byId = new Map(skillGraph.map((skill) => [skill.id, skill]));

export function getSkillDefinition(id: SkillId): SkillDefinition {
  const skill = byId.get(id);
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill;
}

const legacySkillMap: Record<string, SkillId[]> = {
  'letter-recognition': ['hebrew.letter-recognition', 'foundation.visual-discrimination'],
  'initial-sound': ['hebrew.letter-sound', 'hebrew.sound-position', 'foundation.auditory-discrimination'],
  'number-recognition': ['math.numeral-recognition'],
  counting: ['math.quantity-sense'],
  'number-sequence': ['math.numeral-recognition', 'cognition.sequence'],
  'early-addition': ['math.quantity-sense', 'cognition.problem-solving'],
  'shape-recognition': ['concept.shape', 'foundation.visual-discrimination'],
  'shape-properties': ['concept.shape', 'cognition.problem-solving'],
  'color-recognition': ['concept.color', 'foundation.visual-discrimination'],
  'color-groups': ['concept.color', 'cognition.sorting'],
  'picture-word': ['cognition.matching', 'hebrew.first-words'],
  'number-word': ['cognition.matching', 'math.numeral-recognition'],
  'letter-word': ['cognition.matching', 'hebrew.first-words', 'hebrew.letter-recognition'],
  'shape-name': ['cognition.matching', 'concept.shape'],
  'visual-memory': ['cognition.memory', 'foundation.visual-discrimination'],
  'symbol-memory': ['cognition.memory'],
  'word-memory': ['cognition.memory', 'hebrew.first-words'],
  'ab-pattern': ['cognition.sequence'],
  'abc-pattern': ['cognition.sequence', 'cognition.problem-solving'],
  'number-pattern': ['cognition.sequence', 'math.numeral-recognition', 'cognition.problem-solving', 'readiness.grade-one'],
  categories: ['cognition.sorting', 'cognition.problem-solving', 'readiness.grade-one']
};

export function skillIdsForLegacySkill(skill: string): SkillId[] {
  return legacySkillMap[skill] ?? [];
}

export function evidenceFormForGame(gameId: GameId, skill: string): EvidenceForm {
  if (gameId === 'matching') return 'matching';
  if (gameId === 'memory') return 'memory';
  if (gameId === 'patterns') return 'sequence';
  if (gameId === 'sorting') return 'sorting';
  return skill === 'initial-sound' ? 'listening-choice' : 'visual-choice';
}

export function experienceSkillIds(gameId: Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>): SkillId[] {
  const domain: Record<typeof gameId, SkillId> = {
    letters: 'hebrew.letter-recognition', numbers: 'math.quantity-sense', shapes: 'concept.shape', colors: 'concept.color'
  };
  return [domain[gameId], 'motor.fine', 'cognition.problem-solving'];
}

export function validateSkillGraph(): string[] {
  const errors: string[] = [];
  const ids = new Set<SkillId>();
  for (const skill of skillGraph) {
    if (ids.has(skill.id)) errors.push(`duplicate skill id: ${skill.id}`);
    ids.add(skill.id);
  }
  const visiting = new Set<SkillId>();
  const visited = new Set<SkillId>();
  const visit = (id: SkillId) => {
    if (visiting.has(id)) { errors.push(`skill prerequisite cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of getSkillDefinition(id).prerequisites) {
      if (!ids.has(prerequisite)) errors.push(`${id}: missing prerequisite ${prerequisite}`);
      else visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  };
  skillGraph.forEach((skill) => visit(skill.id));
  return errors;
}
