import { getWallets } from '@wallet-standard/app';
import { lifeEngine, lifePixels, normalizeId, SUPPLY, PIXELS } from '../../lib/life-engine.cjs';
import { resolveConfig, explorerUrl } from '../../lib/config.cjs';
import { RpcClient, indexerGet } from '../../lib/rpc.js';
import { discoverWallets, connectWallet, disconnectWallet } from '../../lib/wallet.js';
import { formatTannoTime, relativeTannoTime, parseTannoTime } from '../../lib/time.cjs';

const $ = (id) => document.getElementById(id);
const number = (value) => Number(value).toLocaleString('en-US');
const short = (value) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '—';
const burnUrl = new URL('./burn.js', document.currentScript.src).href;
const state = { config: null, rpc: null, connection: null, supply: null, tokenAccounts: [], balanceRaw: 0n, walletIds: [], walletIndexed: false, selectedId: 777, selectedLife: null, specimenImages: [], summonRequest: 0, indexerStatus: 'UNAVAILABLE', walletEventOff: null, timers: [] };

function text(id, value) {
  const node = $(id);
  if (node) node.textContent = String(value);
}

function status(id, value, kind = 'quiet') {
  const node = $(id);
  if (!node) return;
  node.textContent = value;
  node.dataset.state = kind;
}

function formatUnits(raw, decimals) {
  const divisor = 10n ** BigInt(decimals);
  const whole = BigInt(raw) / divisor;
  const fraction = String(BigInt(raw) % divisor).padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
}

function setArchiveTime(id, value, relative = true) {
  const node = $(id);
  const date = parseTannoTime(value);
  if (!node) return;
  node.textContent = date ? (relative ? relativeTannoTime(date) : formatTannoTime(date)) : 'NOT OBSERVED';
  if (date) {
    node.dataset.archiveTime = date.toISOString();
    node.title = formatTannoTime(date);
    node.tabIndex = 0;
  } else {
    delete node.dataset.archiveTime;
    node.removeAttribute('title');
  }
}

async function copy(value, feedbackId, label) {
  try {
    await navigator.clipboard.writeText(value);
    status(feedbackId, `${label} COPIED`, 'ok');
  } catch {
    status(feedbackId, 'CLIPBOARD UNAVAILABLE', 'error');
  }
}

function showConfig(config) {
  status('site-status', config.mode === 'LIVE' ? 'STATUS: LIVE' : 'STATUS: AWAITING BIRTH', config.mode === 'LIVE' ? 'ok' : 'quiet');
  text('contract-network', config.network === 'mainnet-beta' ? 'SOLANA MAINNET' : `SOLANA ${config.network.toUpperCase()}`);
  text('contract-status', config.mode === 'LIVE' ? 'LIVE CONFIGURATION' : 'AWAITING LAUNCH');
  text('contract-symbol', config.tokenSymbol);
  for (const id of ['ca', 'ca2']) {
    const node = $(id);
    node.dataset.ready = String(config.mode === 'LIVE');
    node.textContent = config.mode === 'LIVE' ? (id === 'ca' ? `CA: ${short(config.tokenMint)}` : short(config.tokenMint)) : (id === 'ca' ? 'CA: TBA' : 'TBA');
    node.title = config.mode === 'LIVE' ? config.tokenMint : 'Mint address awaiting launch';
    if (config.mode === 'LIVE') {
      node.tabIndex = 0;
      node.setAttribute('role', 'link');
      node.addEventListener('click', () => window.open(explorerUrl(config, 'token', config.tokenMint), '_blank', 'noopener'));
      node.addEventListener('keydown', (event) => { if (event.key === 'Enter') node.click(); });
    }
  }
  const twitter = document.querySelectorAll('a[href="https://x.com/tanno_token"]');
  twitter.forEach((link) => { link.href = config.xUrl; });
  status('census-state', config.mode === 'LIVE' ? 'LOADING ON-CHAIN SUPPLY' : 'THE CENSUS HAS NOT STARTED');
  status('heartbeat-state', config.mode === 'LIVE' ? 'AWAITING ACTIVITY FEED' : 'NO PULSE OBSERVED');
  status('graveyard-state', config.mode === 'LIVE' ? 'AWAITING VERIFIED RECORDS' : 'THE GRAVEYARD IS EMPTY');
  status('wallet-state', 'NO CARETAKER CONNECTED');
  status('burn-status', config.mode === 'LIVE' ? 'CONNECT A WALLET TO PREPARE A BURN' : 'AWAITING MINT');
}

