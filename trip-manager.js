(() => {
  'use strict';
  const registryKey = 'mytrip-trip-registry-v1';
  const defaultTrip = {id:'weekend-trip-vol1', title:'WEEKEND TRIP VOL.1', destination:'대전·청주·대구', country:'한국', startDate:'2026-11-06', endDate:'2026-11-08', template:true, createdAt:'2026-11-06T00:00:00.000Z'};
  let registry = {activeId:defaultTrip.id, trips:[defaultTrip]};
  try {
    const saved = JSON.parse(localStorage.getItem(registryKey) || 'null');
    if (saved?.trips?.length) registry = saved;
  } catch (_) { registry = {activeId:defaultTrip.id, trips:[defaultTrip]}; }
  const seedMarker = 'mytrip-seeded-hokkaido-2026-v1';
  if (!localStorage.getItem(seedMarker) && Array.isArray(window.MYTRIP_SEEDED_TRIPS)) {
    for (const seed of window.MYTRIP_SEEDED_TRIPS) {
      if (!seed?.trip?.id || !seed.data) continue;
      if (!registry.trips.some(trip => trip.id === seed.trip.id)) registry.trips.push(seed.trip);
      for (const [base, value] of Object.entries(seed.data)) {
        const key = `${base}:${seed.trip.id}`; if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
      }
      registry.activeId = seed.trip.id;
    }
    localStorage.setItem(registryKey, JSON.stringify(registry)); localStorage.setItem(seedMarker, '1');
  }
  const sheetV2Marker = 'mytrip-sheet-hokkaido-v3';
  const sheetV2 = window.MYTRIP_HOKKAIDO_V2;
  if (sheetV2 && !localStorage.getItem(sheetV2Marker)) {
    const plannerKey = `mytrip-user-planner-v1:${sheetV2.tripId}`;
    const infoKey = `mytrip-travel-info-v1:${sheetV2.tripId}`;
    const shoppingKey = `weekend-trip-shopping-v2:${sheetV2.tripId}`;
    try {
      const planner = JSON.parse(localStorage.getItem(plannerKey) || '{"places":[],"schedule":[]}');
      const alternatives = sheetV2.alternatives.map((item, index) => {
        let place = planner.places.find(candidate => candidate.name === item.name);
        if (!place) {
          place = {
            id: `place-alternative-${index + 1}`,
            name: item.name,
            type: item.type || '기타',
            country: '일본',
            address: '홋카이도',
            localName: '', phone: '', website: '', lat: null, lon: null, checkedAt: '',
            note: `대안 장소 · ${item.note}`,
            updatedAt: new Date().toISOString()
          };
          planner.places.push(place);
        }
        return {id:`alternative-${index + 1}`, ...item, placeId:place.id};
      });
      localStorage.setItem(plannerKey, JSON.stringify(planner));
      localStorage.setItem(`mytrip-alternatives-v1:${sheetV2.tripId}`, JSON.stringify(alternatives));
      const info = JSON.parse(localStorage.getItem(infoKey) || '{"reservations":[],"checklist":[]}');
      info.checklist = info.checklist.filter(item => sheetV2.checklistNames.includes(item.name));
      info.reservations = info.reservations.map(item => {
        const place = planner.places.find(candidate => candidate.name === item.name);
        const schedule = place ? planner.schedule.find(candidate => candidate.placeId === place.id && candidate.day === item.date) : null;
        return {...item, scheduleId:schedule?.id || ''};
      });
      localStorage.setItem(infoKey, JSON.stringify(info));
      const shopping = JSON.parse(localStorage.getItem(shoppingKey) || '[]').map(item => {
        const match = String(item.name).match(/¥\s*([\d,]+)/);
        const place = planner.places.find(candidate => candidate.name === item.store);
        return {
          ...item,
          name: match ? String(item.name).replace(/\s*¥\s*[\d,]+/, '').trim() : item.name,
          imageUrl: item.imageUrl || '',
          placeId: item.placeId || place?.id || '',
          currency: 'JPY',
          price: item.price || (match ? Number(match[1].replace(/,/g, '')) : 0)
        };
      });
      localStorage.setItem(shoppingKey, JSON.stringify(shopping));
      localStorage.setItem(sheetV2Marker, '1');
    } catch (_) { /* 기존 사용자 데이터가 손상된 경우 임의로 덮어쓰지 않는다. */ }
  }
  const shoppingSheetMarker = 'mytrip-hokkaido-shopping-sheet-v1';
  if (Array.isArray(window.MYTRIP_HOKKAIDO_SHOPPING_V1) && !localStorage.getItem(shoppingSheetMarker)) {
    const key = 'weekend-trip-shopping-v2:hokkaido-2026-11';
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { existing = []; }
    const byName = new Map(existing.map(item => [item.name, item]));
    const imported = window.MYTRIP_HOKKAIDO_SHOPPING_V1.map(item => {
      const old = byName.get(item.name);
      return old ? {
        ...item, ...old,
        id:item.id,
        localName:item.localName,
        sheetCategory:item.sheetCategory,
        sourceUrl:item.sourceUrl,
        sourceRow:item.sourceRow,
        imageUrl:old.imageUrl || item.imageUrl
      } : item;
    });
    localStorage.setItem(key, JSON.stringify(imported));
    localStorage.setItem(shoppingSheetMarker, '1');
  }
  if (!registry.trips.some(trip => trip.id === registry.activeId)) registry.activeId = registry.trips[0].id;
  const activeTrip = registry.trips.find(trip => trip.id === registry.activeId);
  const storageKey = (base, tripId = registry.activeId) => `${base}:${tripId}`;
  try { if (activeTrip.template) {
    for (const [base, legacyKeys] of Object.entries({
      'mytrip-user-planner-v1':['mytrip-user-planner-v1'],
      'weekend-trip-shopping-v2':['weekend-trip-shopping-v2','weekend-trip-shopping-v1'],
      'mytrip-exchange-rates-v1':['mytrip-exchange-rates-v1']
    })) {
      if (localStorage.getItem(storageKey(base))) continue;
      const legacy = legacyKeys.map(key => localStorage.getItem(key)).find(Boolean);
      if (legacy) localStorage.setItem(storageKey(base), legacy);
    }
  } } catch (_) { /* 저장소가 차단돼도 읽기 전용 화면은 유지한다. */ }
  const dateFromIso = iso => new Date(`${iso}T12:00:00`);
  const isoFromDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const daysBetween = trip => {
    const days = []; const current = dateFromIso(trip.startDate); const end = dateFromIso(trip.endDate);
    while (current <= end && days.length < 60) { const iso = isoFromDate(current); days.push({value:trip.template ? ['fri','sat','sun'][days.length] || iso : iso, date:iso, label:new Intl.DateTimeFormat('ko-KR', {month:'long', day:'numeric', weekday:'short'}).format(current)}); current.setDate(current.getDate() + 1); }
    return days;
  };
  window.MYTRIP_ACTIVE_TRIP = activeTrip;
  window.MYTRIP_TRIP_DAYS = daysBetween(activeTrip);
  window.MYTRIP_STORAGE_KEY = storageKey;

  const saveRegistry = () => localStorage.setItem(registryKey, JSON.stringify(registry));
  const makeId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const formatRange = trip => {
    const start = dateFromIso(trip.startDate); const end = dateFromIso(trip.endDate);
    const nights = Math.max(0, Math.round((end - start) / 86400000));
    const startText = `${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')}`;
    const endText = `${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`;
    return `${startText}–${endText} · ${nights}박 ${nights + 1}일`;
  };
  function applyActiveTrip() {
    document.body.classList.toggle('custom-trip', !activeTrip.template);
    document.documentElement.dataset.tripId = activeTrip.id;
    document.title = `${activeTrip.title} | MYTRIP`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${activeTrip.title} · ${activeTrip.destination} 여행 일정과 쇼핑리스트`);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${activeTrip.title} | MYTRIP`);
    document.querySelector('#hero-destination').textContent = activeTrip.destination;
    document.querySelector('#hero-trip-title').textContent = activeTrip.title;
    document.querySelector('#hero-date').textContent = formatRange(activeTrip);
    document.querySelector('.footer-title').textContent = `${activeTrip.startDate}–${activeTrip.endDate} / ${activeTrip.title}`;
    if (!activeTrip.template) {
      const cta = document.querySelector('.hero-cta'); cta.href = '#expanded-plan'; cta.firstChild.textContent = '일정 만들기 ';
      document.querySelector('#expanded-title').textContent = `${activeTrip.title} 일정`;
      document.querySelector('#places-title').textContent = `${activeTrip.title} 장소`;
      const tabs = document.querySelector('#expanded-tabs');
      tabs.replaceChildren(...window.MYTRIP_TRIP_DAYS.map((day, index) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'day-tab'; button.dataset.userDay = day.value; button.setAttribute('aria-pressed', String(index === 0));
        const date = document.createElement('span'); date.className = 'day-date'; date.textContent = day.label; button.append(date); return button;
      }));
    }
  }
  applyActiveTrip();
  if (!activeTrip.template) document.addEventListener('DOMContentLoaded', applyActiveTrip, {once:true});

  const listDialog = document.querySelector('#trip-list-dialog');
  const editorDialog = document.querySelector('#trip-editor-dialog');
  let editingId = null;
  const setInput = (id, value = '') => { document.querySelector(id).value = value ?? ''; };
  function selectTrip(tripId) { registry.activeId = tripId; saveRegistry(); location.reload(); }
  function copyTripData(sourceId, targetId) {
    for (const base of ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1', 'mytrip-travel-info-v1', 'mytrip-alternatives-v1']) {
      const source = localStorage.getItem(storageKey(base, sourceId)); if (source) localStorage.setItem(storageKey(base, targetId), source);
    }
  }
  const tripPeriod = trip => {
    const today = isoFromDate(new Date());
    if (trip.endDate < today) return 'past';
    if (trip.startDate > today) return 'upcoming';
    return 'current';
  };
  const tripGroups = [
    {id:'current', title:'여행 중', empty:'현재 진행 중인 여행이 없어요.'},
    {id:'upcoming', title:'다가오는 여행', empty:'예정된 여행이 없어요.'},
    {id:'past', title:'지난 여행', empty:'아직 지난 여행 기록이 없어요.'}
  ];
  function tripCard(trip) {
    const card = document.createElement('article');
    card.className = `trip-list-card${trip.id === registry.activeId ? ' is-active' : ''}`;
    const copy = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = trip.title;
    const meta = document.createElement('p'); meta.textContent = `${trip.destination} · ${trip.country}`;
    const date = document.createElement('small'); date.textContent = `${trip.startDate} — ${trip.endDate}`;
    copy.append(title, meta, date);
    const actions = document.createElement('div'); actions.className = 'trip-card-actions';
    if (trip.id !== registry.activeId) actions.append(button('열기', 'button primary', () => selectTrip(trip.id)));
    else { const badge = document.createElement('span'); badge.className = 'pill'; badge.textContent = '현재 열림'; actions.append(badge); }
    actions.append(
      button('수정', 'button secondary', () => openEditor(trip.id)),
      button('복제', 'button secondary', () => duplicateTrip(trip.id))
    );
    if (registry.trips.length > 1) actions.append(button('삭제', 'trip-delete', () => deleteTrip(trip.id)));
    card.append(copy, actions);
    return card;
  }
  function renderTrips() {
    const list = document.querySelector('#trip-list');
    const sections = tripGroups.map(group => {
      const trips = registry.trips
        .filter(trip => tripPeriod(trip) === group.id)
        .sort((a, b) => group.id === 'past'
          ? b.endDate.localeCompare(a.endDate)
          : a.startDate.localeCompare(b.startDate));
      const section = document.createElement('section');
      section.className = 'trip-list-group';
      section.dataset.tripPeriod = group.id;
      const heading = document.createElement('h3');
      heading.textContent = `${group.title} ${trips.length}`;
      section.append(heading);
      if (trips.length) section.append(...trips.map(tripCard));
      else { const empty = document.createElement('p'); empty.className = 'trip-list-empty'; empty.textContent = group.empty; section.append(empty); }
      return section;
    });
    list.replaceChildren(...sections);
  }
  const button = (label, className, action) => { const element = document.createElement('button'); element.type = 'button'; element.className = className; element.textContent = label; element.addEventListener('click', action); return element; };
  function openEditor(tripId = null) {
    editingId = tripId; const trip = registry.trips.find(item => item.id === tripId);
    document.querySelector('#trip-editor-title').textContent = trip ? '여행 정보 수정' : '새 여행 만들기';
    setInput('#trip-name', trip?.title); setInput('#trip-destination', trip?.destination); setInput('#trip-country', trip?.country); setInput('#trip-start-date', trip?.startDate || isoFromDate(new Date())); setInput('#trip-end-date', trip?.endDate || isoFromDate(new Date())); document.querySelector('#trip-editor-error').textContent = '';
    listDialog.close(); editorDialog.showModal(); setTimeout(() => document.querySelector('#trip-name').focus(), 0);
  }
  function duplicateTrip(tripId) {
    const source = registry.trips.find(trip => trip.id === tripId); const newId = makeId();
    registry.trips.push({...source, id:newId, title:`${source.title} 복사본`, template:false, createdAt:new Date().toISOString()}); copyTripData(tripId, newId); saveRegistry(); renderTrips();
  }
  function deleteTrip(tripId) {
    const trip = registry.trips.find(item => item.id === tripId); if (!trip || !confirm(`“${trip.title}” 여행을 삭제할까요?`)) return;
    registry.trips = registry.trips.filter(item => item.id !== tripId); if (registry.activeId === tripId) registry.activeId = registry.trips[0].id;
    for (const base of ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1', 'mytrip-travel-info-v1', 'mytrip-alternatives-v1']) localStorage.removeItem(storageKey(base, tripId));
    saveRegistry(); if (activeTrip.id === tripId) location.reload(); else renderTrips();
  }
  document.querySelector('#trip-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const startDate = document.querySelector('#trip-start-date').value; const endDate = document.querySelector('#trip-end-date').value;
    if (endDate < startDate) { document.querySelector('#trip-editor-error').textContent = '종료일은 시작일보다 빠를 수 없습니다.'; return; }
    const input = {title:document.querySelector('#trip-name').value.trim(), destination:document.querySelector('#trip-destination').value.trim(), country:document.querySelector('#trip-country').value.trim(), startDate, endDate, updatedAt:new Date().toISOString()};
    if (editingId) registry.trips = registry.trips.map(trip => trip.id === editingId ? {...trip, ...input} : trip);
    else { const trip = {id:makeId(), ...input, template:false, createdAt:new Date().toISOString()}; registry.trips.push(trip); registry.activeId = trip.id; }
    saveRegistry(); editorDialog.close(); location.reload();
  });
  document.querySelector('#trip-list-open').addEventListener('click', () => { renderTrips(); listDialog.showModal(); });
  document.querySelector('#trip-list-close').addEventListener('click', () => listDialog.close());
  document.querySelector('#trip-create').addEventListener('click', () => openEditor());
  document.querySelector('#trip-editor-close').addEventListener('click', () => editorDialog.close());
  document.querySelector('#trip-editor-cancel').addEventListener('click', () => { editorDialog.close(); renderTrips(); listDialog.showModal(); });
  const transferableBases = ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1', 'mytrip-travel-info-v1', 'mytrip-alternatives-v1'];
  const transferStatus = document.querySelector('#trip-transfer-status');
  document.querySelector('#trip-export').addEventListener('click', () => {
    const trip = registry.trips.find(item => item.id === registry.activeId);
    const data = Object.fromEntries(transferableBases.map(base => [base, JSON.parse(localStorage.getItem(storageKey(base)) || 'null')]));
    const payload = {format:'MYTRIP_BACKUP', version:1, exportedAt:new Date().toISOString(), trip:{...trip, template:false}, data};
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'}); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = `MYTRIP-${trip.title.replace(/[^0-9A-Za-z가-힣_-]+/g, '-')}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
    transferStatus.textContent = '현재 여행을 파일로 저장했습니다.';
  });
  document.querySelector('#trip-import').addEventListener('click', () => document.querySelector('#trip-import-file').click());
  document.querySelector('#trip-import-file').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.format !== 'MYTRIP_BACKUP' || payload.version !== 1 || !payload.trip?.title || !payload.trip?.startDate || !payload.trip?.endDate || !payload.data) throw new Error('지원하지 않는 백업 파일입니다.');
      const newId = makeId(); const trip = {...payload.trip, id:newId, title:`${payload.trip.title} 가져옴`, template:false, importedAt:new Date().toISOString()}; registry.trips.push(trip);
      for (const base of transferableBases) if (payload.data[base] !== null && payload.data[base] !== undefined) localStorage.setItem(storageKey(base, newId), JSON.stringify(payload.data[base]));
      registry.activeId = newId; saveRegistry(); transferStatus.textContent = '가져오기가 끝났습니다. 여행을 여는 중입니다.'; location.reload();
    } catch (error) { transferStatus.textContent = `가져오기 실패: ${error.message}`; }
    event.target.value = '';
  });
})();
