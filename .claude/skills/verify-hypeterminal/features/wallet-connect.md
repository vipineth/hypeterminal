# Wallet connect and read-only account view

Users connect a wallet to see balances, positions and orders. In dev builds a `MOCK WALLET (TESTING)` section connects any address read-only, which is how verification sees account UI without signing.

## Sub-features

- `modal` opens `Connect Wallet` with Coinbase Wallet, WalletConnect and more wallets.
- `custom-address` connects any address read-only through a wagmi mock connector.
- `account-panel` fills the `Balances`, `Positions`, `Open Orders` and `TWAP` tabs, plus the ACCOUNT sidebar.

## How to get to it (user POV)

- Click `Connect Wallet` in the top nav, or the `Connect Wallet` button in the order panel.

## Driving it with agent-browser

Preconditions: a dev server (mock connectors are absent from production builds) and a fresh session with no wallet connected.

- **Open modal.** `ab find role button click --name "Connect Wallet"`, then `ab wait 1000`. Heading `Connect Wallet` is visible.
- **Expand mock.** `ab find text "Mock Wallet (Testing)" click`. The snapshot shows textbox `Custom wallet address` and button `Connect`.
- **Connect an address.** Read the refs from `ab snapshot -i`, then run `ab fill @<textbox> 0xdfc24b077bc1425ad1dea75bcb6f8158e10df303` and `ab click @<connect>`, then `ab wait 6000`. That address is Hyperliquid's public HLP vault, which always holds a balance.
- **Assert.** The top nav shows button `Account and wallet` and a `Deposit` button. Tabs read `Balances (n)` with n >= 1 and `Positions (n)`. The order panel button reads `Enable Trading`. The ACCOUNT sidebar shows `Account Equity`.
- **Proof.** Capture evidence before connecting and after. The `snapshot.txt` must contain the `Balances (` tab with a count.

## Gotchas

- The mock connector cannot sign. `Enable Trading`, order submit, deposit and withdraw fail or prompt for a real wallet. Report those paths as unverified.
- The address is truncated in the nav (`0xdfc2...f303`). Assert on the tabs and sidebar, not the full address.
- The connection persists in the browser session. Run `scripts/cleanup.sh` or `ab close` before a recipe that needs a disconnected start.
- HLP position counts change over time. A `Positions (0)` reading is valid. `Balances (1)` or more is the stable assertion.