function drawLife(value, readyImage = null) {
  const life = lifeEngine(value, state.specimenImages);
  const imageFrame = $('portrait-gallery');
  const imageNode = $('portrait-gallery-image');
  if (life.imageSrc && readyImage !== false) {
    imageNode.src = readyImage?.src || life.imageSrc;
    imageNode.alt = `Tanno #${life.displayId} specimen appearance`;
    imageFrame.hidden = false;
  } else {
    imageFrame.hidden = true;
  }
  const canvas = $('vcanvas');
  canvas.width = PIXELS;
  canvas.height = PIXELS;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#151512';
  ctx.fillRect(0, 0, PIXELS, PIXELS);
  const pixels = lifePixels(life.id);
  for (let y = 0; y < PIXELS; y += 1) {
    for (let x = 0; x < PIXELS; x += 1) {
      if (!pixels[y][x]) continue;
      ctx.fillStyle = pixels[y][x];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  state.selectedId = life.id;
  state.selectedLife = life;
  text('vname', life.name);
  text('vtag', `#${number(life.id)}`);
  text('vrarity', `${life.rarity}${life.legendaryId ? ' ✦' : ''}`);
  text('vspecies', life.species);
  text('vpalette', life.palette);
  text('veyes', life.eyes);
  text('vtemper', life.temperament);
  text('vlife', life.lifespanClass);
  text('vbody', life.body);
  text('vtrait', life.trait);
  text('vstatus', state.config?.mode === 'LIVE' ? 'NOT INDEXED' : 'AWAITING BIRTH');
  text('vage', '—');
  text('vcaretaker', 'UNKNOWN');
  $('vid').value = String(life.id);
  status('vfeedback', 'IDENTITY COMPUTED / STATUS SEPARATE');
  if (state.config?.mode === 'LIVE' && state.config.indexerEndpoint) loadLifeStatus(life.id);
  return life;
}

async function loadLifeStatus(id) {
  try {
    const data = await indexerGet(state.config, `/life/${id}`);
    if (state.selectedId !== id) return;
    const lifeStatus = ['ALIVE', 'DEAD'].includes(data.status) ? data.status : 'NOT INDEXED';
    text('vstatus', lifeStatus);
    text('vage', data.ageDays == null ? '—' : `${number(data.ageDays)} DAYS`);
    text('vcaretaker', data.caretaker ? short(data.caretaker) : 'UNKNOWN');
  } catch {
    if (state.selectedId === id) text('vstatus', 'INDEXER UNAVAILABLE');
  }
}

async function summon(value) {
  const request = ++state.summonRequest;
  try {
    const id = normalizeId(value);
    const life = lifeEngine(id, state.specimenImages);
    status('vfeedback', 'COMPUTING LIFE…');
    let readyImage = null;
    if (life.imageSrc) {
      readyImage = new Image();
      readyImage.decoding = 'async';
      readyImage.src = life.imageSrc;
      try { await readyImage.decode(); } catch { readyImage = false; }
    }
    if (request !== state.summonRequest) return null;
    return drawLife(id, readyImage);
  } catch (error) {
    if (request === state.summonRequest) status('vfeedback', error.message.toUpperCase(), 'error');
    return null;
  }
}

function initSpecimenPool() {
  try {
    const sources = JSON.parse($('specimen-images')?.textContent || '[]');
    state.specimenImages = Array.isArray(sources)
      ? sources.filter((source) => typeof source === 'string' && source.startsWith('./assets/images/sevra/gallery/'))
      : [];
  } catch { state.specimenImages = []; }
}
function initSummon() {
  $('vgo').addEventListener('click', () => summon($('vid').value));
  $('vid').addEventListener('keydown', (event) => { if (event.key === 'Enter') summon(event.target.value); });
  $('vrand').addEventListener('click', () => {
    const random = new Uint32Array(1);
    let id;
    let candidate;
    do {
      crypto.getRandomValues(random);
      id = (random[0] % SUPPLY) + 1;
      candidate = lifeEngine(id, state.specimenImages);
    } while (id === state.selectedId
      || (state.specimenImages.length > 1 && candidate.imageIndex === state.selectedLife?.imageIndex)
      || (state.selectedLife && ['rarity', 'species', 'palette', 'eyes', 'temperament', 'lifespanClass', 'body', 'trait']
        .every((key) => candidate[key] === state.selectedLife[key])));
    summon(id);
  });
  $('vcopy-id').addEventListener('click', () => copy(String(state.selectedId), 'vfeedback', 'ID'));
  $('vcopy-record').addEventListener('click', () => copy(JSON.stringify(state.selectedLife, null, 2), 'vfeedback', 'RECORD'));
  document.querySelectorAll('[data-id]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    summon(link.dataset.id);
    $('demo').scrollIntoView({ block: 'start' });
  }));
  drawLife(777);
}

