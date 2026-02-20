/**
 * Parse SRT and create searchable JSON index for documentary subtitles.
 * Run: node scripts/srt-to-search-index.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srtPath = path.join(__dirname, '..', 'doc', 'video', 'The.Age.Of.Disclosure.2025.srt');
const outPath = path.join(__dirname, '..', 'content', 'subtitles-index.json');

function parseTime(s) {
  const [h, m, sec] = s.split(':');
  const [sPart, ms] = sec.split(',');
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(sPart, 10) + parseInt(ms || '0', 10) / 1000;
}

const srt = fs.readFileSync(srtPath, 'utf-8');
const lines = srt.split('\n');
const segments = [];
let i = 0;

while (i < lines.length) {
  const numLine = lines[i];
  if (/^\d+$/.test(numLine.trim())) {
    i++;
    const timeLine = lines[i];
    if (timeLine && timeLine.includes('-->')) {
      const [startStr] = timeLine.split('-->').map(s => s.trim());
      const startSec = parseTime(startStr);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim()) {
        textLines.push(lines[i].replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').trim());
        i++;
      }
      const text = textLines.join(' ').trim();
      if (text) {
        segments.push({ text, start_seconds: Math.round(startSec) });
      }
    }
    i++;
  } else {
    i++;
  }
}

fs.writeFileSync(outPath, JSON.stringify(segments), 'utf-8');
console.log('Subtitles index:', segments.length, 'segments ->', outPath);
