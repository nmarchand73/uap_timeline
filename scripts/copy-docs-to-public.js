/**
 * Copy PDF and EPUB from doc/src to public/docs/ with slug-based names.
 * Run: npm run copy-docs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'doc', 'src');
const destDir = path.join(__dirname, '..', 'public', 'docs');
const metaPath = path.join(__dirname, '..', 'content', 'docs-meta.json');

const mapping = [
  { slug: 'mystery-wire-archives', src: 'mystery_wire_documents_rapport.pdf' },
  { slug: 'imminent-elizondo', src: "Imminent _ Inside the Pentagons Hunt for UFOs -- Lue Elizondo, Luis Elizondo.epub" },
  { slug: 'ovnis-enquete-declassifiee', src: "Ovnis l'enquête déclassifiée -- Sylvain Maisonneuve -- 2025.epub" },
  { slug: 'inside-us-gov-covert-ufo', src: "Inside the US Government Covert UFO Program_ Initial -- James T_ Lacatski; Colm A_ Kelleher; George Knapp -- PS, 2023.epub" },
  { slug: 'ovnis-lumiere-dossiers-dini', src: "Ovnis _ Lumière sur les dossiers déclassifiés du Pentagone -- Luc Dini-- 2023.epub" },
  { slug: 'skinwalkers-pentagon', src: "Skinwalkers at the Pentagon_ An Insiders' Account of the -- Lacatski, James & Kelleher, Colm & Knapp, George -- 2021.epub" },
  { slug: 'trinity-secret-mieux-garde', src: "TRINITY_ Le secret le mieux gardé -- Leopizzi Harris, Paola; Vallée , Jacques -- New York, 2021.epub" },
  { slug: 'vallee-phenomenes-insolites', src: "Les phénomènes insolites de l'espace -- Vallée, Jacques & Vallée, Janine -- 1967.epub" },
];

fs.mkdirSync(destDir, { recursive: true });
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

for (const { slug, src } of mapping) {
  const srcPath = path.join(srcDir, src);
  const ext = path.extname(src);
  const destFile = slug + ext;
  const destPath = path.join(destDir, destFile);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Copied:', src, '->', destFile);

    const doc = meta.find(d => d.slug === slug);
    if (doc) {
      if (ext === '.pdf') doc.pdf_path = '/docs/' + destFile;
      if (ext === '.epub') doc.epub_path = '/docs/' + destFile;
    }
  } else {
    console.log('Skip (not found):', srcPath);
  }
}

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
console.log('Updated docs-meta.json');