function initIndex() {
  const toggle = $('index-toggle');
  const panel = $('archive-index');
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

async function refreshCensus() {
  if (state.config.mode !== 'LIVE') return;
  try {
    const result = await state.rpc.tokenSupply(state.config.tokenMint);
    state.supply = result.value;
    text('census-onchain', formatUnits(result.value.amount, result.value.decimals));
    setArchiveTime('census-observed', new Date());
    status('census-state', 'ON-CHAIN SUPPLY OBSERVED', 'ok');
  } catch (error) {
    state.supply = null;
    status('census-state', `RPC UNAVAILABLE / ${error.message}`, 'error');
    text('census-onchain', 'RPC UNAVAILABLE');
  }
  if (!state.config.indexerEndpoint) {
    status('heartbeat-state', 'NO ACTIVITY INDEXER');
    return;
  }
  try {
    const data = await indexerGet(state.config, '/census');
    for (const [id, key] of [
      ['census-circulating', 'circulating'], ['census-alive', 'alive'],
      ['census-burned', 'burned'], ['census-caretakers', 'caretakers'],
      ['census-transfers', 'transfers24h'],
    ]) text(id, data[key] == null ? 'NOT INDEXED' : number(data[key]));
    if (data.observedAt) setArchiveTime('census-observed', data.observedAt);
    if (data.activity && Array.isArray(data.activity.buckets5m)) {
      const buckets = data.activity.buckets5m.slice(-12).map((x) => Math.max(0, Number(x) || 0));
      const maximum = Math.max(1, ...buckets);
      const bars = '▁▂▃▄▅▆▇█';
      text('heartbeat-activity', buckets.map((x) => bars[Math.min(7, Math.floor(x / maximum * 7))]).join(''));
      text('heartbeat-score', Math.min(99, Math.round((Number(data.activity.transfers5m) || 0) / 5)));
      text('heartbeat-transfers', `${number(data.activity.transfers5m || 0)} / 5M`);
      setArchiveTime('heartbeat-last', data.activity.lastEventAt);
      status('heartbeat-state', 'ACTIVITY ABSTRACTION / DERIVED', 'ok');
    } else {
      status('heartbeat-state', 'NO ACTIVITY FEED');
    }
  } catch (error) {
    status('heartbeat-state', `INDEXER UNAVAILABLE / ${error.message}`, 'error');
  }
}

function renderWalletChoices() {
  const choices = $('wallet-choices');
  choices.replaceChildren();
  const wallets = discoverWallets(state.config.chain);
  if (!wallets.length) {
    const note = document.createElement('span');
    note.className = 'archive-meta';
    note.textContent = 'NO SOLANA WALLET DETECTED. INSTALL PHANTOM, SOLFLARE, OR BACKPACK.';
    choices.append(note);
    return;
  }
  wallets.forEach((wallet) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'archive-control';
    button.textContent = wallet.name;
    button.addEventListener('click', async () => {
      choices.hidden = true;
      status('wallet-state', `CONNECTING ${wallet.name.toUpperCase()}…`);
      try {
        state.connection = await connectWallet(wallet, state.config.chain);
        if (state.walletEventOff) state.walletEventOff();
        const events = wallet.features['standard:events'];
        state.walletEventOff = events?.on?.('change', ({ accounts }) => {
          if (!accounts?.some((account) => account.address === state.connection?.account?.address)) clearWallet();
        });
        text('village-caretaker', short(state.connection.account.address));
        status('wallet-state', `CARETAKER: ${short(state.connection.account.address)} / PUBLIC KEY ONLY`, 'ok');
        $('wallet-connect').hidden = true;
        $('wallet-disconnect').hidden = false;
        await refreshVillage();
      } catch (error) {
        clearWallet();
        status('wallet-state', `CONNECTION FAILED / ${error.message}`, 'error');
      }
    });
    choices.append(button);
  });
}

