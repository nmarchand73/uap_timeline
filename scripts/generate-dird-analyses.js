/**
 * Generate DIRD analyses for engineers (informatique/électronique).
 * 1. Extracts text from PDFs via pdf-parse
 * 2. Calls LLM (OpenAI or Anthropic) to produce structured analysis
 * 3. Merges into content/dirds-analysis.json
 *
 * Usage:
 *   npm run generate-dird-analyses          # full run (loads .env)
 *   node scripts/generate-dird-analyses.js --dry-run   # extraction only, no API
 *
 * Env: OPENAI_API_KEY or ANTHROPIC_API_KEY (from .env)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIRDS_PATH = path.join(ROOT, 'content', 'dirds.json');
const ANALYSIS_PATH = path.join(ROOT, 'content', 'dirds-analysis.json');
const PDF_DIR = path.join(ROOT, 'public', 'dirds');

const MAX_CHARS = 24000; // ~6k tokens, safe for context
const DRY_RUN = process.argv.includes('--dry-run');

const dirds = JSON.parse(fs.readFileSync(DIRDS_PATH, 'utf-8'));
let analysis = {};
if (fs.existsSync(ANALYSIS_PATH)) {
  analysis = JSON.parse(fs.readFileSync(ANALYSIS_PATH, 'utf-8'));
}

function filenameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

async function extractText(dird) {
  const filename = filenameFromUrl(dird.url);
  const pdfPath = path.join(PDF_DIR, filename);
  if (!fs.existsSync(pdfPath)) {
    console.warn('PDF not found:', pdfPath);
    return '';
  }
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    await parser.destroy();
    return result.text || '';
  } catch (err) {
    await parser.destroy();
    throw err;
  }
}

function truncateForContext(text) {
  if (!text || text.length <= MAX_CHARS) return text;
  return text.slice(0, MAX_CHARS) + '\n\n[... tronqué ...]';
}

const PROMPT = `Tu es un expert technique. Analyse ce rapport DIRD (Defense Intelligence Reference Document) pour un ingénieur en informatique et électronique.

Titre: {{title}}
Auteur: {{author}}
Affiliation: {{affiliation}}

Extrait du document:
---
{{excerpt}}
---

Produis un JSON valide (pas de markdown, pas de \`\`\`) avec exactement ces clés:
{
  "summary": "Résumé technique TRÈS COMPLET et STRUCTURÉ (markdown). Inclus obligatoirement ces sections, chacune en 3-6 phrases détaillées:\n\n## Contexte\nContexte du document, commanditaire, enjeux.\n\n## Objectifs\nObjectifs de l'étude, questions de recherche.\n\n## Méthodologie\nApproche, outils, modèles utilisés.\n\n## Résultats principaux\nDécouvertes, données chiffrées, équations clés si pertinent.\n\n## Conclusions\nSynthèse, implications techniques, pistes futures.\n\nSois précis, cite des notions techniques, formules ou ordres de grandeur quand le document les fournit.",
  "key_concepts": ["concept1", "concept2", "concept3"],
  "relevance_ict": "Pertinence pour l'ingénieur informatique/électronique: capteurs, circuits, RF, logiciel, matériaux pour composants...",
  "applications": "Applications industrielles potentielles.",
  "related_dird_ids": [num, num],
  "domains": ["materials" | "electronics" | "computing" | "propulsion" | "sensors" | "quantum" | "other"]
}

Règles: related_dird_ids = IDs (1-37) des autres DIRD liés. domains = 1 à 3 valeurs. Réponds uniquement avec le JSON.`;

async function callLLM(excerpt, meta) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const prompt = PROMPT
    .replace('{{title}}', meta.title)
    .replace('{{author}}', meta.author)
    .replace('{{affiliation}}', meta.affiliation)
    .replace('{{excerpt}}', excerpt);

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  if (anthropicKey) {
    const res = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      }
    );
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const block = data.content.find((c) => c.type === 'text');
    return block ? block.text.trim() : '';
  }

  throw new Error('Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
}

function parseJsonResponse(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}') + 1;
  if (start === -1 || end <= start) throw new Error('No JSON object found');
  return JSON.parse(trimmed.slice(start, end));
}

async function main() {
  console.log(DRY_RUN ? 'Dry run: extraction only\n' : 'Generating DIRD analyses...\n');

  for (const d of dirds) {
    const id = String(d.id);
    console.log(`DIRD ${id}: ${d.title}`);

    let text;
    try {
      text = await extractText(d);
    } catch (err) {
      console.error('  Extract error:', err.message);
      continue;
    }

    const excerpt = truncateForContext(text);
    if (DRY_RUN) {
      console.log(`  Chars: ${text.length} -> ${excerpt.length} (truncated)`);
      continue;
    }

    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error('  Skip: no API key');
      continue;
    }

    try {
      const raw = await callLLM(excerpt, d);
      const parsed = parseJsonResponse(raw);
      analysis[id] = {
        summary: parsed.summary || '',
        key_concepts: Array.isArray(parsed.key_concepts) ? parsed.key_concepts : [],
        relevance_ict: parsed.relevance_ict || '',
        applications: parsed.applications || '',
        related_dird_ids: Array.isArray(parsed.related_dird_ids) ? parsed.related_dird_ids : [],
        domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      };
      console.log('  OK');
    } catch (err) {
      console.error('  LLM error:', err.message);
    }

    fs.writeFileSync(ANALYSIS_PATH, JSON.stringify(analysis, null, 2), 'utf-8');
  }

  console.log('\nDone. Updated', ANALYSIS_PATH);
}

main().catch(console.error);
