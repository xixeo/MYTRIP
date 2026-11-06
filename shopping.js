(() => {
  'use strict';
  const storageKey = 'weekend-trip-shopping-v1';
  const $ = selector => document.querySelector(selector);
  const form = $('#shopping-form');
  const list = $('#shopping-list');
  if (!form || !list) return;
  let items = [];
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) items = saved; } catch (_) { items = []; }
  const won = value => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(items));
  const make = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  function render() {
    list.replaceChildren();
    items.forEach(item => {
      const row = make('li', `shopping-item${item.done ? ' is-done' : ''}`);
      const check = make('button', 'shopping-check', item.done ? '✓' : ''); check.type = 'button'; check.setAttribute('aria-label', `${item.name} ${item.done ? '구매 취소' : '구매 완료'}`);
      check.addEventListener('click', () => { item.done = !item.done; save(); render(); });
      const copy = make('div', 'shopping-copy'); copy.append(make('strong', '', item.name));
      copy.append(make('span', '', [item.store, `${item.quantity}개`, item.price ? won(item.price * item.quantity) : ''].filter(Boolean).join(' · ')));
      const remove = make('button', 'shopping-remove', '삭제'); remove.type = 'button'; remove.addEventListener('click', () => { items = items.filter(candidate => candidate.id !== item.id); save(); render(); });
      row.append(check, copy, remove); list.append(row);
    });
    const done = items.filter(item => item.done).length;
    $('#shopping-progress').textContent = `${done} / ${items.length}`;
    $('#shopping-total').textContent = won(items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0));
    $('#shopping-empty').hidden = items.length > 0; $('#shopping-clear-complete').hidden = done === 0;
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const name = $('#shopping-name').value.trim(); if (!name) return;
    items.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, store: $('#shopping-store').value.trim(), quantity: Math.max(1, Number($('#shopping-quantity').value) || 1), price: Math.max(0, Number($('#shopping-price').value) || 0), done: false });
    save(); form.reset(); $('#shopping-quantity').value = '1'; $('#shopping-name').focus(); render();
  });
  $('#shopping-clear-complete').addEventListener('click', () => { items = items.filter(item => !item.done); save(); render(); });
  render();
})();
