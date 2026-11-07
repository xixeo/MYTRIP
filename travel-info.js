(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const storageKey = window.MYTRIP_STORAGE_KEY?.('mytrip-travel-info-v1') || 'mytrip-travel-info-v1';
  if (!$('#reservation-form') || !$('#checklist-form')) return;
  let state = {reservations:[], checklist:[]};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && Array.isArray(saved.reservations) && Array.isArray(saved.checklist)) state = saved;
  } catch (_) { /* 손상된 저장값은 빈 목록으로 복구한다. */ }
  const save = () => { localStorage.setItem(storageKey, JSON.stringify(state)); window.dispatchEvent(new Event('mytrip:data-changed')); };
  const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const make = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
  const button = (label, className, action, ariaLabel = '') => { const el = make('button', className, label); el.type = 'button'; if (ariaLabel) el.setAttribute('aria-label', ariaLabel); el.addEventListener('click', action); return el; };

  function renderReservations() {
    const sorted = [...state.reservations].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    $('#reservation-empty').hidden = sorted.length > 0;
    $('#reservation-list').replaceChildren(...sorted.map(item => {
      const row = make('li', 'info-item');
      const copy = make('div', 'info-copy');
      const title = make('div', 'info-title'); title.append(make('span', 'shopping-category', item.type), make('strong', '', item.name), make('span', `reservation-status status-${item.status === '확정' ? 'confirmed' : 'pending'}`, item.status));
      const meta = [item.date, item.time, item.scheduleId ? '일정 연결됨' : '', item.number ? `예약번호 ${item.number}` : ''].filter(Boolean).join(' · ');
      copy.append(title, make('span', '', meta || '날짜·예약번호 미입력'));
      if (item.note) copy.append(make('small', '', item.note));
      const actions = make('div', 'info-actions');
      if (item.link) { const link = make('a', 'button secondary', '예약 열기 ↗'); link.href = item.link; link.target = '_top'; link.rel = 'noreferrer'; actions.append(link); }
      actions.append(button('삭제', 'shopping-remove', () => { if (!confirm(`“${item.name}” 예약을 삭제할까요?`)) return; state.reservations = state.reservations.filter(candidate => candidate.id !== item.id); save(); renderReservations(); }, `${item.name} 삭제`));
      row.append(copy, actions); return row;
    }));
  }

  function renderChecklist() {
    const done = state.checklist.filter(item => item.done).length;
    $('#checklist-progress').textContent = `${done} / ${state.checklist.length} 준비 완료`;
    $('#checklist-empty').hidden = state.checklist.length > 0;
    $('#checklist-list').replaceChildren(...state.checklist.map(item => {
      const row = make('li', `info-item checklist-item${item.done ? ' is-done' : ''}`);
      const check = button(item.done ? '✓' : '', 'shopping-check', () => { item.done = !item.done; save(); renderChecklist(); }, `${item.name} ${item.done ? '미완료로 변경' : '준비 완료'}`);
      const copy = make('div', 'info-copy'); copy.append(make('strong', '', item.name)); if (item.assignee) copy.append(make('small', '', `담당 · ${item.assignee}`));
      row.append(check, copy, button('삭제', 'shopping-remove', () => { state.checklist = state.checklist.filter(candidate => candidate.id !== item.id); save(); renderChecklist(); }, `${item.name} 삭제`)); return row;
    }));
  }

  $('#reservation-form').addEventListener('submit', event => {
    event.preventDefault();
    state.reservations.push({id:id('reservation'), type:$('#reservation-type').value, name:$('#reservation-name').value.trim(), date:$('#reservation-date').value, time:$('#reservation-time').value, status:$('#reservation-status').value, number:$('#reservation-number').value.trim(), link:$('#reservation-link').value.trim(), note:$('#reservation-note').value.trim(), createdAt:new Date().toISOString()});
    save(); event.currentTarget.reset(); renderReservations(); $('#reservation-name').focus();
  });
  $('#checklist-form').addEventListener('submit', event => {
    event.preventDefault(); state.checklist.push({id:id('check'), name:$('#checklist-name').value.trim(), assignee:$('#checklist-assignee').value.trim(), done:false}); save(); event.currentTarget.reset(); renderChecklist(); $('#checklist-name').focus();
  });
  renderReservations(); renderChecklist();
})();
