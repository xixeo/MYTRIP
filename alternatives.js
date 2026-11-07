(() => {
  'use strict';
  const section = document.querySelector('#alternatives'); if (!section) return;
  const key = window.MYTRIP_STORAGE_KEY?.('mytrip-alternatives-v1') || 'mytrip-alternatives-v1';
  let items = []; let filter = '전체';
  try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(saved)) items = saved; } catch (_) {}
  if (!items.length) return;
  const make = (tag, className, text) => { const el=document.createElement(tag); if(className) el.className=className; if(text!==undefined) el.textContent=text; return el; };
  const labels = {'2026-11-28':'11월 28일','2026-11-29':'11월 29일'};
  function render() {
    section.hidden = false; const filters=['전체','날짜 미정',...Object.keys(labels)];
    document.querySelector('#alternative-filters').replaceChildren(...filters.map(value => { const button=make('button','chip',labels[value] || value); button.type='button'; button.setAttribute('aria-pressed',String(value===filter)); button.addEventListener('click',()=>{filter=value;render();}); return button; }));
    const visible=items.filter(item => filter==='전체' || (filter==='날짜 미정' ? !item.day : item.day===filter));
    document.querySelector('#alternative-list').replaceChildren(...visible.map(item => {
      const card=make('article','alternative-card'); const top=make('div','alternative-card-head'); const copy=make('div'); copy.append(make('span','shopping-category',item.context),make('h4','',item.name)); top.append(copy);
      const menu=make('p','alternative-menu',item.menu ? `추천 · ${item.menu}` : '추천 메뉴 미입력'); const note=make('p','alternative-note',item.note);
      const add=make('button','button secondary','일정에 추가'); add.type='button'; add.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('mytrip:add-alternative',{detail:item})));
      card.append(top,menu,note,add); return card;
    }));
  }
  render();
})();
