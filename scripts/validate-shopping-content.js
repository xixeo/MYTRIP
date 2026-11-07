global.window = {};
require('../data.js');
const fs = require('node:fs');

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
const html = fs.readFileSync('index.html', 'utf8');
for (const id of ['product-search-form', 'product-search-query', 'product-google-search', 'product-search-results', 'shopping-form']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`상품 검색 화면 요소가 없습니다: ${id}`);
}
console.log(`쇼핑 추천 ${suggestions.length}개 · ${[...categories].join(', ')}`);
