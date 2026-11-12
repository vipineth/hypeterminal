# HypeTerminal verification map

The maintained source for verifying what HypeTerminal users see and do. Read this index, then use the matching feature file as the recipe.

## Baseline preconditions

- Dev server started by `scripts/launch.sh 4320` and `scripts/doctor.sh 4320` prints `DOCTOR OK`.
- Browser session `verify-hypeterminal`, viewport 1440x900 unless the recipe says mobile (390x844).
- Hyperliquid mainnet reachable. Footer shows `CONNECTED`.
- No wallet connected at the start of a recipe. A fresh session has none.

## Driving conventions

- `ab` means `agent-browser --session verify-hypeterminal`.
- Wait 6000 ms after every `ab open` before asserting. Data hydrates over a WebSocket.
- Use accessible names from `ab snapshot -i`. Refs (`@e12`) are only valid for the snapshot that printed them.
- Prices, sizes and counts are live. Assert labels, roles, URLs, titles and the presence of rows, never exact numbers.

## Proof and skip reporting

- Run `scripts/evidence.sh <run> <label>` before and after the action under test.
- Report the feature file and entry point with every artifact.
- Signing flows (orders, deposits, withdrawals, agent approval) need a real funded wallet. Report them as unverified with that reason. Never simulate them.

## Features

| Feature | File |
|---|---|
| Market data panels (header, chart, order book, trades) | [market-data.md](market-data.md) |
| Switching markets and categories | [market-switch.md](market-switch.md) |
| Chart engine and intervals | [chart.md](chart.md) |
| Wallet connect and read-only account view | [wallet-connect.md](wallet-connect.md) |
| Theme and responsive layout | [theme-and-layout.md](theme-and-layout.md) |
