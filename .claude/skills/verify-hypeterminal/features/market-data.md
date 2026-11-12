# Market data panels

The trade page streams one market: a header with price and 24h stats, a chart, an order book with a spread row, and recent trades.

## Sub-features

- `header-stats` shows price, 24H change, ORACLE, 24H VOL, OPEN INT and FUNDING.
- `orderbook` shows asks above a `Spread` row and bids below it, with `Price grouping`.
- `trades` shows recent fills in the `Recent Trades` tab.

## How to get to it (user POV)

- Open `/perp` (defaults to BTC-USDC), `/spot`, `/builders-perp`, or `/`.

## Driving it with agent-browser

- **Open.** `ab open http://localhost:4320/perp`, then `ab wait 6000`. The snapshot has tab `Order Book` selected and combobox `Select token` reads `BTC-USDC PERP`.
- **Header.** `ab get text body` contains `ORACLE`, `24H VOL`, `OPEN INT` and `FUNDING`.
- **Spread.** The page text contains `Spread`, with price rows (buttons named by price) above and below it.
- **Grouping.** `ab find role button click --name "Price grouping"`, then pick a larger step from the menu. Book prices now step by that increment.
- **Trades.** `ab find role tab click --name "Recent Trades"`. The tab becomes selected and rows appear within a few seconds.
- **Proof.** `scripts/evidence.sh <run> market-data` after open and after each interaction.

## Gotchas

- The page shows a skeleton until hydration. Asserting before the 6000 ms wait gives false failures.
- The order book rows are buttons. Clicking one fills the order-entry price. That is order-entry behavior, not book behavior.
- The footer `CONNECTED` label reflects the API status. If it reads otherwise, the network is the cause, not the change.
