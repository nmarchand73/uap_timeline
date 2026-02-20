import Fuse from 'fuse.js';

let searchData = {};
try {
  const el = document.getElementById('search-data');
  if (el && el.textContent) searchData = JSON.parse(el.textContent);
} catch (e) {
  console.error('Search data failed to load', e);
}

const TYPE_LABELS = {
  doc: 'Document',
  person: 'Personne',
  incident: 'Incident',
  theme: 'Thème',
  program: 'Programme',
  dird: 'DIRD',
  chapter: 'Documentaire',
  video: 'Vidéo',
};

const items = [
  ...(searchData.docs || []).map((d) => ({ ...d, searchText: `${d.title} ${d.authors} ${d.themes || ''}` })),
  ...(searchData.people || []).map((p) => ({ ...p, searchText: `${p.name} ${p.role} ${p.bio || ''}` })),
  ...(searchData.incidents || []).map((i) => ({ ...i, searchText: `${i.name} ${i.description || ''} ${i.date || ''}` })),
  ...(searchData.themes || []).map((t) => ({ ...t, searchText: `${t.label} ${t.description || ''} ${t.id}` })),
  ...(searchData.programs || []).map((p) => ({ ...p, searchText: `${p.name} ${p.description || ''} ${p.dates || ''}` })),
  ...(searchData.dirds || []).map((d) => ({ ...d, searchText: `${d.title} ${d.author} ${d.affiliation || ''}` })),
  ...(searchData.chapters || []).map((c) => ({ ...c, searchText: `${c.title} ${c.description || ''} ${c.key_quote || ''}` })),
  ...(searchData.videos || []).map((v) => ({ ...v, searchText: `${v.title} ${v.description || ''} ${v.event_date || ''}` })),
];

const fuse = new Fuse(items, {
  keys: ['searchText', 'title', 'name', 'label', 'authors', 'role', 'description', 'author'],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
});

const input = document.getElementById('search-input');
const results = document.getElementById('search-results');
const status = document.getElementById('search-status');

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderItem(item) {
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  if (item.type === 'doc') {
    return `<a href="/documents/${escapeHtml(item.slug)}/" class="result-item" data-type="doc">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.authors)} (${item.year})
    </a>`;
  }
  if (item.type === 'person') {
    return `<a href="/people/${escapeHtml(item.id)}/" class="result-item" data-type="person">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.role)}
    </a>`;
  }
  if (item.type === 'incident') {
    const desc = String(item.description || '').slice(0, 100);
    return `<a href="/incidents/#${escapeHtml(item.id)}" class="result-item" data-type="incident">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(desc)}${desc.length >= 100 ? '…' : ''}
    </a>`;
  }
  if (item.type === 'theme') {
    return `<a href="/themes/" class="result-item" data-type="theme">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.label)}</strong> — ${escapeHtml(String(item.description || '').slice(0, 80))}…
    </a>`;
  }
  if (item.type === 'program') {
    return `<a href="/programs/#${escapeHtml(item.id)}" class="result-item" data-type="program">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.dates || '')}) — ${escapeHtml(String(item.description || '').slice(0, 80))}…
    </a>`;
  }
  if (item.type === 'dird') {
    return `<a href="/dirds/${item.id}/" class="result-item" data-type="dird">
      <span class="result-type">${typeLabel}</span>
      <strong>DIRD ${item.id}</strong> — ${escapeHtml(item.title)} (${escapeHtml(item.author)})
    </a>`;
  }
  if (item.type === 'chapter') {
    const ts = item.timestamp_seconds || 0;
    return `<a href="/documentary/#t=${ts}" class="result-item" data-type="chapter">
      <span class="result-type">${typeLabel}</span>
      <strong>Ch. ${item.id}</strong> — ${escapeHtml(item.title)}
    </a>`;
  }
  if (item.type === 'video') {
    return `<a href="/videos/#${escapeHtml(item.id)}" class="result-item" data-type="video">
      <span class="result-type">${typeLabel}</span>
      <strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.event_date || '')}
    </a>`;
  }
  return '';
}

function runSearch() {
  const q = input?.value?.trim() ?? '';
  if (!q) {
    if (results) results.innerHTML = '';
    if (status) status.textContent = '';
    return;
  }
  if (items.length === 0) {
    if (results) results.innerHTML = '<p class="no-results">Données de recherche non chargées. Rechargez la page.</p>';
    if (status) status.textContent = '';
    return;
  }

  const matches = fuse.search(q).slice(0, 30);
  const byType = {};
  matches.forEach((m) => {
    const t = m.item.type;
    if (!byType[t]) byType[t] = [];
    byType[t].push(m);
  });

  const order = ['person', 'incident', 'doc', 'chapter', 'video', 'dird', 'program', 'theme'];
  let html = '';
  order.forEach((type) => {
    const list = byType[type];
    if (!list || list.length === 0) return;
    const label = TYPE_LABELS[type] || type;
    html += `<div class="result-group"><h3 class="result-group-title">${label}</h3>`;
    html += list.map((m) => renderItem(m.item)).join('');
    html += '</div>';
  });

  if (results) {
    results.innerHTML = html || '<p class="no-results">Aucun résultat pour « ' + escapeHtml(q) + ' »</p>';
  }
  if (status) {
    status.textContent = matches.length > 0 ? `${matches.length} résultat${matches.length > 1 ? 's' : ''}` : 'Aucun résultat';
  }
}

let debounceTimer;
if (input && results) {
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 200);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      input.blur();
      results.innerHTML = '';
      if (status) status.textContent = '';
    }
  });
}
