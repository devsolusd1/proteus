/* ATTENTION MARKETS — wallet connection.
   EIP-6963 multi-provider discovery (MetaMask, Rabby, Coinbase, Phantom…) with a
   window.ethereum fallback. No library needed for connecting; ethers is only used
   by market.js for contract calls. */

window.AMWallet = (() => {
  const providers = [];
  const listeners = new Set();
  let active = null;      // { info, provider }
  let account = null;
  let chainId = null;     // hex string, e.g. '0x1'
  const STORE = 'am:wallet';

  function emit() { listeners.forEach((fn) => { try { fn(snapshot()); } catch (e) { console.error(e); } }); }

  function snapshot() {
    return { account, chainId, wallet: active ? active.info.name : null, providers: list() };
  }

  window.addEventListener('eip6963:announceProvider', (event) => {
    const d = event.detail;
    if (!d || !d.info || providers.some((p) => p.info.uuid === d.info.uuid)) return;
    providers.push(d);
    emit();
    tryRestore(d);
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  function list() {
    if (providers.length) return providers.slice();
    if (window.ethereum) {
      return [{ info: { uuid: 'injected', name: 'Browser wallet', icon: '' }, provider: window.ethereum }];
    }
    return [];
  }

  function bind(provider) {
    if (!provider || !provider.on || provider.__amBound) return;
    provider.__amBound = true;
    provider.on('accountsChanged', (accounts) => {
      account = accounts && accounts[0] ? accounts[0] : null;
      if (!account) { active = null; localStorage.removeItem(STORE); }
      emit();
    });
    provider.on('chainChanged', (id) => { chainId = id; emit(); });
    provider.on('disconnect', () => { account = null; active = null; emit(); });
  }

  async function connect(choice) {
    const entry = choice || list()[0];
    if (!entry) throw new Error('NO_WALLET');
    const accounts = await entry.provider.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    chainId = await entry.provider.request({ method: 'eth_chainId' });
    active = entry;
    bind(entry.provider);
    try { localStorage.setItem(STORE, entry.info.uuid); } catch (e) { /* private mode */ }
    emit();
    return account;
  }

  // Silent reconnect for a wallet the user already approved (eth_accounts never prompts).
  async function tryRestore(entry) {
    let saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) { return; }
    if (!saved || account) return;
    const candidates = entry ? [entry] : list();
    const match = candidates.find((p) => p.info.uuid === saved);
    if (!match) return;
    try {
      const accounts = await match.provider.request({ method: 'eth_accounts' });
      if (accounts && accounts[0]) {
        account = accounts[0];
        chainId = await match.provider.request({ method: 'eth_chainId' });
        active = match;
        bind(match.provider);
        emit();
      }
    } catch (e) { /* ignore */ }
  }

  function disconnect() {
    account = null;
    active = null;
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    emit();
  }

  function hexChain(id) { return '0x' + Number(id).toString(16); }

  // Switches to the configured chain, adding it to the wallet first if it is unknown.
  async function ensureChain(chain) {
    if (!active) throw new Error('NOT_CONNECTED');
    const hex = hexChain(chain.id);
    if (chainId === hex) return true;
    try {
      await active.provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
    } catch (err) {
      const unknown = err && (err.code === 4902 || (err.data && err.data.originalError && err.data.originalError.code === 4902) || /unrecognized|not added|4902/i.test(String(err.message)));
      if (!unknown) throw err;
      await active.provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: hex,
          chainName: chain.name,
          rpcUrls: chain.rpcUrls,
          blockExplorerUrls: chain.blockExplorerUrls.filter(Boolean),
          nativeCurrency: chain.nativeCurrency,
        }],
      });
    }
    chainId = await active.provider.request({ method: 'eth_chainId' });
    emit();
    return chainId === hex;
  }

  function short(addr) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : ''; }

  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  setTimeout(() => tryRestore(null), 300);

  return {
    list, connect, disconnect, ensureChain, short, onChange, hexChain, snapshot,
    get account() { return account; },
    get chainId() { return chainId; },
    get provider() { return active ? active.provider : null; },
    get walletName() { return active ? active.info.name : null; },
  };
})();
