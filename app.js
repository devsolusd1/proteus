/* ATTENTION MARKETS — front-end state & buying simulation.
   All values are sample data until the contract ships on Robinhood Chain. */

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

const CA_FULL = '0x0000000000000000000000000000000000000000';
const TOTAL_SUPPLY = 100000000;
const DELAY_BLOCKS = 480;      // settlement: ~250 ms blocks on Robinhood Chain ≈ 2 minutes
const BLOCK_SECONDS = 0.25;
const SEGMENTS = 8;
const PACE_MS = 1000;          // demo pace per segment (60 blocks)
const BOARD_TILES = 16;
const BOARD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

const NEXT_FORMS = [
  { name: 'Chrome Leviathan', ticker: '$LEVI' },
  { name: 'Salt Prophet', ticker: '$BRINE' },
  { name: 'Moon Kraken', ticker: '$KRKN' },
  { name: 'Ivory Serpent', ticker: '$FANG' },
  { name: 'Gilded Barnacle', ticker: '$GILD' },
  { name: 'Loud Money', ticker: '$LOUD' },
];

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
  ledger: [
    { no: 7, name: 'Gigasquid', ticker: '$SQUID', emblem: 'squid', captor: '0x3aF9…c2E1', tribute: 1200000, reign: '2d 06h', counting: true, earned: 4.31 },
    { no: 6, name: 'Abyss Frog', ticker: '$CROAK', emblem: 'frog', captor: '0x81dE…09bb', tribute: 850000, reign: '1d 20h', counting: false, earned: 2.87 },
    { no: 5, name: 'Chrome Pigeon', ticker: '$COO', emblem: 'pigeon', captor: '0xC44a…7f1D', tribute: 610000, reign: '4d 02h', counting: false, earned: 5.02 },
    { no: 4, name: 'Saltlord', ticker: '$SALT', emblem: 'salt', captor: '0x9E02…44Aa', tribute: 430000, reign: '0d 09h', counting: false, earned: 1.1 },
    { no: 3, name: 'Mercury Maxi', ticker: '$HG', emblem: 'mercury', captor: '0x5b77…d301', tribute: 300000, reign: '3d 11h', counting: false, earned: 3.66 },
    { no: 2, name: 'Seawolf', ticker: '$SWOLF', emblem: 'wolf', captor: '0xAb1C…9E77', tribute: 215000, reign: '6d 08h', counting: false, earned: 6.9 },
    { no: 1, name: 'Attention Markets', ticker: '$ATTN', emblem: 'eye', captor: null, tribute: null, reign: '3d 02h', counting: false, earned: null },
  ],
};

const fmt = (n) => n.toLocaleString('en-US');
const eth = (n) => n.toFixed(2) + ' ETH';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- logos (the mark each sponsor gave the name; line art until real uploads exist) ---------- */

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

function medalHTML(form, size, gold) {
  const cls = 'medal' + (gold ? ' medal-gold' : '');
  let inner;
  if (GLYPHS[form.emblem]) {
    inner = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[form.emblem] + '</svg>';
  } else {
    inner = '<span class="medal-sigil serif" style="font-size: ' + Math.round(size * 0.36) + 'px;">' + form.ticker.replace('$', '').slice(0, 2) + '</span>';
  }
  return '<div class="' + cls + '" style="width: ' + size + 'px; height: ' + size + 'px;">' + inner + '</div>';
}

/* ---------- the board ---------- */

function boardText(name) {
  const t = name.toUpperCase().slice(0, BOARD_TILES);
  const pad = BOARD_TILES - t.length;
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + t + ' '.repeat(pad - left);
}

function tileChar(c) { return c === ' ' ? ' ' : c; }

