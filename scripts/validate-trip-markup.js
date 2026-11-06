const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const required = ['trip-list-open', 'trip-list-dialog', 'trip-create', 'trip-editor-dialog', 'trip-editor-form', 'trip-title', 'trip-destination', 'trip-country', 'trip-start-date', 'trip-end-date'];
const missing = required.filter(id => !html.includes(`id="${id}"`));
if (missing.length) throw new Error(`여행 관리 화면에 필요한 요소가 없습니다: ${missing.join(', ')}`);
const manager = fs.readFileSync('trip-manager.js', 'utf8');
for (const behavior of ['selectTrip', 'duplicateTrip', 'deleteTrip', 'MYTRIP_STORAGE_KEY']) {
  if (!manager.includes(behavior)) throw new Error(`여행 관리 동작이 없습니다: ${behavior}`);
}
console.log(`여행 목록·생성·선택·수정·복제·삭제 화면 ${required.length}개 요소 연결 확인`);
