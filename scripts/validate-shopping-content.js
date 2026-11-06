global.window = {};
require('../data.js');

const suggestions = Object.values(window.TRIP.venues).flatMap(place => place.shoppingSuggestions || []);
if (suggestions.length < 8) throw new Error('쇼핑 추천 콘텐츠가 충분하지 않습니다.');
for (const item of suggestions) {
  if (!item.name || !item.category || typeof item.price !== 'number' || !item.note) {
    throw new Error(`쇼핑 추천 항목 형식이 올바르지 않습니다: ${JSON.stringify(item)}`);
  }
}
const categories = new Set(suggestions.map(item => item.category));
for (const required of ['먹거리', '기념품', '체험']) {
  if (!categories.has(required)) throw new Error(`필수 쇼핑 분류가 없습니다: ${required}`);
}
console.log(`쇼핑 추천 ${suggestions.length}개 · ${[...categories].join(', ')}`);
