const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const seed = fs.readFileSync(path.join(root, 'backend/src/seed.js'), 'utf8');
for (const [folder, name, pattern] of [
  [
    'perfis',
    'perfil_padrao.svg',
    /fs\.writeFileSync\(\s*perfilPadrao,\s*`([\s\S]*?)`\.trim\(\)\s*\)/
  ],
  [
    'servicos',
    'servico_padrao.svg',
    /fs\.writeFileSync\(\s*servicoPadrao,\s*`([\s\S]*?)`\.trim\(\)\s*\)/
  ]
]) {
  const match = seed.match(pattern);
  assert.ok(match && !match[1].includes('${'), 'Seed literal not recognized; do not execute seed');
  const svg = match[1].replace(/\r\n?/g, '\n').trim();
  const file = path.join(root, 'backend/uploads', folder, name);
  if (fs.existsSync(file)) {
    console.log('Preserved existing file: ' + path.relative(root, file));
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, svg, { flag: 'wx' });
  assert.equal(fs.readFileSync(file, 'utf8'), svg);
  console.log('Prepared exact seed asset: ' + path.relative(root, file));
}
