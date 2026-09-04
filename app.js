/* ATTENTION MARKETS — state, rendering and the settlement overlay.
   market.js drives the buy flow (demo or live) through window.AM.
   Sample data below is replaced by the chain snapshot in live mode. */

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const roman = (n) => ROMAN[n] || String(n);

const CA_FULL = (window.AM_CONFIG && window.AM_CONFIG.contract.address) || '0x0000000000000000000000000000000000000000';

const state = {
  formNo: 7,
  name: 'Gigasquid',
  ticker: '$SQUID',
  captor: '0x3aF9…c2E1',
  earned: 4.31,
  capturedAgo: 'bought two days ago',
  nextTribute: 1680000,
  burned: 3605000,
  paidTotal: 23.9,
  totalSupply: 100000000,
  pending: false,
  ledger: [
    { no: 7, name: 'Gigasquid', ticker: '$SQUID', emblem: 'squid', image: null, captor: '0x3aF9…c2E1', tribute: 1200000, reign: '2d 06h', counting: true, earned: 4.31 },
    { no: 6, name: 'Abyss Frog', ticker: '$CROAK', emblem: 'frog', image: null, captor: '0x81dE…09bb', tribute: 850000, reign: '1d 20h', counting: false, earned: 2.87 },
    { no: 5, name: 'Chrome Pigeon', ticker: '$COO', emblem: 'pigeon', image: null, captor: '0xC44a…7f1D', tribute: 610000, reign: '4d 02h', counting: false, earned: 5.02 },
    { no: 4, name: 'Saltlord', ticker: '$SALT', emblem: 'salt', image: null, captor: '0x9E02…44Aa', tribute: 430000, reign: '0d 09h', counting: false, earned: 1.1 },
    { no: 3, name: 'Mercury Maxi', ticker: '$HG', emblem: 'mercury', image: null, captor: '0x5b77…d301', tribute: 300000, reign: '3d 11h', counting: false, earned: 3.66 },
    { no: 2, name: 'Seawolf', ticker: '$SWOLF', emblem: 'wolf', image: null, captor: '0xAb1C…9E77', tribute: 215000, reign: '6d 08h', counting: false, earned: 6.9 },
    { no: 1, name: 'Attention Markets', ticker: '$ATTN', emblem: 'eye', image: null, captor: null, tribute: null, reign: '3d 02h', counting: false, earned: null },
  ],
};

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const eth = (n) => Number(n).toFixed(2) + ' ETH';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only http(s) images are rendered; ipfs:// goes through the configured gateway.
function safeImage(url) {
  if (!url) return '';
  let u = String(url).trim();
  if (u.startsWith('ipfs://')) u = ((window.AM_CONFIG && window.AM_CONFIG.ipfsGateway) || 'https://ipfs.io/ipfs/') + u.slice(7);
  return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : '';
}

/* ---------- logos (line art used when a name has no image) ---------- */

const GLYPHS = {
  squid: '<path d="M12 3c-3.6 0-5.5 2.6-5.5 6v3.5h11V9c0-3.4-1.9-6-5.5-6z"></path>'
    + '<circle cx="9.8" cy="9" r=".7" fill="currentColor"></circle><circle cx="14.2" cy="9" r=".7" fill="currentColor"></circle>'
    + '<path d="M7.5 12.5c-.5 3-1.5 5-3 7M9.5 12.5c0 3-.5 5.5-1 8.5M12 12.5v9M14.5 12.5c0 3 .5 5.5 1 8.5M16.5 12.5c.5 3 1.5 5 3 7"></path>',
  frog: '<ellipse cx="12" cy="14" rx="8" ry="5.5"></ellipse>'
    + '<circle cx="8.5" cy="8.5" r="2.2"></circle><circle cx="15.5" cy="8.5" r="2.2"></circle>'
    + '<circle cx="8.5" cy="8.5" r=".6" fill="currentColor"></circle><circle cx="15.5" cy="8.5" r=".6" fill="currentColor"></circle>'
    + '<path d="M8 15.5c2.5 1.5 5.5 1.5 8 0"></path>',
  pigeon: '<path d="M4 14c3-1 6-1 8 1 1-3 3-4 6-4l2 1-2 1c-1 3-3 5-6 5H8c-2 0-3-1-4-4z"></path>'
    + '<circle cx="16.5" cy="10.5" r=".6" fill="currentColor"></circle>'
    + '<path d="M9 17l-1 3M12 17l1 3"></path>',
  salt: '<path d="M4 10l5-2 5 2v6l-5 2-5-2zM4 10l5 2 5-2M9 12v6"></path>'
    + '<path d="M12 8l4-1.5 4 1.5v5l-4 1.5-4-1.5zM12 8l4 1.5 4-1.5M16 9.5v5"></path>',
  mercury: '<path d="M8.5 3.5c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5"></path>'
    + '<circle cx="12" cy="11" r="4"></circle>'
    + '<path d="M12 15v6M9 18h6"></path>',
  wolf: '<path d="M6 4l3 5h6l3-5v8c0 4-2.5 7-6 8-3.5-1-6-4-6-8z"></path>'
    + '<circle cx="9.8" cy="11" r=".7" fill="currentColor"></circle><circle cx="14.2" cy="11" r=".7" fill="currentColor"></circle>'
    + '<path d="M12 14l-1.2 1.5h2.4z" fill="currentColor"></path>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path>'
    + '<circle cx="12" cy="12" r="3"></circle>',
};

