/* PROTEUS — front-end state & capture simulation.
   All values are sample data until the contract ships. */

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

const CA_FULL = '0x0000000000000000000000000000000000000000';
const TOTAL_SUPPLY = 100000000;
const PACE_MS = 1000; // demo pace per block (mainnet: ~12s)

const NEXT_FORMS = [
  { name: 'Chrome Leviathan', ticker: '$LEVI' },
  { name: 'Salt Prophet', ticker: '$BRINE' },
  { name: 'Moon Kraken', ticker: '$KRKN' },
  { name: 'Ivory Serpent', ticker: '$FANG' },
  { name: 'Gilded Barnacle', ticker: '$GILD' },
  { name: 'Abyss Oracle', ticker: '$OMEN' },
];

const state = {
  formNo: 7,
  name: 'Gigasquid',
  ticker: '$SQUID',
  captor: '0x3aF9…c2E1',
  earned: 4.31,
  capturedAgo: 'captured two days ago',
  nextTribute: 1680000,
  burned: 3605000,
  paidTotal: 23.9,
  ledger: [
    { no: 7, name: 'Gigasquid', ticker: '$SQUID', captor: '0x3aF9…c2E1', tribute: 1200000, reign: '2d 06h', counting: true, earned: 4.31 },
    { no: 6, name: 'Abyss Frog', ticker: '$CROAK', captor: '0x81dE…09bb', tribute: 850000, reign: '1d 20h', counting: false, earned: 2.87 },
    { no: 5, name: 'Chrome Pigeon', ticker: '$COO', captor: '0xC44a…7f1D', tribute: 610000, reign: '4d 02h', counting: false, earned: 5.02 },
    { no: 4, name: 'Saltlord', ticker: '$SALT', captor: '0x9E02…44Aa', tribute: 430000, reign: '0d 09h', counting: false, earned: 1.1 },
    { no: 3, name: 'Mercury Maxi', ticker: '$HG', captor: '0x5b77…d301', tribute: 300000, reign: '3d 11h', counting: false, earned: 3.66 },
    { no: 2, name: 'Seawolf', ticker: '$SWOLF', captor: '0xAb1C…9E77', tribute: 215000, reign: '6d 08h', counting: false, earned: 6.9 },
    { no: 1, name: 'Proteus', ticker: '$PROTEUS', captor: null, tribute: null, reign: '3d 02h', counting: false, earned: null },
  ],
};

const fmt = (n) => n.toLocaleString('en-US');
const eth = (n) => n.toFixed(2).replace(/\.00$/, '.00') + ' ETH';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

const COIN_SVG = (gold) => {
  const ring = gold ? '#8F6E14' : 'rgba(21,65,78,0.55)';
  const ring2 = gold ? 'rgba(143,110,20,0.5)' : 'rgba(21,65,78,0.3)';
  const glyph = gold ? '#8F6E14' : 'rgba(21,65,78,0.7)';
  return '<svg width="30" height="30" viewBox="0 0 30 30" fill="none">'
    + '<circle cx="15" cy="15" r="13.5" stroke="' + ring + '" stroke-width="1"></circle>'
    + '<circle cx="15" cy="15" r="9.5" stroke="' + ring2 + '" stroke-width="1"></circle>'
    + '<g transform="translate(9,9)" stroke="' + glyph + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M3 1.5v2c0 1.65 1.35 3 3 3s3-1.35 3-3v-2"></path><path d="M6 1v10"></path><path d="M4.2 11h3.6"></path></g></svg>';
};

