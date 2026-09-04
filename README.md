# ATTENTION MARKETS — Attention is for sale

Site do token $ATTN (name/symbol/logo mutáveis na **Robinhood Chain**, a L2 da Robinhood sobre Arbitrum): quem queima mais $ATTN compra o nome do token e vira **Sponsor**, recebendo 1% de cada trade até alguém pagar mais. Naming rights, como em estádio — só que pagos com fogo.

Estático, sem dependências — HTML/CSS/JS puros.

## Rodar

```bash
node server.cjs
```

Abre em **http://localhost:4173**.

(Qualquer servidor estático também funciona, ex.: `npx serve .`)

## O que tem

- `index.html` / `styles.css` / `app.js` — a página inteira; estado do token em JS com `data-bind`s.
- **O painel** (split-flap) no hero mostra o nome atual e gira as letras quando um nome novo assenta.
- **BUY THE NAME** roda uma simulação local da compra: 480 blocos de settlement, nome novo aleatório, o painel gira, o ledger ganha entrada, o preço sobe 1.4×. `Esc` cancela; recarregar reseta.
- `docs.html` — a documentação: a tese (atenção como ativo, naming rights), o que muda e o que nunca muda, como um nome é comprado (bid → settlement → sponsorship), a attention fee, o que um Sponsor pode fazer, FAQ e glossário.

## Léxico

| Termo | Significa |
| --- | --- |
| Name | uma encarnação do token (nome + ticker + logo) |
| Bid / attention price | o $ATTN queimado pra comprar o nome; sobe 1.4× por venda |
| Settlement | os 480 blocos entre o burn e o nome aparecer |
| Sponsor | quem comprou o nome por último; recebe 1% de cada trade |
| The house | tesouraria do time; fica com o outro 1% (e com tudo antes da 1ª venda) |
| Attention fee | os 2% de cada trade |

## Pendente até o deploy do contrato

- CA é placeholder (`0x0000…0000`); os links TRADE / EXPLORER são `#` até existirem a rota de swap e o explorer da Robinhood Chain.
- Settlement aparece como 480 blocos (≈ 2 min a ~250 ms/bloco) — ajustar ao valor do contrato.
- Números (nomes, bids, ETH pago) são amostras; os "logos" dos nomes são medalhões em line-art até existirem as imagens que os sponsors subirem.
- Ticker genesis `$ATTN` é sugestão — trocar se o contrato usar outro.
