# לומדים בכיף - Kids Learning Adventure Web

גרסת Web/PWA של אפליקציית משחקי למידה בעברית לילדים בגילאי 3 עד 6.

## מה בוצע בגרסת Web

- הסרה מעשית של תלות ב-Electron והפיכת Vite/React לגרסה הראשית.
- התאמה מלאה לדפדפן ולמובייל.
- תמיכה ב-RTL ובעברית.
- PWA עם `manifest.webmanifest` ו-Service Worker בסיסי.
- בחירת גיל: 3, 4, 5, 6.
- בחירת רמת קושי: קל, בינוני, מתקדם.
- הוראות קוליות בעברית בעזרת Web Speech API.
- מאגר שאלות מחולק לפי תחום: אותיות, מספרים, צורות וצבעים.
- משחק התאמה ומשחק זיכרון מותאמים לגיל ורמת קושי.
- הצגת גרסת אפליקציה בתוך הממשק.

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

## פריסה

אפשר לפרוס את תיקיית `dist` ל:

- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages
- IIS
- Nginx

## מבנה תיקיות

```text
public/
  icons/
  manifest.webmanifest
  sw.js

src/
  components/
    common/
    games/
    layout/
  data/
    questions/
    activityData.ts
    games.ts
    levels.ts
  hooks/
  pages/
  services/
  types/
  utils/
  App.tsx
  main.tsx
  styles.css
```

## הערות חשובות

- איכות הדיבור בעברית תלויה בדפדפן ובמערכת ההפעלה.
- אם רוצים שליטה מלאה באיכות ההוראות הקוליות, מומלץ בעתיד להחליף את Web Speech API בקבצי אודיו מוקלטים.
- ניהול גרסה נמצא כרגע ב-`package.json` וגם ב-`src/services/versionService.ts`.