function renderBoard(name, animate) {
  const row = $('#board-tiles');
  const text = boardText(name);
  if (!row.children.length) {
    row.innerHTML = text.split('').map((c) => '<span class="tile">' + tileChar(c) + '</span>').join('');
    return;
  }
  const tiles = [...row.children];
  if (!animate) {
    tiles.forEach((tile, i) => { tile.textContent = tileChar(text[i]); });
    return;
  }
  tiles.forEach((tile, i) => {
    let steps = 6 + Math.floor(i / 2);
    const iv = setInterval(() => {
      tile.classList.remove('flip');
      void tile.offsetWidth;
      tile.classList.add('flip');
      steps -= 1;
      tile.textContent = steps > 0
        ? BOARD_CHARS[Math.floor(Math.random() * BOARD_CHARS.length)]
        : tileChar(text[i]);
      if (steps <= 0) clearInterval(iv);
    }, 75);
  });
}

/* ---------- the ledger ---------- */

function fstat(label, value, gold) {
  return '<div class="fstat"><div class="fstat-l">' + label + '</div><div class="fstat-v' + (gold ? ' gold-ink' : '') + '">' + value + '</div></div>';
}

function renderCurrent() {
  const f = state.ledger[0];
  $('#current-form').innerHTML = medalHTML(f, 220, true)
    + '<div class="feature-body">'
    + '<div class="feature-label mono">NOW TRADING · NAME ' + ROMAN[f.no] + ' · ' + state.capturedAgo.toUpperCase() + '</div>'
    + '<div class="feature-name"><span class="serif">' + f.name + '</span><span class="mono feature-ticker">' + f.ticker + '</span></div>'
    + '<div class="feature-stats mono">'
    + fstat('SPONSOR', f.captor)
    + fstat('BID BURNED', fmt(f.tribute) + ' $ATTN')
    + fstat('HOLDING FOR', f.reign + ' · counting')
    + fstat('EARNED SO FAR', eth(f.earned), true)
    + fstat('NEXT BID', fmt(state.nextTribute) + ' $ATTN')
    + fstat('LOGO', 'set by the sponsor')
    + '</div>'
    + '<a class="mono link-u feature-link" href="#how">HOW TO BUY THE NAME</a>'
    + '</div>';
}

function cardRow(label, value) {
  return '<div class="card-row"><span>' + label + '</span><span>' + value + '</span></div>';
}

function cardHTML(f) {
  const genesis = f.captor === null;
  return '<article class="form-card">' + medalHTML(f, 96, false)
    + '<div class="card-no mono">NAME ' + ROMAN[f.no] + (genesis ? ' · GENESIS' : '') + '</div>'
    + '<div class="card-name serif">' + f.name + '</div>'
    + '<div class="card-ticker mono">' + f.ticker + '</div>'
    + '<div class="card-stats mono">'
    + cardRow('SPONSOR', genesis ? 'the house, unsponsored' : f.captor)
    + cardRow('BID', genesis ? '—' : fmt(f.tribute) + ' $ATTN')
    + cardRow('HELD', f.reign)
    + '</div>'
    + '<div class="card-earned">' + (genesis ? '<span class="none mono">no sponsor, no fee</span>' : '<span class="echip">' + eth(f.earned) + ' EARNED</span>') + '</div>'
    + '</article>';
}

function renderHistory() {
  $('#history-grid').innerHTML = state.ledger.slice(1).map(cardHTML).join('');
}

function renderState() {
  const binds = {
    'ticker': state.ticker,
    'form-roman': ROMAN[state.formNo],
    'next-tribute': fmt(state.nextTribute),
    'earned': eth(state.earned),
    'captor': state.captor,
    'burned-pct': (state.burned / TOTAL_SUPPLY * 100).toFixed(1) + '%',
    'burned-total': fmt(state.burned),
    'paid-total': state.paidTotal.toFixed(1) + ' ETH',
    'form-line': 'name No. ' + ROMAN[state.formNo] + ' — ' + state.capturedAgo,
    'lives-line': (WORDS[state.formNo] || state.formNo) + ' names so far.',
  };
  Object.keys(binds).forEach((key) => {
    $$('[data-bind="' + key + '"]').forEach((el) => { el.textContent = binds[key]; });
  });
  document.title = 'Attention Markets — now trading as ' + state.ticker;
}

/* ---------- toast ---------- */

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- copy CA ---------- */

