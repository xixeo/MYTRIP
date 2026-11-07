const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  const viewports = [{name:'small-mobile', width:360, height:740}, {name:'mobile', width:390, height:844}, {name:'tablet', width:768, height:1024}, {name:'desktop', width:1440, height:900}];
  const failures = [];
  for (const viewport of viewports) {
    const page = await browser.newPage({viewport});
    const runtimeErrors = []; const failedResources = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('response', response => { if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`); });
    await page.route(/(api\.frankfurter\.dev|efwgdroqjgfhuvkjkger\.supabase\.co)/, route => route.abort('internetdisconnected'));
    await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
    await page.evaluate(() => localStorage.clear()); await page.reload({waitUntil:'domcontentloaded'});
    const audit = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id); const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
      const controls = [...document.querySelectorAll('input:not([type="hidden"]):not([hidden]), select:not([hidden]), textarea:not([hidden])')];
      const unlabeled = controls.filter(control => !control.labels?.length && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')).map(control => control.id || control.outerHTML.slice(0, 80));
      const unnamedActions = [...document.querySelectorAll('button, a[href]')].filter(el => el.getClientRects().length && !el.textContent.trim() && !el.getAttribute('aria-label') && !el.querySelector('img[alt]')).map(el => el.id || el.outerHTML.slice(0, 80));
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const overflowElements = overflow > 1 ? [...document.querySelectorAll('body *')].filter(el => { const box = el.getBoundingClientRect(); return box.right > document.documentElement.clientWidth + 1 || box.left < -1; }).slice(0, 10).map(el => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.trim().replace(/\s+/g, '.')}` : ''}`) : [];
      return {duplicateIds, unlabeled, unnamedActions, h1:document.querySelectorAll('h1').length, overflow, overflowElements};
    });
    if (runtimeErrors.length || failedResources.length || audit.duplicateIds.length || audit.unlabeled.length || audit.unnamedActions.length || audit.h1 !== 1 || audit.overflow > 1) failures.push({viewport:viewport.name, runtimeErrors, failedResources, ...audit});
    console.log(`${viewport.name}: overflow ${audit.overflow}px · labels ${audit.unlabeled.length} missing · actions ${audit.unnamedActions.length} unnamed · runtime errors ${runtimeErrors.length}`);
    await page.close();
  }
  await browser.close();
  if (failures.length) throw new Error(`품질 검사 실패\n${JSON.stringify(failures, null, 2)}`);
})().catch(error => { console.error(error); process.exit(1); });
