const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  const devices = [
    {name:'320px', width:320, height:700}, {name:'360px', width:360, height:740},
    {name:'iPhone-375', width:375, height:812}, {name:'mobile-390', width:390, height:844},
    {name:'large-412', width:412, height:915}, {name:'large-430', width:430, height:932},
    {name:'landscape', width:844, height:390}
  ];
  const failures = [];
  for (const device of devices) {
    const page = await browser.newPage({viewport:{width:device.width,height:device.height}, isMobile:device.name !== 'landscape', hasTouch:true});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route(/(api\.frankfurter\.dev|efwgdroqjgfhuvkjkger\.supabase\.co)/, route => route.abort('internetdisconnected'));
    await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'}); await page.evaluate(() => localStorage.clear()); await page.reload({waitUntil:'domcontentloaded'});
    const base = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const visible = el => el.getClientRects().length > 0;
      const clipped = [...document.querySelectorAll('header a, header button, .day-tab, input, select, textarea, .button')].filter(visible).filter(el => { const r=el.getBoundingClientRect(); return r.left < -1 || r.right > viewport + 1; }).map(el => el.id || el.textContent.trim().slice(0,30));
      const tinyTargets = [...document.querySelectorAll('header a, header button, .day-tab, .button')].filter(visible).map(el => ({name:el.id || el.textContent.trim().slice(0,30), r:el.getBoundingClientRect()})).filter(x => x.r.width < 24 || x.r.height < 24).map(x => `${x.name}:${Math.round(x.r.width)}x${Math.round(x.r.height)}`);
      return {overflow:document.documentElement.scrollWidth-viewport, clipped, tinyTargets, navHeight:document.querySelector('.masthead nav').getBoundingClientRect().height};
    });
    await page.click('#schedule-add');
    const scheduleDialog = await page.evaluate(() => { const r=document.querySelector('#schedule-editor-dialog').getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:[innerWidth,innerHeight]}; });
    await page.click('[data-close-schedule-editor]'); await page.click('#trip-list-open');
    const tripDialog = await page.evaluate(() => { const r=document.querySelector('#trip-list-dialog').getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:[innerWidth,innerHeight]}; });
    const dialogsFit = [scheduleDialog,tripDialog].every(r => r.left >= 0 && r.right <= r.viewport[0] && r.top >= 0 && r.bottom <= r.viewport[1]);
    const result = {...base, dialogsFit, errors};
    if (base.overflow > 1 || base.clipped.length || base.tinyTargets.length || !dialogsFit || errors.length) failures.push({device:device.name,...result,scheduleDialog,tripDialog});
    console.log(`${device.name}: overflow ${base.overflow}px · clipped ${base.clipped.length} · tiny targets ${base.tinyTargets.length} · dialogs ${dialogsFit ? 'fit' : 'fail'} · errors ${errors.length}`);
    await page.close();
  }
  await browser.close(); if (failures.length) throw new Error(`모바일 검사 실패\n${JSON.stringify(failures,null,2)}`);
})().catch(error => { console.error(error); process.exit(1); });
