(() => {
  'use strict';
  const storageKey = 'weekend-trip-shopping-v2';
  const legacyStorageKey = 'weekend-trip-shopping-v1';
  const $ = selector => document.querySelector(selector);
  const form = $('#shopping-form');
  const list = $('#shopping-list');
  if (!form || !list) return;
  const recommendations = Object.entries(window.TRIP?.venues || {}).flatMap(([placeId, place]) =>
    (place.shoppingSuggestions || []).map((item, index) => ({...item, id:`${placeId}-${index}`, placeId, store:place.name})));
  let recommendationFilter = '전체';
  let items = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || '[]');
    if (Array.isArray(saved)) items = saved.map(item => ({category:'기타', note:'', ...item}));
  } catch (_) { items = []; }
  const won = value => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(items));
  const make = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  const sameItem = candidate => items.some(item => !item.done && item.name === candidate.name && item.store === candidate.store);
  function addItem(input) {
    const existing = items.find(item => !item.done && item.name === input.name && item.store === input.store);
    if (existing) existing.quantity += input.quantity || 1;
    else items.push({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`, category:'기타', note:'', quantity:1, price:0, done:false, ...input});
    save(); render();
  }
  function renderRecommendations() {
    const categories = ['전체', ...new Set(recommendations.map(item => item.category))];
    $('#shopping-recommend-filters').replaceChildren(...categories.map(category => {
      const button = make('button', 'chip', category); button.type = 'button'; button.setAttribute('aria-pressed', String(category === recommendationFilter));
      button.addEventListener('click', () => { recommendationFilter = category; renderRecommendations(); }); return button;
    }));
    const visible = recommendations.filter(item => recommendationFilter === '전체' || item.category === recommendationFilter);
    $('#shopping-recommend-list').replaceChildren(...visible.map(item => {
      const card = make('article', 'shopping-recommend-card');
      const top = make('div', 'shopping-recommend-top'); top.append(make('span', 'shopping-category', item.category), make('strong', '', item.name));
      const meta = make('p', 'shopping-recommend-meta', `${item.store} · ${item.price ? won(item.price) : '가격 확인'}`);
      const note = make('p', 'shopping-recommend-note', item.note);
      const button = make('button', 'button secondary', sameItem(item) ? '담김 ✓' : '+ 쇼핑리스트'); button.type = 'button'; button.disabled = sameItem(item);
      button.addEventListener('click', () => addItem({name:item.name, store:item.store, category:item.category, price:item.price, quantity:1, note:item.note, placeId:item.placeId}));
      card.append(top, meta, note, button); return card;
    }));
  }
  function render() {
    list.replaceChildren();
    items.forEach(item => {
      const row = make('li', `shopping-item${item.done ? ' is-done' : ''}`);
      const check = make('button', 'shopping-check', item.done ? '✓' : ''); check.type = 'button'; check.setAttribute('aria-label', `${item.name} ${item.done ? '구매 취소' : '구매 완료'}`);
      check.addEventListener('click', () => { item.done = !item.done; save(); render(); });
      const copy = make('div', 'shopping-copy'); const title = make('div', 'shopping-item-title'); title.append(make('span', 'shopping-category', item.category || '기타'), make('strong', '', item.name)); copy.append(title);
      copy.append(make('span', '', [item.store, `${item.quantity}개`, item.price ? won(item.price * item.quantity) : '가격 확인'].filter(Boolean).join(' · ')));
      if (item.note) copy.append(make('small', '', item.note));
      const remove = make('button', 'shopping-remove', '삭제'); remove.type = 'button'; remove.addEventListener('click', () => { items = items.filter(candidate => candidate.id !== item.id); save(); render(); });
      row.append(check, copy, remove); list.append(row);
    });
    const done = items.filter(item => item.done).length;
    $('#shopping-progress').textContent = `${done} / ${items.length}`;
    $('#shopping-total').textContent = won(items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0));
    $('#shopping-remaining').textContent = `${items.length - done}개`;
    $('#shopping-empty').hidden = items.length > 0; $('#shopping-clear-complete').hidden = done === 0;
    renderRecommendations();
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const name = $('#shopping-name').value.trim(); if (!name) return;
    addItem({name, store:$('#shopping-store').value.trim(), category:$('#shopping-category').value, quantity:Math.max(1, Number($('#shopping-quantity').value) || 1), price:Math.max(0, Number($('#shopping-price').value) || 0), note:$('#shopping-note').value.trim(), done:false});
    form.reset(); $('#shopping-quantity').value = '1'; $('#shopping-name').focus();
  });
  $('#shopping-clear-complete').addEventListener('click', () => { items = items.filter(item => !item.done); save(); render(); });
  window.addEventListener('mytrip:add-shopping', event => { if (event.detail) { addItem(event.detail); document.querySelector('#shopping')?.scrollIntoView({behavior:'smooth'}); } });
  render();
})();
