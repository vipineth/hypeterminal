## Hyperliquid Spot Deploy Validations

Ref: https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/frontend-checks

### Constants
- `PX_GAP = 0.003`, `MAX_N_ORDERS = 4000`
- `MAX_UINT_64 = BigInt("18446744073709551615")`
- `MAX_MARKET_CAP_MILLIONS_START = 10`, `MIN/MAX_MARKET_CAP_BILLIONS_END = 1/100`
- `HYPERLIQUIDITY_USER = "0x0...001"`

### Token Deployment
- `szDecimals`: 0-2, `weiDecimals`: 0-8
- `weiDecimals >= szDecimals + 5`

### Deployer Trading Fee Share
- Must be 0-100

### Genesis
- Blacklist user must be specified alone
- Amount ≤19 digits, total supply ≤ `MAX_UINT_64 / 2`
- Exactly one of user/existingToken (XOR)
- Cannot use hyperliquidity user, anchor token min 100k

### Hyperliquidity
- Required: `startPx`, `orderSz`, `orderCount`, `nSeededLevels`
- `startPx >= getMinStartPx(szDecimals)`, `startPx * orderSz >= 1`
- `pxRange = ceil(pow(1.003, orderCount))` must be ≤1M
- `endPx * orderSz * 1e9 <= MAX_UINT_64`
- Genesis balance ≥100M lots, orderCount ≥10
- End market cap: 1B-100B, start market cap: ≤10M
- Hyperliquidity >1% of total supply
- Check sufficient perps USDC for seeded levels
