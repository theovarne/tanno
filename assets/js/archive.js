import { lifeEngine, normalizeId } from '../../lib/life-engine.cjs';
import { formatTannoTime, parseTannoTime } from '../../lib/time.cjs';

const $ = (id) => document.getElementById(id);
const definitions = {
  flagship: ['FLAGSHIP', 'One indexed life selected to represent a village.', 'ROLE / REPRESENTATIVE'],
  village: ['VILLAGE', 'A wallet balance can be read now. Numbered custody needs a published index.', 'SOURCE / WALLET + INDEXER'],
  keepalive: ['KEEPALIVE', 'A small signal that says a connection is still here. TANNO borrows the word literally.', 'SOURCE / NETWORK LANGUAGE'],
  mortality: ['MORTALITY', 'Supply falls only after a wallet-approved token burn. A sale changes custody, not supply.', 'STATE / VERIFIED BURN ONLY'],
  caretaker: ['CARETAKER', 'The connected public wallet. A balance is not proof of numbered ownership.', 'SOURCE / WALLET'],
  census: ['CENSUS', 'On-chain supply is observed through RPC. Numbered population needs an index.', 'SOURCE / RPC + INDEXER'],
  ghost: ['GHOST', 'An archive record for a life reconciled to a verified burn.', 'SOURCE / VERIFIED RECORD'],
  rarity: ['RARITY', 'A deterministic tier computed from the life ID and the same generator used by Summon.', 'SOURCE / LIFE ENGINE'],
  letgo: ['LET GO', 'A life leaves its current caretaker’s village. No token is burned by a sale.', 'EVENT / CUSTODY CHANGE'],
  death: ['DEATH', 'Permanent death is recorded only after a verifiable token burn and numbered reconciliation.', 'EVENT / TOKEN BURN'],
  graveyard: ['GRAVEYARD', 'The archive of verified deaths. Sketches are never counted as chain records.', 'SOURCE / INDEXER'],
  supply: ['INITIAL POPULATION', 'The maximum life index available to the deterministic engine. The actual mint supply is shown separately.', 'DESIGN / 1,000,000,000'],
  chain: ['SOLANA', 'The network intended for token settlement. A wallet must be on the configured chain.', 'NETWORK / CONFIGURED'],
  contract: ['CONTRACT', 'The mint address is not published yet. After launch it links to the configured explorer.', 'STATE / AWAITING LAUNCH'],
  launch: ['LAUNCH', 'Mint, allocation, venue, and custody policy need a published specification.', 'STATE / PLANNED'],
  roadmap: ['ROADMAP', 'These are design stages, not shipping dates or evidence of completed chain work.', 'STATE / PLANNED'],
  mythic: ['MYTHIC', 'Special IDs include #1, #777, the upper boundary, and palindromes.', 'SOURCE / DETERMINISTIC ENGINE'],
  graveDemo: ['ARCHIVE SKETCH', 'This headstone is a drawing, not a verified death or transaction.', 'STATE / DEMO SPECIMEN'],
  flagshipDemo: ['FLAGSHIP', 'The representative waits for an indexed wallet snapshot. No ID is assigned by this sketch.', 'STATE / UNASSIGNED'],
};
const codeNotes = {
  mulberry32: ['DETERMINISTIC RNG', 'The same seed always yields the same sequence.', 'SOURCE / GENERATOR'],
  seedFor: ['DETERMINISTIC SEED', 'The life ID is mixed into a stable 32-bit starting point.', 'SOURCE / GENERATOR'],
  generate: ['LIFE GENERATION', 'A number resolves to the same traits and portrait inputs every time.', 'SOURCE / LIFE ENGINE'],
  classify: ['RARITY RESOLUTION', 'A deterministic roll maps an ID to a rarity tier.', 'SOURCE / GENERATOR'],
  lifespanDays: ['LIFESPAN CLASS', 'Design metadata, not an active death timer.', 'SOURCE / LIFE ENGINE'],
  lifeEngine: ['LIFE ENGINE', 'The record returned here is the same record shown by Summon.', 'SOURCE / CLIENT'],
  burnOneOrMore: ['VOLUNTARY BURN', 'Only a user-confirmed wallet transaction can reduce mint supply.', 'SOURCE / CLIENT TOKEN INSTRUCTION'],
  createBurnCheckedInstruction: ['BURN CHECKED', 'A Solana Token burn instruction with an explicit amount and mint decimals.', 'SOURCE / TOKEN PROGRAM'],
  graveyard: ['GRAVEYARD', 'Numbered headstones require verified burn and custody records from an indexer.', 'SOURCE / INDEXER'],
};

