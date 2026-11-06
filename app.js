(() => {
  'use strict';

  const {venues, friday, saturday, guides, backup} = window.TRIP;
  const parking = window.TRIP_PARKING || {};
  const menus = window.MENUS || {};
  const photos = window.TRIP_PHOTOS || {};
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
  const dayInfo = [
    ['fri','06','금요일','부산 → 오창','11월 6일 금요일'],
    ['sat','07','토요일','진천 → 대전','11월 7일 토요일'],
    ['sun','08','일요일','대전 → 대구 → 부산','11월 8일 일요일']
  ];
  const state = {
    day:'fri', groups:{fri:'all', sat:'all', sun:'all'},
    preview:{fri:'6', sat:'shop-angels', sun:'early'}, friChoices:{pohang:'6', eonyang:'2'},
    stops:{fri:new Set(), sat:new Set(), sun:new Set()}, stopTypes:{}, pickTypes:{},
    filter:'전체', limit:12
  };
  const allCourses = ['all','전체'];
  const courseGroups = {
    fri:[['pohang','영천'], ['eonyang','언양']],
    sat:['가는 길','쇼핑·공방','산책','늦은 점심','저녁','전시'].map(group => [group, group]),
    sun:[['bread','성심당 포장'], ['skip-bread','성심당 생략']]
  };
  const groupLabels = {fri:'금요일 경유지', sat:'토요일 코스 종류', sun:'일요일 성심당'};
  const sundayBuffet = [
    {id:'early', time:'18:00', depart:'20:00', arrival:'22:00–22:45'},
    {id:'late', time:'19:30', depart:'21:00', arrival:'23:00–23:45'}
  ];
  const dialog = $('#place-dialog');
  const menuTypes = ['식당','카페','베이커리','뷔페','야시장'];
  const activityTypes = ['산책','전시','쇼핑','공방'];
  const isMenu = place => menuTypes.includes(place.type);
  const mapTarget = window.self === window.top ? '' : '_top';
  const link = (href, name, className = 'secondary', target = '_top') => href
    ? '<a class="button ' + className + '" href="' + esc(href) + '"' +
      (target ? ' target="' + target + '"' : '') + ' rel="noreferrer">' + esc(name) + ' ↗</a>' : '';
  const naverSearch = query => 'https://m.map.naver.com/search?query=' + encodeURIComponent(query);
  const mapAddress = place => (place.address || '').split(' · ')[0].replace(/ (?:일대|주차장)$/, '').trim();
  const isKoreanPlace = place => {
    const country = String(place.country || '').trim().toLowerCase();
    if (country) return ['kr', 'kor', 'korea', 'south korea', '대한민국', '한국'].includes(country);
    const {lat, lon} = place.coordinates || {};
    if (Number.isFinite(lat) && Number.isFinite(lon)) return lat >= 32.5 && lat <= 39.8 && lon >= 123.5 && lon <= 132;
    return /(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|대한민국|한국)/.test([place.area, place.address, place.query].filter(Boolean).join(' '));
  };
  const placeQuery = place => place.query || mapAddress(place) || place.name;
  const naverMap = place => place.naverPlaceId
    ? 'https://m.place.naver.com/place/' + place.naverPlaceId + '/location'
    : naverSearch(placeQuery(place));
  const googleMap = place => {
    const {lat, lon} = place.coordinates || {};
    const query = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat},${lon}` : placeQuery(place);
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  };
  function tmap(place) {
    if (!place.coordinates) return 'tmap://search?name=' + encodeURIComponent(placeQuery(place));
    const {lon, lat} = place.coordinates;
    const name = encodeURIComponent(place.name);
    return 'tmap://route?' + (/Android/i.test(navigator.userAgent)
      ? 'goalname=' + name + '&goalx=' + lon + '&goaly=' + lat
      : 'rGoName=' + name + '&rGoX=' + lon + '&rGoY=' + lat);
  }
  const mapLinks = (place, primaryStyle = 'secondary') => isKoreanPlace(place)
    ? link(naverMap(place), '네이버 지도', primaryStyle, mapTarget) + link(tmap(place), '티맵', 'secondary', mapTarget)
    : link(googleMap(place), 'Google Maps', primaryStyle, mapTarget);

  const formatCourseNumber = index => String(index).padStart(2, '0');
  const card = (day, course, selected) =>
    '<button type="button" class="case-card" data-case="' + esc(course.id) + '" data-for="' + day +
    '" aria-controls="day-panel" aria-pressed="' + (course.id === selected) + '"><b>' +
    (course.index ? '<span class="case-index">' + esc(course.index) + '</span> ' : '') +
    esc(course.label) + '</b><span class="case-meta"><small>' + esc(course.subtitle) + '</small>' +
    (course.recommended ? '<span class="status-badge">추천</span>' : '') + '</span></button>';

  const caseList = (day, cards) =>
    '<div class="case-list" data-for-day="' + day + '">' + cards.join('') + '</div>';
  const caseGroup = (day, title, cards) =>
    '<section class="case-group"><h4>' + esc(title) + ' <span>' + cards.length + '가지</span></h4>' +
    caseList(day, cards) + '</section>';
  function subTabs(label, options, selected) {
    return '<p class="course-tabs-label">' + esc(label) + '</p><div class="sub-tabs" role="group" aria-label="' +
      esc(label) + '">' + options.map(([id, name]) =>
        '<button type="button" class="sub-tab" data-group="' + esc(id) +
        '" aria-controls="case-panel day-panel" aria-pressed="' + (id === selected) + '">' +
        esc(name) + '</button>').join('') + '</div>';
  }

  function fridayDetails(choice) {
    const [index, lunch, dinner, pub] = choice;
    const market = dinner === 'yukgeori';
    const seafood = pub === 'jeongchi';
    const tight = market && seafood;
    const lunchTime = lunch === 'eonyang' ? '13:30–13:45' : '14:05–14:20';
    const lunchStop = (lunch === 'eonyang' ? '언양' : '영천') + ' (' + venues[lunch].name + ')';
    const afterCheckIn = pub ? [
      [market ? (seafood ? '20:35' : '21:00') : (seafood ? '20:15' : '20:30'), pub, seafood ? '회·구이·해산물 · 20:50 주문 마감 기준' : '반반꼬막 또는 꼬막짬뽕'],
      ['식사 후',null,'오창 레스트호텔로 귀가','차를 두면 택시, 가져갔으면 대리 호출']
    ] : [];
    return {
      name: '경우 ' + formatCourseNumber(index) + ' · ' + lunchStop + ' → ' +
        (market ? '육거리시장' : '봉용불고기') + ' → ' + (pub ? venues[pub].name : '숙소 바로'),
      description: index === 6 ? '추천 · 영천 토렴 곰탕, 청주 파절이 불고기, 오창 꼬막 안주'
        : pub ? '곰탕 → 청주 2차 → 오창 숙소와 한잔' : '곰탕 → 청주 저녁 → 오창 레스트호텔',
      notice: tight ? '19:30 시장에서 출발하는 경우에 맞춘 안이야. 20:50 라스트오더에 늦을 것 같으면 꼬주망태 코스로 바꿔.' : '',
      rows: [
        ['10:00',null,'개인 일정','출발 전 일정'],
        ['10:55–11:00',null,'서면·전포에서 먼저 출발','차량 인수 장소까지 편도 약 30분 기준'],
        ['11:30','audio','오디오 수리 예약 희망 · 12:00 종료 예상'],
        ['12:30–12:35',null,'서면역 복귀','일행과 합류'],
        ['12:45','home','일행과 함께 출발'],
        [lunchTime,lunch,lunch === 'eonyang' ? '도착 예상 · 소머리곰탕' : '도착 예상 · 영천공설시장 토렴 소머리곰탕'],
        [market ? '19:00–' + (seafood ? '19:30' : '20:00') : '18:00–19:05', dinner, market ? (pub ? '야시장 시작에 맞춰 간식 · 새가덕순대는 대안' : '시장에서 저녁 · 식사 후 숙소로 이동') : '파절이 불고기 · 셀프볶음밥'],
        [market ? (seafood ? '20:00–20:20' : '20:30–20:50') : '19:30–19:55','rest','숙소 입실 · 차와 짐 두기'],
        ...afterCheckIn
      ]
    };
  }

  function saturdayDetails(choice) {
    const [key, group, title, description, rows, travelRows = [
      ['13:30',null,'진천에서 대전으로 출발','15:00–15:30 대전 도착 예상']
    ]] = choice;
    const shoppingAndClass = ['shop-angels','shop-perfume'].includes(key);
    return {
      name: title, description,
      notice: shoppingAndClass
        ? '백화점·공방을 넣으면 17시 오픈런은 다른 코스로 골라야 해. 17:15 체험은 희망 슬롯이고 대기가 길면 저녁은 화월통으로.'
        : group === '늦은 점심' ? '예식 식사를 가볍게 했을 때 맞는 코스야. 대전 도착 시각과 점심 영업을 먼저 확인.' : '',
      rows: [
        ['09:40','rest','짐 챙기고 호텔에서 출발'],
        ['10:20–10:35','church','교회 도착 목표 · 금천길 110'],
        ['11:00–13:00','church','11:00 현지결혼식 · 사진, 인사, 식사까지 예상'],
        ...travelRows,
        ...rows
      ]
    };
  }

  function sundayDetails(dinner, bread) {
    const breadStops = bread ? [['13:05–14:00','sung','대기가 짧으면 빵 포장 · 14:00 출발 목표']] : [];
    return {
      name: '누리손만두 → ' + (bread ? '성심당 포장 → ' : '성심당 생략 → ') +
        venues.buffet.name + ' ' + dinner.time + ' 희망',
      description: bread ? '성심당 대기가 짧아 포장하는 경우' : '성심당 대기가 길어 바로 대구로 가는 경우',
      notice: '호텔 공식 일요일 저녁 운영은 18:00–21:00. 실제 예약 가능 시간과 빈자리를 확인해 주세요.',
      rows: [
        ['11:20–11:30','majung','체크아웃 준비 · 짐과 차 챙기기'],
        ['12:00','nuri','예약 · 치즈비빔만두와 고기손만두'],
        ...breadStops,
        [bread ? '14:00' : '13:30',null,'대전에서 대구로 출발',bread ? '성심당 포장 후 출발 목표' : '성심당 대기가 길면 포장 생략'],
        [bread ? '16:15–16:45' : '15:45–16:15',null,'대구 도착 예상','교통과 휴게소 체류에 따라 변동'],
        [dinner.time,'buffet','입장 희망 시각 · 11/8 실제 예약 가능 시간과 좌석 확인'],
        [dinner.arrival,'busan',dinner.depart + ' 대구 출발 기준 도착 예상']
      ]
    };
  }

  const makeCourse = (id, group, label, subtitle, detail, flags = {}) => ({
    id:String(id), group, label, subtitle, detail,
    stops:new Set(detail.rows.map(([, place]) => place).filter(Boolean)),
    ...flags
  });
  const chosenSaturday = window.EXPANDED_TRIP.sat;
  const courses = {
    fri:friday.map(choice => {
      const [id, lunch, dinner, pub] = choice;
      return makeCourse(id, lunch, venues[dinner].name, pub ? venues[pub].name : '식사 후 숙소 바로',
        fridayDetails(choice), {index:formatCourseNumber(id), recommended:id === 6});
    }),
    sat:[
      ...saturday.map(choice => {
        const [id, group, title, description] = choice;
        return makeCourse(id, group, title, description, saturdayDetails(choice));
      }),
      makeCourse('soje-hyeonam', '저녁', '소제동 + 현암뚝방구이', '카페와 연탄구이 뒤 화월통', {
        name:chosenSaturday.title, description:'이번에 고른 토요일 코스', notice:chosenSaturday.note,
        rows:chosenSaturday.rows
      })
    ],
    sun:[true, false].flatMap(bread => sundayBuffet.map(dinner =>
      makeCourse(dinner.id + (bread ? '' : '-skip'), bread ? 'bread' : 'skip-bread',
        dinner.time + ' 뷔페 희망', '부산 ' + dinner.arrival + ' 예상', sundayDetails(dinner, bread))))
  };
  const courseById = (day, id) => courses[day].find(course => course.id === id);
  const isVenue = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(venues, id);
  const rowPlaces = rows => rows.map(([, id]) => id).filter(isVenue);
  const placesByDay = Object.fromEntries(dayInfo.map(([day]) => {
    const example = window.EXPANDED_TRIP[day];
    const coursePlaces = courseGroups[day].flatMap(([group]) => courses[day]
      .filter(course => course.group === group).flatMap(course => [...course.stops]));
    const branchPlaces = (example.branches || []).flatMap(branch => rowPlaces(branch.rows));
    const ids = [...coursePlaces, ...rowPlaces(example.rows), ...branchPlaces, ...backup[day]];
    return [day, [...new Set(ids.filter(isVenue))]];
  }));
  const tripStorageKey = 'mytrip-weekend-vol1:selection';
  const copyPicks = picks => Object.fromEntries(dayInfo.map(([day]) => [day, [...picks[day]]]));
  const hasPicks = picks => dayInfo.some(([day]) => picks[day].length > 0);

  function readSavedTrip() {
    let record;
    try {
      record = JSON.parse(window.localStorage.getItem(tripStorageKey));
    } catch {
      // A browser can restrict access to local storage.
    }
    return Object.fromEntries(dayInfo.map(([day]) => {
      const previous = record?.picks?.[day];
      if (record?.version === 2 && Array.isArray(previous)) return [day, previous.filter(isVenue)];
      if (record?.version === 1) {
        const course = courseById(day, previous);
        const places = course ? rowPlaces(course.detail.rows) : [];
        return [day, places.filter((id, index) => id !== places[index - 1])];
      }
      return [day, []];
    }));
  }

  let savedTrip = readSavedTrip();
  let tripPicks = copyPicks(savedTrip);

  function timelineRow([time, id, note, sub, person], showMap = false) {
    const place = venues[id];
    const personBadge = person ? '<span class="person-badge" data-person="' + esc(person) + '">' + esc(person) + '</span> ' : '';
    const heading = '<strong>' + personBadge + esc(place ? place.name : note) + '</strong>';
    const inner = place
      ? heading + '<span class="stop-area">' + esc(place.area) + '</span>' +
        '<span class="stop-note">' + esc(note || place.picks) + '</span>'
      : heading + '<span class="stop-note">' + esc(sub) + '</span>';
    return '<li><span class="time">' + esc(time) + '</span>' +
      (place ? '<button type="button" class="stop" data-place="' + id + '">' + inner + '</button>'
        : '<div class="move">' + inner + '</div>') +
      (place && showMap ? '<div class="expanded-map-links">' + mapLinks(place) +
        '<button type="button" class="button parking-button" data-parking="' + esc(id) +
        '" aria-label="' + esc(place.name) + ' 주차 정보">주차 정보</button></div>' : '') + '</li>';
  }

  let expandedDay = 'fri';
  function renderExpanded() {
    const detail = window.EXPANDED_TRIP[expandedDay];
    const current = dayInfo.find(([id]) => id === expandedDay);
    $('#expanded-tabs').innerHTML = dayInfo.map(([id, date, label, route]) =>
      '<button type="button" class="day-tab" data-expanded-day="' + id + '" aria-controls="expanded-panel" aria-pressed="' +
      (expandedDay === id) + '"><span class="day-number">' + date + '</span><span class="day-label">' + label +
      '</span><span class="day-route">' + esc(route) + '</span></button>').join('');
    const timeline = rows => '<ol class="timeline">' + rows.map(row => timelineRow(row, true)).join('') + '</ol>';
    const branches = (detail.branches || []).map(({title, rows}) =>
      '<section class="expanded-branch"><h4>' + esc(title) + '</h4>' + timeline(rows) + '</section>').join('');
    $('#expanded-panel').innerHTML =
      '<header class="itinerary-header"><p class="eyebrow">' + esc(current[4]) + '</p><h3>' +
      esc(detail.title) + '</h3></header>' + timeline(detail.rows) +
      (branches ? '<div class="expanded-branches">' + branches + '</div>' : '') +
      '<p class="notice">' + esc(detail.note) + '</p><div class="expanded-sources">' +
      detail.sources.map(([label, href]) => link(href, label)).join('') + '</div>';
  }

  function renderStopPicker(day, choices) {
    const selected = state.stops[day];
    const candidates = [...new Set(choices.flatMap(course => [...course.stops]))]
      .filter(id => choices.some(course => !course.stops.has(id)));
    const types = ['all', ...new Set(candidates.map(id => venues[id].type))];
    const type = state.stopTypes[day] || 'all';
    $('#stop-picker').hidden = candidates.length === 0;
    $('#stop-count').textContent = selected.size ? selected.size + '곳 선택' : '';
    $('#stop-types').innerHTML = types.map(key =>
      '<button type="button" class="chip" data-stop-type="' + esc(key) + '" aria-pressed="' +
      (key === type) + '">' + esc(key === 'all' ? '전체' : key) + '</button>').join('');
    $('#stop-options').innerHTML = candidates.filter(id => type === 'all' || venues[id].type === type)
      .map(id => '<button type="button" class="chip" data-stop="' + esc(id) + '" aria-pressed="' +
        selected.has(id) + '">' + esc(venues[id].name) + '</button>').join('');
    $('#stop-selection').textContent = selected.size
      ? '고른 장소 · ' + [...selected].map(id => venues[id].name).join(' · ') : '';
    $('#clear-stops').hidden = selected.size === 0;
  }

  function groupsFor(day) {
    const group = state.groups[day];
    return courseGroups[day].filter(([id]) => group === 'all' || id === group);
  }

  function renderDayTabs() {
    $('#day-tabs').innerHTML = dayInfo.map(([id, date, label, route]) =>
      '<button type="button" class="day-tab" data-day="' + id + '" aria-controls="choose-places my-trip day-panel" aria-pressed="' +
      (state.day === id) + '"><span class="day-number">' + date + '</span><span class="day-label">' + label +
      '</span><span class="day-route">' + esc(route) + '</span><span class="day-count">' +
      tripPicks[id].length + '곳 담음</span></button>').join('');
  }

  function renderPlacePicker() {
    const day = state.day;
    const places = placesByDay[day];
    const picked = tripPicks[day];
    const type = state.pickTypes[day] || 'all';
    const types = ['all', ...new Set(places.map(id => venues[id].type))];
    $('#trip-jump').textContent = '담은 장소 ' + picked.length + '곳 ↓';
    $('#pick-types').innerHTML = types.map(key =>
      '<button type="button" class="chip" data-pick-type="' + esc(key) + '" aria-pressed="' +
      (type === key) + '">' + esc(key === 'all' ? '전체' : key) + '</button>').join('');
    $('#pick-options').innerHTML = places.filter(id => type === 'all' || venues[id].type === type).map(id => {
      const place = venues[id];
      const count = picked.filter(stop => stop === id).length;
      return '<button type="button" class="pick-option' + (count ? ' is-picked' : '') + '" data-add-stop="' + esc(id) +
        '"><b>' + esc(place.name) + '</b><small>' + esc(place.type + ' · ' + place.area) + '</small><span>' +
        (count ? count + '회 담김 · 더 담기' : '+ 담기') + '</span></button>';
    }).join('');
  }

  function renderTripPicks() {
    const day = state.day;
    const picks = tripPicks[day];
    const dirty = dayInfo.some(([id]) => tripPicks[id].length !== savedTrip[id].length ||
      tripPicks[id].some((place, index) => place !== savedTrip[id][index]));
    $('#trip-title').textContent = dayInfo.find(([id]) => id === day)[2] + ' 방문 순서';
    $('#pick-count').textContent = picks.length + '곳';
    $('#empty-picks').hidden = picks.length > 0;
    $('#trip-picks').innerHTML = picks.map((id, index) => {
      const name = esc(venues[id].name);
      return '<li><button type="button" class="trip-pick" data-place="' + esc(id) + '"><span>' +
        formatCourseNumber(index + 1) + '</span><b>' + name + '</b></button>' +
        '<button class="trip-pick-action" type="button" data-move-stop="' + index + '" data-step="-1" aria-label="' +
        name + ' 위로"' + (index === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button class="trip-pick-action" type="button" data-move-stop="' + index + '" data-step="1" aria-label="' +
        name + ' 아래로"' + (index === picks.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button class="trip-pick-action" type="button" data-remove-stop="' + index + '" aria-label="' +
        name + ' 빼기">빼기</button></li>';
    }).join('');
    $('#save-trip').disabled = !dirty;
    $('#load-trip').hidden = !dirty || !hasPicks(savedTrip);
  }

  function renderBuilder() {
    renderDayTabs();
    renderPlacePicker();
    renderTripPicks();
  }

  function renderPlan() {
    const day = state.day;
    const group = state.groups[day];
    const current = dayInfo.find(([id]) => id === day);

    $('#course-tabs').innerHTML = subTabs(groupLabels[day], [allCourses, ...courseGroups[day]], group);
    $('#course-tabs').hidden = false;
    $('#friday-departure').hidden = day !== 'fri';

    const groups = groupsFor(day);
    const candidates = groups.flatMap(([id]) => courses[day].filter(course => course.group === id));
    renderStopPicker(day, candidates);
    const selectedStops = [...state.stops[day]];
    const choices = candidates.filter(course => selectedStops.every(id => course.stops.has(id)));
    const preferred = day === 'fri' ? state.friChoices[group] : '';
    const selected = choices.find(course => course.id === state.preview[day]) ||
      choices.find(course => course.id === preferred) || choices[0];
    if (selected) state.preview[day] = selected.id;

    const options = groups.map(([id, label]) => {
      const cards = choices.filter(course => course.group === id).map(course => card(day, course, selected?.id));
      const title = day === 'fri' ? label + ' · ' + venues[id].name : label;
      return cards.length ? caseGroup(day, title, cards) : '';
    }).join('');
    $('#case-panel').innerHTML = '<div class="case-head"><h3>코스 조합</h3><span>' + choices.length +
      '가지</span></div>' + (options || '<p class="notice">고른 장소를 모두 포함하는 코스가 없어요. 장소를 하나씩 골라 보세요.</p>');

    $('#guide-panel').innerHTML = '<h3>시간이 겹칠 때</h3>' +
      guides[day].map(([head, desc]) => '<details><summary>' + esc(head) + '</summary><p>' + esc(desc) + '</p></details>').join('');
    const panel = $('#day-panel');
    panel.hidden = !selected;
    if (!selected) return;

    const detail = selected.detail;
    const alternatives = backup[day];
    const planTitle = current[2] + (selected.recommended ? ' · 추천 코스' : ' · 여행 일정');
    panel.innerHTML =
      '<header class="itinerary-header"><div class="itinerary-top"><p class="eyebrow">' + esc(current[4]) +
      '</p><a class="case-return" href="#case-panel">코스 목록 ↑</a></div><h3>' + esc(planTitle) +
      '</h3><p class="itinerary-course">' + esc(detail.name) + '</p><p class="itinerary-description">' +
      esc(detail.description) + '</p></header>' +
      (detail.notice ? '<p class="notice">' + esc(detail.notice) + '</p>' : '') +
      '<ol class="timeline">' + detail.rows.map(row => timelineRow(row)).join('') + '</ol>' +
      (alternatives.length ? '<div class="backup"><p>근처 대안과 비교 후보</p><div class="chips">' +
        alternatives.map(id => '<button type="button" class="chip" data-place="' + id + '">' + esc(venues[id].name) + '</button>').join('') +
        '</div></div>' : '');
  }

  function focusCourse() {
    const panel = $('#day-panel');
    panel.focus({preventScroll:true});
    panel.scrollIntoView({block:'start'});
  }

  const featured = ['shinsegae','perfume','angels','daecheong','eonyang','pohang','bongyong','kkoju','gwangcheon','taehwa','sung','buffet'];
  const directory = [...new Set([...featured, ...Object.keys(venues)])];
  const filterNames = ['전체','맛집·메뉴','쇼핑·공방','산책·전시','숙소·이동'];
  const compact = value => value.toLowerCase().replace(/\s/g, '');
  const matchesType = place => {
    if (state.filter === '맛집·메뉴') return isMenu(place);
    if (state.filter === '쇼핑·공방') return ['쇼핑','공방'].includes(place.type);
    if (state.filter === '산책·전시') return ['산책','전시'].includes(place.type);
    if (state.filter === '숙소·이동') return !isMenu(place) && !activityTypes.includes(place.type);
    return true;
  };
  function picture(id, place, isDetail) {
    const photo = photos[place.photoKey || id];
    if (!photo) return '';
    const img = '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="' + esc(photo[0]) + '" alt="' + esc(isDetail ? place.name + ' 사진' : '') + '" data-photo>';
    if (!isDetail) return img;
    return '<figure class="detail-photo">' + img + '<figcaption><a href="' + esc(photo[1]) +
      '" target="_top" rel="noreferrer">사진 · ' + esc(photo[2]) + '</a></figcaption></figure>';
  }

  function tile(id) {
    const place = venues[id];
    const kind = isMenu(place) ? 'food' : activityTypes.includes(place.type) ? 'activity' : 'location';
    const art = {
      food:'<path d="M8 26h32c0 8-7 14-16 14S8 34 8 26Zm12-6c-4-4 4-6 0-10m8 10c-4-4 4-6 0-10"/>',
      activity:'<path d="M10 36 20 16l7 13 5-9 6 16H10Z"/><circle cx="34" cy="12" r="3"/>',
      location:'<path d="M34 20c0 8-10 18-10 18S14 28 14 20a10 10 0 0 1 20 0Z"/><circle cx="24" cy="20" r="3"/>'
    }[kind];
    return '<button class="place-card" type="button" data-place="' + id + '" data-kind="' + kind +
      '"><span class="tile-image"><span class="tile-placeholder"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + art +
      '</svg></span>' + picture(id, place, false) + '</span><span class="place-card-copy"><span class="pill">' + esc(place.type) +
      '</span><b>' + esc(place.name) + '</b><small>' + esc(place.area) + '</small>' +
      (place.picks ? '<small class="picks">' + esc(place.picks) + '</small>' : '') + '</span></button>';
  }

  function renderDirectory() {
    const query = compact($('#place-search').value);
    $('#place-filters').innerHTML = filterNames.map(filter =>
      '<button class="chip" type="button" data-filter="' + esc(filter) + '" aria-pressed="' + (state.filter === filter) +
      '">' + esc(filter) + '</button>').join('');
    const filtered = directory.filter(id => {
      const place = venues[id];
      const words = [place.name, place.area, place.address, place.type, place.picks, ...(menus[id] || []).map(([name]) => name)].join(' ');
      return matchesType(place) && compact(words).includes(query);
    });
    $('#place-grid').innerHTML = filtered.slice(0, state.limit).map(tile).join('') ||
      '<p class="no-results">검색 결과가 없어. 지역이나 메뉴 이름을 바꿔서 찾아봐.</p>';
    const more = $('#more-places');
    more.hidden = filtered.length <= state.limit;
    more.textContent = '장소 더 보기 (' + Math.min(state.limit, filtered.length) + '/' + filtered.length + ')';
  }

  function parkingSection(id) {
    const place = venues[id];
    const {
      facility = '전용·건물 주차장 확인 필요',
      support = '무료 주차나 할인 조건은 공개 안내에서 확인하기 어려워요.',
      lots = [], sources = [], nearby = place.area.split(' · ')[0]
    } = parking[id] || {};
    const options = lots.map(lot => '<li><b>' + esc(lot.name) + '</b>' +
      (lot.address ? '<p class="parking-address">' + esc(lot.address) + '</p>' : '') +
      '<p class="parking-note">' + esc(lot.note) + '</p><div class="parking-links">' +
      mapLinks(lot) + link(lot.source, '요금·운영 안내') +
      '</div></li>').join('');
    return '<section class="detail-parking" aria-labelledby="detail-parking-title">' +
      '<h3 id="detail-parking-title">주차 정보</h3><dl class="parking-facts">' +
      '<div><dt>주차장</dt><dd>' + esc(facility) + '</dd></div>' +
      '<div><dt>무료·주차비 지원</dt><dd>' + esc(support) + '</dd></div></dl>' +
      (options ? '<h4>주차할 곳</h4><ul class="parking-options">' + options + '</ul>' : '') +
      '<div class="parking-links">' +
      mapLinks({name: nearby + ' 주차장', address: nearby, country: place.country}) +
      sources.map(([label, href]) => link(href, label)).join('') +
      '</div><p class="parking-address">2026.11.06 공개 안내 기준 · 현장 안내 우선</p></section>';
  }

  function showPlaceDialog(content) {
    $('#place-detail').innerHTML = content;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('.dialog-close').focus();
  }

  function openPlace(id, parkingOnly = false) {
    const place = venues[id];
    const heading = '<header class="detail-head"><span class="pill">' + esc(place.type) +
      '</span><h2 id="detail-title">' + esc(place.name) + '</h2><p class="detail-area">' +
      esc(place.area) + '</p><p class="detail-address">' + esc(place.address) + '</p></header>';
    if (parkingOnly) return showPlaceDialog(heading + parkingSection(id));
    const entries = menus[id] || [];
    const catalog = place.catalog ? link(place.catalog, '공식 빵 목록') : '';
    const phone = place.phone ? '<a class="button secondary" href="tel:' + esc(place.phone) + '">전화 ' + esc(place.phone) + '</a>' : '';
    const labels = {공방:'체험·가격',뷔페:'요금과 메뉴 구성',야시장:'먹거리 안내',베이커리:'공개 제품·가격'};
    const menuNote = {공방:'공개 체험 정보 기준 · 실제 예약 가능 시간과 비용은 매장 확인.',
      뷔페:'공개 요금과 메뉴 예시 · 방문일 메뉴는 호텔 안내 확인.',
      야시장:'부스와 메뉴는 행사 당일 구성이 달라질 수 있어.',
      베이커리:'공개된 대표 제품 기준 · 본점 재고와 품목은 방문일에 달라질 수 있어.'};
    const information = entries.length ?
      '<section class="detail-menu"><h3>' + esc(labels[place.type] || '공개 메뉴판') + '</h3><p class="menu-note">' +
      esc(menuNote[place.type] || '메뉴와 가격은 공개 자료 기준 · 방문일 가격과 품절은 매장 확인.') +
      '</p><ul class="menu-list">' + entries.map(([item, price]) => '<li><span>' + esc(item) +
      '</span><span class="menu-price">' + esc(price || '매장 확인') + '</span></li>').join('') + '</ul></section>' : '';
    const sourceLabel = isMenu(place) && !['야시장','뷔페'].includes(place.type) ? '메뉴판·사진 원문' : '상세 안내·사진';
    const shoppingSuggestions = (place.shoppingSuggestions || []).map((item, index) =>
      '<button type="button" class="button secondary" data-shopping-place="' + esc(id) + '" data-shopping-index="' + index + '">+ ' + esc(item.name) + '</button>').join('');
    const shoppingSection = shoppingSuggestions ? '<section class="detail-shopping"><h3>쇼핑리스트에 담기</h3><p>이 장소에서 살 만한 항목이에요.</p><div class="detail-links">' + shoppingSuggestions + '</div></section>' : '';
    const mapUrl = isKoreanPlace(place) ? naverMap(place) : googleMap(place);
    const addressUrl = isKoreanPlace(place) ? naverSearch(mapAddress(place)) : googleMap({...place, query: mapAddress(place)});
    showPlaceDialog(heading +
      '<p class="detail-note">' + esc(place.note) + '</p>' +
      (place.picks ? '<p class="menu-pick">' + esc(place.picks) + '</p>' : '') +
      '<div class="detail-links">' + mapLinks(place, 'primary') +
      (addressUrl !== mapUrl ? link(addressUrl, '주소로 검색', 'secondary', mapTarget) : '') +
      link(place.menuSource || place.source,sourceLabel) +
      (place.menuSource && place.source !== place.menuSource ? link(place.source,'장소 안내') : '') +
      link(place.booking,'예약 화면') + catalog + phone + '</div>' +
      shoppingSection + parkingSection(id) + picture(id, place, true) + information);
  }

  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-photo')) {
      (event.target.closest('figure') || event.target).hidden = true;
    }
  }, true);

  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    const data = target.dataset;
    if (data.shoppingPlace) {
      const place = venues[data.shoppingPlace];
      const item = place?.shoppingSuggestions?.[Number(data.shoppingIndex)];
      if (item) window.dispatchEvent(new CustomEvent('mytrip:add-shopping', {detail:{...item, store:place.name, quantity:1, placeId:data.shoppingPlace}}));
      dialog.close();
      return;
    }
    if (data.expandedDay && data.expandedDay !== expandedDay) {
      expandedDay = data.expandedDay;
      renderExpanded();
      return $('[data-expanded-day="' + expandedDay + '"]').focus({preventScroll:true});
    }
    if (data.parking && venues[data.parking]) return openPlace(data.parking, true);
    if (data.place && venues[data.place]) return openPlace(data.place);
    if (data.day && data.day !== state.day) {
      state.day = data.day;
      renderBuilder();
      renderPlan();
      return $('[data-day="' + data.day + '"]').focus({preventScroll:true});
    }
    if (data.case && data.for === state.day) {
      const day = state.day;
      state.preview[day] = data.case;
      if (day === 'fri') state.friChoices[courseById(day, data.case).group] = data.case;
      renderPlan();
      return focusCourse();
    }
    if (data.group && target.getAttribute('aria-pressed') !== 'true') {
      state.groups[state.day] = data.group;
      state.stops[state.day].clear();
      state.stopTypes[state.day] = 'all';
      renderPlan();
      return $('[data-group="' + data.group + '"]').focus({preventScroll:true});
    }
    if (data.stopType) {
      state.stopTypes[state.day] = data.stopType;
      renderStopPicker(state.day, groupsFor(state.day)
        .flatMap(([id]) => courses[state.day].filter(course => course.group === id)));
      return $('[data-stop-type="' + data.stopType + '"]').focus({preventScroll:true});
    }
    if (data.stop) {
      const selected = state.stops[state.day];
      if (selected.has(data.stop)) selected.delete(data.stop);
      else selected.add(data.stop);
      renderPlan();
      return $('[data-stop="' + data.stop + '"]').focus({preventScroll:true});
    }
    if (target.id === 'clear-stops') {
      state.stops[state.day].clear();
      renderPlan();
      return $('#stop-picker summary').focus({preventScroll:true});
    }
    if (data.pickType) {
      state.pickTypes[state.day] = data.pickType;
      renderPlacePicker();
      return $('[data-pick-type="' + data.pickType + '"]').focus({preventScroll:true});
    }
    const picks = tripPicks[state.day];
    if (data.addStop && placesByDay[state.day].includes(data.addStop)) {
      picks.push(data.addStop);
      $('#trip-status').textContent = '장소를 담았어요. 내 코스 저장을 누르면 순서가 저장돼요.';
      renderBuilder();
      return $('[data-add-stop="' + data.addStop + '"]').focus({preventScroll:true});
    }
    if (data.moveStop !== undefined) {
      const index = Number(data.moveStop);
      const next = index + Number(data.step);
      if (!picks[index] || !picks[next]) return;
      [picks[index], picks[next]] = [picks[next], picks[index]];
      $('#trip-status').textContent = '방문 순서를 바꿨어요.';
      renderTripPicks();
      return $('#trip-picks').children[next].querySelector('.trip-pick').focus({preventScroll:true});
    }
    if (data.removeStop !== undefined) {
      const index = Number(data.removeStop);
      if (!picks[index]) return;
      picks.splice(index, 1);
      $('#trip-status').textContent = '장소를 뺐어요.';
      renderBuilder();
      const row = $('#trip-picks').children[Math.min(index, picks.length - 1)];
      return (row?.querySelector('.trip-pick') || $('#trip-jump')).focus({preventScroll:true});
    }
    if (target.id === 'save-trip') {
      try {
        window.localStorage.setItem(tripStorageKey, JSON.stringify({version:2, picks:tripPicks}));
      } catch {
        $('#trip-status').textContent = '이 화면에서 저장할 수 없어요. 링크를 브라우저에서 열어 다시 시도해 주세요.';
        return;
      }
      savedTrip = copyPicks(tripPicks);
      $('#trip-status').textContent = hasPicks(savedTrip) ? '날짜별 장소와 순서를 저장했어요.' : '저장한 코스를 비웠어요.';
      return renderTripPicks();
    }
    if (target.id === 'load-trip') {
      tripPicks = copyPicks(savedTrip);
      $('#trip-status').textContent = '저장한 코스를 불러왔어요.';
      return renderBuilder();
    }
    if (data.filter && data.filter !== state.filter) {
      state.filter = data.filter;
      state.limit = 12;
      renderDirectory();
      return [...document.querySelectorAll('[data-filter]')].find(button => button.dataset.filter === data.filter).focus({preventScroll:true});
    }
    if (target.id === 'more-places') {
      const priorLimit = state.limit;
      state.limit += 16;
      renderDirectory();
      return $('#place-grid').children[priorLimit]?.focus({preventScroll:true});
    }
    if (target.classList.contains('dialog-close')) dialog.close();
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  $('#place-search').addEventListener('input', () => {
    state.limit = 12;
    renderDirectory();
  });

  renderExpanded();
  renderBuilder();
  renderPlan();
  renderDirectory();
  if (hasPicks(savedTrip)) $('#trip-status').textContent = '저장한 코스의 장소를 불러왔어요.';
})();
