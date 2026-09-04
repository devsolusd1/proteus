/* ATTENTION MARKETS — the buy flow and the chain adapter.
   demo mode: same form, same settlement screen, no transaction.
   live mode: reads the contract, sends buyName(), follows settlement by block.
   Requires: config.js, app.js (window.AM), wallet.js (window.AMWallet), ethers v6 (live only). */

(() => {
  const cfg = window.AM_CONFIG;
  const AM = window.AM;
  const W = window.AMWallet;
  const $ = (sel) => document.querySelector(sel);
  const ZERO = /^0x0{40}$/i;

  const live = cfg.mode === 'live' && /^0x[0-9a-fA-F]{40}$/.test(cfg.contract.address) && !ZERO.test(cfg.contract.address);
  const hasEthers = typeof window.ethers !== 'undefined';
  const SETTLE = 480;
  const BLOCK_SECONDS = cfg.chain.blockSeconds || 0.25;

  /* ---------- errors → short messages ---------- */

  function msgFor(e) {
    const code = e && (e.code || (e.info && e.info.error && e.info.error.code));
    if (code === 4001 || code === 'ACTION_REJECTED') return 'REJECTED IN WALLET';
    if (e && e.message === 'NO_WALLET') return 'NO WALLET FOUND — INSTALL ONE TO CONTINUE';
    if (e && e.message === 'NOT_CONNECTED') return 'CONNECT A WALLET FIRST';
    const m = (e && (e.shortMessage || e.reason || e.message)) || 'SOMETHING WENT WRONG';
    return String(m).replace(/\s+/g, ' ').slice(0, 110).toUpperCase();
  }

  /* ---------- nav: connect button ---------- */

  const connectBtn = $('#connect-btn');

  function wrongChain() { return !!(W.account && live && W.chainId !== W.hexChain(cfg.chain.id)); }

  function renderWallet() {
    const a = W.account;
    if (a) {
      connectBtn.innerHTML = '<i class="dot"></i>' + AM.esc(W.short(a));
      connectBtn.classList.add('connected');
    } else {
      connectBtn.textContent = 'Connect wallet';
      connectBtn.classList.remove('connected');
    }
    connectBtn.classList.toggle('wrong', wrongChain());
    connectBtn.title = wrongChain() ? 'Wrong network — click to switch' : (a ? 'Connected with ' + (W.walletName || 'wallet') : 'Connect a wallet');
    updateBuyWallet();
  }

  W.onChange(renderWallet);
  renderWallet();

  connectBtn.addEventListener('click', async () => {
    if (!W.account) { await connectFlow(); return; }
    if (wrongChain()) {
      try { await W.ensureChain(cfg.chain); AM.toast('SWITCHED TO ' + cfg.chain.name.toUpperCase()); }
      catch (e) { AM.toast(msgFor(e)); }
      return;
    }
    openAccountMenu();
  });

  async function connectFlow() {
    const list = W.list();
    if (!list.length) { AM.toast('NO WALLET FOUND — INSTALL ONE TO CONTINUE'); return null; }
    try {
      const entry = list.length === 1 ? list[0] : await pickWallet(list);
      if (!entry) return null;
      const acc = await W.connect(entry);
      AM.toast('CONNECTED · ' + W.short(acc));
      if (live) { try { await W.ensureChain(cfg.chain); } catch (e) { AM.toast(msgFor(e)); } }
      return acc;
    } catch (e) {
      AM.toast(msgFor(e));
      return null;
    }
  }

  /* ---------- wallet picker & account menu (share one modal) ---------- */

  const walletOverlay = $('#wallet-overlay');
  const walletList = $('#wallet-list');

  function showWalletModal(title, html) {
    $('#wallet-title').textContent = title;
    walletList.innerHTML = html;
    walletOverlay.classList.add('open');
  }
  function hideWalletModal() { walletOverlay.classList.remove('open'); }
  $('#wallet-cancel').addEventListener('click', hideWalletModal);

  function pickWallet(list) {
    return new Promise((resolve) => {
      showWalletModal('Choose a wallet', list.map((p, i) =>
        '<button type="button" class="wallet-opt" data-i="' + i + '">'
        + (p.info.icon ? '<img src="' + AM.esc(p.info.icon) + '" alt="">' : '<span class="wallet-ph"></span>')
        + '<span>' + AM.esc(p.info.name) + '</span></button>').join(''));
      const done = (v) => { hideWalletModal(); $('#wallet-cancel').onclick = null; resolve(v); };
      walletList.querySelectorAll('.wallet-opt').forEach((b) => { b.onclick = () => done(list[+b.dataset.i]); });
      $('#wallet-cancel').onclick = () => done(null);
    });
  }

  function openAccountMenu() {
    showWalletModal('Connected',
      '<div class="wallet-addr mono">' + AM.esc(W.account) + '</div>'
      + '<button type="button" class="wallet-opt" id="acct-copy"><span class="wallet-ph"></span><span>Copy address</span></button>'
      + (cfg.chain.blockExplorerUrls[0] ? '<a class="wallet-opt" target="_blank" rel="noopener" href="' + AM.esc(cfg.chain.blockExplorerUrls[0].replace(/\/$/, '') + '/address/' + W.account) + '"><span class="wallet-ph"></span><span>View on explorer</span></a>' : '')
      + '<button type="button" class="wallet-opt danger" id="acct-disconnect"><span class="wallet-ph"></span><span>Disconnect</span></button>');
    $('#acct-copy').onclick = () => navigator.clipboard.writeText(W.account).then(() => AM.toast('ADDRESS COPIED'));
    $('#acct-disconnect').onclick = () => { W.disconnect(); hideWalletModal(); AM.toast('DISCONNECTED'); };
  }

  /* ---------- chain adapter (live) ---------- */

  let readProvider = null;
  let readContract = null;
  if (live && hasEthers) {
    readProvider = new ethers.JsonRpcProvider(cfg.chain.rpcUrls[0]);
    readContract = new ethers.Contract(cfg.contract.address, cfg.contract.abi, readProvider);
  }

  const toUnits = (x) => Number(ethers.formatUnits(x, cfg.contract.decimals));

  function ago(ts) {
    const s = Math.max(0, Date.now() / 1000 - ts);
    if (s < 3600) return 'bought moments ago';
    if (s < 86400) return 'bought ' + Math.floor(s / 3600) + ' hours ago';
    const d = Math.floor(s / 86400);
    return 'bought ' + d + (d === 1 ? ' day ago' : ' days ago');
  }

  function dur(from, to) {
    const s = Math.max(0, (to || Date.now() / 1000) - from);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return d + 'd ' + String(h).padStart(2, '0') + 'h';
  }

  async function signerContract() {
    const bp = new ethers.BrowserProvider(W.provider);
    const signer = await bp.getSigner();
    return { bp, contract: new ethers.Contract(cfg.contract.address, cfg.contract.abi, signer) };
  }

  // Everything the page shows, read from the contract. Adjust here if the ABI differs.
  async function readSnapshot() {
    const [cur, price, burned, count, supply] = await Promise.all([
      readContract.currentName(), readContract.attentionPrice(), readContract.totalBurned(), readContract.nameCount(), readContract.totalSupply(),
    ]);
    const n = Number(count);
    const ledger = [];
    for (let id = n; id >= Math.max(1, n - 40); id--) {
      const r = await readContract.nameAt(id);
      const genesis = id === 1 || ZERO.test(r.sponsor);
      ledger.push({
        no: id,
        name: r.name,
        ticker: '$' + r.symbol,
        emblem: genesis ? 'eye' : 'sigil',
        image: r.image || null,
        captor: genesis ? null : W.short(r.sponsor),
        tribute: genesis ? null : toUnits(r.bid),
        reign: dur(Number(r.since), Number(r.until) || null),
        counting: Number(r.until) === 0,
        earned: genesis ? null : Number(ethers.formatEther(r.earned)),
      });
    }
    const burnedUnits = toUnits(burned);
    return {
      formNo: n,
      name: cur.name,
      ticker: '$' + cur.symbol,
      captor: ZERO.test(cur.sponsor) ? null : W.short(cur.sponsor),
      earned: ZERO.test(cur.sponsor) ? 0 : Number(ethers.formatEther(cur.earned)),
      capturedAgo: ZERO.test(cur.sponsor) ? 'genesis — no sponsor yet' : ago(Number(cur.since)),
      nextTribute: toUnits(price),
      burned: burnedUnits,
      paidTotal: ledger.reduce((a, f) => a + (f.earned || 0), 0),
      totalSupply: toUnits(supply) + burnedUnits,
      ledger,
    };
  }

  async function refresh() {
    if (!live || !readContract) return;
    try { AM.applyLiveSnapshot(await readSnapshot()); }
    catch (e) { console.warn('[attention] refresh failed', e); }
  }

  if (live && readContract) {
    refresh();
    setInterval(refresh, 15000);
    try {
      readContract.on('NameBought', () => refresh());
      readContract.on('NameSettled', () => refresh());
    } catch (e) { /* provider without subscriptions: polling covers it */ }
  }

  /* ---------- buy modal ---------- */

  const buyOverlay = $('#buy-overlay');
  const form = $('#buy-form');
  const nameIn = $('#buy-name');
  const tickerIn = $('#buy-ticker');
  const imageIn = $('#buy-image');
  const submitBtn = $('#buy-submit');

  nameIn.maxLength = cfg.limits.nameMax;
  tickerIn.maxLength = cfg.limits.tickerMax;
  $('#buy-name-max').textContent = cfg.limits.nameMax;

  function status(html, kind) {
    const el = $('#buy-status');
    el.innerHTML = html || '';
    el.className = 'buy-status mono' + (kind ? ' ' + kind : '');
  }

  function updateBuyWallet() {
    const el = $('#buy-wallet');
    if (!el) return;
    el.innerHTML = W.account ? '<i class="dot"></i>' + AM.esc(W.short(W.account)) : 'Connect wallet';
  }

  async function refreshBalance() {
    if (!live || !readContract || !W.account) return;
    try {
      const b = await readContract.balanceOf(W.account);
      $('#buy-balance').textContent = AM.fmt(Math.floor(toUnits(b))) + ' $ATTENTION';
    } catch (e) { /* ignore */ }
  }

  W.onChange(() => { if (buyOverlay.classList.contains('open')) refreshBalance(); });

  async function openBuy() {
    if (AM.state.pending) { AM.toast('A NAME IS ALREADY SETTLING'); return; }
    if (live && !hasEthers) { AM.toast('ETHERS FAILED TO LOAD — REFRESH THE PAGE'); return; }
    form.reset();
    status('');
    submitBtn.disabled = false;
    $('#buy-name-count').textContent = '0';
    $('#buy-price').textContent = AM.fmt(AM.state.nextTribute) + ' $ATTENTION';
    $('#buy-balance').textContent = live ? '—' : 'demo';
    $('#buy-mode-note').textContent = live
      ? 'this sends a real transaction on ' + cfg.chain.name + ' — the bid is burned and cannot be refunded'
      : 'demo mode — nothing is sent on-chain until the contract ships';
    updateBuyWallet();
    buyOverlay.classList.add('open');
    nameIn.focus();
    if (live) {
      try { const p = await readContract.attentionPrice(); $('#buy-price').textContent = AM.fmt(toUnits(p)) + ' $ATTENTION'; } catch (e) { /* keep last known */ }
      refreshBalance();
    }
  }

  $('#capture-btn').addEventListener('click', openBuy);
  $('#buy-cancel').addEventListener('click', () => buyOverlay.classList.remove('open'));
  $('#buy-wallet').addEventListener('click', (e) => { e.preventDefault(); if (!W.account) connectFlow(); });
  nameIn.addEventListener('input', () => { $('#buy-name-count').textContent = String(nameIn.value.length); });
  tickerIn.addEventListener('input', () => { tickerIn.value = tickerIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameIn.value.trim().replace(/\s+/g, ' ');
    const symbol = tickerIn.value.trim().toUpperCase();
    const image = imageIn.value.trim();
    if (name.length < 2) return status('NAME NEEDS AT LEAST 2 CHARACTERS', 'err');
    if (name.length > cfg.limits.nameMax) return status('NAME IS TOO LONG', 'err');
    if (!/^[A-Z0-9]{1,8}$/.test(symbol) || symbol.length > cfg.limits.tickerMax) return status('TICKER: 1–' + cfg.limits.tickerMax + ' LETTERS OR DIGITS', 'err');
    if (image && !/^(https?:\/\/|ipfs:\/\/)\S+$/i.test(image)) return status('LOGO MUST BE AN HTTPS OR IPFS URL', 'err');
    if (image.length > cfg.limits.imageMax) return status('LOGO URL IS TOO LONG', 'err');
    const next = { name, ticker: '$' + symbol, image: image || null };
    if (live) sendBuy(next); else runDemo(next);
  });

  /* ---------- demo: the same screens, no transaction ---------- */

  function runDemo(next) {
    buyOverlay.classList.remove('open');
    const bid = AM.state.nextTribute;
    const buyer = W.account ? W.short(W.account) : '0xD3M0…CA97';
    AM.openSettling(next, bid, buyer);
    let seg = 0;
    const total = 8;
    const iv = setInterval(() => {
      seg += 1;
      const block = Math.round(seg * SETTLE / total);
      AM.settlingProgress(seg / total, 'BLOCK ' + block + ' OF ' + SETTLE + ' · SETTLES IN ≈ ' + Math.ceil((SETTLE - block) * BLOCK_SECONDS) + ' S');
      if (seg >= total) {
        clearInterval(iv);
        AM.setCancel(null);
        AM.finishSettling(next, bid, buyer, true);
      }
    }, 1000);
    AM.setCancel(() => { clearInterval(iv); AM.closeOverlay(); AM.toast('DEMO CANCELLED — ON-CHAIN, A BID CANNOT BE'); });
  }

  /* ---------- live: burn, wait for the receipt, follow settlement by block ---------- */

  function txLink(hash) {
    const base = (cfg.chain.blockExplorerUrls[0] || '').replace(/\/$/, '');
    const short = hash.slice(0, 10) + '…' + hash.slice(-6);
    return base ? '<a href="' + AM.esc(base + '/tx/' + hash) + '" target="_blank" rel="noopener">' + short + '</a>' : short;
  }

  async function sendBuy(next) {
    if (!W.account) { const a = await connectFlow(); if (!a) return; }
    try { await W.ensureChain(cfg.chain); } catch (e) { return status(msgFor(e), 'err'); }
    submitBtn.disabled = true;
    status('CONFIRM IN YOUR WALLET…', 'pending');
    try {
      const { bp, contract } = await signerContract();
      const [price, balance, pend] = await Promise.all([contract.attentionPrice(), contract.balanceOf(W.account), contract.pendingName().catch(() => null)]);
      if (pend && pend.active) throw new Error('A NAME IS ALREADY SETTLING — TRY AGAIN AFTER BLOCK ' + pend.settleBlock);
      if (balance < price) throw new Error('INSUFFICIENT $ATTENTION — YOU NEED ' + AM.fmt(toUnits(price)));

      const tx = await contract.buyName(next.name, next.ticker.slice(1), next.image || '');
      status('PENDING · ' + txLink(tx.hash), 'pending');
      const receipt = await tx.wait();
      buyOverlay.classList.remove('open');

      let settleBlock = receipt.blockNumber + SETTLE;
      try { const p = await contract.pendingName(); if (p.active) settleBlock = Number(p.settleBlock); } catch (e) { /* keep estimate */ }
      const startBlock = receipt.blockNumber;
      const bid = toUnits(price);
      const buyer = W.short(W.account);

      AM.openSettling(next, bid, buyer);
      AM.setCancel(() => { AM.closeOverlay(); AM.toast('SETTLEMENT CONTINUES ON-CHAIN'); });

      const poll = setInterval(async () => {
        try {
          const bn = await bp.getBlockNumber();
          const frac = (bn - startBlock) / Math.max(1, settleBlock - startBlock);
          AM.settlingProgress(frac, 'BLOCK ' + bn + ' OF ' + settleBlock + ' · SETTLES IN ≈ ' + Math.max(0, Math.ceil((settleBlock - bn) * BLOCK_SECONDS)) + ' S');
          if (bn >= settleBlock) {
            clearInterval(poll);
            try { const t = await contract.settle(); await t.wait(); } catch (e) { /* lazy settlement or already settled by someone else */ }
            await refresh();
            AM.finishSettling(next, bid, buyer, false);
          }
        } catch (e) { console.warn('[attention] settlement poll', e); }
      }, 2000);
    } catch (e) {
      status(msgFor(e), 'err');
    } finally {
      submitBtn.disabled = false;
    }
  }

  window.AMMarket = { live, refresh, openBuy, connectFlow };
})();