const tooltip = document.createElement('aside');
tooltip.id = 'archive-tooltip';
tooltip.setAttribute('role', 'tooltip');
tooltip.hidden = true;
tooltip.innerHTML = '<strong></strong><span></span><small></small>';
document.body.append(tooltip);
let tooltipTarget = null;
let showTimer;
let hideTimer;

function tooltipInfo(target) {
  if (!target) return null;
  if (target.dataset.inspect) return codeNotes[target.dataset.inspect] || null;
  if (target.dataset.tip) return definitions[target.dataset.tip] || null;
  const rawId = target.dataset.lifeId || (target.closest('#legendary-body') ? target.textContent.replace(/[^0-9]/g, '') : '');
  if (rawId) {
    try {
      const life = lifeEngine(normalizeId(rawId));
      return [life.name, `${life.rarity} / ${life.species.toUpperCase()} / ${life.palette.toUpperCase()}`, target.dataset.demo === 'true' ? 'DEMO SPECIMEN / NOT CUSTODY ASSIGNED' : target.dataset.indexed === 'true' ? 'INDEXED CUSTODY / LIFE STATUS UNVERIFIED' : 'IDENTITY / COMPUTED; CUSTODY SEPARATE'];
    } catch { return null; }
  }
  if (target.dataset.archiveTime) return ['ARCHIVE TIME', formatTannoTime(target.dataset.archiveTime), 'ZONE / AMERICA / NEW YORK'];
  return null;
}

function placeTooltip(target) {
  const rect = target.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  const left = Math.min(window.innerWidth - width - 10, Math.max(10, rect.left));
  const below = rect.bottom + 9;
  const top = below + height < window.innerHeight - 10 ? below : Math.max(10, rect.top - height - 9);
  tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
}

function hideTooltip() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  tooltip.hidden = true;
  tooltipTarget = null;
}

function showTooltip(target, immediate = false) {
  const info = tooltipInfo(target);
  if (!info) return;
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  showTimer = setTimeout(() => {
    tooltip.querySelector('strong').textContent = info[0];
    tooltip.querySelector('span').textContent = info[1];
    tooltip.querySelector('small').textContent = info[2];
    tooltip.hidden = false;
    tooltipTarget = target;
    placeTooltip(target);
  }, immediate ? 0 : 150);
}

function tipTrigger(node) {
  return node instanceof Element ? node.closest('[data-tip],[data-life-id],[data-archive-time],[data-inspect],#legendary-body a') : null;
}

