---
name: verify-hypeterminal
description: Drive the HypeTerminal trading web app (apps/terminal) in a real browser the way a user does, and capture proof that a change works. Use before claiming a UI, market-data, wallet, or layout change is done, or to reproduce a reported bug on the real surface.
---

# Verify HypeTerminal

HypeTerminal is a Hyperliquid trading UI (TanStack Start + Vite, SSR). Users touch one surface, the web app. The desktop layout runs at 1440x900 and the mobile layout at 390x844, on routes `/`, `/perp`, `/spot`, `/builders-perp`, `/builders-perp/$dex`, and `/mobile-agent-sync`. Market data is live from Hyperliquid mainnet, so prices change between runs. Assert structure and labels, not numbers.

The browser driver is `agent-browser` (on `PATH`). Every browser command in this skill takes `--session verify-hypeterminal` so it never touches the user's own browser session. Helpers live in `scripts/` next to this file and resolve the repo root themselves.

## Launch

```bash
S=.claude/skills/verify-hypeterminal/scripts
$S/launch.sh 4320
```

It starts `vite dev --port 4320 --strictPort` in `apps/terminal`. It writes the pid and log to `.verify/state/` and returns once `GET /perp` answers 200, usually in under 5s. It refuses a port that a process it did not start already holds. Pick another port for a second, parallel instance.

Use the dev server, not the production build. The mock-wallet connectors that let you view an account without signing exist only when `import.meta.env.DEV` is true (`apps/terminal/src/config/wagmi.ts`). Use `pnpm build` and `PORT=<p> node apps/terminal/.output/server/index.mjs` only when the change is about the production bundle or SSR output, and say so in the evidence.

Ready means usable. After `open`, wait 6000 ms. The chart, order book and market header hydrate client-side over a WebSocket, and the page shows a skeleton until then.

## Doctor

```bash
$S/doctor.sh 4320
```

It is read-only. It checks that our pid is alive, that the port is listening, that `/perp` returns the app `<title>`, and which branch and commit are checked out. Run it first whenever a step behaves oddly. Drive only an instance that prints `DOCTOR OK`.

## Drive

```bash
ab() { agent-browser --session verify-hypeterminal "$@"; }
ab set viewport 1440 900          # or 390 844 for the mobile layout
ab open http://localhost:4320/perp
ab wait 6000
ab snapshot -i                    # interactive elements with refs (@e12) and accessible names
```

Prefer accessible names over refs. Refs change on every snapshot. Stable handles in this app:

- **Top nav.** Links `All`, `Perp`, `Spot`, `Builders`. Buttons `Connect Wallet`, `Deposit` (when connected), `Account and wallet` (when connected), `Switch to light mode` / `Switch to dark mode`, `Settings`.
- **Market header.** Combobox `Select token`. Favorite pills `Select <PAIR> market`.
- **Chart.** Interval buttons `1m` `5m` `1h` `4h` `1D`, `More intervals`, `Chart type`. Engine toggle `Default` (klinecharts) and `TradingView`.
- **Book.** Tabs `Order Book` and `Recent Trades`. Button `Price grouping`.
- **Account panel.** Tabs `Balances (n)`, `Positions (n)`, `Open Orders (n)`, `TWAP (n)`, `Trade History`, `Funding History`, `Order History`.
- **Wallet modal.** Heading `Connect Wallet`. Toggle `MOCK WALLET (TESTING)`. Textbox `Custom wallet address` and button `Connect`.

Click by name with `ab find role button click --name "Settings"` or `ab find text "TradingView" click`. Type into the focused field with `ab keyboard type ETH`. Fill a field with `ab fill @eN <value>` after reading its ref from a fresh snapshot.

The browser tab title encodes the selected market and price (`$2,049.6 · ETH-USDC | HypeTerminal`). `ab get title` is a cheap way to prove a market switch.

## Evidence

```bash
$S/evidence.sh <run-name> <label>
```

It writes `<label>.png`, `<label>.snapshot.txt` (interactive ARIA tree), `<label>.meta.txt` (url and title) and `<label>.console-errors.txt` to `.verify/runs/<run-name>/` at the repo root. That folder is gitignored and survives cleanup. Name runs after the change, for example `fix-orderbook-grouping`.

Proof standards:

- Capture before and after the user action, not only the final screen.
- Drive the real user path (clicks, typing, routes). Never call stores, setters or `window` hooks to reach a state.
- Assert labels, roles, counts and URLs. Live prices and sizes differ every run.
- Read-only account views use the custom-address mock connector (see `features/wallet-connect.md`). It cannot sign. Order placement, deposits, withdrawals and agent approval need a real wallet and real funds. Never fake them. Report them as unverified with that reason.
- An empty `console-errors.txt` is part of the proof. Report any error it lists.

## Cleanup

```bash
$S/cleanup.sh 4320
```

It kills only the pid that `launch.sh` recorded (and its children) and closes the `verify-hypeterminal` browser session. It never kills by process name. `.verify/runs/` is left in place. Run cleanup after every failed attempt too.

## Feature map

`features/README.md` indexes the user-facing features with a recipe for each. Drive every entry point a feature lists, not just the convenient one. Keep the map in step with the app via `/maintain-verification-skill`.
