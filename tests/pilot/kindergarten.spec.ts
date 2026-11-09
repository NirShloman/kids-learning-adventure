import { test, expect, type Page, type APIRequestContext, type Locator } from '@playwright/test';
import { openGame, selectGameMode } from '../e2e/helpers';
import { solveDetectiveStep } from '../e2e/detective-helpers';

const project='demo-olamia-pilot', password='Pilot-Test-123!';
async function setRange(locator:Locator,value:number) { await locator.focus();await locator.press('Home');for(let i=0;i<value;i++)await locator.press('ArrowUp'); }
async function seed(request:APIRequestContext) {
  const email=`pilot-${crypto.randomUUID()}@example.test`, garden=crypto.randomUUID();
  const response=await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{data:{email,password,returnSecureToken:true}});
  expect(response.ok()).toBeTruthy(); const uid=(await response.json()).localId;
  for(const [path,fields] of [ [`memberships/${uid}`,{kindergartenId:{stringValue:garden},disabled:{booleanValue:false}}], [`kindergartens/${garden}`,{name:{stringValue:'גן בדיקה'}}] ] as const) {
    const saved=await request.patch(`http://127.0.0.1:8088/v1/projects/${project}/databases/(default)/documents/${path}`,{headers:{Authorization:'Bearer owner'},data:{fields}}); expect(saved.ok()).toBeTruthy();
  }
  return {email,garden};
}
async function signIn(page:Page,email:string,initial=true) {
  await page.goto('/'); await expect(page.getByLabel('אימייל הגן')).toBeVisible({timeout:15000}); await page.getByLabel('אימייל הגן').fill(email); await page.getByLabel('סיסמה',{exact:true}).fill(password); await page.getByRole('button',{name:'כניסה לגן',exact:true}).click();
  await expect(page.getByLabel('קוד צוות בן שש ספרות')).toBeVisible({timeout:30000});
  await page.getByLabel('קוד צוות בן שש ספרות').fill('123456');
  if(initial) await page.getByLabel('סיסמת חשבון הגן לאימות').fill(password);
  await page.getByRole('checkbox').check(); await page.getByRole('button',{name:'פתיחת אזור הצוות'}).click();
  await expect(page.getByRole('heading',{name:'מי יוצא להרפתקה?'})).toBeVisible({timeout:45000});
}
async function unlock(page:Page) { await expect(page.getByLabel('קוד צוות בן שש ספרות')).toBeVisible();await page.getByLabel('קוד צוות בן שש ספרות').fill('123456'); await page.getByRole('button',{name:'פתיחת אזור הצוות'}).click(); await expect(page.locator('.pilot-roster')).toBeVisible(); }
async function add(page:Page,names:string) { await page.getByLabel('שמות או כינויים').fill(names); await page.getByRole('button',{name:'תצוגה מקדימה'}).click(); await page.getByRole('button',{name:'אישור והוספת הילדים'}).click(); await expect(page.getByLabel('שמות או כינויים')).toHaveValue(''); }
test('50 children: bulk roster, isolated settings, staff lock, refresh and safe switch',async({page,request},info)=>{
  const {email}=await seed(request); await signIn(page,email); await add(page,Array.from({length:50},(_,i)=>`ילד ${i+1}`).join('\n')); await expect(page.locator('.pilot-roster article')).toHaveCount(50);
  const first=page.locator('.pilot-roster article').filter({has:page.getByRole('heading',{name:'ילד 1',exact:true})});
  await first.getByRole('button',{name:'התקדמות והעדפות'}).click(); await setRange(page.getByLabel('מוזיקה',{exact:true}),12); await page.getByRole('button',{name:'חזרה לילדי הגן'}).click();
  await first.getByRole('button',{name:'מתחילים עם ילד 1',exact:true}).click(); await expect(page.locator('.home-grid')).toBeVisible(); await expect(page.locator('.pilot-bar')).toContainText('ילד 1');
  await page.getByRole('button',{name:'אזור צוות והחלפת ילד',exact:true}).first().click(); await expect(page.locator('.home-grid')).toHaveCount(0); await unlock(page);
  const second=page.locator('.pilot-roster article').filter({has:page.getByRole('heading',{name:'ילד 2',exact:true})}); await second.getByRole('button',{name:'התקדמות והעדפות'}).click(); await expect(page.getByLabel('מוזיקה',{exact:true})).toHaveValue('45'); await page.getByRole('button',{name:'חזרה לילדי הגן'}).click();
  const started=Date.now(); await second.getByRole('button',{name:'מתחילים עם ילד 2',exact:true}).click(); await expect(page.locator('.home-grid')).toBeVisible(); expect(Date.now()-started).toBeLessThan(2000);
  await page.reload(); await expect(page.getByLabel('קוד צוות בן שש ספרות')).toBeVisible(); await expect(page.locator('.home-grid')).toHaveCount(0); await unlock(page); await expect(page.locator('.pilot-roster article')).toHaveCount(50);
  await page.screenshot({path:info.outputPath('kindergarten-roster.png'),fullPage:true});
});
test('a second computer loads saved preferences and cannot see another garden',async({page,browser,request})=>{
  const {email}=await seed(request); await signIn(page,email); await add(page,'אורי\nנועה');
  await page.locator('.pilot-roster article').first().getByRole('button',{name:'התקדמות והעדפות'}).click(); await setRange(page.getByLabel('קריינות',{exact:true}),31); await page.getByRole('button',{name:'חזרה לילדי הגן'}).click(); await expect(page.getByRole('status').first()).toContainText('הגיבוי בענן מעודכן');
  const context=await browser.newContext(); const other=await context.newPage(); await signIn(other,email,false); await expect(other.locator('.pilot-roster article')).toHaveCount(2); await other.locator('.pilot-roster article').filter({has:other.getByRole('heading',{name:'אורי',exact:true})}).getByRole('button',{name:'התקדמות והעדפות'}).click(); await expect(other.getByLabel('קריינות',{exact:true})).toHaveValue('31'); await context.close();
  const different=await seed(request); const isolated=await browser.newContext(); const separate=await isolated.newPage(); await signIn(separate,different.email); await expect(separate.locator('.pilot-roster article')).toHaveCount(0); await isolated.close();
});
test('all eight games and four worlds work inside a child session and persist progress',async({page,request})=>{
  test.setTimeout(240000); const {email}=await seed(request); await signIn(page,email); await add(page,'נועה'); await page.locator('.pilot-roster article').getByRole('button',{name:'מתחילים עם נועה'}).click();
  await page.getByRole('button',{name:'⚙️ צלילים'}).click(); await page.getByLabel('🔊 הקראה',{exact:true}).uncheck(); await page.getByRole('button',{name:'🎲 משחקים'}).click();
  for(const title of ['אותיות','מספרים','צורות','צבעים','התאמה','זיכרון','רצפים','מיון וסיווג'] as const) {
    await openGame(page,title); if(['אותיות','מספרים','צורות','צבעים'].includes(title)) await selectGameMode(page,'quiz');
    await expect(page.locator('.detective-game')).toBeVisible(); await solveDetectiveStep(page); await page.getByRole('button',{name:/^(חזרה לתפריט|לתפריט המשחקים)$/}).click();
  }
  for(const title of ['אותיות','מספרים','צורות','צבעים'] as const) { await openGame(page,title); await selectGameMode(page,'experience'); await expect(page.getByTestId('adventure')).toBeVisible(); await page.getByRole('button',{name:'חזרה לתפריט המשחקים',exact:true}).click(); }
  await expect(page.getByRole('status').first()).toContainText('הגיבוי בענן מעודכן');
});
test('prepared classroom survives offline reload and backs up queued children after reconnection',async({page,context,request})=>{
  test.setTimeout(300000); const {email}=await seed(request);await signIn(page,email);await add(page,'אורי');
  await page.getByRole('button',{name:'הכנת המחשב למשחק ללא רשת'}).click();
  await expect(page.getByRole('status').first()).toContainText('תוכן מוכן ללא רשת',{timeout:180000});
  await context.setOffline(true);await page.reload();await unlock(page);
  await add(page,'נועה');await expect(page.getByRole('status').first()).toContainText('פעולות ממתינות לגיבוי');
  await page.reload();await unlock(page);await expect(page.locator('.pilot-roster article')).toHaveCount(2);
  await page.locator('.pilot-roster article').filter({has:page.getByRole('heading',{name:'אורי',exact:true})}).getByRole('button',{name:'מתחילים עם אורי'}).click();await expect(page.locator('.home-grid')).toBeVisible();
  await context.setOffline(false);await expect(page.getByRole('status').first()).toContainText('הגיבוי בענן מעודכן');
});
