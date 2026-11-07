const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(8000);
  let cloudSaved = null;
  page.on('pageerror', error => console.error('PAGE ERROR', error));
  await page.route(/api\.frankfurter\.dev\/v1\/latest/, route => route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({amount:1, base:'JPY', date:'2026-11-06', rates:{KRW:8.4863}})}));
  await page.route(/efwgdroqjgfhuvkjkger\.supabase\.co\/rest\/v1\/mytrip_snapshots/, async route => {
    if (route.request().method() === 'POST') { cloudSaved = JSON.parse(route.request().postData()); return route.fulfill({status:201, contentType:'application/json', body:''}); }
    return route.fulfill({status:200, contentType:'application/json', body:'[]'});
  });
  const step = name => console.log(`STEP ${name}`);
  step('open');
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mytrip-supabase-session-v1', JSON.stringify({access_token:'test-token', refresh_token:'test-refresh', expires_at:Math.floor(Date.now() / 1000) + 3600, user:{id:'00000000-0000-0000-0000-000000000001'}})); });
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

  step('reservation and checklist');
  await page.fill('#reservation-name', '도쿄역 호텔');
  await page.fill('#reservation-date', '2026-12-01');
  await page.selectOption('#reservation-status', '확정');
  await page.fill('#reservation-number', 'TEST-1234');
  await page.click('#reservation-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#reservation-list')?.textContent.includes('TEST-1234'));
  await page.fill('#checklist-name', '여권');
  await page.fill('#checklist-assignee', '나');
  await page.click('#checklist-form button[type="submit"]');
  await page.click('#checklist-list .shopping-check');
  await page.waitForFunction(() => document.querySelector('#checklist-progress')?.textContent.includes('1 / 1'));

  step('export backup');
  await page.click('#trip-list-open');
  const downloadPromise = page.waitForEvent('download');
  await page.click('#trip-export');
  const download = await downloadPromise;
  const backup = JSON.parse(await require('fs').promises.readFile(await download.path(), 'utf8'));
  if (backup.format !== 'MYTRIP_BACKUP' || backup.data['mytrip-travel-info-v1'].reservations[0].number !== 'TEST-1234') throw new Error('백업에 예약 정보가 없습니다.');
  await page.click('#cloud-upload');
  await page.waitForFunction(() => document.querySelector('#cloud-status')?.textContent.includes('완료'));
  if (cloudSaved?.title !== '도쿄 테스트 여행' || cloudSaved?.payload?.data?.['mytrip-travel-info-v1']?.reservations?.[0]?.number !== 'TEST-1234') throw new Error('클라우드 저장 데이터가 올바르지 않습니다.');
  await page.click('#trip-list-close');

  await page.screenshot({path:'/tmp/mytrip-flow-mobile.png', fullPage:true});
  step('done');
  console.log(JSON.stringify({title:await page.textContent('#hero-trip-title'), schedule:await page.textContent('#schedule-day-summary'), shopping:await page.textContent('#shopping-list'), reservation:await page.textContent('#reservation-list'), checklist:await page.textContent('#checklist-progress'), backup:backup.format, cloud:cloudSaved?.title, screenshot:'/tmp/mytrip-flow-mobile.png'}));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
