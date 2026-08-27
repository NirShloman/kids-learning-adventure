# ידע׳לה | Yedale

הרפתקת למידה בעברית לילדים בגילאי 3–6. אותו קוד נבנה כ־PWA וכאפליקציות Capacitor ל־Android ול־iOS. האפליקציה local-first: אין Firebase, מסד נתונים, התחברות או שירות ענן בזמן ריצה.

## תוכן

המאגר כולל 1,010 יחידות תוכן בשמונה קובצי JSON תחת `src/content`:

| משחק | פריטים |
| --- | ---: |
| אותיות | 180 |
| מספרים | 170 |
| צורות | 110 |
| צבעים | 110 |
| התאמה | 120 |
| זיכרון | 100 זוגות |
| רצפים | 110 |
| מיון וסיווג | 110 |

כל משחק נטען ב־`import()` רק בעת הכניסה אליו. הבחירה מדויקת לפי גיל ורמה, מאוזנת לפי מיומנות ונמנעת מחזרה על תוכן המשחק הקודם.

## פיתוח

```bash
npm install
npm run dev
```

סנכרון ובדיקת המעטפות הנייטיביות:

```bash
npm run mobile:assets
npm run build:native
npm run mobile:verify
```

הפרויקטים `android/` ו־`ios/` הם קוד מקור ונשמרים בריפו. אין להגדיר `server.url`: התוכן והמדיה נארזים בבינארי ופועלים ללא רשת. הוראות חתימה והעלאת בטא נמצאות ב־`docs/MOBILE_RELEASE.md`.

בדיקות ושערי איכות:

```bash
npm run validate:content
npm run test:unit
npm run typecheck
npm run test:e2e:local
npm run build
```

`npm run generate:content` מייצר מחדש את קובצי התוכן ואת `review-status.json`. כל שינוי בתוכן חייב לעבור את הסכמה, הבדיקות הסמנטיות ושלושת אישורי הביקורת.

## שמירה מקומית

ב־Web הפרופיל וההתקדמות נשמרים ב־`localStorage`. ב־Android וב־iOS הם נשמרים בקובץ אטומי באזור פרטי שאינו מגובה. בהפעלה הראשונה מתבצעת מיגרציה מהפורמט הישן, אם קיים.

## אנימציה

האפליקציה כוללת שכבת אינטגרציה עצלה ל־Rive ו־fallback מקומי. מפרט קובצי המקור נמצא ב־`src/assets/animations/README.md`. קובצי Marketplace או rigs של צד שלישי אינם מותרים.

## פריסה

```bash
npm run build:web
```

את תיקיית `dist` אפשר לפרוס ל־Cloudflare Workers & Pages ללא bindings וללא משתני סביבה. ה־Service Worker נרשם רק ב־Web; באפליקציות הנייטיביות הנכסים נטענים ישירות מהחבילה.
