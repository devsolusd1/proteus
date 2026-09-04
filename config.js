/* ATTENTION MARKETS — deployment configuration.
   Everything the front-end needs to talk to the chain lives here.
   mode: 'demo'  → the buy flow runs a local simulation (no transaction is sent)
   mode: 'live'  → the site reads state from the contract and sends real transactions
   Switch to 'live' once contract.address is set. */

window.AM_CONFIG = {
  mode: 'demo',

  chain: {
    id: 0,                                   // TODO: Robinhood Chain chainId (decimal)
    name: 'Robinhood Chain',
    rpcUrls: [''],                           // TODO: public RPC url
    blockExplorerUrls: [''],                 // TODO: explorer base url (used for tx / address links)
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockSeconds: 0.25,                      // used only to estimate settlement time in the UI
  },

  contract: {
    address: '0x0000000000000000000000000000000000000000',   // TODO: $ATTENTION contract
    decimals: 18,
    // Human-readable ABI of what the site calls. See CONTRACT.md — adjust here if the contract differs.
    abi: [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address owner) view returns (uint256)',
      'function attentionPrice() view returns (uint256)',
      'function totalBurned() view returns (uint256)',
      'function nameCount() view returns (uint256)',
      'function currentName() view returns (uint256 id, string name, string symbol, string image, address sponsor, uint256 bid, uint256 since, uint256 earned)',
      'function pendingName() view returns (bool active, string name, string symbol, string image, address buyer, uint256 bid, uint256 settleBlock)',
      'function nameAt(uint256 id) view returns (string name, string symbol, string image, address sponsor, uint256 bid, uint256 since, uint256 until, uint256 earned)',
      'function settlementBlocks() view returns (uint256)',
      'function buyName(string name, string symbol, string image)',
      'function settle()',
      'event NameBought(uint256 indexed id, address indexed buyer, string name, string symbol, string image, uint256 bid, uint256 settleBlock)',
      'event NameSettled(uint256 indexed id, address indexed sponsor)',
    ],
  },

  limits: { nameMax: 32, tickerMax: 8, imageMax: 200 },

  tradeUrl: '#',                             // TODO: swap route once the pool exists
  ipfsGateway: 'https://ipfs.io/ipfs/',
};
