(() => {
  'use strict';
  const storageKey = window.MYTRIP_STORAGE_KEY?.('weekend-trip-shopping-v2') || 'weekend-trip-shopping-v2';
  const legacyStorageKey = 'weekend-trip-shopping-v1';
  const exchangeStorageKey = window.MYTRIP_STORAGE_KEY?.('mytrip-exchange-rates-v1') || 'mytrip-exchange-rates-v1';
  const rateMaxAge = 6 * 60 * 60 * 1000;
  const defaultCurrency = /일본|japan/i.test(window.MYTRIP_ACTIVE_TRIP?.country || '') ? 'JPY' : 'KRW';
  const $ = selector => document.querySelector(selector);
  const form = $('#shopping-form');
  const list = $('#shopping-list');
  if (!form || !list) return;
  const recommendations = Object.entries(window.MYTRIP_ACTIVE_TRIP?.template ? window.TRIP?.venues || {} : {}).flatMap(([placeId, place]) =>
    (place.shoppingSuggestions || []).map((item, index) => ({...item, id:`${placeId}-${index}`, placeId, store:place.name})));
  let recommendationFilter = '전체';
  let items = [];
  let exchangeRates = {};
  let exchangeLoading = false;
  let exchangeError = '';
  let listLimit = 12;
  let editingItemId = null;
  try {
    const legacy = window.MYTRIP_ACTIVE_TRIP?.template ? localStorage.getItem('weekend-trip-shopping-v2') || localStorage.getItem(legacyStorageKey) : null;
    const saved = JSON.parse(localStorage.getItem(storageKey) || legacy || '[]');
    if (Array.isArray(saved)) items = saved.map(item => ({category:'기타', note:'', currency:'KRW', imageUrl:'', ...item}));
  } catch (_) { items = []; }
  try { exchangeRates = JSON.parse(localStorage.getItem(exchangeStorageKey) || (window.MYTRIP_ACTIVE_TRIP?.template ? localStorage.getItem('mytrip-exchange-rates-v1') : null) || '{}'); } catch (_) { exchangeRates = {}; }
  const won = value => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const money = (value, currency = 'KRW') => new Intl.NumberFormat('ko-KR', {style:'currency', currency, maximumFractionDigits:['KRW','JPY'].includes(currency) ? 0 : 2}).format(Number(value || 0));
  const save = () => { localStorage.setItem(storageKey, JSON.stringify(items)); window.dispatchEvent(new Event('mytrip:data-changed')); };
  const saveRates = () => localStorage.setItem(exchangeStorageKey, JSON.stringify(exchangeRates));
  const make = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  const imageFallback = item => { const fallback=make('span','shopping-thumb-placeholder',item.category === '먹거리' ? '🍴' : item.category === '생활용품' ? '🧴' : '🛍'); fallback.setAttribute('role','img'); fallback.setAttribute('aria-label','상품 사진 미등록'); return fallback; };
  async function resizedImage(input) { const file=input?.files?.[0];if(!file)return'';if(file.size>8*1024*1024)throw new Error('사진은 8MB 이하만 등록할 수 있어요.');const url=URL.createObjectURL(file);try{const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});const scale=Math.min(1,640/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.78);}finally{URL.revokeObjectURL(url);} }
  const sameItem = candidate => items.some(item => !item.done && item.name === candidate.name && item.store === candidate.store);
  function addItem(input) {
    const existing = items.find(item => !item.done && item.name === input.name && item.store === input.store);
    if (existing) existing.quantity += input.quantity || 1;
    else items.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, category:'기타', note:'', currency:'KRW', quantity:1, price:0, done:false, ...input});
    save(); render();
  }
  const foreignCurrencies = () => [...new Set(items.map(item => item.currency || 'KRW').filter(currency => currency !== 'KRW'))];
  const convertedWon = item => {
    const currency = item.currency || 'KRW'; const subtotal = (Number(item.price) || 0) * item.quantity;
    if (currency === 'KRW') return subtotal;
    return exchangeRates[currency]?.rate ? subtotal * exchangeRates[currency].rate : null;
  };
  async function requestRates(force = false) {
    if (exchangeLoading) return;
    const now = Date.now();
    const targets = foreignCurrencies().filter(currency => force || !exchangeRates[currency] || now - exchangeRates[currency].fetchedAt > rateMaxAge);
    if (!targets.length) { renderExchangeStatus(); return; }
    exchangeLoading = true; exchangeError = ''; renderExchangeStatus();
    const results = await Promise.allSettled(targets.map(async currency => {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(currency)}&symbols=KRW`);
      if (!response.ok) throw new Error(`${currency} 환율 HTTP ${response.status}`);
      const data = await response.json(); const rate = Number(data.rates?.KRW);
      if (!Number.isFinite(rate)) throw new Error(`${currency} 환율 없음`);
      exchangeRates[currency] = {rate, date:data.date, fetchedAt:Date.now()};
    }));
    exchangeLoading = false;
    if (results.some(result => result.status === 'rejected')) exchangeError = '일부 환율을 불러오지 못해 마지막 저장값을 사용합니다.';
    saveRates(); render(true);
  }
  function renderExchangeStatus() {
    const currencies = foreignCurrencies();
    if (!currencies.length) { $('#exchange-status').textContent = '해외 통화를 입력하면 최신 기준환율로 원화 금액을 계산해요.'; return; }
    if (exchangeLoading) { $('#exchange-status').textContent = '최신 환율을 불러오는 중…'; return; }
    const details = currencies.map(currency => exchangeRates[currency] ? `1 ${currency} = ${won(exchangeRates[currency].rate)} (${exchangeRates[currency].date} 기준)` : `${currency} 환율 미확인`);
    $('#exchange-status').textContent = `${details.join(' · ')}${exchangeError ? ` · ${exchangeError}` : ''}`;
  }
  function renderRecommendations() {
    document.querySelector('.shopping-recommendations').hidden = recommendations.length === 0;
    const categories = ['전체', ...new Set(recommendations.map(item => item.category))];
    $('#shopping-recommend-filters').replaceChildren(...categories.map(category => {
      const button = make('button', 'chip', category); button.type = 'button'; button.setAttribute('aria-pressed', String(category === recommendationFilter));
      button.addEventListener('click', () => { recommendationFilter = category; renderRecommendations(); }); return button;
    }));
    const visible = recommendations.filter(item => recommendationFilter === '전체' || item.category === recommendationFilter);
    $('#shopping-recommend-list').replaceChildren(...visible.map(item => {
      const card = make('article', 'shopping-recommend-card');
      const top = make('div', 'shopping-recommend-top'); top.append(make('span', 'shopping-category', item.category), make('strong', '', item.name));
      const meta = make('p', 'shopping-recommend-meta', `${item.store} · ${item.price ? money(item.price, item.currency || 'KRW') : '가격 확인'}`);
      const note = make('p', 'shopping-recommend-note', item.note);
      const button = make('button', 'button secondary', sameItem(item) ? '담김 ✓' : '+ 쇼핑리스트'); button.type = 'button'; button.disabled = sameItem(item);
      button.addEventListener('click', () => addItem({name:item.name, store:item.store, category:item.category, price:item.price, currency:item.currency || 'KRW', quantity:1, note:item.note, placeId:item.placeId}));
      card.append(top, meta, note, button); return card;
    }));
  }
  function render(skipRateRequest = false) {
    list.replaceChildren();
    const query = ($('#shopping-list-search')?.value || '').trim().toLowerCase(); const statusFilter = $('#shopping-list-status')?.value || 'all';
    const visibleItems = items.filter(item => (!query || `${item.name} ${item.store} ${item.note}`.toLowerCase().includes(query)) && (statusFilter === 'all' || (statusFilter === 'done') === Boolean(item.done)));
    visibleItems.slice(0, listLimit).forEach(item => {
      const row = make('li', `shopping-item${item.done ? ' is-done' : ''}`);
      const thumb=make('div','shopping-thumb');
      if (item.imageUrl) { const img=document.createElement('img'); img.src=item.imageUrl; img.alt=`${item.name} 상품 사진`; img.loading='lazy'; img.addEventListener('error',()=>img.replaceWith(imageFallback(item))); thumb.append(img); } else thumb.append(imageFallback(item));
      const check = make('button', 'shopping-check', item.done ? '✓' : ''); check.type = 'button'; check.setAttribute('aria-label', `${item.name} ${item.done ? '구매 취소' : '구매 완료'}`);
      check.addEventListener('click', () => { item.done = !item.done; save(); render(); });
      const copy = make('div', 'shopping-copy'); const title = make('div', 'shopping-item-title'); title.append(make('span', 'shopping-category', item.sheetCategory || item.category || '기타'), make('strong', '', item.name)); copy.append(title); if(item.localName)copy.append(make('small','shopping-local-name',item.localName));
      const currency = item.currency || 'KRW'; const subtotal = (Number(item.price) || 0) * item.quantity; const converted = convertedWon(item);
      copy.append(make('span', '', [item.store, `${item.quantity}개`].filter(Boolean).join(' · ')));
      copy.append(make('small','shopping-local-price',item.price ? `현지 가격 · ${item.priceText || money(subtotal,currency)}` : `현지 가격 · ${item.priceText || '미입력'}`));
      if (currency !== 'KRW' && item.price) copy.append(make('small', 'shopping-conversion', converted === null ? '한국 가격 · 환산 중…' : `한국 가격 · 현재 기준 약 ${won(Math.round(converted))}`));
      else if (currency === 'KRW' && item.price) copy.append(make('small','shopping-conversion',`한국 가격 · ${won(subtotal)}`));
      if (item.note) copy.append(make('small', '', item.note));
      if(item.sourceUrl){const source=make('a','shopping-source','공식 정보 ↗');source.href=item.sourceUrl;source.target='_top';source.rel='noreferrer';copy.append(source);}
      const edit = make('button','shopping-edit','수정'); edit.type='button'; edit.addEventListener('click',()=>openEditor(item.id));
      const remove = make('button', 'shopping-remove', '삭제'); remove.type = 'button'; remove.addEventListener('click', () => { items = items.filter(candidate => candidate.id !== item.id); save(); render(); });
      const actions=make('div','shopping-item-actions'); actions.append(edit,remove); row.append(thumb,check,copy,actions); list.append(row);
    });
    const done = items.filter(item => item.done).length;
    $('#shopping-progress').textContent = `${done} / ${items.length}`;
    const converted = items.map(convertedWon); const knownTotal = converted.reduce((sum, amount) => sum + (amount ?? 0), 0); const pending = converted.some(amount => amount === null);
    $('#shopping-total').textContent = `${pending ? '약 ' : ''}${won(Math.round(knownTotal))}${pending ? ' +' : ''}`;
    $('#shopping-remaining').textContent = `${items.length - done}개`;
    $('#shopping-empty').hidden = items.length > 0; $('#shopping-clear-complete').hidden = done === 0;
    $('#shopping-list-tools').hidden = items.length === 0;
    $('#shopping-list-more').hidden = visibleItems.length <= listLimit; $('#shopping-list-more').textContent = `더 보기 (${visibleItems.length - listLimit}개)`;
    renderRecommendations(); renderExchangeStatus(); if (!skipRateRequest) requestRates();
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); const name = $('#shopping-name').value.trim(); if (!name) return;
    let imageUrl=$('#shopping-image').value.trim();try{imageUrl=await resizedImage($('#shopping-image-file')) || imageUrl;}catch(error){alert(error.message);return;}
    addItem({name, store:$('#shopping-store').value.trim(), category:$('#shopping-category').value, currency:$('#shopping-currency').value, quantity:Math.max(1, Number($('#shopping-quantity').value) || 1), price:Math.max(0, Number($('#shopping-price').value) || 0), imageUrl, note:$('#shopping-note').value.trim(), done:false});
    form.reset(); $('#shopping-quantity').value = '1'; $('#shopping-currency').value = defaultCurrency; $('#shopping-name').focus();
  });
  $('#shopping-clear-complete').addEventListener('click', () => { items = items.filter(item => !item.done); save(); render(); });
  $('#shopping-list-search').addEventListener('input', () => { listLimit = 12; render(true); });
  $('#shopping-list-status').addEventListener('change', () => { listLimit = 12; render(true); });
  $('#shopping-list-more').addEventListener('click', () => { listLimit += 12; render(true); });
  const editorDialog=$('#shopping-editor-dialog');
  function openEditor(itemId) { const item=items.find(candidate=>candidate.id===itemId); if(!item)return; editingItemId=itemId; $('#shopping-edit-name').value=item.name; $('#shopping-edit-store').value=item.store || ''; $('#shopping-edit-category').value=item.category || '기타'; $('#shopping-edit-currency').value=item.currency || defaultCurrency; $('#shopping-edit-quantity').value=String(item.quantity || 1); $('#shopping-edit-price').value=String(item.price || 0); $('#shopping-edit-image').value=/^https?:\/\//.test(item.imageUrl || '') ? item.imageUrl : ''; $('#shopping-edit-image-file').value=''; $('#shopping-edit-remove-image').checked=false; $('#shopping-edit-note').value=item.note || ''; editorDialog.showModal(); }
  $('#shopping-editor-form').addEventListener('submit',async event=>{ event.preventDefault(); const item=items.find(candidate=>candidate.id===editingItemId); if(!item)return;let imageUrl=$('#shopping-edit-remove-image').checked ? '' : item.imageUrl || '';const enteredUrl=$('#shopping-edit-image').value.trim();if(enteredUrl)imageUrl=enteredUrl;try{imageUrl=await resizedImage($('#shopping-edit-image-file')) || imageUrl;}catch(error){alert(error.message);return;} Object.assign(item,{name:$('#shopping-edit-name').value.trim(),store:$('#shopping-edit-store').value.trim(),category:$('#shopping-edit-category').value,currency:$('#shopping-edit-currency').value,quantity:Math.max(1,Number($('#shopping-edit-quantity').value)||1),price:Math.max(0,Number($('#shopping-edit-price').value)||0),priceText:'',imageUrl,note:$('#shopping-edit-note').value.trim()}); save(); editorDialog.close(); render(); });
  document.querySelectorAll('[data-close-shopping-editor]').forEach(button=>button.addEventListener('click',()=>editorDialog.close()));
  $('#exchange-refresh').addEventListener('click', () => requestRates(true));
  window.addEventListener('mytrip:add-shopping', event => { if (event.detail) { addItem(event.detail); document.querySelector('#shopping')?.scrollIntoView({behavior:'smooth'}); } });
  $('#shopping-currency').value = defaultCurrency;
  render();
})();
