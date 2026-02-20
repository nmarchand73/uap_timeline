/**
 * Download DIRD PDFs - two modes:
 *
 * 1. AUTO: Try to fetch from Black Vault (may fail with 403)
 * 2. MANUAL: Extract from ZIP downloaded in browser
 *    - Download: https://documents2.theblackvault.com/documents/dia/AAWSAP-DIRDs/AAWSAP-DIRDs-1-37.zip
 *    - Save to: public/dirds/AAWSAP-DIRDs-1-37.zip
 *    - Run: npm run download-dirds
 *
 * Run: npm run download-dirds
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dirdsPath = path.join(__dirname, '..', 'content', 'dirds.json');
const destDir = path.join(__dirname, '..', 'public', 'dirds');
const zipPath = path.join(destDir, 'AAWSAP-DIRDs-1-37.zip');

fs.mkdirSync(destDir, { recursive: true });
const dirds = JSON.parse(fs.readFileSync(dirdsPath, 'utf-8'));

function filenameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Alternative mirror (Locations Unknown) - may allow programmatic access
const LOCATIONS_UNKNOWN_BASE = 'https://locationsunknown.org/s/';

async function extractFromZip() {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  let extracted = 0;
  for (const entry of entries) {
    if (!entry.entryName.toLowerCase().endsWith('.pdf')) continue;
    const name = path.basename(entry.entryName);
    zip.extractEntryTo(entry, destDir, false, true);
    extracted++;
    console.log('Extracted:', name);
  }
  return extracted;
}

async function fetchRemote() {
  let ok = 0;
  let fail = 0;
  for (const d of dirds) {
    const filename = filenameFromUrl(d.url);
    const destPath = path.join(destDir, filename);
    const localUrl = '/dirds/' + filename;

    if (fs.existsSync(destPath)) {
      d.url = localUrl;
      ok++;
      continue;
    }
    const urlsToTry = [
      LOCATIONS_UNKNOWN_BASE + filename,
      d.url, // Black Vault
    ];
    let lastErr;
    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
            'Accept': 'application/pdf,*/*',
          },
          redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buf));
        d.url = localUrl;
        ok++;
        console.log('OK:', filename, '(from', url.includes('locationsunknown') ? 'LocationsUnknown' : 'BlackVault', ')');
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!d.url.startsWith('/')) {
      console.error('FAIL:', filename, lastErr?.message || '');
      fail++;
    }
  }
  return { ok, fail };
}

async function main() {
  if (fs.existsSync(zipPath)) {
    console.log('ZIP found. Extracting...\n');
    const extracted = await extractFromZip();
    console.log(`\nExtracted ${extracted} PDFs.`);

    // Update dirds.json: match each DIRD to extracted PDF by number
    const files = fs.readdirSync(destDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
    for (const d of dirds) {
      const num = String(d.id).padStart(2, '0');
      const match = files.find((f) => f.includes('DIRD_' + num) || f.includes('DIRD-' + num) || f.includes('_' + num + '_') || f.includes('_' + num + '-'));
      if (match) d.url = '/dirds/' + match;
    }
  } else {
    console.log('ZIP not found. Trying remote fetch...\n');
    console.log('If that fails (403), download manually:\n');
    console.log('  https://documents2.theblackvault.com/documents/dia/AAWSAP-DIRDs/AAWSAP-DIRDs-1-37.zip\n');
    console.log('  Save to: public/dirds/AAWSAP-DIRDs-1-37.zip\n');
    const { ok, fail } = await fetchRemote();
    console.log(`\nRemote: ${ok} OK, ${fail} failed.`);
  }

  fs.writeFileSync(dirdsPath, JSON.stringify(dirds, null, 2), 'utf-8');
  console.log('Updated dirds.json with local paths.');
}

main().catch(console.error);
