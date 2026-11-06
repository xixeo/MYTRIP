(() => {
  'use strict';
  const storageKey = window.MYTRIP_STORAGE_KEY?.('mytrip-user-planner-v1') || 'mytrip-user-planner-v1';
  const $ = selector => document.querySelector(selector);
  const builtInPlaces = window.MYTRIP_ACTIVE_TRIP?.template ? window.TRIP?.venues || {} : {};
  const tripDays = window.MYTRIP_TRIP_DAYS || [{value:'fri', label:'11월 6일 금요일'}];
  const dayLabels = Object.fromEntries(tripDays.map(day => [day.value, day.label]));
  let activeDay = tripDays[0].value;
  let editingPlaceId = null;
  let editingScheduleId = null;
  let state = {places:[], schedule:[]};
  try {
    const legacy = window.MYTRIP_ACTIVE_TRIP?.template ? localStorage.getItem('mytrip-user-planner-v1') : null;
    const saved = JSON.parse(localStorage.getItem(storageKey) || legacy || 'null');
    if (saved?.places && saved?.schedule) state = saved;
  } catch (_) { state = {places:[], schedule:[]}; }

  const placeDialog = $('#place-editor-dialog');
  const scheduleDialog = $('#schedule-editor-dialog');
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const value = selector => $(selector).value.trim();
  const setValue = (selector, next = '') => { $(selector).value = next ?? ''; };
  const resolvedPlace = placeId => state.places.find(place => place.id === placeId) || builtInPlaces[placeId];
  const isKorean = place => {
    const country = String(place.country || '').toLowerCase();
    if (country) return ['kr','kor','korea','south korea','대한민국','한국'].includes(country);
    const lat = Number(place.lat ?? place.coordinates?.lat); const lon = Number(place.lon ?? place.coordinates?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return lat >= 32.5 && lat <= 39.8 && lon >= 123.5 && lon <= 132;
    return /(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|대한민국|한국)/.test(`${place.area || ''} ${place.address || ''}`);
  };
  const mapLinks = place => {
    const query = place.address || place.query || place.name;
    const lat = Number(place.lat ?? place.coordinates?.lat); const lon = Number(place.lon ?? place.coordinates?.lon);
    if (isKorean(place)) {
      const naver = `https://m.map.naver.com/search?query=${encodeURIComponent(query)}`;
      const tmap = Number.isFinite(lat) && Number.isFinite(lon) ? `tmap://route?rGoName=${encodeURIComponent(place.name)}&rGoX=${lon}&rGoY=${lat}` : `tmap://search?name=${encodeURIComponent(query)}`;
      return [{label:'네이버 지도', href:naver}, {label:'티맵', href:tmap}];
    }
    const googleQuery = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat},${lon}` : query;
    return [{label:'Google Maps', href:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleQuery)}`}];
  };
  const makeButton = (label, className, action) => { const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label; button.addEventListener('click', action); return button; };
  const makeLink = ({label, href}) => { const anchor = document.createElement('a'); anchor.className = 'button secondary'; anchor.textContent = `${label} ↗`; anchor.href = href; anchor.target = '_top'; anchor.rel = 'noreferrer'; return anchor; };

  function renderPlaces() {
    const grid = $('#user-place-grid');
    const search = ($('#place-search')?.value || '').trim().toLowerCase();
    const visible = state.places.filter(place => !search || [place.name, place.localName, place.type, place.country, place.address, place.note].join(' ').toLowerCase().includes(search));
    grid.replaceChildren(...visible.map(place => {
      const card = document.createElement('article'); card.className = 'user-place-card';
      const head = document.createElement('div'); head.className = 'user-place-head';
      const copy = document.createElement('div'); const type = document.createElement('span'); type.className = 'pill'; type.textContent = place.type; const title = document.createElement('h4'); title.textContent = place.name; copy.append(type, title);
      head.append(copy, makeButton('편집', 'place-edit', () => openPlaceEditor(place.id)));
      const address = document.createElement('p'); address.className = 'user-place-address'; address.textContent = `${place.country || '국가 미확인'} · ${place.address}`;
      const note = document.createElement('p'); note.className = 'user-place-note'; note.textContent = place.note || '직접 확인 메모 없음';
      const verified = document.createElement('p'); verified.className = 'user-place-verified'; verified.textContent = place.checkedAt ? `직접 확인 ${place.checkedAt}` : '확인일 미입력';
      const actions = document.createElement('div'); actions.className = 'detail-links'; actions.append(...mapLinks(place).map(makeLink), makeButton('일정에 추가', 'button primary', () => openScheduleEditor(null, place.id)));
      card.append(head, address, note, verified, actions); return card;
    }));
    $('#user-place-empty').hidden = state.places.length > 0 && (visible.length > 0 || !search);
    if (state.places.length > 0 && visible.length === 0) { $('#user-place-empty').hidden = false; $('#user-place-empty').textContent = '검색 조건에 맞는 직접 등록 장소가 없어요.'; }
    else $('#user-place-empty').textContent = '아직 직접 등록한 장소가 없어요.';
  }

  function renderSchedule() {
    const schedule = state.schedule.filter(item => item.day === activeDay).sort((a, b) => a.time.localeCompare(b.time));
    $('#user-schedule-title').textContent = `${dayLabels[activeDay]} · 내가 추가한 일정`;
    $('#user-schedule-empty').hidden = schedule.length > 0;
    $('#user-schedule-list').replaceChildren(...schedule.map(item => {
      const place = resolvedPlace(item.placeId) || {name:'삭제된 장소', area:'', address:''};
      const row = document.createElement('li'); if (item.status !== 'planned') row.className = `is-${item.status}`;
      const time = document.createElement('span'); time.className = 'time'; time.textContent = item.time;
      const body = document.createElement('div'); body.className = 'stop user-schedule-stop';
      const title = document.createElement('strong'); title.textContent = place.name;
      const meta = document.createElement('span'); meta.className = 'stop-area'; meta.textContent = `${place.area || place.address || '주소 미확인'} · ${item.duration}분${item.fixed ? ' · 고정' : ''}`;
      const note = document.createElement('span'); note.className = 'stop-note'; note.textContent = item.note || '';
      const actions = document.createElement('div'); actions.className = 'user-schedule-actions';
      actions.append(makeButton(item.status === 'done' ? '완료 취소' : '방문 완료', 'mini-action', () => setScheduleStatus(item.id, item.status === 'done' ? 'planned' : 'done')), makeButton(item.status === 'skipped' ? '건너뜀 취소' : '건너뜀', 'mini-action', () => setScheduleStatus(item.id, item.status === 'skipped' ? 'planned' : 'skipped')), makeButton('수정', 'mini-action', () => openScheduleEditor(item.id)));
      body.append(title, meta, note, actions); row.append(time, body); return row;
    }));
  }

  function renderPlaceOptions(selected) {
    const options = [...Object.entries(builtInPlaces).map(([placeId, place]) => ({placeId, name:place.name, group:'기존 장소'})), ...state.places.map(place => ({placeId:place.id, name:place.name, group:'내 장소'}))];
    const select = $('#schedule-place'); select.replaceChildren();
    for (const groupName of ['내 장소', '기존 장소']) {
      const groupItems = options.filter(option => option.group === groupName); if (!groupItems.length) continue;
      const group = document.createElement('optgroup'); group.label = groupName;
      for (const item of groupItems) { const option = document.createElement('option'); option.value = item.placeId; option.textContent = item.name; option.selected = item.placeId === selected; group.append(option); }
      select.append(group);
    }
  }

  function openPlaceEditor(placeId = null) {
    editingPlaceId = placeId; const place = state.places.find(item => item.id === placeId);
    $('#place-editor-title').textContent = place ? '장소 편집' : '새 장소 등록'; $('#place-delete').hidden = !place;
    setValue('#place-name', place?.name); setValue('#place-type', place?.type || '관광'); setValue('#place-country', place?.country || window.MYTRIP_ACTIVE_TRIP?.country); setValue('#place-address', place?.address); setValue('#place-local-name', place?.localName); setValue('#place-phone', place?.phone); setValue('#place-website', place?.website); setValue('#place-lat', place?.lat); setValue('#place-lon', place?.lon); setValue('#place-checked-at', place?.checkedAt); setValue('#place-note', place?.note);
    placeDialog.showModal(); setTimeout(() => $('#place-name').focus(), 0);
  }
  function openScheduleEditor(scheduleId = null, placeId = null) {
    editingScheduleId = scheduleId; const item = state.schedule.find(candidate => candidate.id === scheduleId);
    $('#schedule-editor-title').textContent = item ? '일정 수정' : '일정에 장소 추가'; $('#schedule-delete').hidden = !item;
    renderPlaceOptions(item?.placeId || placeId); const daySelect = $('#schedule-day'); daySelect.replaceChildren(...tripDays.map(day => { const option = document.createElement('option'); option.value = day.value; option.textContent = day.label; return option; })); setValue('#schedule-day', item?.day || activeDay); setValue('#schedule-time', item?.time || '10:00'); setValue('#schedule-duration', String(item?.duration ?? 60)); $('#schedule-fixed').checked = item?.fixed || false; setValue('#schedule-note', item?.note);
    scheduleDialog.showModal();
  }
  function setScheduleStatus(scheduleId, status) { const item = state.schedule.find(candidate => candidate.id === scheduleId); if (item) item.status = status; save(); renderSchedule(); }

  $('#place-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const latText = value('#place-lat'); const lonText = value('#place-lon'); const lat = latText ? Number(latText) : null; const lon = lonText ? Number(lonText) : null;
    if ((lat !== null && (lat < -90 || lat > 90)) || (lon !== null && (lon < -180 || lon > 180))) { alert('위도와 경도 범위를 확인해 주세요.'); return; }
    const input = {name:value('#place-name'), type:value('#place-type'), country:value('#place-country'), address:value('#place-address'), localName:value('#place-local-name'), phone:value('#place-phone'), website:value('#place-website'), lat, lon, checkedAt:value('#place-checked-at'), note:value('#place-note'), updatedAt:new Date().toISOString()};
    if (editingPlaceId) state.places = state.places.map(place => place.id === editingPlaceId ? {...place, ...input} : place);
    else state.places.push({id:id('place'), ...input});
    save(); placeDialog.close(); renderPlaces(); renderSchedule();
  });
  $('#schedule-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const input = {placeId:value('#schedule-place'), day:value('#schedule-day'), time:value('#schedule-time'), duration:Math.max(0, Number(value('#schedule-duration')) || 0), fixed:$('#schedule-fixed').checked, note:value('#schedule-note'), status:'planned', updatedAt:new Date().toISOString()};
    if (editingScheduleId) state.schedule = state.schedule.map(item => item.id === editingScheduleId ? {...item, ...input, status:item.status} : item);
    else state.schedule.push({id:id('schedule'), ...input});
    activeDay = input.day; save(); scheduleDialog.close(); renderSchedule();
  });
  $('#place-delete').addEventListener('click', () => { if (!editingPlaceId || !confirm('이 장소와 연결된 내 일정을 모두 삭제할까요?')) return; state.places = state.places.filter(place => place.id !== editingPlaceId); state.schedule = state.schedule.filter(item => item.placeId !== editingPlaceId); save(); placeDialog.close(); renderPlaces(); renderSchedule(); });
  $('#schedule-delete').addEventListener('click', () => { if (!editingScheduleId || !confirm('이 일정을 삭제할까요?')) return; state.schedule = state.schedule.filter(item => item.id !== editingScheduleId); save(); scheduleDialog.close(); renderSchedule(); });
  $('#place-add').addEventListener('click', () => openPlaceEditor()); $('#schedule-add').addEventListener('click', () => openScheduleEditor());
  document.querySelectorAll('[data-close-place-editor]').forEach(button => button.addEventListener('click', () => placeDialog.close()));
  document.querySelectorAll('[data-close-schedule-editor]').forEach(button => button.addEventListener('click', () => scheduleDialog.close()));
  $('#place-search')?.addEventListener('input', renderPlaces);
  window.addEventListener('mytrip:copy-place', event => {
    const source = event.detail?.place; if (!source) return;
    let place = state.places.find(item => item.sourceId === event.detail.sourceId);
    if (!place) {
      place = {id:id('place'), sourceId:event.detail.sourceId, name:source.name || '', type:source.type || '기타', country:isKorean(source) ? '한국' : '', address:source.address || '', localName:'', phone:source.phone || '', website:source.source || source.booking || '', lat:source.coordinates?.lat ?? null, lon:source.coordinates?.lon ?? null, checkedAt:'', note:source.note || '', updatedAt:new Date().toISOString()};
      state.places.push(place); save(); renderPlaces();
    }
    openPlaceEditor(place.id);
  });
  document.addEventListener('click', event => { const target = event.target.closest('[data-expanded-day], [data-user-day]'); const day = target?.dataset.expandedDay || target?.dataset.userDay; if (day) { activeDay = day; if (target.dataset.userDay) { document.querySelectorAll('[data-user-day]').forEach(button => button.setAttribute('aria-pressed', String(button === target))); } renderSchedule(); } });
  renderPlaces(); renderSchedule();
})();