function initTooltips() {
  const linkTerms = new Map([
    ['#flagship', 'flagship'], ['#village', 'village'], ['#keepalive', 'keepalive'],
    ['#death', 'death'], ['#graveyard', 'graveyard'], ['#rarity', 'rarity'],
    ['#census', 'census'], ['#seller', 'letgo'],
  ]);
  for (const section of document.querySelectorAll('section')) {
    let count = 0;
    for (const link of section.querySelectorAll('p a[href^="#"], li a[href^="#"], blockquote a[href^="#"]')) {
      if (count >= 4 || link.dataset.id) continue;
      const term = linkTerms.get(link.getAttribute('href'));
      if (term) { link.dataset.tip = term; link.classList.add('archive-term'); count += 1; }
    }
  }
  for (const link of document.querySelectorAll('a[target="_blank"]')) link.classList.add('archive-external');
  const population = document.querySelector('.bignum');
  if (population) { population.dataset.tip = 'supply'; population.tabIndex = 0; population.classList.add('archive-term'); }
  for (const link of document.querySelectorAll('[data-id]')) link.dataset.lifeId = link.dataset.id;
  const seller = document.querySelector('#seller blockquote');
  if (seller) { seller.dataset.tip = 'letgo'; seller.tabIndex = 0; }
  const tokenRows = document.querySelectorAll('#token table tbody tr');
  const rowTerms = [null, 'supply', 'launch', 'chain', 'chain', 'launch', 'contract'];
  tokenRows.forEach((row, index) => { if (rowTerms[index]) { row.dataset.tip = rowTerms[index]; row.tabIndex = 0; } });
  const roadmapRows = document.querySelectorAll('#roadmap tbody tr');
  roadmapRows.forEach((row) => { row.dataset.tip = 'roadmap'; row.tabIndex = 0; });
  const caretaker = document.querySelector('#my-village .vt span');
  if (caretaker) { caretaker.dataset.tip = 'caretaker'; caretaker.tabIndex = 0; }
  const rareRows = document.querySelectorAll('#rarity > table tbody tr');
  rareRows.forEach((row) => { row.dataset.tip = row.textContent.includes('MYTHIC') ? 'mythic' : 'rarity'; row.tabIndex = 0; });
  document.addEventListener('mouseover', (event) => {
    const target = tipTrigger(event.target);
    if (target && target !== tooltipTarget) showTooltip(target);
  });
  document.addEventListener('mouseout', (event) => {
    const target = tipTrigger(event.target);
    if (target && !target.contains(event.relatedTarget)) hideTimer = setTimeout(hideTooltip, 120);
  });
  document.addEventListener('focusin', (event) => { const target = tipTrigger(event.target); if (target) showTooltip(target, true); });
  document.addEventListener('focusout', (event) => { if (tipTrigger(event.target)) hideTooltip(); });
  document.addEventListener('click', (event) => {
    if (!window.matchMedia('(hover: none)').matches) return;
    const target = tipTrigger(event.target);
    if (!target?.matches('a') || (!target.dataset.tip && !target.dataset.lifeId)) return;
    if (tooltipTarget !== target) { event.preventDefault(); event.stopPropagation(); showTooltip(target, true); }
  }, true);
  document.addEventListener('click', (event) => {
    const target = tipTrigger(event.target);
    if (!target) { hideTooltip(); return; }
    if (target.dataset.inspect) { openInspector(target.dataset.inspect); hideTooltip(); return; }
    if (window.matchMedia('(hover: none)').matches) {
      if (tooltipTarget !== target) { if (target.matches('a')) event.preventDefault(); showTooltip(target, true); }
      else hideTooltip();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { hideTooltip(); closeInspector(); }
    if (event.key === 'Enter' && event.target.dataset.inspect) openInspector(event.target.dataset.inspect);
  });
  window.addEventListener('scroll', () => { if (tooltipTarget) placeTooltip(tooltipTarget); }, { passive: true });
  window.addEventListener('resize', () => { if (tooltipTarget) placeTooltip(tooltipTarget); });
}

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const tokenPattern = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|throw|await|async|class|import|export|from|require)\b|\b(?:true|false|null|undefined|Infinity)\b|\b\d[\d_]*(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\())/g;
function highlightLine(line) {
  let html = '';
  let last = 0;
  for (const match of line.matchAll(tokenPattern)) {
    html += escapeHtml(line.slice(last, match.index));
    const token = match[0];
    const kind = token.startsWith('//') ? 'comment' : /^["'`]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(true|false|null|undefined|Infinity)$/.test(token) ? 'constant' : /^(const|let|var|function|return|if|else|for|while|new|throw|await|async|class|import|export|from|require)$/.test(token) ? 'keyword' : 'function';
    html += `<span class="syntax-${kind}">${escapeHtml(token)}</span>`;
    last = match.index + token.length;
  }
  return html + escapeHtml(line.slice(last));
}

let sources = null;
let activeTab = 'ENGINE';
let copyTimer;
function keyForLine(line) {
  for (const key of Object.keys(codeNotes)) if (new RegExp(`\\b${key}\\b`).test(line)) return key;
  return null;
}
function renderCode(tab) {
  if (!sources?.[tab]) return;
  activeTab = tab;
  const host = $('code-lines');
  host.replaceChildren();
  const fragment = document.createDocumentFragment();
  sources[tab].split('\n').forEach((value, index) => {
    const line = document.createElement('div');
    line.className = 'code-line';
    const inspect = keyForLine(value);
    if (inspect) { line.dataset.inspect = inspect; line.tabIndex = 0; line.setAttribute('role', 'button'); line.setAttribute('aria-label', `Inspect ${inspect} at line ${index + 1}`); }
    line.innerHTML = `<span class="code-no">${String(index + 1).padStart(3, '0')}</span><span class="code-text">${highlightLine(value) || ' '}</span>`;
    fragment.append(line);
  });
  host.append(fragment);
  $('code-scroll').scrollTop = 0;
  $('code-scroll').scrollLeft = 0;
  document.querySelectorAll('[data-code-tab]').forEach((button) => {
    const selected = button.dataset.codeTab === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $('code-file').textContent = sources.files?.[tab] || 'SOURCE';
  closeInspector();
}
function openInspector(key) {
  const note = codeNotes[key];
  if (!note) return;
  const host = $('code-inspector');
  if (!host) return;
  host.hidden = false;
  $('code-inspector-title').textContent = note[0];
  $('code-inspector-body').textContent = note[1];
  $('code-inspector-meta').textContent = note[2];
}
function closeInspector() { if ($('code-inspector')) $('code-inspector').hidden = true; }
function initCode() {
  const setStatus = (value) => { $('code-status').textContent = value; };
  document.querySelectorAll('[data-code-tab]').forEach((button) => button.addEventListener('click', () => renderCode(button.dataset.codeTab)));
  $('code-tabs').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const tabs = [...document.querySelectorAll('[data-code-tab]')];
    const index = tabs.findIndex((button) => button.dataset.codeTab === activeTab);
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus(); next.click(); event.preventDefault();
  });
  $('code-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sources?.[activeTab] || '');
      $('code-copy').textContent = '[ COPIED ]';
      setStatus('SOURCE COPIED');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { $('code-copy').textContent = '[ COPY ]'; }, 1200);
    } catch { setStatus('CLIPBOARD UNAVAILABLE'); }
  });
  $('code-run').addEventListener('click', () => {
    $('code-output').hidden = false;
    try {
      const life = lifeEngine(normalizeId($('code-run-id').value));
      $('code-output-text').textContent = `> boot tanno.life-engine\n> deterministic .... TRUE\n> generate(${life.id})\n\n${JSON.stringify(life, null, 2)}`;
      setStatus(`EXECUTED ${life.name}`);
    } catch (error) { $('code-output-text').textContent = `> ERROR / ${error.message}`; setStatus('INVALID LIFE ID'); }
  });
  $('code-run-id').addEventListener('keydown', (event) => { if (event.key === 'Enter') $('code-run').click(); });
  $('code-reset').addEventListener('click', () => {
    $('code-output').hidden = true;
    $('code-run-id').value = '777';
    renderCode('ENGINE');
    setStatus('READ ONLY / SOURCE RESTORED');
  });
  $('code-inspector-close').addEventListener('click', closeInspector);
  fetch('./data/code.json').then((response) => {
    if (!response.ok) throw new Error(`CODE SOURCE HTTP ${response.status}`);
    return response.json();
  }).then((data) => { sources = data; renderCode('ENGINE'); setStatus('SOURCE LOADED / READ ONLY'); })
    .catch((error) => { setStatus(`SOURCE UNAVAILABLE / ${error.message}`); });
}

