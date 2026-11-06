const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('planner-editor.js', 'utf8');
const requiredIds = [...script.matchAll(/\$\('#([a-z0-9-]+)'\)/g)].map(match => match[1]);
const missing = [...new Set(requiredIds)].filter(id => !html.includes(`id="${id}"`));
if (missing.length) throw new Error(`장소·일정 편집 화면에 필요한 요소가 없습니다: ${missing.join(', ')}`);
for (const id of ['place-add', 'place-editor-dialog', 'schedule-add', 'schedule-editor-dialog', 'user-place-grid', 'user-schedule-list']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`핵심 편집 요소가 없습니다: ${id}`);
}
console.log(`장소·일정 편집 화면 ${new Set(requiredIds).size}개 요소 연결 확인`);