function clearWallet() {
  if (state.walletEventOff) state.walletEventOff();
  state.walletEventOff = null;
  state.connection = null;
  state.tokenAccounts = [];
  state.balanceRaw = 0n;
  state.walletIds = [];
  state.walletIndexed = false;
  $('wallet-connect').hidden = false;
  $('wallet-disconnect').hidden = true;
  $('wallet-choices').hidden = true;
  $('burn-review').disabled = true;
  $('burn-confirm').hidden = true;
  $('village-grid').replaceChildren();
  for (const id of ['village-caretaker', 'village-balance', 'village-population', 'village-flagship', 'village-rarest', 'village-oldest']) text(id, '—');
  text('village-more', '');
  text('village-note', 'connect a caretaker to read the village.');
  status('wallet-state', 'NO CARETAKER CONNECTED');
}

function sampleIds(address, count) {
  let seed = 2166136261;
  for (const char of `${state.config.tokenMint}:${address}`) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    ids.push((seed % SUPPLY) + 1);
  }
  return ids;
}

function renderVillage(ids, total, indexed) {
  const grid = $('village-grid');
  grid.replaceChildren();
  const displayed = ids.slice(0, 72);
  const flagship = indexed && displayed.length ? displayed.slice().sort((a, b) => {
    const ranks = { MYTHIC: 0, LEGENDARY: 1, RARE: 2, UNCOMMON: 3, COMMON: 4 };
    return ranks[lifeEngine(a).rarity] - ranks[lifeEngine(b).rarity] || a - b;
  })[0] : null;
  for (const id of displayed) {
    const life = lifeEngine(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = id === flagship ? '◉' : (['RARE', 'LEGENDARY', 'MYTHIC'].includes(life.rarity) ? '●' : '○');
    button.dataset.rarity = life.rarity;
    button.dataset.lifeId = String(id);
    button.dataset.demo = String(!indexed);
    button.dataset.indexed = String(indexed);
    button.dataset.flagship = String(id === flagship);
    button.title = indexed ? `${life.name} / ${life.rarity} / AGE — / ALIVE NOT VERIFIED` : `${life.name} / COMPUTED SAMPLE / NOT CUSTODY ASSIGNED`;
    button.setAttribute('aria-label', button.title);
    button.addEventListener('click', () => { summon(id); $('demo').scrollIntoView({ block: 'start' }); });
    grid.append(button);
  }
  text('village-more', total > displayed.length ? `+ ${number(total - displayed.length)} MORE` : '');
  text('village-flagship', flagship ? `#${lifeEngine(flagship).displayId}` : 'AWAITING CUSTODY INDEX');
  text('village-rarest', flagship ? `#${lifeEngine(flagship).displayId} / ${lifeEngine(flagship).rarity}` : 'NOT INDEXED');
  text('village-oldest', 'AGE NOT OBSERVED');
  text('village-note', indexed ? 'numbered custody from the configured indexer snapshot.' : 'glyphs are computed samples. fungible tokens do not carry serial numbers; these are not owned IDs.');
  text('village-population', indexed ? number(total) : 'NOT INDEXED');
}

async function refreshVillage() {
  if (!state.connection) return;
  if (state.config.mode !== 'LIVE') {
    text('village-balance', 'AWAITING MINT');
    text('village-population', 'NO POPULATION OBSERVED');
    text('village-note', 'the caretaker key is connected. no token mint has been configured.');
    status('wallet-state', `CARETAKER: ${short(state.connection.account.address)} / WALLET VIEW LIMITED`, 'ok');
    return;
  }
  status('wallet-state', 'READING TOKEN ACCOUNTS…');
  try {
    const result = await state.rpc.tokenAccounts(state.connection.account.address, state.config.tokenMint);
    state.tokenAccounts = result.value;
    state.balanceRaw = result.value.reduce((sum, item) => sum + BigInt(item.account?.data?.parsed?.info?.tokenAmount?.amount || 0), 0n);
    const decimals = state.supply?.decimals ?? Number(result.value[0]?.account?.data?.parsed?.info?.tokenAmount?.decimals ?? 0);
    text('village-balance', `${formatUnits(state.balanceRaw, decimals)} ${state.config.tokenSymbol}`);
    status('wallet-state', `CARETAKER: ${short(state.connection.account.address)} / BALANCE OBSERVED`, 'ok');
    const whole = state.balanceRaw / (10n ** BigInt(decimals));
    const sampleCount = Number(whole > 72n ? 72n : whole);
    renderVillage(sampleIds(state.connection.account.address, sampleCount), Number(whole > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : whole), false);
    $('burn-review').disabled = state.balanceRaw < (10n ** BigInt(decimals)) || !state.connection.account.features.includes('solana:signAndSendTransaction');
    status('burn-status', $('burn-review').disabled ? 'WHOLE TOKEN BALANCE OR WALLET SIGNING UNAVAILABLE' : 'USER-INITIATED TOKEN BURN AVAILABLE');
    if (state.config.indexerEndpoint) {
      try {
        const data = await indexerGet(state.config, `/wallet/${encodeURIComponent(state.connection.account.address)}`);
        if (data.wallet !== state.connection.account.address) throw new Error('Indexer wallet mismatch');
        if (Array.isArray(data.ids)) {
          state.walletIds = data.ids.filter((id) => Number.isSafeInteger(id) && id >= 1 && id <= SUPPLY);
          state.walletIndexed = true;
          renderVillage(state.walletIds, Number.isSafeInteger(data.population) ? data.population : state.walletIds.length, true);
        }
      } catch (error) {
        status('wallet-state', `BALANCE OBSERVED / INDEXER UNAVAILABLE: ${error.message}`, 'error');
      }
    }
  } catch (error) {
    status('wallet-state', `RPC UNAVAILABLE / ${error.message}`, 'error');
    text('village-balance', 'RPC UNAVAILABLE');
    $('burn-review').disabled = true;
  }
}

function initWallet() {
  $('wallet-connect').addEventListener('click', () => {
    const choices = $('wallet-choices');
    choices.hidden = !choices.hidden;
    if (!choices.hidden) renderWalletChoices();
  });
  $('wallet-disconnect').addEventListener('click', async () => {
    try { await disconnectWallet(state.connection); } catch { /* local disconnection still clears the view */ }
    clearWallet();
  });
  getWallets().on('register', () => { if (!$('wallet-choices').hidden) renderWalletChoices(); });
}

async function renderLegendary() {
  try {
    const response = await fetch('./data/legendary.json');
    if (!response.ok) throw new Error('Legendary index unavailable');
    const entries = await response.json();
    let observed = {};
    if (state.config.mode === 'LIVE' && state.config.indexerEndpoint) {
      try {
        const data = await indexerGet(state.config, '/legendary');
        observed = data.records || {};
      } catch { status('legendary-state', 'INDEXER UNAVAILABLE', 'error'); }
    }
    const body = $('legendary-body');
    body.replaceChildren();
    for (const item of entries) {
      const row = document.createElement('tr');
      const idCell = document.createElement('td');
      const link = document.createElement('a');
      link.href = '#demo';
      link.dataset.lifeId = String(item.id);
      link.textContent = `#${lifeEngine(item.id).displayId}`;
      link.addEventListener('click', (event) => { event.preventDefault(); summon(item.id); $('demo').scrollIntoView(); });
      idCell.append(link);
      const reason = document.createElement('td'); reason.textContent = item.reason;
      const record = observed[item.id];
      const recordCell = document.createElement('td');
      recordCell.textContent = record?.status || (state.config.mode === 'LIVE' ? 'NOT INDEXED' : 'AWAITING BIRTH');
      row.append(idCell, reason, recordCell);
      body.append(row);
    }
  } catch (error) {
    status('legendary-state', error.message.toUpperCase(), 'error');
  }
}

function renderHeadstones(records) {
  const host = $('graveyard-list');
  host.replaceChildren();
  if (!records.length) { text('graveyard-count', 'NO VERIFIED HEADSTONES'); return; }
  text('graveyard-count', `${number(records.length)} VERIFIED RECORDS ON THIS PAGE`);
  for (const record of records.slice(0, 20)) {
    if (!Number.isSafeInteger(record.id) || !record.signature) continue;
    const row = document.createElement('div');
    row.className = 'vt';
    const name = document.createElement('span'); name.textContent = `#${lifeEngine(record.id).displayId}`;
    const tx = document.createElement('a'); tx.href = explorerUrl(state.config, 'tx', record.signature); tx.target = '_blank'; tx.rel = 'noopener'; tx.textContent = `${short(record.signature)} / TOKEN BURN`;
    row.append(name, tx);
    const diedAt = record.diedAt || (record.blockTime ? record.blockTime * 1000 : null);
    if (parseTannoTime(diedAt)) {
      const time = document.createElement('span');
      time.className = 'archive-meta';
      time.textContent = `DIED / ${formatTannoTime(diedAt)}`;
      time.dataset.archiveTime = parseTannoTime(diedAt).toISOString();
      time.tabIndex = 0;
      row.append(time);
    }
    host.append(row);
  }
}

async function refreshGraveyard() {
  if (state.config.mode !== 'LIVE' || !state.config.indexerEndpoint) return;
  try {
    const data = await indexerGet(state.config, '/graveyard?limit=20');
    renderHeadstones(Array.isArray(data.records) ? data.records : []);
    status('graveyard-state', 'VERIFIED BURN RECORDS / INDEXER', 'ok');
  } catch (error) {
    status('graveyard-state', `INDEXER UNAVAILABLE / ${error.message}`, 'error');
  }
}

function initGraveyard() {
  $('graveyard-go').addEventListener('click', async () => {
    let id;
    try { id = normalizeId($('graveyard-search').value); }
    catch (error) { status('graveyard-results', error.message.toUpperCase(), 'error'); return; }
    if (state.config.mode !== 'LIVE') { status('graveyard-results', `#${lifeEngine(id).displayId} / AWAITING BIRTH`); return; }
    if (!state.config.indexerEndpoint) { status('graveyard-results', `#${lifeEngine(id).displayId} / STATUS NOT INDEXED`); return; }
    status('graveyard-results', 'SEARCHING VERIFIED RECORDS…');
    try {
      const data = await indexerGet(state.config, `/life/${id}`);
      if (data.status === 'DEAD' && data.burnTx) {
        const host = $('graveyard-results');
        host.replaceChildren();
        host.append(document.createTextNode(`HERE LIES #${lifeEngine(id).displayId} / TOKEN BURN / TX `));
        const link = document.createElement('a'); link.href = explorerUrl(state.config, 'tx', data.burnTx); link.target = '_blank'; link.rel = 'noopener'; link.textContent = short(data.burnTx);
        host.append(link);
        const diedAt = data.diedAt || (data.blockTime ? data.blockTime * 1000 : null);
        if (parseTannoTime(diedAt)) {
          const time = document.createElement('span');
          time.textContent = ` / DIED ${formatTannoTime(diedAt)}`;
          time.dataset.archiveTime = parseTannoTime(diedAt).toISOString();
          time.tabIndex = 0;
          host.append(time);
        }
      } else if (data.status === 'ALIVE') status('graveyard-results', `#${lifeEngine(id).displayId} / NOT HERE`);
      else status('graveyard-results', `#${lifeEngine(id).displayId} / NOT INDEXED`);
    } catch (error) { status('graveyard-results', `INDEXER UNAVAILABLE / ${error.message}`, 'error'); }
  });
  $('graveyard-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') $('graveyard-go').click(); });
}