function hueOf(str) {
  let h = 7;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function tileStyle(seed) {
  const h = hueOf(seed);
  return 'background: linear-gradient(135deg, hsl(' + h + ' 82% 60%) 0%, hsl(' + ((h + 55) % 360) + ' 70% 30%) 100%);';
}

function glyphHTML(form) {
  const img = safeImage(form.image);
  if (img) return '<img class="tile-img" src="' + esc(img) + '" alt="">';
  if (GLYPHS[form.emblem]) {
    return '<svg class="tile-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[form.emblem] + '</svg>';
  }
  return '<span class="sigil">' + esc(String(form.ticker || '').replace('$', '').slice(0, 2)) + '</span>';
}

/* ---------- hero ---------- */

function renderHero(animate) {
  const f = state.ledger[0];
  $('#hero-tile').setAttribute('style', tileStyle(f.ticker + f.name));
  $('#hero-glyph').innerHTML = glyphHTML(f);
  const nameEl = $('#hero-name');
  nameEl.textContent = f.name;
  if (animate) {
    nameEl.classList.remove('swap');
    void nameEl.offsetWidth;
    nameEl.classList.add('swap');
  }
  $('#hero-avatar').setAttribute('style', tileStyle(f.captor || 'house'));
}

/* ---------- gallery ---------- */

function gcardHTML(f, isNow) {
  const genesis = f.captor === null;
  return '<article class="gcard' + (isNow ? ' now' : '') + '">'
    + '<div class="gtile" style="' + tileStyle(f.ticker + f.name) + '">' + glyphHTML(f)
    + '<span class="gbadge mono">' + (isNow ? 'NOW TRADING' : 'NAME ' + roman(f.no) + (genesis ? ' · GENESIS' : '')) + '</span></div>'
    + '<div class="gname">' + esc(f.name) + '</div>'
    + '<div class="gticker mono">' + esc(f.ticker) + '</div>'
    + '<div class="grows mono">'
    + '<div class="grow"><span>SPONSOR</span><span>' + (genesis ? 'the house' : esc(f.captor)) + '</span></div>'
    + '<div class="grow"><span>BID</span><span>' + (genesis ? '—' : fmt(f.tribute) + ' $ATTN') + '</span></div>'
    + '<div class="grow"><span>HELD</span><span>' + esc(f.reign) + (f.counting ? ' · live' : '') + '</span></div>'
    + '</div>'
    + (genesis
      ? '<span class="gearn none mono">NO SPONSOR, NO FEE</span>'
      : '<span class="gearn mono">' + eth(f.earned || 0) + ' EARNED</span>')
    + '</article>';
}

function renderGallery() {
  $('#gallery-grid').innerHTML = state.ledger.map((f, i) => gcardHTML(f, i === 0)).join('');
}

/* ---------- binds ---------- */

function renderState() {
  const binds = {
    'ticker': state.ticker,
    'form-roman': roman(state.formNo),
    'next-tribute': fmt(state.nextTribute),
    'earned': eth(state.earned),
    'captor': state.captor,
    'burned-pct': (state.burned / state.totalSupply * 100).toFixed(1) + '%',
    'burned-total': fmt(state.burned),
    'paid-total': Number(state.paidTotal).toFixed(1) + ' ETH',
    'form-line': 'Name No. ' + roman(state.formNo) + ' — ' + state.capturedAgo,
    'lives-line': (WORDS[state.formNo] || state.formNo) + ' names so far.',
    'held': state.ledger[0].reign,
  };
  Object.keys(binds).forEach((key) => {
    $$('[data-bind="' + key + '"]').forEach((el) => { el.textContent = binds[key]; });
  });
  document.title = 'Attention Markets — now trading as ' + state.ticker;
}

function renderAll() {
  renderState();
  renderHero(false);
  renderGallery();
}

/* ---------- toast ---------- */

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

$('#ca-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(CA_FULL).then(
    () => toast(/^0x0+$/.test(CA_FULL) ? 'PLACEHOLDER CA COPIED — REAL ONE COMES WITH THE DEPLOY' : 'CONTRACT ADDRESS COPIED'),
    () => toast('COULD NOT COPY')
  );
});

