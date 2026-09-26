/**
 * Cross-platform, zero-dependency extension packaging script.
 * Produces compliant distribution archives for Chrome, Edge, and Firefox.
 * 
 * Works on Windows, macOS, and Linux using only Node.js built-in modules (fs, path, zlib).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = path.resolve(__dirname, '..');

const CHROME_OUT = path.join(ROOT_DIR, 'intentional-yt.zip');
const EDGE_OUT = path.join(ROOT_DIR, 'intentional-yt-edge.zip');
const FIREFOX_OUT = path.join(ROOT_DIR, 'intentional-yt-firefox.zip');

/**
 * Creates a standard compliant ZIP file from an array of file entries.
 * Uses only Node's built-in zlib (deflateRawSync) and crc32.
 * 
 * @param {Array<{name: string, data: Buffer}>} entries
 * @param {string} outputPath
 */
function createZip(entries, outputPath) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const dataBuf = entry.data;
    const crc = zlib.crc32(dataBuf);
    const uncompressedSize = dataBuf.length;
    const compressed = zlib.deflateRawSync(dataBuf, { level: 9 });
    const compressedSize = compressed.length;

    // Local file header (30 bytes)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);          // version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6);      // flag: UTF-8 filename
    localHeader.writeUInt16LE(8, 8);           // compression: Deflate
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);          // extra field length

    const fileRecord = Buffer.concat([localHeader, nameBuf, compressed]);
    localHeaders.push(fileRecord);

    // Central directory header (46 bytes)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4);          // version made by
    centralHeader.writeUInt16LE(20, 6);          // version needed
    centralHeader.writeUInt16LE(0x0800, 8);      // flag: UTF-8 filename
    centralHeader.writeUInt16LE(8, 10);          // compression: Deflate
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);          // extra field length
    centralHeader.writeUInt16LE(0, 32);          // file comment length
    centralHeader.writeUInt16LE(0, 34);          // disk number start
    centralHeader.writeUInt16LE(0, 36);          // internal file attributes
    centralHeader.writeUInt32LE(0x81a40000, 38); // external file attributes (-rw-r--r--)
    centralHeader.writeUInt32LE(offset, 42);     // relative offset of local header

    const centralRecord = Buffer.concat([centralHeader, nameBuf]);
    centralHeaders.push(centralRecord);

    offset += fileRecord.length;
  }

  const centralDirBuf = Buffer.concat(centralHeaders);
  const localHeadersBuf = Buffer.concat(localHeaders);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk start
  eocd.writeUInt16LE(entries.length, 8);  // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirBuf.length, 12); // central dir size
  eocd.writeUInt32LE(offset, 16);    // central dir offset
  eocd.writeUInt16LE(0, 20);         // comment length

  const finalZip = Buffer.concat([localHeadersBuf, centralDirBuf, eocd]);
  fs.writeFileSync(outputPath, finalZip);
}

/**
 * Recursively collects all files from a directory.
 * 
 * @param {string} dir
 * @param {string} baseDir
 * @returns {Array<{name: string, data: Buffer}>}
 */
function collectFiles(dir, baseDir = ROOT_DIR) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        name: relPath,
        data: fs.readFileSync(fullPath)
      });
    }
  }

  return results;
}

function packageExtension() {
  console.log('Packaging Intentional YT browser extension...');

  const manifestPath = path.join(ROOT_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found in ' + ROOT_DIR);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifestData = JSON.parse(manifestRaw);

  // Chrome & Edge manifest: remove background.scripts fallback (Chrome MV3 service_worker only)
  const chromeManifest = JSON.parse(JSON.stringify(manifestData));
  if (chromeManifest.background && chromeManifest.background.scripts) {
    delete chromeManifest.background.scripts;
  }
  const chromeManifestBuffer = Buffer.from(JSON.stringify(chromeManifest, null, 2), 'utf8');
  const firefoxManifestBuffer = Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8');

  // Common items to include
  const standardDirs = ['background', 'content', 'icons', 'styles', 'ui', 'utils'];
  const commonFiles = [];
  for (const dir of standardDirs) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(dirPath)) {
      commonFiles.push(...collectFiles(dirPath));
    }
  }

  // 1. Chrome Web Store package (all 26 locales, service_worker only)
  const chromeFiles = [
    { name: 'manifest.json', data: chromeManifestBuffer },
    ...collectFiles(path.join(ROOT_DIR, '_locales')),
    ...commonFiles
  ];
  createZip(chromeFiles, CHROME_OUT);

  // 2. Microsoft Edge Add-ons package (English-only locale, service_worker only)
  const edgeEnLocale = path.join(ROOT_DIR, '_locales', 'en', 'messages.json');
  const edgeFiles = [
    { name: 'manifest.json', data: chromeManifestBuffer },
    { name: '_locales/en/messages.json', data: fs.readFileSync(edgeEnLocale) },
    ...commonFiles
  ];
  createZip(edgeFiles, EDGE_OUT);

  // 3. Mozilla Firefox AMO package (all 26 locales, retains background.scripts and Gecko settings)
  const firefoxFiles = [
    { name: 'manifest.json', data: firefoxManifestBuffer },
    ...collectFiles(path.join(ROOT_DIR, '_locales')),
    ...commonFiles
  ];
  createZip(firefoxFiles, FIREFOX_OUT);

  console.log('==================================================');
  console.log('✔ Packages created successfully:');
  console.log('  • Chrome Web Store        : ' + CHROME_OUT + ' (' + (fs.statSync(CHROME_OUT).size / 1024).toFixed(1) + ' KB)');
  console.log('  • Microsoft Edge Add-ons  : ' + EDGE_OUT + ' (' + (fs.statSync(EDGE_OUT).size / 1024).toFixed(1) + ' KB, EN-only)');
  console.log('  • Mozilla Firefox (AMO)   : ' + FIREFOX_OUT + ' (' + (fs.statSync(FIREFOX_OUT).size / 1024).toFixed(1) + ' KB)');
  console.log('==================================================');
}

packageExtension();
