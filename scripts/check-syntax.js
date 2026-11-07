const { execFileSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'assets', 'dist']);

function collectJavaScript(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return collectJavaScript(join(directory, entry.name));
    }
    return entry.name.endsWith('.js') ? [join(directory, entry.name)] : [];
  });
}

const files = collectJavaScript(root).sort();
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`JavaScript syntax checked: ${files.length} files`);