function initFaq() {
  const faq = $('faq');
  for (const heading of [...faq.querySelectorAll(':scope > h3')]) {
    const answer = heading.nextElementSibling;
    if (!answer || answer.tagName !== 'P') continue;
    const details = document.createElement('details');
    details.className = 'archive-faq';
    const summary = document.createElement('summary');
    summary.textContent = heading.textContent;
    details.append(summary, answer);
    heading.replaceWith(details);
  }
}

function initDiary() {
  document.querySelectorAll('.diary .e').forEach((entry, index) => {
    const title = entry.querySelector('.d');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'diary-toggle';
    button.textContent = title.textContent;
    button.setAttribute('aria-expanded', 'false');
    title.replaceChildren(button);
    const meta = document.createElement('div');
    meta.className = 'diary-meta archive-meta';
    meta.hidden = true;
    const recorded = parseTannoTime(entry.dataset.recordedAt);
    meta.textContent = `ENTRY ${String(index + 1).padStart(3, '0')} / ARCHIVE TYPE: DIARY / RECORDED: ${recorded ? formatTannoTime(recorded) : 'NOT OBSERVED'}`;
    if (recorded) { meta.dataset.archiveTime = recorded.toISOString(); meta.tabIndex = 0; }
    entry.append(meta);
    button.addEventListener('click', () => { meta.hidden = !meta.hidden; button.setAttribute('aria-expanded', String(!meta.hidden)); });
  });
}

