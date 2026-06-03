# לומדים בכיף - Kids Learning Adventure Web

גרסת Web/PWA של אפליקציית משחקי למידה בעברית לילדים בגילאי 3 עד 6.

## גרסה נוכחית

**1.2.0 - Web PWA Premium Learning**

הגרסה הזו כוללת שדרוג עומק ללובי, להקראה הקולית, לגרפיקה, למאגר השאלות ולמגוון המשחקים.

## מה שודרג בגרסה 1.2.0

- הקראה קולית רחבה יותר בכל האפליקציה:
  - הקראת שם ותיאור משחק בעת מעבר עכבר או פוקוס מקלדת.
  - הקראת הוראות בכניסה לכל משחק.
  - הקראת אפשרויות תשובה, פריטי התאמה, קלפי זיכרון, רצפים וסלי מיון.
  - מנגנון מניעת הקראה כפולה מהירה כדי לא להציף את הילד.
- לובי משודרג:
  - מסך פתיחה יותר ברור, מזמין ופרודוקטיבי.
  - תצוגת משחקים מקדימה.
  - בחירת גיל, רמת קושי וקול הדרכה לפני כניסה לתפריט.
- גרפיקה ואנימציות:
  - שדרוג אנימציות CSS בכל מסכי הליבה.
  - קלפי משחק עשירים יותר, Mascot בלובי, תנועות עדינות, Glow, Sparkles ותגובות Hover/Focus.
  - תמיכה ב-prefers-reduced-motion לנגישות.
- מאגר שאלות מורחב:
  - אותיות, מספרים, צורות וצבעים הורחבו משמעותית.
  - שאלות מחולקות לפי גיל ורמת קושי.
  - הטקסטים בעברית ומותאמים לילדים בגילאי 3–6.
- סוכן התאמת תוכן בסגנון קלינאית תקשורת:
  - נוסף שירות `speechTherapistAgent.ts` שבודק שאלות לפי אורך, בהירות, התאמה לגיל, כפילויות ותשובה נכונה קיימת.
  - `questionService.ts` משתמש בשכבת אישור כדי להחזיר שאלות תקינות בלבד.
- משחקים חדשים:
  - `רצפים` - השלמת תבניות של צבעים, צורות ומספרים.
  - `מיון וסיווג` - שיוך פריטים לקבוצות כמו חיות, פירות, כלי תחבורה, בגדים ועוד.
- שדרוגי אבטחה ואיכות:
  - אין קריאות OpenAI/GPT ישירות מה-Frontend כדי לא לחשוף API Key בדפדפן.
  - טקסטים שמוקראים עוברים ניקוי בסיסי לפני SpeechSynthesis.
  - שמירה על TypeScript strict וקומפוננטות קטנות יחסית.
  - עדכון גרסה ב-`package.json` וב-`src/services/versionService.ts`.

## הערה חשובה לגבי GPT Image

לא הוכנסה קריאת API ישירה למודל תמונות מתוך צד לקוח, כי זה יחשוף מפתח API בדפדפן. במקום זאת נוספו גרפיקה, SVG/CSS ואנימציות סטטיות בתוך הפרויקט. אם בעתיד רוצים יצירת נכסים אוטומטית בעזרת GPT Image, נכון לעשות זאת דרך Backend מאובטח שמחזיר קבצי תמונה מוכנים ל-Frontend.

## דרישות

- Node.js 20 ומעלה
- npm

## התקנה והרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה תרוץ בכתובת:

```bash
http://localhost:5173
```

## Build לפרודקשן

```bash
npm run build
```

הפלט ייווצר בתיקייה:

```bash
dist/
```

## בדיקת build מקומית

```bash
npm run preview
```

## Firebase ותוכן מנוהל

הגדרות Firebase מגיעות מקובצי env מקומיים לפי `.env.example`. אין לשמור secrets או service account בתוך הקוד.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Firestore rules הקנוניים נמצאים ב-`firebase/firestore.rules`, ו-`firebase.json` מצביע אליהם.

## בדיקות תוכן

```bash
npm run validate:content
npm run review:content
npm run check:duplicates
```

ה-seed הראשוני נמצא ב-`shared-content/seed/questions.seed.json` וכולל 120 שאלות במבנה `GameQuestion`.

## ייבוא וייצוא שאלות

ייבוא/ייצוא מתבצעים ממחשב פיתוח מהימן עם Admin SDK:

```bash
npm run firebase:import
npm run firebase:export
```

יש להגדיר `FIREBASE_PROJECT_ID` וגם `GOOGLE_APPLICATION_CREDENTIALS` או `FIREBASE_SERVICE_ACCOUNT_PATH`.

## Admin לאישור שאלות

אחרי פתיחת אזור ההורים מופיע כפתור `ניהול תוכן`. שם אפשר להוסיף שאלה, להריץ בדיקת כפילות ו-Agent, לצפות בדוח איכות, לאשר/לדחות/לבקש תיקון, לבצע Preview, לייבא seed ולייצא JSON לגיבוי.

שאלות משתמש נשמרות תמיד במסלול `pendingQuestionSubmissions` ולא נכנסות ישירות למאגר המאושר.

## בדיקות E2E עם Playwright

התוסף של Playwright ב-VS Code קורא את `playwright.config.ts`, ולכן כל הבדיקות מופיעות גם ב-Test Explorer.

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
```

בדיקות ברירת המחדל מריצות את האפליקציה במצב local/fallback בלי Firebase, גם אם קיים `.env.local`.

לבדיקות Firebase יש להריץ Auth + Firestore Emulator בנפרד, ואז:

```bash
npm run test:e2e:firebase
```

ה-Firebase suite מדלג אוטומטית אם ה-emulators לא זמינים, ואינו כותב ל-production.

## מבנה תיקיות מרכזי

```text
public/
  icons/
  manifest.webmanifest
  sw.js

src/
  components/
    common/
    games/
      matching/
      memory/
      patterns/
      quiz/
      sorting/
    layout/
  data/
    questions/
    activityData.ts
    gameInstructions.ts
    games.ts
    levels.ts
  hooks/
  pages/
  services/
    questionService.ts
    questions/questionProvider.ts
    firebase/questionRepository.ts
    contentReview/contentReviewAgent.ts
    contentReview/duplicateQuestionDetector.ts
    speechService.ts
    speechTherapistAgent.ts
    versionService.ts
  types/
  utils/
  App.tsx
  main.tsx
  styles.css
```

## הערות תפעול

- איכות הדיבור בעברית תלויה בדפדפן ובמערכת ההפעלה.
- בדפדפנים מסוימים SpeechSynthesis מתחיל לעבוד טוב יותר אחרי אינטראקציה ראשונה של המשתמש.
- `node_modules` לא נדרש להיות בתוך קובץ ההפצה; יש להריץ `npm install` אחרי חילוץ הפרויקט.
