# Hyperliquid foundation plan — adversarial review

Reviewed 2026-11-13 against repository HEAD `f303913bc79b2ba131e1e8fe55b6f33309e89c5b`, the working-tree plan, and installed SDK 0.33.3. Seven verified findings follow. No repository files were changed, no signatures were created, and no `/exchange` request was made. Repros use real application functions and SDK code; fixture inputs and simulated clocks are identified below.

Intent: preserve the user's intended asset, side, size, price and protection; fund builder dexes correctly; and verify the application's actual trading paths.

For every command below, first run this exact shell prelude:

```sh
export R=/Users/ankit/Documents/make/hypeterminal
export S=/private/tmp/claude-501/-Users-ankit-Documents-make-hypeterminal/44e5db3f-67f9-455b-98bf-30786ec67377/scratchpad/codex
export SDK="$R/apps/terminal/node_modules/@nktkas/hyperliquid/esm"
cd "$R/apps/terminal"
```

## 1. Quote-sized limit orders use mark price to size and validate a different notional

**Severity: P0 fund-risk.** Missed by HL-1 and HL-4's formatter/model work.

The production hook passes mark price as `conversionPrice`; `deriveOrderEntry` computes both base size and `orderValue` from it. The ticket then supplies the independently entered limit price to `buildOrderPlan`. With a fixture spot market at mark 100, entering 100 USDC and a limit of 200 produces a one-unit buy worth 200 USDC. The real complete spot validation accepts this even when only 150 USDC is available. If the account can cover the order, its eventual execution can consume twice the entered quote amount; otherwise the apparently valid order can be rejected for balance.

Command:

```sh
bun "$S/review.ts" quote-budget
(cd "$R" && rg -n 'conversionPrice =|conversionPrice,|orderValue,' apps/terminal/src/hooks/trade/use-order-entry-data.ts apps/terminal/src/hooks/trade/use-trade-ticket.ts)
```

Output:

```text
quoteInput=100 mark=100 limit=200 quoteBalance=150
derivedSize=1 validatedOrderValue=100 quoteCheck=true
fullSpotValidation={"valid":true,"errors":[],"canSubmit":true,"needsApproval":false}
wire={"a":10001,"b":true,"p":"200","s":"1","r":false,"t":{"limit":{"tif":"Gtc"}}} wireNotional=200
apps/terminal/src/hooks/trade/use-trade-ticket.ts:172:		orderValue,
apps/terminal/src/hooks/trade/use-order-entry-data.ts:68:	const conversionPrice = markPx > 0 ? markPx : 0;
apps/terminal/src/hooks/trade/use-order-entry-data.ts:74:		conversionPrice,
apps/terminal/src/hooks/trade/use-order-entry-data.ts:89:			price: conversionPrice,
apps/terminal/src/hooks/trade/use-order-entry-data.ts:100:			price: conversionPrice,
```

**Intent requires:** derive quote-sized limit orders from the execution limit, and calculate balance checks from the final wire quantity and price, including fees where applicable. Add a quote-size test with mark different from limit and a balance between the displayed and wire notionals. Tick/lot checks alone accept this wrong order.

## 2. SDK size formatting does not conserve scale totals, and scale validation uses average notional

**Severity: P1 wrong behavior.** HL-1's proposed SDK substitution leaves this failure intact.

The real scale builder divides every leg equally and floors each independently. A request for 18 integer units across five levels sends 15, with no plan error. Every generated price and size passes SDK tick/lot checks. Separately, the scale minimum-notional validator accepts an average leg value of 21 even though the actual first leg is worth only 2.

Command:

```sh
bun "$S/review.ts" scale
```

Output:

```text
requested=18 sizes=["3","3","3","3","3"] total=15 errors=[]
SDK replacement sizes=["3","3","3","3","3"]
all SDK tick/lot checks pass=true
min-notional validator=true wireNotionals=[2,40]
```

**Intent requires:** allocate the remainder in whole lots so the sum equals the requested executable total, and check each final leg's notional. Pin the non-divisible 18/5 case. HL-1 lane 6 can pass with a divisible total such as 100/5, and its live-meta tick/lot assertions pass the broken 18/5 plan. Also reconcile HL-3 lane 5, which expects a below-minimum leg to reach the exchange, with HL-1's requirement to block such orders before signing; use a different exchange-only leg rejection to test partial results.

## 3. The position stop editor rejects profit-protecting stops and accepts stops on the wrong side of mark

**Severity: P1 wrong behavior.** No PR in the plan fixes this validation path.

The modal uses entry price as the trigger-direction reference. A long entered at 100 and now marked at 120 cannot set a stop at 110. Conversely, with mark at 80, it accepts a stop at 90 even though the sell-stop trigger is already crossed. This is independent of wire precision. Hyperliquid triggers TP/SL from mark price. [Official TP/SL documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/take-profit-and-stop-loss-orders-tp-sl), checked 2026-11-13.

Command:

```sh
bun "$S/review.ts" stop-profit
rg -n 'referencePrice =|validateSlPrice|slError|SL must' src/components/trade/positions/position-tpsl-modal.tsx
```

Output:

```text
long entry=100 mark=120 proposedStop=110
modal validator using entry: false
same validator using mark: true
long entry=100 mark=80 proposedStop=90: entryValidator=true markValidator=false
12:import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
61:	const referencePrice = position.entryPx;
67:	const slValid = !hasSl || validateSlPrice(referencePrice, slPriceNum, side);
71:	const slError = hasSl && !slValid ? (position.isLong ? t`SL must be below entry` : t`SL must be above entry`) : null;
158:					slError={slError}
```

**Intent requires:** validate trigger placement against current mark and keep entry-based PnL calculations separate. Add long and short cases for profitable positions and already-crossed triggers. Merely resting valid-price TP/SL on a newly opened BTC position, as HL-1 lane 5 specifies, does not exercise this editor failure.

## 4. Two tabs sharing the persisted agent issue identical nonces

**Severity: P1 wrong behavior.** The plan contains no nonce implementation or multi-session verification work.

The app reads the same agent from a localStorage key determined only by environment and account address. Its ExchangeClient construction supplies no custom nonce manager. The SDK's default nonce state is local to the JavaScript runtime. The repro creates the actual SDK manager once for each simulated tab, freezes the clock to model requests in the same millisecond, and requests nonces for the same signer key. Both tabs issue identical successive nonces. This proves a collision, not an observed exchange rejection; no action was signed or sent. The protocol requires unused nonces per signer. [Official nonce documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets), checked 2026-11-13.

Command:

```sh
bun "$S/review.ts" nonce
(cd "$R" && rg -n 'hyperliquid_agent_|localStorage.getItem' packages/hl-react/src/signing/agent-storage.ts)
(cd "$R" && rg -n 'new ExchangeClient|nonceManager' packages/hl-react/src/clients.ts)
```

Output:

```text
tab1 nonce: 1800000000000
tab2 nonce: 1800000000000
tab1 next nonce: 1800000000001
tab2 next nonce: 1800000000001
31:	return `hyperliquid_agent_${env}_${userAddress.toLowerCase()}`;
39:		const raw = localStorage.getItem(key);
93:const STORAGE_KEY_PREFIX = "hyperliquid_agent_";
82:	const client = new ExchangeClient({ transport: getHttpTransport(isTestnet), wallet });
96:		return new ExchangeClient({ transport: getHttpTransport(isTestnet), wallet: signingWallet });
```

**Intent requires:** coordinate nonce allocation across consumers of an agent, or give each signing session its own approved agent. Test two independent runtimes sharing one agent, including concurrent order/cancel requests. Per-order cloids do not fix signer nonce collisions or rejected cancels.

## 5. HL-1 forbids required caller edits and depends on scripts reserved for a later PR

**Severity: P2 plan defect.** The hotfix cannot satisfy its own boundaries and gates as written.

HL-1 must pass size decimals and market kind to every formatter caller, but its exclusive file list excludes `order-intent.ts` and `use-order-submit.ts`, which contain those callers. It also requires two currently nonexistent scripts under `scripts/hl-live/**`, a directory reserved exclusively for HL-7; HL-7 depends on HL-1. Thus there is no permitted way to both finish and verify HL-1 under the stated ownership rules.

Command:

```sh
(cd "$R" && rg -n 'HL-1 touches only|HL-7 touches only|HL-7 after HL-1|scan-wire.ts|bench-plan.ts|Thread market kind' docs/plans/hyperliquid-foundation.md)
(cd "$R" && rg -n 'formatPriceForOrder\(' apps/terminal/src/domain/trade/order-intent.ts apps/terminal/src/hooks/trade/use-order-submit.ts)
for f in scripts/hl-live/scan-wire.ts scripts/hl-live/bench-plan.ts; do
  if test -f "$R/$f"; then echo "$f exists"; else echo "$f MISSING"; fi
done
```

Output:

```text
40:  - [ ] HL-7 after HL-1. It can run beside HL-3 to HL-6.
42:  - [ ] HL-1 touches only `apps/terminal/src/lib/trade/numbers.ts`, `apps/terminal/src/domain/trade/orders.ts`, `apps/terminal/src/domain/trade/order/**`, test files, `vitest.config.ts` and `package.json`.
44:  - [ ] HL-7 touches only `scripts/hl-live/**` and CI config.
89:  - [ ] Thread market kind through `buildOrders`, TP/SL, trigger, scale, TWAP, close, reverse and swap callers.
105:- [ ] The scratchpad scan `headless.ts` from the audit, ported to `scripts/hl-live/scan-wire.ts`, reports 0 invalid plans across live mainnet meta. Run `bun scripts/hl-live/scan-wire.ts`.
123:- [ ] Probe. `bun scripts/hl-live/bench-plan.ts` run 5 times interleaved at trunk and head.
apps/terminal/src/domain/trade/order-intent.ts:136:				p: formatPriceForOrder(orderPrice),
apps/terminal/src/domain/trade/order-intent.ts:156:				p: formatPriceForOrder(price),
apps/terminal/src/domain/trade/order-intent.ts:177:				p: formatPriceForOrder(orderPrice),
apps/terminal/src/domain/trade/order-intent.ts:198:				p: formatPriceForOrder(price),
apps/terminal/src/domain/trade/order-intent.ts:216:	const triggerPx = formatPriceForOrder(triggerPrice);
apps/terminal/src/hooks/trade/use-order-submit.ts:95:		const formattedPrice = formatPriceForOrder(price);
apps/terminal/src/hooks/trade/use-order-submit.ts:106:			tpPrice: hasTp ? formatPriceForOrder(tpPriceNum ?? 0) : undefined,
apps/terminal/src/hooks/trade/use-order-submit.ts:107:			slPrice: hasSl ? formatPriceForOrder(slPriceNum ?? 0) : undefined,
scripts/hl-live/scan-wire.ts MISSING
scripts/hl-live/bench-plan.ts MISSING
```

**Intent requires:** expand HL-1's ownership to every required caller and move the read-only scan/benchmark prerequisites into HL-1 or an earlier shared harness step. Update the dependency graph before execution, so verification is possible before the hotfix lands.

## 6. HL-7's agent-only credential cannot execute all its required user actions for the principal

**Severity: P2 plan defect.** HL-7 specifies a dedicated testnet agent key from env, while its scenario list includes USD class transfer, `sendAsset`, and abstraction switching.

The installed SDK routes the first two and `userSetAbstraction` through user-signed EIP-712, while the supported agent counterparts are separate methods. An approved agent key is not the principal's signing key. Funding the agent address and treating it as a principal would test a different account and signing path.

Command:

```sh
rg -n 'return executeUserSignedAction|return executeL1Action' "$SDK"/api/exchange/_methods/{usdClassTransfer,sendAsset,userSetAbstraction,agentSendAsset,agentSetAbstraction}.js
```

Output:

```text
/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSendAsset.js:90:  return executeL1Action({
/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSetAbstraction.js:84:  return executeL1Action(config, action, opts);
/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdClassTransfer.js:109:  return executeUserSignedAction(config, action, UsdClassTransferTypes, opts);
/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendAsset.js:132:  return executeUserSignedAction(config, action, SendAssetTypes, opts);
/Users/ankit/Documents/make/hypeterminal/apps/terminal/node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userSetAbstraction.js:125:  return executeUserSignedAction(config, action, UserSetAbstractionTypes, {
```

**Intent requires:** specify a dedicated testnet principal signer plus its approved agent, with assertions against the principal's account. Exercise the intended user and agent routes separately; use `agentSendAsset`/`agentSetAbstraction` when testing agent capability. An agent-only harness must explicitly mark user-signature scenarios unsupported rather than claiming every trading function passed.

## 7. The proposed buildOrderPlan matrix does not exercise the production TWAP path

**Severity: P2 plan defect.** HL-1 says its live-meta suite runs `buildOrderPlan` for every order kind; HL-7 promises to test the app's own pure builders.

Passing `orderType: "twap"` to the real builder returns an ordinary GTC limit order, with no error. Its price and size are valid. The real application bypasses this builder for TWAP and constructs a separate `twapOrder` payload inside the React submission hook. A green matrix row labelled TWAP therefore need not test TWAP serialization at all.

Command:

```sh
bun "$S/review.ts" twap
rg -n 'if \(twapOrder\)|placeTwapOrder\(|buildOrderPlan\(' src/hooks/trade/use-order-submit.ts
```

Output:

```text
buildOrderPlan entry orderType=twap: {"orders":[{"a":0,"b":true,"p":"100","s":"3","r":false,"t":{"limit":{"tif":"Gtc"}}}],"grouping":"na","errors":[],"warnings":[]}
112:			if (twapOrder) {
114:				const result = await placeTwapOrder({
129:				const plan = buildOrderPlan({
```

**Intent requires:** extract and share the production TWAP payload builder, test its actual action type, size, duration, direction and reduce-only flag, and reject unsupported kinds in the ordinary-order builder. The live-meta suite must assert execution kind as well as valid numeric strings.

## Control run: headline bugs reproduced

Claims (a)–(d) survived this adversarial check. These outputs use the real app formatters, fee conversion and SDK response assertion; the mixed response is a fixture, not a live trade.

Command:

```sh
bun "$S/review.ts" claims
```

Output:

```text
size(100,0): 1 SDK: 100
price(0.092424): 0.092424 SDK szDecimals=1: 0.09242
fee(10): 0.1%
SDK: ApiRequestError order 1: bad TP statuses=[{"filled":{"totalSz":"1","avgPx":"100","oid":1}},{"error":"bad TP"}]
```

The SDK methods and formatter signatures named by the plan exist in the installed version. No finding above depends on signing an action, placing an order, or changing account state.
