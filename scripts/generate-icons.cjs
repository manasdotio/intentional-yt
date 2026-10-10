// Build tooling only. No dependencies are added to the browser extension.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const sizes = [16, 32, 48, 128, 512];

// ICO supports PNG payloads. Include native small sizes so browsers need not
// shrink one large bitmap to render a favicon.
function createIco(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(image => image.data)]);
}

async function main() {
  const source = fs.readFileSync(path.join(root, 'icons/icon.svg'));
  const rendered = await Promise.all(sizes.map(async size => ({
    size,
    data: await sharp(source, { density: 576 }).resize(size, size).png().toBuffer()
  })));
  for (const directory of ['icons', 'public/icons']) {
    const destination = path.join(root, directory);
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, 'icon.svg'), source);
    for (const { size, data } of rendered) {
      fs.writeFileSync(path.join(destination, 'icon-' + size + '.png'), data);
    }
    fs.writeFileSync(path.join(destination, 'icon.png'), rendered.find(image => image.size === 128).data);
    if (directory === 'public/icons') {
      fs.copyFileSync(path.join(root, 'icons/ICONS_README.md'), path.join(destination, 'ICONS_README.md'));
    }
  }
  const faviconSource = fs.readFileSync(path.join(root, 'icons/favicon.svg'));
  const faviconImages = await Promise.all([16, 32, 48, 96].map(async size => ({
    size,
    data: await sharp(faviconSource, { density: 576 }).resize(size, size).png().toBuffer()
  })));
  fs.writeFileSync(path.join(root, 'public/favicon.svg'), faviconSource);
  fs.writeFileSync(path.join(root, 'public/favicon-96.png'), faviconImages.find(image => image.size === 96).data);
  const favicon = createIco(faviconImages);
  for (const filename of ['favicon.ico', 'public/favicon.ico']) {
    fs.writeFileSync(path.join(root, filename), favicon);
  }
  console.log('Generated app icons and full-bleed SVG, PNG, and 16/32/48/96px ICO favicons.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