function ledgerRowHTML(f, isCurrent) {
  const nameCell = '<div class="l-name">' + COIN_SVG(isCurrent)
    + '<span class="nm">' + f.name + '</span>'
    + '<span class="tk">' + f.ticker + '</span>'
    + (isCurrent ? '<span class="tag">REIGNING</span>' : '') + '</div>';
  const captor = f.captor === null
    ? '<div class="l-captor genesis">genesis — unnamed by mortals</div>'
    : '<div class="l-captor">' + f.captor + '</div>';
  const tribute = '<div class="l-tribute">' + (f.tribute === null ? '—' : fmt(f.tribute)) + '</div>';
  const reign = '<div class="l-reign">' + f.reign + (f.counting ? ' · counting' : '') + '</div>';
  let earnedCell;
  if (f.earned === null) {
    earnedCell = '<div class="l-earned"><span class="none">—</span></div>';
  } else {
    earnedCell = '<div class="l-earned"><span class="echip' + (isCurrent ? ' solid' : '') + '">' + eth(f.earned) + '</span></div>';
  }
  return '<div class="lrow' + (isCurrent ? ' reigning' : '') + '">'
    + '<div class="l-form">' + ROMAN[f.no] + '</div>'
    + nameCell + captor + tribute + reign + earnedCell + '</div>';
}

function renderLedger() {
  $('#ledger-rows').innerHTML = state.ledger.map((f, i) => ledgerRowHTML(f, i === 0)).join('');
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
    'name-serif': state.name + '.',
    'form-line': 'form № ' + ROMAN[state.formNo] + ' — ' + state.capturedAgo,
    'lives-line': (WORDS[state.formNo] || state.formNo) + ' lives so far.',
  };
  Object.keys(binds).forEach((key) => {
    $$('[data-bind="' + key + '"]').forEach((el) => { el.textContent = binds[key]; });
  });
  document.title = 'Proteus — currently ' + state.ticker;
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

/* ---------- capture simulation ---------- */

const overlay = $('#meta-overlay');
let captureTimer = null;

function pickNextForm() {
  const pool = NEXT_FORMS.filter((f) => f.ticker !== state.ticker);
  return pool[Math.floor(Math.random() * pool.length)];
}

function startCapture() {
  if (captureTimer) return;
  const next = pickNextForm();
  const tribute = state.nextTribute;

  $('#meta-old-name').textContent = state.name.toUpperCase();
  $('#meta-old-form').textContent = 'FORM ' + ROMAN[state.formNo] + ' — DETHRONED';
  $('#meta-new-name').textContent = '? ? ? ?';
  $('#meta-new-form').textContent = 'FORM ' + ROMAN[state.formNo + 1] + ' — SEALED UNTIL BLOCK 8';
  $('#meta-new-name').parentElement.classList.remove('revealed');
  $('#meta-burn-line').innerHTML = '0xD3M0…CA97 BURNED <b class="gold">' + fmt(tribute) + ' $PROTEUS</b> — THE TRIBUTE IS ALREADY ASH';
  $$('#meta-progress i').forEach((seg) => seg.classList.remove('on'));
  $('#meta-block-label').innerHTML = 'BLOCK <b class="gold">0</b> OF <b class="gold">8</b>';

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  let block = 0;
  captureTimer = setInterval(() => {
    block += 1;
    const segs = $$('#meta-progress i');
    if (segs[block - 1]) segs[block - 1].classList.add('on');
    $('#meta-block-label').innerHTML = 'BLOCK <b class="gold">' + block + '</b> OF <b class="gold">8</b>';
    if (block >= 8) {
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
  $('#meta-new-form').textContent = 'FORM ' + ROMAN[state.formNo + 1] + ' — HE YIELDS';
  setTimeout(() => {
    closeOverlay();
    applyCapture(next, tribute);
    toast('THE GOD WEARS A NEW NAME');
    $('#current').scrollIntoView({ behavior: 'smooth' });
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
  state.capturedAgo = 'captured moments ago';
  state.burned += tribute;
  state.nextTribute = Math.round(state.nextTribute * 1.4 / 1000) * 1000;
  renderState();
  renderLedger();
}

$('#capture-btn').addEventListener('click', startCapture);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) {
    if (captureTimer) { clearInterval(captureTimer); captureTimer = null; }
    closeOverlay();
    toast('THE GOD SLIPPED AWAY — TRIBUTE SPARED (DEMO)');
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
renderLedger();
