(() => {
  'use strict';
  const $=selector=>document.querySelector(selector); if(!$('#overview-metrics'))return;
  const read=base=>{try{return JSON.parse(localStorage.getItem(window.MYTRIP_STORAGE_KEY?.(base) || base)||'null')}catch(_){return null}};
  function render() {
    const planner=read('mytrip-user-planner-v1') || {schedule:[],places:[]}; const shopping=read('weekend-trip-shopping-v2') || []; const info=read('mytrip-travel-info-v1') || {reservations:[],checklist:[]}; const alternatives=read('mytrip-alternatives-v1') || [];
    const trip=window.MYTRIP_ACTIVE_TRIP; const days=window.MYTRIP_TRIP_DAYS || []; const now=new Date(); now.setHours(0,0,0,0); const start=new Date(`${trip.startDate}T00:00:00`); const diff=Math.ceil((start-now)/86400000);
    $('#overview-status').textContent=diff>0?`출발까지 D-${diff} · 지금은 예약과 확인사항을 마무리할 때예요.`:diff===0?'오늘 여행이 시작돼요. 첫 일정과 이동 정보를 확인하세요.':'진행 중이거나 지난 여행이에요. 완료 상태와 기록을 정리하세요.';
    const metrics=[{value:planner.schedule.length,label:'전체 일정',href:'#expanded-plan'},{value:`${info.reservations.filter(item=>item.status==='확정').length}/${info.reservations.length}`,label:'예약 확정',href:'#travel-info'},{value:info.checklist.filter(item=>!item.done).length,label:'남은 확인',href:'#travel-info'},{value:shopping.filter(item=>!Number(item.price)).length,label:'가격 미입력',href:'#shopping'},{value:alternatives.length,label:'대안 플랜',href:'#alternatives'}];
    $('#overview-metrics').replaceChildren(...metrics.map(item=>{const a=document.createElement('a');a.className='overview-metric';a.href=item.href;const strong=document.createElement('strong');strong.textContent=item.value;const span=document.createElement('span');span.textContent=item.label;a.append(strong,span);return a;}));
    $('#overview-days').replaceChildren(...days.map(day=>{const items=planner.schedule.filter(item=>item.day===day.value).sort((a,b)=>a.time.localeCompare(b.time));const link=document.createElement('a');link.href='#expanded-plan';link.className='overview-day';link.dataset.overviewDay=day.value;const title=document.createElement('strong');title.textContent=day.label;const meta=document.createElement('span');meta.textContent=items.length?`${items.length}개 일정 · ${items[0].time} 시작`:'일정 없음';link.append(title,meta);return link;}));
    const pending=[...info.reservations.filter(item=>item.status!=='확정').map(item=>({title:item.name,meta:`${item.status} · ${item.date || '날짜 미입력'}`,href:'#travel-info'})),...info.checklist.filter(item=>!item.done).map(item=>({title:item.name,meta:'확인 필요',href:'#travel-info'})),...shopping.filter(item=>!Number(item.price)).slice(0,2).map(item=>({title:item.name,meta:'가격 입력 필요',href:'#shopping'}))].slice(0,5);
    $('#overview-next').replaceChildren(...pending.map(item=>{const a=document.createElement('a');a.className='overview-task';a.href=item.href;const title=document.createElement('strong');title.textContent=item.title;const meta=document.createElement('span');meta.textContent=item.meta;a.append(title,meta);return a;})); if(!pending.length)$('#overview-next').textContent='남은 확인사항이 없어요.';
    document.querySelectorAll('[data-overview-day]').forEach(link=>link.addEventListener('click',()=>{const target=document.querySelector(`[data-user-day="${link.dataset.overviewDay}"]`);if(target)setTimeout(()=>target.click(),0);}));
  }
  window.addEventListener('mytrip:data-changed',render); render();
})();
