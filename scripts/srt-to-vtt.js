/**
 * Convert SRT to WebVTT for video subtitles.
 * Run: node scripts/srt-to-vtt.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srtPath = path.join(__dirname, '..', 'doc', 'video', 'The.Age.Of.Disclosure.2025.srt');
const vttPath = path.join(__dirname, '..', 'public', 'video', 'The.Age.Of.Disclosure.2025.vtt');

const srt = fs.readFileSync(srtPath, 'utf-8');
const lines = srt.split('\n');
let vtt = 'WEBVTT\n\n';

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (/^\d+$/.test(line.trim())) {
    i++;
    const timeLine = lines[i];
    if (timeLine && timeLine.includes('-->')) {
      const vttTime = timeLine.replace(/,(\d{3})/g, '.$1');
      vtt += vttTime + '\n';
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim()) {
        textLines.push(lines[i].replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, ''));
        i++;
      }
      vtt += textLines.join('\n') + '\n\n';
    }
    i++;
  } else {
    i++;
  }
}

fs.mkdirSync(path.dirname(vttPath), { recursive: true });
fs.writeFileSync(vttPath, vtt, 'utf-8');
console.log('VTT written to', vttPath);
