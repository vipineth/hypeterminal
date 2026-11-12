# Switching markets and categories

Users change the traded market from a searchable selector, from favorite pills, or by switching category in the top nav.

## Sub-features

- `selector-search` filters markets by typed text and selects with Enter.
- `favorites` switches via the `Select <PAIR> market` pills.
- `category-nav` switches between `All`, `Perp`, `Spot` and `Builders`.

## How to get to it (user POV)

- Click the market name in the header, type, press Enter.
- Click a favorite pill such as `ETH-USDC`.
- Click `Spot` or `Builders` in the top nav.

## Driving it with agent-browser

- **Search.** `ab find role combobox click --name "Select token"`. A searchbox `Select market` and listbox `Markets` appear. `ab keyboard type ETH`, `ab press Enter`, `ab wait 2000`. `ab get title` contains `ETH-USDC`.
- **Favorite.** `ab find role button click --name "Select HYPE-USDC market"`, then `ab wait 2000`. `ab get title` contains `HYPE-USDC`.
- **Category.** `ab find role link click --name "Spot"`, then `ab wait 4000`. `ab get url` ends with `/spot` and the `Select token` combobox shows a spot pair.
- **Builders.** `ab find role link click --name "Builders"`. The URL starts with `/builders-perp`, and the market is a HIP-3 pair such as `xyz:SILVER`.
- **Proof.** Capture evidence before the switch and after it. The `meta.txt` title proves the selected market.

## Gotchas

- The selected market persists per category in localStorage (`selectedMarkets`). A second run in the same session starts on the last market, not BTC.
- Favorites are user-editable. The default pills are BTC, ETH and HYPE, but a reused session may differ.
- `/builders-perp/$dex` routes to one builder DEX. An unknown DEX name falls through to the catch-all route.
