import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/vendor/', import.meta.url));
const manifestFile = path.join(root, 'manifest.json');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--check')) {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  for (const item of manifest) {
    if (hash(await readFile(path.join(root, item.file))) !== item.sha256)
      throw new Error('Vendor integrity mismatch: ' + item.file);
  }
  console.log('Local browser assets verified: ' + manifest.length);
} else {
  const manifest = [];
  async function download(url, file) {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error('Download failed ' + response.status + ': ' + url);
    const bytes = Buffer.from(await response.arrayBuffer());
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), bytes);
    manifest.push({ file, source: url, sha256: hash(bytes) });
    return bytes;
  }
  const fontsUrl =
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
  let css = (await download(fontsUrl, 'poppins.css')).toString();
  for (const url of new Set(
    [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1])
  )) {
    const file = 'fonts/' + path.basename(new URL(url).pathname);
    await download(url, file);
    css = css.replaceAll(url, './' + file);
  }
  await writeFile(path.join(root, 'poppins.css'), css);
  manifest.find((item) => item.file === 'poppins.css').sha256 = hash(css);
  await download(
    'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt',
    'Poppins-OFL.txt'
  );
  await download(
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'fontawesome/css/all.min.css'
  );
  for (const name of ['fa-brands-400', 'fa-regular-400', 'fa-solid-900', 'fa-v4compatibility']) {
    for (const extension of ['woff2', 'ttf'])
      await download(
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/' +
          name +
          '.' +
          extension,
        'fontawesome/webfonts/' + name + '.' + extension
      );
  }
  await download(
    'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.4.0/LICENSE.txt',
    'FontAwesome-LICENSE.txt'
  );
  await download(
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js',
    'chart/Chart.min.js'
  );
  await download(
    'https://raw.githubusercontent.com/chartjs/Chart.js/v2.9.4/LICENSE.md',
    'Chart-LICENSE.md'
  );
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Vendored exact browser assets with provenance and SHA256: ' + manifest.length);
}