function initBurn() {
  $('burn-review').addEventListener('click', () => {
    const amount = Number($('burn-amount').value);
    const decimals = state.supply?.decimals;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000 || !Number.isSafeInteger(decimals) || BigInt(amount) * 10n ** BigInt(decimals) > state.balanceRaw) {
      status('burn-status', 'ENTER A WHOLE AMOUNT WITHIN YOUR VERIFIED BALANCE', 'error');
      return;
    }
    text('burn-confirm-amount', number(amount));
    $('burn-confirm').hidden = false;
    status('burn-status', 'REVIEW THE BURN; THE WALLET WILL ASK FOR YOUR SIGNATURE');
  });
  $('burn-cancel').addEventListener('click', () => { $('burn-confirm').hidden = true; status('burn-status', 'BURN CANCELLED'); });
  $('burn-submit').addEventListener('click', async () => {
    if (!state.connection || state.config.mode !== 'LIVE' || $('burn-confirm').hidden) return;
    $('burn-submit').disabled = true;
    status('burn-status', 'AWAITING WALLET SIGNATURE…');
    try {
      const { burnOneOrMore } = await import(burnUrl);
      const result = await burnOneOrMore({
        config: state.config, rpc: state.rpc, connection: state.connection,
        tokenAccounts: state.tokenAccounts, decimals: state.supply.decimals,
        amount: Number($('burn-amount').value),
      });
      $('burn-confirm').hidden = true;
      const tx = $('burn-tx');
      tx.href = explorerUrl(state.config, 'tx', result.signature);
      tx.textContent = `TX: ${short(result.signature)}`;
      tx.hidden = false;
      state.rpc.clear('getTokenSupply');
      await Promise.allSettled([refreshCensus(), refreshVillage(), refreshGraveyard()]);
      status('burn-status', result.confirmed ? `${number(result.amount)} TOKEN${result.amount === 1 ? '' : 'S'} BURNED / NUMBERED GRAVE AWAITS INDEXER` : 'TRANSACTION SENT / CONFIRMATION PENDING', result.confirmed ? 'ok' : 'quiet');
    } catch (error) {
      status('burn-status', `BURN NOT COMPLETED / ${error.message}`, 'error');
    } finally {
      $('burn-submit').disabled = false;
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll('section');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) observer.unobserve(entry.target);
  }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
  items.forEach((item) => observer.observe(item));
}

async function main() {
  initIndex();
  initSpecimenPool();
  initSummon();
  initWallet();
  initGraveyard();
  initBurn();
  initReveal();
  try {
    const response = await fetch('./config/project.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`CONFIG HTTP ${response.status}`);
    state.config = resolveConfig(await response.json());
    state.rpc = new RpcClient(state.config.rpcEndpoint);
    showConfig(state.config);
    drawLife(state.selectedId);
    renderLegendary();
    if (state.config.mode === 'LIVE') {
      refreshCensus();
      refreshGraveyard();
      state.timers.push(setInterval(refreshCensus, 45000));
      if (state.config.indexerEndpoint) state.timers.push(setInterval(refreshGraveyard, 60000));
    }
  } catch (error) {
    status('site-status', `CONFIG ERROR / ${error.message}`, 'error');
    status('census-state', 'CONFIG UNAVAILABLE', 'error');
    status('wallet-state', 'CONFIG UNAVAILABLE', 'error');
    $('wallet-connect').disabled = true;
  }
}

main();
window.__TANNO_TEST__ = { state, lifeEngine, summon, refreshCensus, refreshVillage };