$('#ca-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(CA_FULL).then(
    () => toast('PLACEHOLDER CA COPIED — REAL ONE COMES WITH THE DEPLOY'),
    () => toast('COULD NOT COPY')
  );
});

/* ---------- buying simulation ---------- */

const overlay = $('#meta-overlay');
let captureTimer = null;

function pickNextForm() {
  const pool = NEXT_FORMS.filter((f) => f.ticker !== state.ticker);
  return pool[Math.floor(Math.random() * pool.length)];
}

function blockLabel(block) {
  const eta = Math.ceil((DELAY_BLOCKS - block) * BLOCK_SECONDS);
  return 'BLOCK <b class="gold">' + block + '</b> OF <b class="gold">' + DELAY_BLOCKS + '</b> · SETTLES IN <b class="gold">≈ ' + eta + ' S</b>';
}

function startCapture() {
  if (captureTimer) return;
  const next = pickNextForm();
  const tribute = state.nextTribute;

  $('#meta-old-name').textContent = state.name.toUpperCase();
  $('#meta-old-form').textContent = 'NAME ' + ROMAN[state.formNo] + ' — OUTBID';
  $('#meta-new-name').textContent = '? ? ? ?';
  $('#meta-new-form').textContent = 'NAME ' + ROMAN[state.formNo + 1] + ' — SEALED UNTIL BLOCK ' + DELAY_BLOCKS;
  $('#meta-new-name').parentElement.classList.remove('revealed');
  $('#meta-burn-line').innerHTML = '0xD3M0…CA97 BURNED <b class="gold">' + fmt(tribute) + ' $ATTN</b> — THE BID IS NON-REFUNDABLE';
  $$('#meta-progress i').forEach((seg) => seg.classList.remove('on'));
  $('#meta-block-label').innerHTML = blockLabel(0);

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  let seg = 0;
  captureTimer = setInterval(() => {
    seg += 1;
    const segs = $$('#meta-progress i');
    if (segs[seg - 1]) segs[seg - 1].classList.add('on');
    $('#meta-block-label').innerHTML = blockLabel(Math.round(seg * DELAY_BLOCKS / SEGMENTS));
    if (seg >= SEGMENTS) {
      clearInterval(captureTimer);
      captureTimer = null;
      revealForm(next, tribute);
    }
  }, PACE_MS);
}

function revealForm(next, tribute) {
  const box = $('#meta-new-name');
  box.textContent = next.name.toUpperCase() + ' · ' + next.ticker;
  box.parentElement.classList.add('revealed');
  $('#meta-new-form').textContent = 'NAME ' + ROMAN[state.formNo + 1] + ' — SETTLED';
  setTimeout(() => {
    closeOverlay();
    applyCapture(next, tribute);
    toast('THE MARKET HAS A NEW NAME');
    $('#skin').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 2000);
}

function closeOverlay() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function applyCapture(next, tribute) {
  state.ledger[0].counting = false;
  state.ledger.unshift({
    no: state.formNo + 1,
    name: next.name,
    ticker: next.ticker,
    emblem: 'sigil',
    captor: '0xD3M0…CA97',
    tribute: tribute,
    reign: '0d 00h',
    counting: true,
    earned: 0,
  });
  state.formNo += 1;
  state.name = next.name;
  state.ticker = next.ticker;
  state.captor = '0xD3M0…CA97';
  state.earned = 0;
  state.capturedAgo = 'bought moments ago';
  state.burned += tribute;
  state.nextTribute = Math.round(state.nextTribute * 1.4 / 1000) * 1000;
  renderState();
  renderBoard(state.name, true);
  renderCurrent();
  renderHistory();
}

$('#capture-btn').addEventListener('click', startCapture);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) {
    if (captureTimer) { clearInterval(captureTimer); captureTimer = null; }
    closeOverlay();
    toast('DEMO CANCELLED — ON-CHAIN, A BID CANNOT BE');
  }
});

/* ---------- reveal on scroll ---------- */

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

$$('.reveal').forEach((el) => io.observe(el));

/* ---------- init ---------- */

renderState();
renderBoard(state.name, false);
renderCurrent();
renderHistory();