function initLexicon() {
  const destinations = ['#name', '#howmade', '#number', '#flagship', '#village', '#hold', '#keepalive', '#seller', '#death', '#graveyard'];
  document.querySelectorAll('#lexicon dt').forEach((term, index) => {
    const link = document.createElement('a');
    link.href = destinations[index] || '#lexicon';
    link.textContent = term.textContent;
    link.dataset.tip = ({ 3: 'flagship', 4: 'village', 6: 'keepalive', 7: 'letgo', 8: 'death', 9: 'ghost' })[index] || 'rarity';
    term.replaceChildren(link);
  });
}

function decorateArt(host, pattern, makeElement) {
  if (!host) return;
  const source = host.textContent;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    fragment.append(document.createTextNode(source.slice(cursor, match.index)));
    fragment.append(makeElement(match[0], match.index));
    cursor = match.index + match[0].length;
  }
  fragment.append(document.createTextNode(source.slice(cursor)));
  host.replaceChildren(fragment);
}

function initArchiveScenes() {
  const village = document.querySelector('#village > .art');
  let index = 0;
  decorateArt(village, /\(\s*[ox-]\s*\)/g, (glyph) => {
    const node = document.createElement('button');
    node.className = 'art-glyph'; node.type = 'button'; node.textContent = glyph;
    node.dataset.lifeId = String([1, 777, 12321, 817261, 3817261][index++ % 5]);
    node.dataset.demo = 'true';
    node.setAttribute('aria-label', `${glyph} demo life ${node.dataset.lifeId}`);
    node.addEventListener('click', () => { window.__TANNO_TEST__?.summon(node.dataset.lifeId); $('demo').scrollIntoView(); });
    return node;
  });
  const grave = document.querySelector('#graveyard > .art');
  decorateArt(grave, /#(?:77|12|98)/g, (value) => {
    const node = document.createElement('span');
    node.className = 'art-glyph'; node.textContent = value; node.dataset.tip = 'graveDemo'; node.tabIndex = 0;
    return node;
  });
  const flagship = document.querySelector('#flagship .earn');
  if (flagship) {
    const specimen = document.createElement('div');
    specimen.className = 'flagship-signal'; specimen.tabIndex = 0; specimen.dataset.tip = 'flagshipDemo';
    specimen.innerHTML = '<span class="flagship-eye" aria-hidden="true">◉</span><span>FLAGSHIP / <b id="flagship-observed">AWAITING INDEXED WALLET</b></span>';
    flagship.before(specimen);
    const target = $('village-flagship');
    if (target) new MutationObserver(() => { $('flagship-observed').textContent = target.textContent === '—' ? 'AWAITING INDEXED WALLET' : target.textContent; }).observe(target, { childList: true });
  }
  const keepalive = document.querySelector('#keepalive .earn');
  if (keepalive) {
    const trace = document.createElement('div');
    trace.className = 'keepalive-trace'; trace.dataset.tip = 'keepalive'; trace.tabIndex = 0;
    trace.textContent = '__/\\____/\\_/\\/\\____/\\__';
    trace.setAttribute('aria-label', 'Keepalive pulse, a visual metaphor, not on-chain activity');
    keepalive.before(trace);
    trace.addEventListener('mouseenter', () => trace.classList.add('is-active'));
    trace.addEventListener('mouseleave', () => trace.classList.remove('is-active'));
  }
  const seller = document.querySelector('#seller .earn');
  if (seller) {
    const scene = document.createElement('div');
    scene.className = 'seller-scene';
    scene.innerHTML = '<span aria-hidden="true">● ● ●  →  ○ ○ ○</span><small>CONCEPT SKETCH / CUSTODY MOVES; SUPPLY DOES NOT</small>';
    seller.before(scene);
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { scene.classList.add('is-read'); observer.disconnect(); }
      }, { threshold: .25 });
      observer.observe(seller.closest('section'));
    }
  }
}

