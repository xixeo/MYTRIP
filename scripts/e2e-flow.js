const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(8000);
  let cloudSaved = null;
  let loginRequestUrl = '';
  let resolveCloudSave;
  const cloudSavePromise = new Promise(resolve => { resolveCloudSave = resolve; });
  page.on('pageerror', error => console.error('PAGE ERROR', error));
  await page.route(/api\.frankfurter\.dev\/v1\/latest/, route => route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({amount:1, base:'JPY', date:'2026-11-06', rates:{KRW:8.4863}})}));
  await page.route(/nominatim\.openstreetmap\.org\/search/, route => { const query=new URL(route.request().url()).searchParams.get('q') || ''; const shibuya=query.includes('시부야'); const result=shibuya?{place_id:2,name:'시부야 스카이',display_name:'시부야 스카이, 시부야, 도쿄, 일본',lat:'35.6580',lon:'139.7016',type:'attraction',address:{country:'일본'}}:{place_id:1,name:'도쿄역',display_name:'도쿄역, 마루노우치, 도쿄, 일본',lat:'35.6812',lon:'139.7671',type:'station',address:{country:'일본'}}; return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([result])}); });
  await page.route(/efwgdroqjgfhuvkjkger\.supabase\.co\/functions\/v1\/google-shopping-search/, route => route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({results:[{id:'google-test-product',name:'칼디 스프레드',store:'Google 테스트 판매처',price:7500,priceText:'₩7,500',currency:'JPY',imageUrl:'https://example.com/product.png',sourceUrl:'https://example.com/product'}]})}));
  await page.route('https://example.com/product.png', route => route.fulfill({status:200, contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#a8c6f5"/><text x="40" y="45" text-anchor="middle">A</text></svg>'}));
  await page.route(/efwgdroqjgfhuvkjkger\.supabase\.co\/rest\/v1\/mytrip_snapshots/, async route => {
    if (route.request().method() === 'POST') { cloudSaved = JSON.parse(route.request().postData()); resolveCloudSave(); return route.fulfill({status:201, contentType:'application/json', body:''}); }
    return route.fulfill({status:200, contentType:'application/json', body:'[]'});
  });
  await page.route(/efwgdroqjgfhuvkjkger\.supabase\.co\/auth\/v1\/otp/, route => { loginRequestUrl = route.request().url(); return route.fulfill({status:200, contentType:'application/json', body:'{}'}); });
  const step = name => console.log(`STEP ${name}`);
  step('open');
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mytrip-serpapi-key-v1','test-serpapi-key'); localStorage.setItem('mytrip-supabase-session-v1', JSON.stringify({access_token:'test-token', refresh_token:'test-refresh', expires_at:Math.floor(Date.now() / 1000) + 3600, user:{id:'00000000-0000-0000-0000-000000000001'}})); });
  await page.reload({waitUntil:'domcontentloaded'});

  step('seeded Hokkaido sheet trip');
  await page.waitForFunction(() => document.querySelector('#hero-trip-title')?.textContent === '홋카이도 3박 4일 여행');
  const seeded = await page.evaluate(() => ({
    tabs:document.querySelectorAll('[data-user-day]').length,
    schedule:document.querySelectorAll('#user-schedule-list > li').length,
    shoppingVisible:document.querySelectorAll('#shopping-list > li').length,
    shoppingTotal:document.querySelector('#shopping-progress')?.textContent,
    reservations:document.querySelectorAll('#reservation-list > li').length,
    checklist:document.querySelectorAll('#checklist-list > li').length,
    alternatives:document.querySelectorAll('#alternative-list > article').length,
    currency:document.querySelector('#shopping-currency')?.value
  }));
  if (seeded.tabs !== 4 || seeded.schedule !== 10 || seeded.shoppingVisible !== 12 || !seeded.shoppingTotal.includes('/ 80') || seeded.reservations !== 5 || seeded.checklist !== 4 || seeded.alternatives !== 6 || seeded.currency !== 'JPY') throw new Error(`홋카이도 시트 화면 반영 오류: ${JSON.stringify(seeded)}`);
  const overview=await page.locator('#overview-metrics').textContent(); if(!overview.includes('54전체 일정') || !overview.includes('4/5예약 확정') || !overview.includes('4남은 확인') || !overview.includes('6대안 플랜')) throw new Error(`홈 준비 현황 오류: ${overview}`);
  const mobileNav=await page.locator('.masthead nav').textContent(); if(!mobileNav.includes('홈') || !mobileNav.includes('일정') || !mobileNav.includes('쇼핑') || !mobileNav.includes('준비')) throw new Error(`모바일 정보 구조 오류: ${mobileNav}`);
  const timelineMaps = await page.locator('#user-schedule-list .schedule-map-link').count(); const firstMap=page.locator('#user-schedule-list .schedule-map-link').first(); const firstMapHref=await firstMap.getAttribute('href'); const firstMapTarget=await firstMap.getAttribute('target');
  if (timelineMaps !== 10 || !firstMapHref.startsWith('https://www.google.com/maps/') || firstMapTarget !== '_top') throw new Error(`일정 지도 링크 오류: ${timelineMaps}, ${firstMapHref}, ${firstMapTarget}`);
  if (await page.locator('#user-place-grid .user-place-card').count() !== 6) throw new Error('일정 미배치 후보가 6개로 표시되지 않습니다.');
  await page.click('#place-all-filter'); if (await page.locator('#user-place-grid .user-place-card').count() < 59) throw new Error('저장 장소 전체 목록이 표시되지 않습니다.'); await page.click('#place-unscheduled-filter');
  const alternativeLinks = await page.evaluate(() => JSON.parse(localStorage.getItem('mytrip-alternatives-v1:hokkaido-2026-11') || '[]').filter(item => item.placeId).length);
  if (alternativeLinks !== 6) throw new Error(`대안 장소 일정 연결 누락: ${alternativeLinks}/6`);
  await page.waitForFunction(() => document.querySelector('#shopping-list')?.textContent.includes('¥17,600~') && document.querySelector('#shopping-list')?.textContent.includes('한국 가격'));
  if (await page.locator('#shopping-list img[src*="assets/shopping/sheet-"]').count() < 1) throw new Error('Google Sheets 상품 이미지가 표시되지 않습니다.');
  if (!await page.locator('#shopping-list').textContent().then(text => text.includes('MEXICO 66 TGRS'))) throw new Error('쇼핑 시트 현지 상품명이 표시되지 않습니다.');
  await page.fill('#product-search-query', '칼디 스프레드');
  const googleShoppingHref = await page.locator('#product-google-search').getAttribute('href');
  if (!googleShoppingHref.includes('google.com/search') || !googleShoppingHref.includes('q=')) throw new Error(`Google 쇼핑 연결 오류: ${googleShoppingHref}`);
  await page.click('#product-search-form button[type="submit"]');
  await page.waitForSelector('.product-result-card');
  await page.click('.product-result-card .button');
  const registeredGoogleProduct = await page.evaluate(() => JSON.parse(localStorage.getItem('weekend-trip-shopping-v2:hokkaido-2026-11') || '[]').find(item => item.name === '칼디 스프레드'));
  if (!registeredGoogleProduct || registeredGoogleProduct.price !== 7500 || registeredGoogleProduct.imageUrl !== 'https://example.com/product.png') throw new Error(`Google 검색 결과 바로 등록 오류: ${JSON.stringify(registeredGoogleProduct)}`);
  await page.click('#alternative-list .button');
  await page.waitForFunction(() => document.querySelector('#schedule-selected-place')?.textContent.includes('타키나미'));
  await page.click('[data-close-schedule-editor]');

  step('create trip');
  await page.click('#trip-list-open');
  const tripGroups = await page.evaluate(() => {
    const actual = Object.fromEntries([...document.querySelectorAll('.trip-list-group')].map(group => [group.dataset.tripPeriod, group.querySelectorAll('.trip-list-card').length]));
    const expected = {current:0, upcoming:0, past:0};
    const today = new Date().toLocaleDateString('en-CA');
    const registry = JSON.parse(localStorage.getItem('mytrip-trip-registry-v1'));
    registry.trips.forEach(trip => { expected[trip.endDate < today ? 'past' : trip.startDate > today ? 'upcoming' : 'current'] += 1; });
    return {actual, expected};
  });
  if (JSON.stringify(tripGroups.actual) !== JSON.stringify(tripGroups.expected)) throw new Error(`여행 목록 기간 분류 오류: ${JSON.stringify(tripGroups)}`);
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
  await page.fill('#schedule-place-search', '도쿄역');
  await page.waitForSelector('.external-place-option');
  await page.click('.external-place-option');
  await page.waitForFunction(() => document.querySelector('#schedule-selected-place')?.textContent.includes('도쿄역'));
  const inputColors=await page.locator('#schedule-place-search').evaluate(el=>({color:getComputedStyle(el).color,fill:getComputedStyle(el).webkitTextFillColor})); if(inputColors.color==='rgba(0, 0, 0, 0)' || inputColors.fill==='rgba(0, 0, 0, 0)') throw new Error(`입력 글씨색 오류: ${JSON.stringify(inputColors)}`);
  await page.fill('#schedule-time', '09:00');
  await page.fill('#schedule-duration', '40');
  await page.click('#schedule-editor-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#user-schedule-list')?.textContent.includes('도쿄역'));

  step('second place and conflict');
  await page.click('#schedule-add');
  await page.fill('#schedule-place-search', '시부야 스카이');
  await page.waitForSelector('.external-place-option');
  await page.click('.external-place-option');
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
  await page.setInputFiles('#shopping-image-file', {name:'product.png', mimeType:'image/png', buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCTkAAAAASUVORK5CYII=','base64')});
  await page.click('#shopping-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#shopping-list')?.textContent.includes('JP¥400'));
  await page.waitForFunction(() => document.querySelector('#shopping-list')?.textContent.includes('현재 기준 약'), null, {timeout:15000});
  await page.waitForFunction(() => [...document.querySelectorAll('#shopping-list li')].find(row=>row.textContent.includes('물건 A'))?.querySelector('img')?.src.startsWith('data:image/jpeg'));
  const addedRow=page.locator('#shopping-list li').filter({hasText:'물건 A'}); await addedRow.locator('.shopping-edit').click();
  await page.fill('#shopping-edit-price','450'); await page.click('#shopping-editor-form button[type="submit"]');
  await page.waitForFunction(() => [...document.querySelectorAll('#shopping-list li')].find(row=>row.textContent.includes('물건 A'))?.textContent.includes('JP¥450'));
  await addedRow.locator('.shopping-edit').click(); await page.check('#shopping-edit-remove-image'); await page.click('#shopping-editor-form button[type="submit"]');
  await page.waitForFunction(() => ![...document.querySelectorAll('#shopping-list li')].find(row=>row.textContent.includes('물건 A'))?.querySelector('img'));

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
  await cloudSavePromise;
  if (cloudSaved?.title !== '도쿄 테스트 여행' || cloudSaved?.payload?.data?.['mytrip-travel-info-v1']?.reservations?.[0]?.number !== 'TEST-1234') throw new Error('클라우드 저장 데이터가 올바르지 않습니다.');
  await page.click('#trip-list-close');

  step('email login redirect');
  await page.evaluate(() => localStorage.removeItem('mytrip-supabase-session-v1'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.click('#trip-list-open');
  await page.fill('#cloud-email', 'traveler@example.com');
  await page.click('#cloud-login-form button[type="submit"]');
  await page.waitForFunction(() => document.querySelector('#cloud-status')?.textContent.includes('로그인 링크를 보냈습니다'));
  if (!loginRequestUrl.includes('redirect_to=')) throw new Error('로그인 복귀 주소가 OTP 요청에 없습니다.');
  await page.click('#trip-list-close');

  await page.screenshot({path:'/tmp/mytrip-flow-mobile.png', fullPage:true});
  step('done');
  console.log(JSON.stringify({title:await page.textContent('#hero-trip-title'), schedule:await page.textContent('#schedule-day-summary'), shopping:await page.textContent('#shopping-list'), reservation:await page.textContent('#reservation-list'), checklist:await page.textContent('#checklist-progress'), backup:backup.format, cloud:cloudSaved?.title, loginRedirect:true, screenshot:'/tmp/mytrip-flow-mobile.png'}));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
