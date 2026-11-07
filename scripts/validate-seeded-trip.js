const fs = require('fs');
const vm = require('vm');

const context = {window:{}};
vm.runInNewContext(fs.readFileSync('imported-hokkaido.js', 'utf8'), context);
const seed = context.window.MYTRIP_SEEDED_TRIPS?.[0];
if (!seed || seed.trip.id !== 'hokkaido-2026-11') throw new Error('홋카이도 여행 시드 누락');
if (seed.trip.startDate !== '2026-11-27' || seed.trip.endDate !== '2026-11-30') throw new Error('홋카이도 여행 기간 오류');
const planner = seed.data['mytrip-user-planner-v1'];
const info = seed.data['mytrip-travel-info-v1'];
if (planner.schedule.length !== 54 || planner.places.length !== 58) throw new Error('시트 일정·장소 변환 개수 오류');
if (seed.data['weekend-trip-shopping-v2'].length < 40) throw new Error('쇼핑 후보 변환 누락');
if (info.reservations.length < 5 || info.checklist.length !== 7) throw new Error('예약·확인사항 변환 누락');
for (const item of planner.schedule) if (!planner.places.some(place => place.id === item.placeId)) throw new Error(`일정 장소 연결 누락: ${item.id}`);
console.log(`홋카이도 시트 반영: 일정 ${planner.schedule.length}개 · 장소 ${planner.places.length}개 · 쇼핑 ${seed.data['weekend-trip-shopping-v2'].length}개 · 예약 ${info.reservations.length}개 · 확인 ${info.checklist.length}개`);
