const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('travel-info.js', 'utf8');
const requiredIds = [
  'travel-info', 'reservation-form', 'reservation-name', 'reservation-date',
  'reservation-status', 'reservation-list', 'checklist-form', 'checklist-name',
  'checklist-assignee', 'checklist-list', 'trip-export', 'trip-import', 'trip-import-file'
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`여행 준비·백업 요소 누락: #${id}`);
}
for (const token of ['mytrip-travel-info-v1', 'reservations', 'checklist']) {
  if (!script.includes(token)) throw new Error(`여행 준비 저장 로직 누락: ${token}`);
}
console.log(`예약·준비물·백업 화면 ${requiredIds.length}개 요소 연결 확인`);
