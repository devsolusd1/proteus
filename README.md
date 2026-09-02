# PROTEUS — The God of a Thousand Forms

Site do token $PROTEUS (token com name/symbol mutáveis na **Robinhood Chain**, a L2 da Robinhood sobre Arbitrum): quem queima o tributo renomeia o deus e vira **Captor**, recebendo 1% de cada trade até ser destronado.

Estático, sem dependências — HTML/CSS/JS puros.

## Rodar

```bash
node server.cjs
```

Abre em **http://localhost:4173**.

(Qualquer servidor estático também funciona, ex.: `npx serve .`)

## O que tem

- `index.html` / `styles.css` / `app.js` — a página inteira; estado do token em JS com `data-bind`s.
- **CAPTURE HIM** roda uma simulação local da metamorfose: 8 blocks de delay, nome novo aleatório, ledger ganha linha, tributo sobe 1.4×. `Esc` abandona; recarregar reseta.
- `assets/proteus-plate.jpg` — gravura "PROTHEVS" (séc. XVI, domínio público).

## Pendente até o deploy do contrato

- CA é placeholder (`0x0000…0000`); os links TRADE / EXPLORER são `#` até existirem a rota de swap e o explorer da Robinhood Chain.
- Delay da metamorfose aparece como 480 blocos (≈ 2 min a ~250 ms/bloco) — ajustar ao valor do contrato.
- Números (formas, tributos, ETH pago) são amostras; as "faces" das formas são medalhões em line-art até existirem as imagens que os captors subirem.
- A simulação de captura vira o fluxo real de burn quando o contrato existir.
