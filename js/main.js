/* ═══════════════════════════════════════
   news rendered from news.js (NEWS array)
   publications rendered from publications.bib
═══════════════════════════════════════ */

const NEWS_VISIBLE = 4; // items shown before "show more"

/* ── News renderer ── */
function renderNews() {
  const container = document.getElementById('news-list');
  if (!container || typeof NEWS === 'undefined') return;

  NEWS.forEach((item, i) => {
    const li = document.createElement('li');
    li.style.display = i >= NEWS_VISIBLE ? 'none' : '';
    // li.innerHTML = `<span class="news-date">${item.date}</span>${item.text}`;
    li.innerHTML = `<span class="news-date">${item.date}</span><span class="news-text">${item.text}</span>`;

    container.appendChild(li);
  });

  if (NEWS.length > NEWS_VISIBLE) {
    const btn = document.createElement('button');
    btn.className = 'news-toggle';
    btn.textContent = `Show ${NEWS.length - NEWS_VISIBLE} more`;
    let open = false;
    btn.addEventListener('click', () => {
      open = !open;
      container.querySelectorAll('li').forEach((el, i) => {
        el.style.display = (i >= NEWS_VISIBLE && !open) ? 'none' : '';
      });
      btn.textContent = open ? 'Show less' : `Show ${NEWS.length - NEWS_VISIBLE} more`;
    });
    container.after(btn);
  }
}

/* ── Minimal BibTeX parser ── */
// function parseBib(text) {
//   const entries = [];
//   const entryRe = /@\w+\s*\{[^@]*/g;
//   let match;
//   while ((match = entryRe.exec(text)) !== null) {
//     const block = match[0];
//     const fields = {};
//     const fieldRe = /(\w+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|(\d+))/g;
//     let f;
//     while ((f = fieldRe.exec(block)) !== null) {
//       const key = f[1].toLowerCase();
//       const val = (f[2] ?? f[3] ?? f[4] ?? '').trim();
//       fields[key] = val;
//     }
//     if (fields.year && fields.title) entries.push(fields);
//   }
//   return entries.sort((a, b) => b.year - a.year);
// }

function parseBib(text) {
  const entries = [];
  const entryRe = /@\w+\s*\{[^@]*/g;
  let match;
  while ((match = entryRe.exec(text)) !== null) {
    const block = match[0];
    const fields = {};

    // Walk char-by-char to extract fields with nested-brace support
    const fieldStartRe = /(\w+)\s*=\s*/g;
    let f;
    while ((f = fieldStartRe.exec(block)) !== null) {
      const key = f[1].toLowerCase();
      let val = '';
      let pos = f.index + f[0].length;
      if (block[pos] === '{') {
        let depth = 0, i = pos;
        while (i < block.length) {
          if (block[i] === '{') depth++;
          else if (block[i] === '}') { depth--; if (depth === 0) { val = block.slice(pos + 1, i); break; } }
          i++;
        }
      } else if (block[pos] === '"') {
        const end = block.indexOf('"', pos + 1);
        if (end !== -1) val = block.slice(pos + 1, end);
      } else {
        const m = block.slice(pos).match(/^(\d+)/);
        if (m) val = m[1];
      }
      fields[key] = val.trim();
    }

    if (fields.year && fields.title) entries.push(fields);
  }
  return entries.sort((a, b) => b.year - a.year);
}

/* Format "Last, First and Last2, First2" -> "F. Last, F2. Last2" */

function formatAuthors(raw) {
  return raw.split(' and ').map(a => {
    a = a.trim();

    // Highlight your name
    const isMe = a === 'Dao, Ha' || a === 'Ha Dao';

    let formatted;
    if (a.includes(',')) {
      const [last, first] = a.split(',').map(s => s.trim());
      const initial = first ? first[0] + '.' : '';
      formatted = initial ? `${initial} ${last}` : last;
    } else {
      const parts = a.split(' ');
      if (parts.length === 1) {
        formatted = a;
      } else {
        const last = parts.pop();
        formatted = `${parts[0][0]}. ${last}`;
      }
    }

    return isMe ? `<strong>${formatted}</strong>` : formatted;
  }).join(', ');
}


/* Build link row
   - Preprint / PDF  -> same tab (no target)
   - DOI / arXiv / Code -> new tab */
function buildLinks(e) {
  const links = [];
  if (e.url_doi)      links.push({ label: 'DOI',     url: e.url_doi,                             ext: true  });
  if (e.url_preprint) links.push({ label: 'Preprint', url: 'assets/preprints/' + e.url_preprint, ext: false });
  if (e.url_pdf)      links.push({ label: 'PDF',      url: e.url_pdf,                            ext: false });
  if (e.url_arxiv)    links.push({ label: 'arXiv',    url: e.url_arxiv,                          ext: true  });
  if (e.url_code)     links.push({ label: 'Code',     url: e.url_code,                           ext: true  });
  return links.map(l => {
    const t = l.ext ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${l.url}"${t}>[${l.label}]</a>`;
  }).join(' ');
}

/* Build one .pub div */
function buildPubDiv(e) {
  const venue   = e.booktitle || e.journal || '';
  const authors = formatAuthors(e.author || '');
  const links   = buildLinks(e);
  const div = document.createElement('div');
  div.className = 'pub';
  div.innerHTML = `
    <p class="pub-title">${e.title}</p>
    <p class="pub-meta">${authors}${venue ? ' &mdash; <em>' + venue + '</em>' : ''}</p>
    ${links ? '<p class="pub-links">' + links + '</p>' : ''}
  `;
  return div;
}

/* Cache bib entries */
let _entries = null;
async function getEntries() {
  if (_entries) return _entries;
  try {
    const res  = await fetch('publications.bib');
    const text = await res.text();
    _entries = parseBib(text);
  } catch (err) {
    _entries = [];
  }
  return _entries;
}

/* Full publication list grouped by year */
async function renderFullPubs() {
  const container = document.getElementById('pub-list');
  if (!container) return;
  const entries = await getEntries();
  if (!entries.length) {
    container.innerHTML = '<p style="color:#888">Could not load publications.bib</p>';
    return;
  }
  const byYear = {};
  entries.forEach(e => {
    if (!byYear[e.year]) byYear[e.year] = [];
    byYear[e.year].push(e);
  });
  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    const h = document.createElement('h3');
    h.textContent = year;
    container.appendChild(h);
    byYear[year].forEach(e => container.appendChild(buildPubDiv(e)));
  });
}

/* Selected publications for home (marked selected = {yes} in .bib) */
async function renderSelectedPubs() {
  const container = document.getElementById('home-pub-list');
  if (!container) return;
  const entries = await getEntries();
  const selected = entries.filter(e => e.selected === 'yes');
  const show = selected.length ? selected : entries.slice(0, 3);
  show.forEach(e => container.appendChild(buildPubDiv(e)));
}

/* ── Tab switching ── */
document.addEventListener('DOMContentLoaded', () => {
  const tabs  = document.querySelectorAll('.tab-link');
  const pages = document.querySelectorAll('.page');

  function showTab(id) {
    tabs.forEach(t  => t.classList.toggle('active', t.dataset.tab === id));
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    history.replaceState(null, '', id === 'home' ? location.pathname : '#' + id);

  }

  tabs.forEach(t => t.addEventListener('click', e => {
    e.preventDefault();
    showTab(t.dataset.tab);
  }));

  const hash  = location.hash.replace('#', '');
  const valid = [...tabs].map(t => t.dataset.tab);
  showTab(valid.includes(hash) ? hash : 'home');

  renderNews();
  renderFullPubs();
  renderSelectedPubs();
});
