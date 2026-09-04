/* ATTENTION MARKETS — state, rendering and the settlement overlay.
   market.js drives the buy flow (demo or live) through window.AM.
   Until the contract ships the state below is the genesis state: one name, no sponsor. */

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const roman = (n) => ROMAN[n] || String(n);

const CA_FULL = (window.AM_CONFIG && window.AM_CONFIG.contract.address) || '0x0000000000000000000000000000000000000000';
const OPENING_PRICE = 1000000;   // sample opening attention price; the contract sets the real one

const state = {
  formNo: 1,
  name: 'Attention Markets',
  ticker: '$ATTENTION',
  captor: null,                      // null = the house, no sponsor yet
  earned: 0,
  capturedAgo: 'genesis — no sponsor yet',
  nextTribute: OPENING_PRICE,
  burned: 0,
  paidTotal: 0,
  totalSupply: 100000000,
  pending: false,
  ledger: [
    { no: 1, name: 'Attention Markets', ticker: '$ATTENTION', emblem: 'eye', image: null, captor: null, tribute: null, reign: 'since launch', counting: true, earned: null },
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

/* ---------- logos ---------- */

const GLYPHS = {
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path>'
    + '<circle cx="12" cy="12" r="3"></circle>',
};

function hueOf(str) {
  let h = 7;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function tileStyle(form) {
  if (form.emblem === 'eye') return 'background: linear-gradient(135deg, #1A1F12 0%, #0B0B0C 100%);';
  const h = hueOf(form.ticker + form.name);
  return 'background: linear-gradient(135deg, hsl(' + h + ' 82% 60%) 0%, hsl(' + ((h + 55) % 360) + ' 70% 30%) 100%);';
}

function avatarStyle(seed) {
  const h = hueOf(seed);
  return 'background: linear-gradient(135deg, hsl(' + h + ' 82% 60%) 0%, hsl(' + ((h + 55) % 360) + ' 70% 30%) 100%);';
}

function glyphHTML(form) {
  const img = safeImage(form.image);
  if (img) return '<img class="tile-img" src="' + esc(img) + '" alt="">';
  if (GLYPHS[form.emblem]) {
    return '<svg class="tile-glyph' + (form.emblem === 'eye' ? ' tile-eye' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[form.emblem] + '</svg>';
  }
  return '<span class="sigil">' + esc(String(form.ticker || '').replace('$', '').slice(0, 2)) + '</span>';
}

/* ---------- hero ---------- */

function renderHero(animate) {
  const f = state.ledger[0];
  $('#hero-tile').setAttribute('style', tileStyle(f));
  $('#hero-glyph').innerHTML = glyphHTML(f);
  const nameEl = $('#hero-name');
  nameEl.textContent = f.name;
  if (animate) {
    nameEl.classList.remove('swap');
    void nameEl.offsetWidth;
    nameEl.classList.add('swap');
  }
  const sponsored = !!f.captor;
  $('#hero-avatar').setAttribute('style', sponsored ? avatarStyle(f.captor) : 'background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line-strong);');
  $('#sponsor-label').textContent = sponsored ? 'SPONSOR · WHO SET THIS NAME' : 'THE HOUSE · NO SPONSOR YET';
  $('#sponsor-copy').hidden = !sponsored;
  $('#earn-chip').hidden = !sponsored;
}

/* ---------- gallery ---------- */

function gcardHTML(f, isNow) {
  const genesis = f.captor === null;
  return '<article class="gcard' + (isNow ? ' now' : '') + '">'
    + '<div class="gtile" style="' + tileStyle(f) + '">' + glyphHTML(f)
    + '<span class="gbadge mono">' + (isNow ? 'NOW TRADING' : 'NAME ' + roman(f.no) + (genesis ? ' · GENESIS' : '')) + '</span></div>'
    + '<div class="gname">' + esc(f.name) + '</div>'
    + '<div class="gticker mono">' + esc(f.ticker) + '</div>'
    + '<div class="grows mono">'
    + '<div class="grow"><span>SPONSOR</span><span>' + (genesis ? 'the house' : esc(f.captor)) + '</span></div>'
    + '<div class="grow"><span>BID</span><span>' + (genesis ? '—' : fmt(f.tribute) + ' $ATTENTION') + '</span></div>'
    + '<div class="grow"><span>HELD</span><span>' + esc(f.reign) + (f.counting && f.reign !== 'since launch' ? ' · live' : '') + '</span></div>'
    + '</div>'
    + (genesis
      ? '<span class="gearn none mono">NO SPONSOR, NO FEE</span>'
      : '<span class="gearn mono">' + eth(f.earned || 0) + ' EARNED</span>')
    + '</article>';
}

function renderGallery() {
  $('#gallery-grid').innerHTML = state.ledger.map((f, i) => gcardHTML(f, i === 0)).join('');
  const empty = $('#gallery-empty');
  if (empty) empty.hidden = state.ledger.length > 1;
}

/* ---------- binds ---------- */

function livesLine(n) {
  if (n === 1) return 'One name so far — the genesis. Nobody has bought it yet.';
  return (WORDS[n] || n) + ' names so far.';
}

function renderState() {
  const binds = {
    'ticker': state.ticker,
    'form-roman': roman(state.formNo),
    'next-tribute': fmt(state.nextTribute),
    'earned': state.captor ? eth(state.earned) : '—',
    'captor': state.captor || 'the house',
    'burned-pct': (state.burned / state.totalSupply * 100).toFixed(1) + '%',
    'burned-total': fmt(state.burned),
    'paid-total': Number(state.paidTotal).toFixed(1) + ' ETH',
    'form-line': 'Name No. ' + roman(state.formNo) + ' — ' + state.capturedAgo,
    'lives-line': livesLine(state.formNo),
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
  $('#meta-old-form').textContent = 'NAME ' + roman(state.formNo) + (state.captor ? ' — OUTBID' : ' — THE GENESIS NAME');
  $('#meta-new-name').textContent = '? ? ? ?';
  $('#meta-new-form').textContent = 'NAME ' + roman(state.formNo + 1) + ' — SEALED UNTIL SETTLEMENT';
  $('#meta-new-box').classList.remove('revealed');
  $('#meta-burn-line').textContent = buyer + ' BURNED ' + fmt(bid) + ' $ATTENTION — THE BID IS NON-REFUNDABLE';
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

// Live mode: replace the genesis state with what the contract says.
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
