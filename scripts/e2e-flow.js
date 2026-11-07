const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => console.error('PAGE ERROR', error));
  await page.route(/api\.frankfurter\.dev\/v1\/latest/, route => route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({amount:1, base:'JPY', date:'2026-11-06', rates:{KRW:8.4863}})}));
  const step = name => console.log(`STEP ${name}`);
  step('open');
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
  await page.evaluate(() => localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});

  step('create trip');
  await page.click('#trip-list-open');
  await page.click('#trip-create');
  await page.fill('#trip-name', '도쿄 테스트 여행');
  await page.fill('#trip-destination', '도쿄');
  await page.fill('#trip-country', '일본');
  await page.fill('#trip-start-date', '2026-12-01');
  await page.fill('#trip-end-date', '2026-12-03');
  await Promise.all([page.waitForLoadState('domcontentloaded'), page.click('#trip-editor-form button[type="submit"]')]);
  await page.waitForFunction(() => document.querySelector('#hero-trip-title')?.textContent === '도쿄 테스트 여행');

  step('create schedule and place');
  await page.click('#schedule-add');
  await page.click('#schedule-new-place');
  await page.fill('#place-name', '도쿄역');
  await page.selectOption('#place-type', '교통');
  await page.fill('#place-address', '1 Chome Marunouchi, Chiyoda City, Tokyo');
  await page.click('#place-editor-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#schedule-selected-place')?.textContent.includes('도쿄역'));
  await page.fill('#schedule-time', '09:00');
  await page.fill('#schedule-duration', '40');
  await page.click('#schedule-editor-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#user-schedule-list')?.textContent.includes('도쿄역'));

  step('second place and conflict');
  await page.click('#schedule-add');
  await page.click('#schedule-new-place');
  await page.fill('#place-name', '시부야 스카이');
  await page.selectOption('#place-type', '관광');
  await page.fill('#place-address', '2 Chome Shibuya, Tokyo');
  await page.click('#place-editor-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#schedule-selected-place')?.textContent.includes('시부야 스카이'));
  await page.fill('#schedule-time', '09:30');
  await page.fill('#schedule-duration', '30');
  await page.selectOption('#schedule-travel-mode', '대중교통');
  await page.fill('#schedule-travel-minutes', '20');
  await page.click('#schedule-editor-form button[type="submit"]');
  await page.waitForFunction(() => !document.querySelector('#schedule-warning')?.hidden && document.querySelector('.travel-gap')?.textContent.includes('대중교통'));

  step('shopping exchange');
  await page.fill('#shopping-name', '물건 A');
  await page.selectOption('#shopping-currency', 'JPY');
  await page.fill('#shopping-price', '400');
  await page.click('#shopping-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#shopping-list')?.textContent.includes('JP¥400'));
  await page.waitForFunction(() => document.querySelector('#shopping-list')?.textContent.includes('현재 기준 약'), null, {timeout:15000});

  await page.screenshot({path:'/tmp/mytrip-flow-mobile.png', fullPage:true});
  step('done');
  console.log(JSON.stringify({title:await page.textContent('#hero-trip-title'), schedule:await page.textContent('#schedule-day-summary'), shopping:await page.textContent('#shopping-list'), screenshot:'/tmp/mytrip-flow-mobile.png'}));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
