# PROTEUS — The God of a Thousand Forms

Site do token $PROTEUS (ERC-20 com name/symbol mutáveis na Ethereum): quem queima o tributo renomeia o deus e vira **Captor**, recebendo 1% de cada trade até ser destronado.

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

- CA é placeholder (`0x0000…0000`), links de Buy/Etherscan apontam pros sites genéricos.
- Números (formas, tributos, ETH pago) são amostras pra visualizar o conceito.
- A simulação de captura vira o fluxo real de burn quando o contrato existir.
