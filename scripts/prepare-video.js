/**
 * Copy video from doc/video/ to public/video/ if it exists.
 * Run: npm run prepare-video
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'doc', 'video');
const destDir = path.join(__dirname, '..', 'public', 'video');

const names = ['The.Age.Of.Disclosure.2025'];
const exts = ['.mkv', '.mp4', '.webm'];

fs.mkdirSync(destDir, { recursive: true });

for (const name of names) {
  for (const ext of exts) {
    const src = path.join(srcDir, name + ext);
    const dest = path.join(destDir, name + ext);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('Copied:', name + ext, '-> public/video/');
      break;
    }
  }
}