/* ---------- settlement overlay (driven by market.js) ---------- */

const overlay = $('#meta-overlay');
let cancelHandler = null;

function openSettling(next, bid, buyer) {
  $('#meta-old-name').textContent = state.name.toUpperCase();
  $('#meta-old-form').textContent = 'NAME ' + roman(state.formNo) + ' — OUTBID';
  $('#meta-new-name').textContent = '? ? ? ?';
  $('#meta-new-form').textContent = 'NAME ' + roman(state.formNo + 1) + ' — SEALED UNTIL SETTLEMENT';
  $('#meta-new-box').classList.remove('revealed');
  $('#meta-burn-line').textContent = buyer + ' BURNED ' + fmt(bid) + ' $ATTN — THE BID IS NON-REFUNDABLE';
  $('#meta-fill').style.width = '0%';
  $('#meta-block-label').textContent = 'WAITING FOR THE FIRST BLOCK';
  state.pending = true;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function settlingProgress(frac, label) {
  $('#meta-fill').style.width = (Math.max(0, Math.min(1, frac)) * 100) + '%';
  if (label) $('#meta-block-label').textContent = label;
}

function finishSettling(next, bid, buyer, applyLocally) {
  $('#meta-new-name').textContent = next.name.toUpperCase() + ' · ' + next.ticker;
  $('#meta-new-box').classList.add('revealed');
  $('#meta-new-form').textContent = 'NAME ' + roman(state.formNo + 1) + ' — SETTLED';
  $('#meta-fill').style.width = '100%';
  setTimeout(() => {
    closeOverlay();
    if (applyLocally) applyCapture(next, bid, buyer);
    toast('THE MARKET HAS A NEW NAME');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1800);
}

function closeOverlay() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.pending = false;
  cancelHandler = null;
}

function applyCapture(next, bid, buyer) {
  state.ledger[0].counting = false;
  state.ledger.unshift({
    no: state.formNo + 1,
    name: next.name,
    ticker: next.ticker,
    emblem: 'sigil',
    image: next.image || null,
    captor: buyer,
    tribute: bid,
    reign: '0d 00h',
    counting: true,
    earned: 0,
  });
  state.formNo += 1;
  state.name = next.name;
  state.ticker = next.ticker;
  state.captor = buyer;
  state.earned = 0;
  state.capturedAgo = 'bought moments ago';
  state.burned += bid;
  state.nextTribute = Math.round(state.nextTribute * 1.4 / 1000) * 1000;
  renderAll();
  renderHero(true);
}

// Live mode: replace the sample state with what the contract says.
function applyLiveSnapshot(snap) {
  Object.assign(state, snap);
  if (!state.ledger || !state.ledger.length) return;
  renderAll();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) {
    if (cancelHandler) cancelHandler();
    else closeOverlay();
  }
});

window.AM = {
  state, roman, fmt, eth, esc, toast,
  renderAll, renderHero,
  openSettling, settlingProgress, finishSettling, closeOverlay, applyCapture, applyLiveSnapshot,
  setCancel(fn) { cancelHandler = fn; },
};

/* ---------- init ---------- */

renderAll();