function initIndexAndReturn() {
  const panel = $('archive-index');
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  panel.replaceChildren();
  links.forEach((original) => {
    const target = document.querySelector(original.getAttribute('href'));
    if (!target) return;
    const link = document.createElement('a');
    link.href = original.getAttribute('href');
    link.textContent = original.textContent.replace(/\s+/g, ' ').trim();
    link.dataset.preview = target.querySelector('h2')?.textContent || 'ARCHIVE RECORD';
    panel.append(link);
  });
  for (const [href, label] of [['#census', '03 / live census'], ['#heartbeat', '03 / heartbeat'], ['#my-village', '09 / my village'], ['#legendary-index', '07 / legendary index'], ['#graveyard-live', '14 / verified graveyard']]) {
    const link = document.createElement('a');
    link.href = href; link.textContent = label;
    link.dataset.preview = document.querySelector(href)?.querySelector('h3')?.textContent || 'LIVE ARCHIVE RECORD';
    panel.append(link);
  }
  panel.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    panel.hidden = true;
    $("index-toggle").setAttribute("aria-expanded", "false");
  });
  const indexLinks = [...panel.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        indexLinks.forEach((link) => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      }
    }, { rootMargin: '-20% 0px -65% 0px' });
    document.querySelectorAll('section[id]').forEach((section) => observer.observe(section));
  }
  const returnButton = document.createElement('button');
  returnButton.id = 'archive-return'; returnButton.type = 'button'; returnButton.hidden = true;
  document.body.append(returnButton);
  let previousY = 0;
  let timer;
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor || anchor.dataset.id || anchor.getAttribute('href') === '#') return;
    const from = [...document.querySelectorAll('section[id]')].reverse().find((section) => section.getBoundingClientRect().top < 90);
    previousY = window.scrollY;
    returnButton.textContent = `← RETURN TO ${from?.querySelector('.sec')?.textContent.split('·')[0].trim() || 'ARCHIVE'}`;
    returnButton.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { returnButton.hidden = true; }, 7000);
  });
  returnButton.addEventListener('click', () => { window.scrollTo({ top: previousY, behavior: 'smooth' }); returnButton.hidden = true; });
}

function initReveal() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('archive-visible'); observer.unobserve(entry.target); }
  }, { threshold: .02, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('section').forEach((section) => { section.classList.add('archive-reveal'); observer.observe(section); });
}

initFaq();
initDiary();
initLexicon();
initArchiveScenes();
initIndexAndReturn();
initTooltips();
initCode();
initReveal();
