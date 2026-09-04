# Interface esperada pelo site

O front (`market.js`) foi escrito contra a interface abaixo. Ela é uma **proposta** — se o contrato sair diferente, o único lugar a ajustar é a ABI em `config.js` e os adaptadores `readSnapshot()` / `sendBuy()` em `market.js`.

Token ERC-20 padrão (`name`, `symbol`, `decimals`, `totalSupply`, `balanceOf`, `transfer`, …) **mais**:

## Leitura

| Função | Retorna | Uso no site |
| --- | --- | --- |
| `attentionPrice() → uint256` | preço atual pra comprar o nome, em unidades do token (18 dec) | hero, marquee, modal de compra |
| `currentName() → (id, name, symbol, image, sponsor, bid, since, earned)` | o nome vigente; `since` = timestamp do settlement; `earned` = ETH já pago a esse sponsor (wei) | hero + card "NOW TRADING" |
| `pendingName() → (active, name, symbol, image, buyer, bid, settleBlock)` | a compra em settlement, se houver | overlay "Settling", bloqueio de nova compra |
| `nameCount() → uint256` | quantos nomes já existiram (inclui o genesis = id 1) | galeria |
| `nameAt(id) → (name, symbol, image, sponsor, bid, since, until, earned)` | histórico; `until = 0` no nome atual | galeria |
| `totalBurned() → uint256` | total de $ATTENTION queimado em bids | stats |
| `settlementBlocks() → uint256` | blocos de settlement (o site assume 480 se não existir) | textos e estimativa de tempo |

## Escrita

| Função | Comportamento esperado |
| --- | --- |
| `buyName(string name, string symbol, string image)` | Queima `attentionPrice()` do `msg.sender` (o próprio contrato é o token, então não precisa de `approve`), registra o pendente com `settleBlock = block.number + settlementBlocks()`, emite `NameBought`. Reverte se já há um pendente ativo, se o saldo é insuficiente, ou se nome/ticker excedem o cap de bytes. |
| `settle()` | Chamável por qualquer um após `settleBlock`: aplica nome/símbolo/imagem, troca o sponsor, sobe o preço em 1.4×, emite `NameSettled`. **Alternativa**: aplicar lazily na primeira transferência após `settleBlock` — nesse caso o site só faz `refresh()` (já trata `settle()` inexistente com try/catch). |

## Eventos

```
event NameBought(uint256 indexed id, address indexed buyer, string name, string symbol, string image, uint256 bid, uint256 settleBlock);
event NameSettled(uint256 indexed id, address indexed sponsor);
```

O site assina os dois e faz `refresh()` ao receber.

## Fee

2% em cada trade: 1% pra `house`, 1% pro `sponsor` do nome vigente, pagos em ETH conforme os trades acontecem (`earned` acumula). Antes do primeiro `settle()`, 100% pra house. O site só **mostra** isso — não há chamada de claim.

## Decisões em aberto (pro contrato)

1. `settle()` explícito vs. aplicação lazy.
2. O preço "esfria" com o tempo se ninguém comprar? (site assume que não).
3. Caps de bytes de `name` e `symbol` (site limita a 32 e 8 caracteres na UI — `limits` em `config.js`).
4. Quem pode comprar durante um settlement (site assume: ninguém).
5. `image`: URL http(s) ou `ipfs://` — o site converte `ipfs://` pra gateway.
