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
  let placeView = 'unscheduled';
  let externalPlaceResults = [];
  let placeSearchTimer = 0;
  let placeSearchSequence = 0;
  let state = {places:[], schedule:[]};
  try {
    const legacy = window.MYTRIP_ACTIVE_TRIP?.template ? localStorage.getItem('mytrip-user-planner-v1') : null;
    const saved = JSON.parse(localStorage.getItem(storageKey) || legacy || 'null');
    if (saved?.places && saved?.schedule) state = saved;
  } catch (_) { state = {places:[], schedule:[]}; }
  state.schedule = state.schedule.map((item, index) => ({order:index, travelMode:'', travelMinutes:0, ...item}));

  const placeDialog = $('#place-editor-dialog');
  const scheduleDialog = $('#schedule-editor-dialog');
  const save = () => { localStorage.setItem(storageKey, JSON.stringify(state)); window.dispatchEvent(new Event('mytrip:data-changed')); };
  const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let migratedBuiltInSchedules = false;
  const migratedPlaceIds = new Map();
  for (const item of state.schedule) {
    const source = builtInPlaces[item.placeId];
    if (!source) continue;
    let localId = migratedPlaceIds.get(item.placeId) || state.places.find(place => place.sourceId === item.placeId)?.id;
    if (!localId) {
      localId = id('place'); migratedPlaceIds.set(item.placeId, localId);
      state.places.push({id:localId, sourceId:item.placeId, name:source.name || '', type:source.type || '기타', country:window.MYTRIP_ACTIVE_TRIP?.country || '', address:source.address || source.area || '', localName:'', phone:source.phone || '', website:source.source || source.booking || '', lat:source.coordinates?.lat ?? null, lon:source.coordinates?.lon ?? null, checkedAt:'', note:source.note || '', updatedAt:new Date().toISOString()});
    }
    item.placeId = localId; migratedBuiltInSchedules = true;
  }
  if (migratedBuiltInSchedules) save();
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
  const makeButton = (label, className, action, disabled = false) => { const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label; button.disabled = disabled; button.addEventListener('click', action); return button; };
  const makeLink = ({label, href}) => { const anchor = document.createElement('a'); anchor.className = 'button secondary'; anchor.textContent = `${label} ↗`; anchor.href = href; anchor.target = '_top'; anchor.rel = 'noreferrer'; return anchor; };

  function renderPlaces() {
    const grid = $('#user-place-grid');
    const search = ($('#user-place-search')?.value || '').trim().toLowerCase(); const scheduledIds=new Set(state.schedule.map(item=>item.placeId));
    const visible = state.places.filter(place => (placeView === 'all' || !scheduledIds.has(place.id)) && (!search || [place.name, place.localName, place.type, place.country, place.address, place.note].join(' ').toLowerCase().includes(search)));
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
    $('#user-place-empty').hidden = visible.length > 0;
    if (!state.places.length) $('#user-place-empty').textContent = '아직 저장한 장소가 없어요.';
    else if (placeView === 'unscheduled' && !visible.length && !search) $('#user-place-empty').textContent = '모든 저장 장소가 일정에 들어가 있어요. 전체에서 장소 정보를 확인할 수 있어요.';
    else if (!visible.length) $('#user-place-empty').textContent = '검색 조건에 맞는 저장 장소가 없어요.';
  }

  function renderSchedule() {
    const schedule = state.schedule.filter(item => item.day === activeDay).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.time.localeCompare(b.time));
    $('#user-schedule-title').textContent = `${dayLabels[activeDay]} 일정`;
    const totalMinutes = schedule.reduce((sum, item, index) => sum + (Number(item.duration) || 0) + (index ? Number(item.travelMinutes) || 0 : 0), 0);
    $('#schedule-day-summary').textContent = schedule.length ? `${schedule.length}곳 · 체류·이동 약 ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분` : '';
    const warnings = [];
    schedule.forEach((item, index) => {
      const next = schedule[index + 1]; if (!next) return;
      const [hour, minute] = item.time.split(':').map(Number); const [nextHour, nextMinute] = next.time.split(':').map(Number);
      const readyAt = hour * 60 + minute + (Number(item.duration) || 0) + (Number(next.travelMinutes) || 0); const nextAt = nextHour * 60 + nextMinute;
      if (Number.isFinite(readyAt) && Number.isFinite(nextAt) && nextAt < readyAt) warnings.push(`${item.time} ${resolvedPlace(item.placeId)?.name || '일정'} 이후 ${readyAt - nextAt}분이 부족해요.`);
    });
    $('#schedule-warning').hidden = warnings.length === 0; $('#schedule-warning').textContent = warnings.join(' ');
    $('#user-schedule-empty').hidden = schedule.length > 0;
    $('#user-schedule-list').replaceChildren(...schedule.map((item, index) => {
      const place = resolvedPlace(item.placeId) || {name:'삭제된 장소', area:'', address:''};
      const row = document.createElement('li'); if (item.status !== 'planned') row.className = `is-${item.status}`;
      const time = document.createElement('span'); time.className = 'time'; time.textContent = item.time;
      const body = document.createElement('div'); body.className = 'stop user-schedule-stop';
      const titleRow=document.createElement('div'); titleRow.className='schedule-title-row'; const title = document.createElement('strong'); title.textContent = place.name; const primaryMap=mapLinks(place)[0]; const map=document.createElement('a'); map.className='schedule-map-link'; map.textContent=`${primaryMap.label} ↗`; map.href=primaryMap.href; map.target='_top'; map.rel='noreferrer'; titleRow.append(title,map);
      const meta = document.createElement('span'); meta.className = 'stop-area'; meta.textContent = `${place.area || place.address || '주소 미확인'} · ${item.duration}분${item.fixed ? ' · 고정' : ''}`;
      const note = document.createElement('span'); note.className = 'stop-note'; note.textContent = item.note || '';
      const actions = document.createElement('div'); actions.className = 'user-schedule-actions';
      actions.append(makeButton('↑', 'mini-action order-action', () => moveSchedule(item.id, -1), index === 0), makeButton('↓', 'mini-action order-action', () => moveSchedule(item.id, 1), index === schedule.length - 1), makeButton(item.status === 'done' ? '완료 취소' : '✓ 완료', 'mini-action', () => setScheduleStatus(item.id, item.status === 'done' ? 'planned' : 'done')), makeButton(item.status === 'skipped' ? '건너뜀 취소' : '건너뜀', 'mini-action', () => setScheduleStatus(item.id, item.status === 'skipped' ? 'planned' : 'skipped')), makeButton('편집', 'mini-action edit-action', () => openScheduleEditor(item.id)));
      body.append(titleRow, meta, note, actions); row.append(time, body);
      if (index < schedule.length - 1) { const next = schedule[index + 1]; const travel = document.createElement('span'); travel.className = 'travel-gap'; travel.textContent = next.travelMode && next.travelMinutes ? `${next.travelMode} · 약 ${next.travelMinutes}분` : next.travelMode ? `${next.travelMode} · 이동시간 미확인` : next.travelMinutes ? `이동수단 미확인 · 약 ${next.travelMinutes}분` : '이동 시간·수단 미확인'; row.append(travel); }
      return row;
    }));
  }

  function allSchedulePlaces() {
    return state.places.map(place => ({placeId:place.id, name:place.name, area:place.address, type:place.type, group:'저장한 장소'}));
  }
  function renderPlaceOptions(selected) {
    const options = allSchedulePlaces();
    const select = $('#schedule-place'); select.replaceChildren();
    for (const groupName of ['저장한 장소']) {
      const groupItems = options.filter(option => option.group === groupName); if (!groupItems.length) continue;
      const group = document.createElement('optgroup'); group.label = groupName;
      for (const item of groupItems) { const option = document.createElement('option'); option.value = item.placeId; option.textContent = item.name; option.selected = item.placeId === selected; group.append(option); }
      select.append(group);
    }
    if (selected) select.value = selected;
    renderPlacePicker($('#schedule-place-search')?.value || '', selected);
  }
  function renderPlacePicker(query = '', selected = value('#schedule-place')) {
    const normalized = query.trim().toLowerCase();
    const matches = allSchedulePlaces().filter(place => !normalized || `${place.name} ${place.area} ${place.type}`.toLowerCase().includes(normalized)).slice(0, 12);
    const resultBox=$('#schedule-place-results'); resultBox.replaceChildren();
    const heading=text=>{const el=document.createElement('p');el.className='schedule-result-heading';el.textContent=text;resultBox.append(el);};
    if(normalized && externalPlaceResults.length){heading('지도 검색 결과 · 선택하면 저장 후 일정에 연결');resultBox.append(...externalPlaceResults.map(result=>{const button=document.createElement('button');button.type='button';button.className='schedule-place-option external-place-option';const copy=document.createElement('span');const name=document.createElement('strong');name.textContent=result.name || result.display_name.split(',')[0];const meta=document.createElement('small');meta.textContent=result.display_name;copy.append(name,meta);button.append(copy);button.addEventListener('click',()=>saveExternalPlace(result));return button;}));}
    if(matches.length) heading(normalized?'이미 저장한 장소':'저장한 장소에서 선택');
    resultBox.append(...matches.map(place => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `schedule-place-option${place.placeId === selected ? ' is-selected' : ''}`;
      const copy = document.createElement('span'); const name = document.createElement('strong'); name.textContent = place.name; const meta = document.createElement('small'); meta.textContent = `${place.type} · ${place.area || '주소 미확인'}`; copy.append(name, meta);
      button.append(copy); button.addEventListener('click', () => selectSchedulePlace(place.placeId)); return button;
    }));
    if (!matches.length && (!normalized || !externalPlaceResults.length)) { const empty = document.createElement('p'); empty.className = 'schedule-picker-empty'; empty.textContent = normalized ? '지도 검색 결과를 불러오는 중이거나 결과가 없어요.' : '장소 이름이나 주소를 입력해 검색하세요.'; resultBox.append(empty); }
  }
  const countryCode=()=>{const country=String(window.MYTRIP_ACTIVE_TRIP?.country || '').toLowerCase();if(/한국|korea|kor/.test(country))return'kr';if(/일본|japan|jpn/.test(country))return'jp';return'';};
  const inferredType=result=>{const text=`${result.type} ${result.category} ${result.display_name}`.toLowerCase();if(/restaurant|food|cafe|bar|식당|카페/.test(text))return'식당';if(/hotel|hostel|숙소|호텔/.test(text))return'숙소';if(/shop|mall|store|쇼핑/.test(text))return'쇼핑';if(/station|airport|bus|rail|역|공항/.test(text))return'교통';return'관광';};
  async function searchExternalPlaces(query) {
    const sequence=++placeSearchSequence; $('#schedule-search-status').textContent='지도에서 장소를 검색하는 중…';
    try{const code=countryCode();const params=new URLSearchParams({format:'jsonv2',q:query,addressdetails:'1',limit:'6','accept-language':'ko'});if(code)params.set('countrycodes',code);const response=await fetch(`https://nominatim.openstreetmap.org/search?${params}`);if(!response.ok)throw new Error(String(response.status));const results=await response.json();if(sequence!==placeSearchSequence)return;const savedAddresses=new Set(state.places.map(place=>place.address));externalPlaceResults=results.filter(result=>!savedAddresses.has(result.display_name));$('#schedule-search-status').textContent=externalPlaceResults.length?`지도 검색 결과 ${externalPlaceResults.length}개`:'지도 검색 결과가 없어요. 검색어를 더 구체적으로 입력하세요.';renderPlacePicker(query);
    }catch(_){if(sequence!==placeSearchSequence)return;externalPlaceResults=[];$('#schedule-search-status').textContent='지도 검색을 불러오지 못했어요. 잠시 후 다시 시도하거나 아래에서 직접 입력하세요.';renderPlacePicker(query);}
  }
  function saveExternalPlace(result){const place={id:id('place'),name:result.name || result.display_name.split(',')[0],type:inferredType(result),country:result.address?.country || window.MYTRIP_ACTIVE_TRIP?.country || '',address:result.display_name,localName:'',phone:'',website:'',lat:Number(result.lat),lon:Number(result.lon),checkedAt:'',note:'지도 검색으로 저장',source:'OpenStreetMap',updatedAt:new Date().toISOString()};state.places.push(place);save();renderPlaces();externalPlaceResults=[];setValue('#schedule-place-search',place.name);renderPlaceOptions(place.id);selectSchedulePlace(place.id);$('#schedule-search-status').textContent='장소를 저장하고 일정에 연결했습니다.';}
  function selectSchedulePlace(placeId) {
    $('#schedule-place').value = placeId;
    const place = allSchedulePlaces().find(item => item.placeId === placeId);
    $('#schedule-selected-place').textContent = place ? `선택: ${place.name}` : '장소를 선택하세요';
    renderPlacePicker(value('#schedule-place-search'), placeId);
  }

  function openPlaceEditor(placeId = null) {
    editingPlaceId = placeId; const place = state.places.find(item => item.id === placeId);
    $('#place-editor-title').textContent = place ? '장소 편집' : '새 장소 등록'; $('#place-delete').hidden = !place;
    setValue('#place-name', place?.name); setValue('#place-type', place?.type || '관광'); setValue('#place-country', place?.country || window.MYTRIP_ACTIVE_TRIP?.country); setValue('#place-address', place?.address); setValue('#place-local-name', place?.localName); setValue('#place-phone', place?.phone); setValue('#place-website', place?.website); setValue('#place-lat', place?.lat); setValue('#place-lon', place?.lon); setValue('#place-checked-at', place?.checkedAt); setValue('#place-note', place?.note);
    placeDialog.showModal(); setTimeout(() => $('#place-name').focus(), 0);
  }
  function openScheduleEditor(scheduleId = null, placeId = null) {
    editingScheduleId = scheduleId; const item = state.schedule.find(candidate => candidate.id === scheduleId);
    $('#schedule-editor-title').textContent = item ? '일정 수정' : '일정에 장소 추가'; $('#schedule-delete').hidden = !item; $('#schedule-duplicate').hidden = !item;
    externalPlaceResults=[];$('#schedule-search-status').textContent='';setValue('#schedule-place-search', ''); const selectedPlace = placeId || item?.placeId || ''; renderPlaceOptions(selectedPlace); selectSchedulePlace(selectedPlace); const daySelect = $('#schedule-day'); daySelect.replaceChildren(...tripDays.map(day => { const option = document.createElement('option'); option.value = day.value; option.textContent = day.label; return option; })); setValue('#schedule-day', item?.day || activeDay); setValue('#schedule-time', item?.time || '10:00'); setValue('#schedule-duration', String(item?.duration ?? 60)); setValue('#schedule-travel-mode', item?.travelMode || ''); setValue('#schedule-travel-minutes', String(item?.travelMinutes ?? 0)); $('#schedule-fixed').checked = item?.fixed || false; setValue('#schedule-note', item?.note); updateTravelFields(item);
    scheduleDialog.showModal();
  }
  function updateTravelFields(item = state.schedule.find(candidate => candidate.id === editingScheduleId)) {
    const day = value('#schedule-day'); const ordered = state.schedule.filter(candidate => candidate.day === day).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); const hasPrevious = item ? ordered.findIndex(candidate => candidate.id === item.id) > 0 : ordered.length > 0;
    document.querySelectorAll('.schedule-travel-field').forEach(field => { field.hidden = !hasPrevious; });
    if (!hasPrevious) { setValue('#schedule-travel-mode', ''); setValue('#schedule-travel-minutes', '0'); }
  }
  function setScheduleStatus(scheduleId, status) { const item = state.schedule.find(candidate => candidate.id === scheduleId); if (item) item.status = status; save(); renderSchedule(); }
  function moveSchedule(scheduleId, direction) {
    const items = state.schedule.filter(item => item.day === activeDay).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); const index = items.findIndex(item => item.id === scheduleId); const target = items[index + direction]; if (!target) return;
    const current = items[index]; const order = current.order; current.order = target.order; target.order = order; save(); renderSchedule();
  }

  $('#place-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const latText = value('#place-lat'); const lonText = value('#place-lon'); const lat = latText ? Number(latText) : null; const lon = lonText ? Number(lonText) : null;
    if ((lat !== null && (lat < -90 || lat > 90)) || (lon !== null && (lon < -180 || lon > 180))) { alert('위도와 경도 범위를 확인해 주세요.'); return; }
    const input = {name:value('#place-name'), type:value('#place-type'), country:value('#place-country'), address:value('#place-address'), localName:value('#place-local-name'), phone:value('#place-phone'), website:value('#place-website'), lat, lon, checkedAt:value('#place-checked-at'), note:value('#place-note'), updatedAt:new Date().toISOString()};
    let savedId = editingPlaceId;
    if (editingPlaceId) state.places = state.places.map(place => place.id === editingPlaceId ? {...place, ...input} : place);
    else { savedId = id('place'); state.places.push({id:savedId, ...input}); }
    save(); placeDialog.close(); renderPlaces(); renderSchedule();
  });
  $('#schedule-editor-form').addEventListener('submit', event => {
    event.preventDefault(); const placeId = value('#schedule-place'); if (!placeId) { $('#schedule-selected-place').textContent = '장소를 먼저 선택해 주세요.'; $('#schedule-selected-place').classList.add('is-error'); return; } $('#schedule-selected-place').classList.remove('is-error');
    const input = {placeId, day:value('#schedule-day'), time:value('#schedule-time'), duration:Math.max(0, Number(value('#schedule-duration')) || 0), travelMode:value('#schedule-travel-mode'), travelMinutes:Math.max(0, Number(value('#schedule-travel-minutes')) || 0), fixed:$('#schedule-fixed').checked, note:value('#schedule-note'), status:'planned', updatedAt:new Date().toISOString()};
    if (editingScheduleId) state.schedule = state.schedule.map(item => item.id === editingScheduleId ? {...item, ...input, status:item.status} : item);
    else { const nextOrder = Math.max(-1, ...state.schedule.filter(item => item.day === input.day).map(item => item.order ?? 0)) + 1; state.schedule.push({id:id('schedule'), order:nextOrder, ...input}); }
    activeDay = input.day; save(); scheduleDialog.close(); renderSchedule();
  });
  $('#place-delete').addEventListener('click', () => { if (!editingPlaceId || !confirm('이 장소와 연결된 내 일정을 모두 삭제할까요?')) return; state.places = state.places.filter(place => place.id !== editingPlaceId); state.schedule = state.schedule.filter(item => item.placeId !== editingPlaceId); save(); placeDialog.close(); renderPlaces(); renderSchedule(); });
  $('#schedule-delete').addEventListener('click', () => { if (!editingScheduleId || !confirm('이 일정을 삭제할까요?')) return; state.schedule = state.schedule.filter(item => item.id !== editingScheduleId); save(); scheduleDialog.close(); renderSchedule(); });
  $('#schedule-duplicate').addEventListener('click', () => {
    const source = state.schedule.find(item => item.id === editingScheduleId); if (!source) return;
    state.schedule.filter(item => item.day === source.day && (item.order ?? 0) > (source.order ?? 0)).forEach(item => { item.order += 1; });
    const copy = {...source, id:id('schedule'), order:(source.order ?? 0) + 1, status:'planned', fixed:false, note:source.note ? `${source.note} · 복제` : '복제한 일정', updatedAt:new Date().toISOString()}; state.schedule.push(copy); save(); scheduleDialog.close(); renderSchedule(); openScheduleEditor(copy.id);
  });
  $('#place-add').addEventListener('click', () => openPlaceEditor()); $('#schedule-add').addEventListener('click', () => openScheduleEditor());
  $('#schedule-place-search').addEventListener('input', event => {const query=event.target.value.trim();externalPlaceResults=[];clearTimeout(placeSearchTimer);renderPlacePicker(query);if(query.length>=2)placeSearchTimer=setTimeout(()=>searchExternalPlaces(query),450);else $('#schedule-search-status').textContent='';});
  $('#schedule-day').addEventListener('change', () => updateTravelFields());
  document.querySelectorAll('[data-close-place-editor]').forEach(button => button.addEventListener('click', () => placeDialog.close()));
  document.querySelectorAll('[data-close-schedule-editor]').forEach(button => button.addEventListener('click', () => scheduleDialog.close()));
  $('#place-search')?.addEventListener('input', renderPlaces); $('#user-place-search').addEventListener('input',renderPlaces);
  $('#place-unscheduled-filter').addEventListener('click',()=>{placeView='unscheduled';$('#place-unscheduled-filter').setAttribute('aria-pressed','true');$('#place-all-filter').setAttribute('aria-pressed','false');renderPlaces();});
  $('#place-all-filter').addEventListener('click',()=>{placeView='all';$('#place-unscheduled-filter').setAttribute('aria-pressed','false');$('#place-all-filter').setAttribute('aria-pressed','true');renderPlaces();});
  window.addEventListener('mytrip:copy-place', event => {
    const source = event.detail?.place; if (!source) return;
    let place = state.places.find(item => item.sourceId === event.detail.sourceId);
    if (!place) {
      place = {id:id('place'), sourceId:event.detail.sourceId, name:source.name || '', type:source.type || '기타', country:isKorean(source) ? '한국' : '', address:source.address || '', localName:'', phone:source.phone || '', website:source.source || source.booking || '', lat:source.coordinates?.lat ?? null, lon:source.coordinates?.lon ?? null, checkedAt:'', note:source.note || '', updatedAt:new Date().toISOString()};
      state.places.push(place); save(); renderPlaces();
    }
    openPlaceEditor(place.id);
  });
  window.addEventListener('mytrip:add-alternative', event => { const placeId=event.detail?.placeId; if (placeId && state.places.some(place => place.id === placeId)) openScheduleEditor(null, placeId); });
  document.addEventListener('click', event => { const target = event.target.closest('[data-expanded-day], [data-user-day]'); const day = target?.dataset.expandedDay || target?.dataset.userDay; if (day) { activeDay = day; if (target.dataset.userDay) { document.querySelectorAll('[data-user-day]').forEach(button => button.setAttribute('aria-pressed', String(button === target))); } renderSchedule(); } });
  renderPlaces(); renderSchedule();
})();
