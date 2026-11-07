(() => {
  'use strict';
  const registryKey = 'mytrip-trip-registry-v1';
  const defaultTrip = {id:'weekend-trip-vol1', title:'WEEKEND TRIP VOL.1', destination:'대전·청주·대구', country:'한국', startDate:'2026-11-06', endDate:'2026-11-08', template:true, createdAt:'2026-11-06T00:00:00.000Z'};
  let registry = {activeId:defaultTrip.id, trips:[defaultTrip]};
  try {
    const saved = JSON.parse(localStorage.getItem(registryKey) || 'null');
    if (saved?.trips?.length) registry = saved;
  } catch (_) { registry = {activeId:defaultTrip.id, trips:[defaultTrip]}; }
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
    for (const base of ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1']) {
      const source = localStorage.getItem(storageKey(base, sourceId)); if (source) localStorage.setItem(storageKey(base, targetId), source);
    }
  }
  function renderTrips() {
    const list = document.querySelector('#trip-list'); list.replaceChildren(...registry.trips.map(trip => {
      const card = document.createElement('article'); card.className = `trip-list-card${trip.id === registry.activeId ? ' is-active' : ''}`;
      const copy = document.createElement('div'); const title = document.createElement('h3'); title.textContent = trip.title; const meta = document.createElement('p'); meta.textContent = `${trip.destination} · ${trip.country}`; const date = document.createElement('small'); date.textContent = `${trip.startDate} — ${trip.endDate}`; copy.append(title, meta, date);
      const actions = document.createElement('div'); actions.className = 'trip-card-actions';
      if (trip.id !== registry.activeId) actions.append(button('선택', 'button primary', () => selectTrip(trip.id)));
      else { const badge = document.createElement('span'); badge.className = 'pill'; badge.textContent = '사용 중'; actions.append(badge); }
      actions.append(button('수정', 'button secondary', () => openEditor(trip.id)), button('복제', 'button secondary', () => duplicateTrip(trip.id)));
      if (registry.trips.length > 1) actions.append(button('삭제', 'trip-delete', () => deleteTrip(trip.id)));
      card.append(copy, actions); return card;
    }));
  }
  const button = (label, className, action) => { const element = document.createElement('button'); element.type = 'button'; element.className = className; element.textContent = label; element.addEventListener('click', action); return element; };
  function openEditor(tripId = null) {
    editingId = tripId; const trip = registry.trips.find(item => item.id === tripId);
    document.querySelector('#trip-editor-title').textContent = trip ? '여행 정보 수정' : '새 여행 만들기';
    setInput('#trip-title', trip?.title); setInput('#trip-destination', trip?.destination); setInput('#trip-country', trip?.country); setInput('#trip-start-date', trip?.startDate || new Date().toISOString().slice(0, 10)); setInput('#trip-end-date', trip?.endDate || new Date().toISOString().slice(0, 10)); document.querySelector('#trip-editor-error').textContent = '';
    listDialog.close(); editorDialog.showModal(); setTimeout(() => document.querySelector('#trip-title').focus(), 0);
  }
  function duplicateTrip(tripId) {
    const source = registry.trips.find(trip => trip.id === tripId); const newId = makeId();
    registry.trips.push({...source, id:newId, title:`${source.title} 복사본`, template:false, createdAt:new Date().toISOString()}); copyTripData(tripId, newId); saveRegistry(); renderTrips();
  }
  function deleteTrip(tripId) {
    const trip = registry.trips.find(item => item.id === tripId); if (!trip || !confirm(`“${trip.title}” 여행을 삭제할까요?`)) return;
    registry.trips = registry.trips.filter(item => item.id !== tripId); if (registry.activeId === tripId) registry.activeId = registry.trips[0].id;
    for (const base of ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1']) localStorage.removeItem(storageKey(base, tripId));
    saveRegistry(); if (activeTrip.id === tripId) location.reload(); else renderTrips();
  }
  document.querySelector('#trip-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const startDate = document.querySelector('#trip-start-date').value; const endDate = document.querySelector('#trip-end-date').value;
    if (endDate < startDate) { document.querySelector('#trip-editor-error').textContent = '종료일은 시작일보다 빠를 수 없습니다.'; return; }
    const input = {title:document.querySelector('#trip-title').value.trim(), destination:document.querySelector('#trip-destination').value.trim(), country:document.querySelector('#trip-country').value.trim(), startDate, endDate, updatedAt:new Date().toISOString()};
    if (editingId) registry.trips = registry.trips.map(trip => trip.id === editingId ? {...trip, ...input} : trip);
    else { const trip = {id:makeId(), ...input, template:false, createdAt:new Date().toISOString()}; registry.trips.push(trip); registry.activeId = trip.id; }
    saveRegistry(); editorDialog.close(); location.reload();
  });
  document.querySelector('#trip-list-open').addEventListener('click', () => { renderTrips(); listDialog.showModal(); });
  document.querySelector('#trip-list-close').addEventListener('click', () => listDialog.close());
  document.querySelector('#trip-create').addEventListener('click', () => openEditor());
  document.querySelector('#trip-editor-close').addEventListener('click', () => editorDialog.close());
  document.querySelector('#trip-editor-cancel').addEventListener('click', () => { editorDialog.close(); renderTrips(); listDialog.showModal(); });
})();
