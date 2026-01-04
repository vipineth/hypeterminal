# Euphoria-Style Box Prediction Trading on Hyperliquid

## Specification Document v1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concept](#2-core-concept)
3. [Critical Constraints](#3-critical-constraints)
4. [Mathematical Formulas](#4-mathematical-formulas)
5. [User Experience Flow](#5-user-experience-flow)
6. [Grid Layout Specification](#6-grid-layout-specification)
7. [Trade Execution](#7-trade-execution)
8. [Outcome Handling](#8-outcome-handling)
9. [Edge Cases & Validation](#9-edge-cases--validation)
10. [API Implementation](#10-api-implementation)
11. [Example Scenarios](#11-example-scenarios)
12. [Known Limitations](#12-known-limitations)

---

## 1. Overview

### 1.1 What This System Does

Replicates Euphoria.fi's "box prediction" gambling mechanic using Hyperliquid's perpetual futures order book. Users tap on price level "boxes" to bet that price will touch that level within a time window.

### 1.2 How It Works (High Level)

```
USER SEES:                          SYSTEM DOES:
┌─────────────────────────┐        ┌──────────────────────────────────┐
│                         │        │                                  │
│  Grid of boxes above    │   →    │  Opens LONG position             │
│  and below current      │        │  Sets TP at box edge             │
│  price, with time       │        │  Sets SL to limit loss           │
│  columns and            │        │  Monitors for outcome            │
│  multipliers            │        │  Closes on TP/SL/expiry          │
│                         │        │                                  │
└─────────────────────────┘        └──────────────────────────────────┘
```

### 1.3 Key Terminology

| Term | Definition |
|------|------------|
| **Box** | A price zone on the grid that user can bet on |
| **TP (Take Profit)** | The price level where winning position closes |
| **SL (Stop Loss)** | The price level where losing position closes |
| **Multiplier** | Return on bet if box is hit (e.g., 2x means bet $5, get $10) |
| **Collateral** | Funds locked to maintain the leveraged position |
| **Entry** | Current price where position opens |

---

## 2. Core Concept

### 2.1 The User Mental Model

```
"I bet $5 that ETH price will touch $3,015 within 30 seconds.
 If it does, I win $10 (2x).
 If it doesn't (or hits my stop), I lose my $5."
```

### 2.2 What Actually Happens

```
1. User taps box at $3,015 (current price: $3,000)
2. System opens LONG position at $3,000
3. System sets TP (Take Profit) at $3,015
4. System sets SL (Stop Loss) at $2,985 (calculated)
5. Timer starts: 30 seconds

OUTCOME A: Price hits $3,015 first
   → TP triggers → Position closes → User wins ~$5 profit

OUTCOME B: Price hits $2,985 first
   → SL triggers → Position closes → User loses ~$5

OUTCOME C: Timer expires, price is $3,008
   → Position force-closed → User gets partial result
```

### 2.3 Visual Representation

```
    PRICE                               TIME
      ↑
$3,030 │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
       │    │ 3x  │ │ 2.5x│ │ 2.2x│ │ 2x  │   ← Far boxes: Higher mult
$3,020 │    └─────┘ └─────┘ └─────┘ └─────┘
       │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
$3,015 │    │ 2x  │ │ 1.8x│ │ 1.6x│ │ 1.5x│   ← Tapped box
       │    └─────┘ └─────┘ └─────┘ └─────┘
───────│────────●──────────────────────────── $3,000 (Current Price)
       │        │
$2,985 │    ┌───│─┐ ┌─────┐ ┌─────┐ ┌─────┐   ← SL set here (invisible)
       │    │ 2x│ │ │ 1.8x│ │ 1.6x│ │ 1.5x│
       │    └───│─┘ └─────┘ └─────┘ └─────┘
       │        │
       └────────┼─────┼─────┼─────┼────────→ TIME
               30s   1m    5m   15m
```

---

## 3. Critical Constraints

### 3.1 Minimum Box Distance

> **RULE: Boxes must be at least 0.5% away from current price**

**Why?**
- Hyperliquid TP/SL orders have ~0.1% slippage
- If box is only 0.1% away, slippage eats 100% of profit
- At 0.3%, slippage eats 33% of profit
- At 0.5%, slippage eats 20% of profit (acceptable)

```
EXAMPLE:
  Current: $3,000
  Closest allowed box: $3,015 (0.5% away)
  
  NOT ALLOWED: $3,003 (0.1% away) - slippage destroys profit
```

### 3.2 Multiplier Constraints

| Multiplier | Min Box Distance | Collateral Ratio |
|------------|------------------|------------------|
| 1.5x | 0.5% | 3x bet |
| 2.0x | 0.5% | 6x bet |
| 3.0x | 0.5% | 12x bet |
| 5.0x | 1.0% | 25x bet |
| 10.0x | 2.0% | 55x bet |

> **RULE: Multiplier must be > 1.1 and < 20**

**Why?**
- Multiplier < 1.1 creates SL infinitely far away
- Multiplier > 20 creates SL too close, almost instant loss

### 3.3 Minimum Bet Amount

> **RULE: Minimum bet = $1**

**Why?**
- Hyperliquid has $10 minimum order size
- Small bets with high multipliers may create sub-$10 positions
- $1 minimum ensures viable positions for 2x multiplier at 0.5% distance

### 3.4 Box Cannot Straddle Current Price

> **RULE: Box must be entirely ABOVE or BELOW current price**

```
VALID:
  Current: $3,000
  Box: $3,015 - $3,020 (entirely above) ✓
  Box: $2,980 - $2,985 (entirely below) ✓

INVALID:
  Current: $3,000
  Box: $2,995 - $3,005 (straddles price) ✗
```

### 3.5 Time Window Constraints

| Time Window | Recommended | Notes |
|-------------|-------------|-------|
| 10s | ❌ No | Too fast, order execution latency issues |
| 15s | ⚠️ Risky | Borderline viable |
| 30s | ✅ Yes | Minimum recommended |
| 1m | ✅ Yes | Good default |
| 5m | ✅ Yes | Standard |
| 15m | ✅ Yes | Good for far boxes |
| 1h+ | ⚠️ Risky | Funding costs accumulate |

---

## 4. Mathematical Formulas

### 4.1 Core Variables

```
currentPrice    = Current market price (entry point)
boxBottom       = Lower edge of box
boxTop          = Upper edge of box
betAmount       = User's wager (max loss)
multiplier      = Target payout ratio (e.g., 2 for 2x)
leverage        = Hyperliquid leverage (default: 20)
takerFee        = 0.00035 (0.035%)
slippage        = 0.001 (0.1%)
```

### 4.2 Direction Determination

```typescript
direction = boxBottom > currentPrice ? 'LONG' : 'SHORT'
```

### 4.3 Take Profit Price

```typescript
// TP is the closest edge of the box to current price
if (direction === 'LONG') {
  tp = boxBottom  // Price must reach bottom of box to win
} else {
  tp = boxTop     // Price must reach top of box to win
}
```

### 4.4 TP Distance (in price terms)

```typescript
tpDistanceAbs = Math.abs(tp - currentPrice)
tpDistancePercent = tpDistanceAbs / currentPrice
```

### 4.5 Effective TP Move (after slippage)

```typescript
// Slippage reduces actual exit price
slippageCost = tp * slippage  // e.g., $3015 * 0.001 = $3.015

// Effective move is less than nominal
effectiveTpMove = tpDistanceAbs - slippageCost
```

### 4.6 Position Size

```typescript
// Desired profit after slippage and fees
desiredProfit = betAmount * (multiplier - 1)

// Fee cost per unit
feeRate = takerFee * 2  // Round-trip: entry + exit

// Profit per unit of asset
profitPerUnit = effectiveTpMove - (currentPrice * feeRate)

// Position size needed
sizeAsset = desiredProfit / profitPerUnit
sizeUsd = sizeAsset * currentPrice
```

### 4.7 Stop Loss Price

```typescript
// SL distance should result in loss ≈ betAmount
// Account for slippage making exit worse
slDistanceAbs = (betAmount / sizeAsset) * (1 + slippage + feeRate)

if (direction === 'LONG') {
  sl = currentPrice - slDistanceAbs
} else {
  sl = currentPrice + slDistanceAbs
}
```

### 4.8 Collateral Required

```typescript
collateralRequired = sizeUsd / leverage
```

### 4.9 Expected Outcomes

```typescript
// If TP hits
expectedProfit = sizeAsset * effectiveTpMove - (sizeUsd * feeRate)
userGetsBack = betAmount + expectedProfit

// If SL hits  
expectedLoss = sizeAsset * slDistanceAbs + (sizeUsd * feeRate)
userGetsBack = betAmount - expectedLoss  // Should be ≈ $0
```

### 4.10 Complete Calculation Function

```typescript
function calculateTrade(
  currentPrice: number,
  boxBottom: number,
  boxTop: number,
  betAmount: number,
  multiplier: number,
  leverage: number = 20
): TradeParams {
  const slippage = 0.001;
  const feeRate = 0.0007;
  
  // Direction
  const isUpBox = boxBottom > currentPrice;
  const direction = isUpBox ? 'LONG' : 'SHORT';
  
  // TP
  const tp = isUpBox ? boxBottom : boxTop;
  const tpDistanceAbs = Math.abs(tp - currentPrice);
  
  // Validate minimum distance
  const tpDistancePercent = tpDistanceAbs / currentPrice;
  if (tpDistancePercent < 0.005) {
    throw new Error('Box too close to current price');
  }
  
  // Effective move after slippage
  const slippageCost = tp * slippage;
  const effectiveTpMove = tpDistanceAbs - slippageCost;
  
  if (effectiveTpMove <= 0) {
    throw new Error('Slippage exceeds box distance');
  }
  
  // Position size
  const desiredProfit = betAmount * (multiplier - 1);
  const profitPerUnit = effectiveTpMove - (currentPrice * feeRate);
  const sizeAsset = desiredProfit / profitPerUnit;
  const sizeUsd = sizeAsset * currentPrice;
  
  // SL
  const slDistanceAbs = (betAmount / sizeAsset) * (1 + slippage + feeRate);
  const sl = isUpBox 
    ? currentPrice - slDistanceAbs 
    : currentPrice + slDistanceAbs;
  
  // Collateral
  const collateralRequired = sizeUsd / leverage;
  
  return {
    direction,
    entry: currentPrice,
    tp,
    sl,
    sizeAsset,
    sizeUsd,
    collateralRequired,
    expectedProfit: sizeAsset * effectiveTpMove - (sizeUsd * feeRate),
    expectedLoss: betAmount,
  };
}
```

---

## 5. User Experience Flow

### 5.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ETH/USD                              Balance: $500         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         30s      1m       5m      15m                       │
│        ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ $3,030 │ 3x  │ │ 2.5x│ │ 2.2x│ │ 2x  │                     │
│        └─────┘ └─────┘ └─────┘ └─────┘                     │
│        ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ $3,020 │ 2.5x│ │ 2.2x│ │ 2x  │ │ 1.8x│                     │
│        └─────┘ └─────┘ └─────┘ └─────┘                     │
│        ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ $3,015 │ 2x  │ │ 1.8x│ │ 1.6x│ │ 1.5x│  ← USER TAPS       │
│        └─────┘ └─────┘ └─────┘ └─────┘                     │
│ ─────────────●──────────────────────────── $3,008 LIVE     │
│        ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ $3,000 │ 2x  │ │ 1.8x│ │ 1.6x│ │ 1.5x│                     │
│        └─────┘ └─────┘ └─────┘ └─────┘                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  BET CONFIRMATION                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Box: $3,015.00 (UP)         Time: 30 seconds       │   │
│  │  Bet: [ - ] $5.00 [ + ]      Multiplier: 2x         │   │
│  │                                                      │   │
│  │  If WIN: +$5.00 → Total $10.00                      │   │
│  │  If LOSE: -$5.00 → Total $0.00                      │   │
│  │                                                      │   │
│  │  Collateral Reserved: $30.00                        │   │
│  │                                                      │   │
│  │  [ CONFIRM BET ]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
1. USER OPENS APP
   └→ See grid of boxes with current price line
   └→ Boxes update in real-time as price moves

2. USER TAPS A BOX
   └→ Confirmation modal appears
   └→ Shows bet amount, multiplier, potential outcomes
   └→ Shows collateral that will be reserved

3. USER ADJUSTS BET (optional)
   └→ Can increase/decrease bet amount
   └→ Multiplier stays fixed (based on box position/time)
   └→ Collateral updates accordingly

4. USER CONFIRMS
   └→ Position opens at market
   └→ TP/SL orders placed
   └→ Timer starts
   └→ Collateral reserved from balance

5. WHILE ACTIVE
   └→ User sees position status
   └→ Can see price movement toward/away from box
   └→ Timer countdown shown

6. OUTCOME
   └→ TP HIT: "🎉 You won! +$X.XX"
   └→ SL HIT: "❌ Box missed"
   └→ EXPIRED: "⏰ Time up. Result: +/-$X.XX"
```

### 5.3 Real-Time Updates

```
GRID BEHAVIOR:
- Boxes closest to current price disappear as price approaches
- New boxes appear on the far side
- Minimum 0.5% gap maintained between price and nearest box

DURING ACTIVE BET:
- Highlight the active box
- Show price line moving
- Show countdown timer
- Pulse/glow if price is close to box
```

---

## 6. Grid Layout Specification

### 6.1 Box Grid Parameters

```typescript
const GRID_CONFIG = {
  // Price levels
  boxesAbove: 4,           // Number of box rows above current price
  boxesBelow: 4,           // Number of box rows below current price
  boxHeightPercent: 0.5,   // Each box spans 0.5% of price
  minDistancePercent: 0.5, // Minimum distance from current price
  
  // Time columns
  timeWindows: [30, 60, 300, 900], // seconds: 30s, 1m, 5m, 15m
  
  // Multiplier calculation
  baseMultiplier: 2.0,     // Multiplier for closest box, longest time
  distanceMultiplierBonus: 0.5,  // +0.5x per additional distance tier
  timeMultiplierBonus: 0.3,      // +0.3x for shorter time windows
};
```

### 6.2 Box Generation Algorithm

```typescript
function generateBoxGrid(currentPrice: number): Box[][] {
  const grid: Box[][] = [];
  
  for (let timeIdx = 0; timeIdx < GRID_CONFIG.timeWindows.length; timeIdx++) {
    const timeColumn: Box[] = [];
    const timeWindow = GRID_CONFIG.timeWindows[timeIdx];
    
    // Generate boxes ABOVE current price
    for (let i = 0; i < GRID_CONFIG.boxesAbove; i++) {
      const distanceTier = i + 1;
      const bottomPrice = currentPrice * (1 + GRID_CONFIG.minDistancePercent/100 + 
                         (i * GRID_CONFIG.boxHeightPercent/100));
      const topPrice = bottomPrice * (1 + GRID_CONFIG.boxHeightPercent/100);
      
      const multiplier = calculateMultiplier(distanceTier, timeIdx);
      
      timeColumn.push({
        id: `up_${i}_${timeIdx}`,
        priceBottom: bottomPrice,
        priceTop: topPrice,
        timeWindowSeconds: timeWindow,
        multiplier,
        direction: 'UP',
      });
    }
    
    // Generate boxes BELOW current price
    for (let i = 0; i < GRID_CONFIG.boxesBelow; i++) {
      const distanceTier = i + 1;
      const topPrice = currentPrice * (1 - GRID_CONFIG.minDistancePercent/100 - 
                      (i * GRID_CONFIG.boxHeightPercent/100));
      const bottomPrice = topPrice * (1 - GRID_CONFIG.boxHeightPercent/100);
      
      const multiplier = calculateMultiplier(distanceTier, timeIdx);
      
      timeColumn.push({
        id: `down_${i}_${timeIdx}`,
        priceBottom: bottomPrice,
        priceTop: topPrice,
        timeWindowSeconds: timeWindow,
        multiplier,
        direction: 'DOWN',
      });
    }
    
    grid.push(timeColumn);
  }
  
  return grid;
}

function calculateMultiplier(distanceTier: number, timeIdx: number): number {
  // Farther boxes and shorter times = higher multiplier
  const base = GRID_CONFIG.baseMultiplier;
  const distanceBonus = (distanceTier - 1) * GRID_CONFIG.distanceMultiplierBonus;
  const timeBonus = (GRID_CONFIG.timeWindows.length - 1 - timeIdx) * GRID_CONFIG.timeMultiplierBonus;
  
  return Math.round((base + distanceBonus + timeBonus) * 10) / 10;
}
```

### 6.3 Example Grid Output

```
Current Price: $3,000

                30s       1m        5m        15m
              ┌───────┬─────────┬─────────┬─────────┐
    $3,030    │  3.3x │   3.0x  │   2.7x  │   2.4x  │  (2% away)
              ├───────┼─────────┼─────────┼─────────┤
    $3,022.50 │  2.8x │   2.5x  │   2.2x  │   1.9x  │  (1.5% away)
              ├───────┼─────────┼─────────┼─────────┤
    $3,015    │  2.3x │   2.0x  │   1.7x  │   1.5x  │  (1% away)
              ├───────┼─────────┼─────────┼─────────┤
    $3,007.50 │  1.8x │   1.5x  │   1.3x  │   1.2x  │  (0.5% away)
              └───────┴─────────┴─────────┴─────────┘
─────────────────────●───────────────────────────────── $3,000
              ┌───────┬─────────┬─────────┬─────────┐
    $2,992.50 │  1.8x │   1.5x  │   1.3x  │   1.2x  │  (0.5% away)
              ├───────┼─────────┼─────────┼─────────┤
    $2,985    │  2.3x │   2.0x  │   1.7x  │   1.5x  │  (1% away)
              ├───────┼─────────┼─────────┼─────────┤
    $2,977.50 │  2.8x │   2.5x  │   2.2x  │   1.9x  │  (1.5% away)
              ├───────┼─────────┼─────────┼─────────┤
    $2,970    │  3.3x │   3.0x  │   2.7x  │   2.4x  │  (2% away)
              └───────┴─────────┴─────────┴─────────┘
```

---

## 7. Trade Execution

### 7.1 Order Sequence

```typescript
async function executeBet(params: BetParams): Promise<ActiveBet> {
  const { coin, boxBottom, boxTop, betAmount, multiplier, timeWindow } = params;
  
  // 1. Get current price
  const currentPrice = await hyperliquid.getMarkPrice(coin);
  
  // 2. Calculate trade parameters
  const trade = calculateTrade(currentPrice, boxBottom, boxTop, betAmount, multiplier);
  
  // 3. Validate
  if (!validateTrade(trade, userBalance)) {
    throw new Error('Insufficient balance or invalid parameters');
  }
  
  // 4. Place entry order (market-like IOC)
  const entryOrder = await hyperliquid.placeOrder({
    coin,
    side: trade.direction === 'LONG' ? 'BUY' : 'SELL',
    size: trade.sizeAsset,
    price: trade.direction === 'LONG' 
      ? currentPrice * 1.005   // Slightly above for guaranteed fill
      : currentPrice * 0.995,  // Slightly below for guaranteed fill
    orderType: { limit: { tif: 'Ioc' } },
    reduceOnly: false,
  });
  
  // 5. Wait for fill confirmation
  await waitForFill(entryOrder.oid, 2000); // 2 second timeout
  
  // 6. Place TP order
  const tpOrder = await hyperliquid.placeOrder({
    coin,
    side: trade.direction === 'LONG' ? 'SELL' : 'BUY',
    size: trade.sizeAsset,
    orderType: {
      trigger: {
        triggerPx: trade.tp.toString(),
        isMarket: true,  // Market order for guaranteed exit
        tpsl: 'tp',
      },
    },
    reduceOnly: true,
  });
  
  // 7. Place SL order
  const slOrder = await hyperliquid.placeOrder({
    coin,
    side: trade.direction === 'LONG' ? 'SELL' : 'BUY',
    size: trade.sizeAsset,
    orderType: {
      trigger: {
        triggerPx: trade.sl.toString(),
        isMarket: true,
        tpsl: 'sl',
      },
    },
    reduceOnly: true,
  });
  
  // 8. Create active bet record
  const bet: ActiveBet = {
    id: generateId(),
    coin,
    trade,
    entryOrderId: entryOrder.oid,
    tpOrderId: tpOrder.oid,
    slOrderId: slOrder.oid,
    startTime: Date.now(),
    expiresAt: Date.now() + (timeWindow * 1000),
    status: 'ACTIVE',
  };
  
  // 9. Start monitoring
  monitorBet(bet);
  
  return bet;
}
```

### 7.2 Hyperliquid Order Types Used

| Purpose | Order Type | Parameters |
|---------|------------|------------|
| Entry | Limit IOC | `tif: 'Ioc'`, aggressive price |
| Take Profit | Trigger Market | `tpsl: 'tp'`, `isMarket: true` |
| Stop Loss | Trigger Market | `tpsl: 'sl'`, `isMarket: true` |
| Force Close | Market | On time expiry |

### 7.3 Order Cancellation on Outcome

```typescript
async function handleOutcome(bet: ActiveBet, outcome: 'TP_HIT' | 'SL_HIT' | 'EXPIRED') {
  // Cancel remaining orders
  if (outcome === 'TP_HIT') {
    await hyperliquid.cancelOrder(bet.slOrderId);
  } else if (outcome === 'SL_HIT') {
    await hyperliquid.cancelOrder(bet.tpOrderId);
  } else {
    // Expired - cancel both and force close
    await hyperliquid.cancelOrder(bet.tpOrderId);
    await hyperliquid.cancelOrder(bet.slOrderId);
    await forceClosePosition(bet);
  }
}
```

---

## 8. Outcome Handling

### 8.1 Monitoring Loop

```typescript
async function monitorBet(bet: ActiveBet) {
  const checkInterval = 500; // Check every 500ms
  
  const monitor = setInterval(async () => {
    // Check position status
    const position = await hyperliquid.getPosition(bet.coin);
    const hasPosition = position && Math.abs(position.size) > 0;
    
    // Check if time expired
    if (Date.now() >= bet.expiresAt) {
      clearInterval(monitor);
      if (hasPosition) {
        await handleOutcome(bet, 'EXPIRED');
      }
      return;
    }
    
    // Check if position was closed (TP or SL hit)
    if (!hasPosition) {
      clearInterval(monitor);
      const outcome = await determineOutcome(bet);
      await handleOutcome(bet, outcome);
      return;
    }
  }, checkInterval);
}
```

### 8.2 Determining Outcome

```typescript
async function determineOutcome(bet: ActiveBet): Promise<'TP_HIT' | 'SL_HIT' | 'EXPIRED'> {
  // Get recent fills
  const fills = await hyperliquid.getUserFills(bet.coin);
  
  // Find the closing fill
  const closingFill = fills.find(f => 
    f.oid === bet.tpOrderId || f.oid === bet.slOrderId
  );
  
  if (!closingFill) {
    return 'EXPIRED';
  }
  
  if (closingFill.oid === bet.tpOrderId) {
    return 'TP_HIT';
  } else {
    return 'SL_HIT';
  }
}
```

### 8.3 PnL Calculation

```typescript
async function calculateFinalPnL(bet: ActiveBet): Promise<number> {
  const fills = await hyperliquid.getUserFills(bet.coin);
  
  // Sum up all PnL from this bet's fills
  const relevantFills = fills.filter(f => 
    f.time >= bet.startTime && f.time <= bet.expiresAt + 60000
  );
  
  let totalPnL = 0;
  for (const fill of relevantFills) {
    totalPnL += parseFloat(fill.closedPnl || '0');
  }
  
  return totalPnL;
}
```

### 8.4 User Notification

```typescript
function notifyOutcome(bet: ActiveBet, outcome: string, pnl: number) {
  switch (outcome) {
    case 'TP_HIT':
      showNotification({
        type: 'success',
        title: '🎉 You Won!',
        message: `+$${pnl.toFixed(2)}`,
        sound: 'win.mp3',
      });
      break;
      
    case 'SL_HIT':
      showNotification({
        type: 'error',
        title: '❌ Box Missed',
        message: `-$${Math.abs(pnl).toFixed(2)}`,
        sound: 'lose.mp3',
      });
      break;
      
    case 'EXPIRED':
      showNotification({
        type: 'info',
        title: '⏰ Time Expired',
        message: pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`,
        sound: 'expired.mp3',
      });
      break;
  }
}
```

---

## 9. Edge Cases & Validation

### 9.1 Pre-Trade Validation

```typescript
function validateBet(params: BetParams, userBalance: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Box distance check
  const distance = Math.abs(params.boxBottom - params.currentPrice) / params.currentPrice;
  if (distance < 0.005) {
    errors.push('Box too close to current price (min 0.5%)');
  } else if (distance < 0.01) {
    warnings.push('Box is very close - higher chance of slippage impact');
  }
  
  // 2. Multiplier check
  if (params.multiplier < 1.1) {
    errors.push('Multiplier too low (min 1.1x)');
  }
  if (params.multiplier > 20) {
    errors.push('Multiplier too high (max 20x)');
  }
  
  // 3. Bet amount check
  if (params.betAmount < 1) {
    errors.push('Minimum bet is $1');
  }
  
  // 4. Calculate required collateral
  const trade = calculateTrade(params);
  if (trade.collateralRequired > userBalance) {
    errors.push(`Insufficient balance. Need $${trade.collateralRequired.toFixed(2)}`);
  }
  
  // 5. Position size check
  if (trade.sizeUsd < 10) {
    errors.push('Bet too small - position would be below $10 minimum');
  }
  
  // 6. Box straddling check
  if (params.boxBottom <= params.currentPrice && params.boxTop >= params.currentPrice) {
    errors.push('Box cannot contain current price');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

### 9.2 Runtime Error Handling

```typescript
async function handleExecutionError(bet: ActiveBet, error: Error) {
  console.error(`Bet ${bet.id} error:`, error);
  
  // Try to close any open position
  try {
    const position = await hyperliquid.getPosition(bet.coin);
    if (position && Math.abs(position.size) > 0) {
      await hyperliquid.closePosition(bet.coin);
    }
  } catch (closeError) {
    console.error('Failed to close position:', closeError);
  }
  
  // Cancel any pending orders
  try {
    await hyperliquid.cancelAllOrders(bet.coin);
  } catch (cancelError) {
    console.error('Failed to cancel orders:', cancelError);
  }
  
  // Update bet status
  bet.status = 'ERROR';
  bet.error = error.message;
  
  // Notify user
  showNotification({
    type: 'error',
    title: 'Trade Error',
    message: 'Something went wrong. Position has been closed.',
  });
}
```

### 9.3 Price Movement During Execution

```typescript
// If price moves significantly during order placement
async function handlePriceSlip(bet: ActiveBet, expectedEntry: number, actualEntry: number) {
  const slipPercent = Math.abs(actualEntry - expectedEntry) / expectedEntry;
  
  if (slipPercent > 0.005) { // More than 0.5% slip
    // Recalculate TP/SL based on actual entry
    const adjustedTrade = recalculateTrade(bet.trade, actualEntry);
    
    // Cancel old TP/SL
    await hyperliquid.cancelOrder(bet.tpOrderId);
    await hyperliquid.cancelOrder(bet.slOrderId);
    
    // Place new TP/SL at adjusted levels
    // ... (similar to initial placement)
  }
}
```

---

## 10. API Implementation

### 10.1 Hyperliquid SDK Setup

```typescript
import { Hyperliquid } from 'hyperliquid';

const hyperliquid = new Hyperliquid({
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: process.env.NODE_ENV !== 'production',
});
```

### 10.2 Key API Calls

```typescript
// Get current price
async function getMarkPrice(coin: string): Promise<number> {
  const mids = await hyperliquid.info.allMids();
  return parseFloat(mids[coin]);
}

// Place order
async function placeOrder(params: OrderParams): Promise<OrderResult> {
  return await hyperliquid.exchange.order(params);
}

// Get position
async function getPosition(coin: string): Promise<Position | null> {
  const state = await hyperliquid.info.userState(walletAddress);
  return state.assetPositions?.find(p => p.position.coin === coin)?.position;
}

// Cancel order
async function cancelOrder(oid: number): Promise<void> {
  await hyperliquid.exchange.cancel({ oid });
}

// Get fills
async function getUserFills(coin: string): Promise<Fill[]> {
  return await hyperliquid.info.userFills(walletAddress);
}
```

### 10.3 WebSocket for Real-Time Updates

```typescript
// Subscribe to price updates
hyperliquid.subscriptions.subscribe({
  type: 'allMids',
}, (data) => {
  updateCurrentPrice(data.mids);
  updateBoxGrid();
});

// Subscribe to order updates
hyperliquid.subscriptions.subscribe({
  type: 'orderUpdates',
  user: walletAddress,
}, (data) => {
  handleOrderUpdate(data);
});

// Subscribe to position updates  
hyperliquid.subscriptions.subscribe({
  type: 'userState',
  user: walletAddress,
}, (data) => {
  handlePositionUpdate(data);
});
```

---

## 11. Example Scenarios

### 11.1 Scenario: Basic Win

```
SETUP:
  Current Price: $3,000
  User taps: Box at $3,015 (0.5% up)
  Time: 30 seconds
  Bet: $5
  Multiplier: 2x

CALCULATION:
  Direction: LONG
  TP: $3,015
  SL: $2,985 (calculated)
  Position Size: 0.3344 ETH ($1,003 notional)
  Collateral: $50

EXECUTION:
  0s:  Entry at $3,000 ✓
  12s: Price at $3,010
  18s: Price at $3,016 → TP TRIGGERED
  
RESULT:
  Exit Price: $3,015 × 0.999 = $3,011.985 (0.1% slippage)
  Gross PnL: 0.3344 × ($3,011.985 - $3,000) = $4.01
  Fees: $1,003 × 0.0007 = $0.70
  Net PnL: $4.01 - $0.70 = $3.31
  
  User gets back: $5 + $3.31 = $8.31
  Actual multiplier: 1.66x (less than 2x due to slippage/fees)
```

### 11.2 Scenario: Basic Loss

```
SETUP:
  Current Price: $3,000
  User taps: Box at $3,015 (0.5% up)
  Time: 30 seconds
  Bet: $5
  Multiplier: 2x

EXECUTION:
  0s:  Entry at $3,000 ✓
  5s:  Price at $2,995
  11s: Price at $2,984 → SL TRIGGERED
  
RESULT:
  Exit Price: $2,985 × 0.999 = $2,982.015
  Gross PnL: 0.3344 × ($2,982.015 - $3,000) = -$6.01
  Fees: $0.70
  Net PnL: -$6.01 - $0.70 = -$6.71
  
  User gets back: $5 - $6.71 = -$1.71 (loses more than bet due to slippage)
  
  NOTE: This is why SL is set with buffer - actual loss target is ~$5
```

### 11.3 Scenario: Time Expiry

```
SETUP:
  Current Price: $3,000
  User taps: Box at $3,015 (0.5% up)
  Time: 30 seconds
  Bet: $5

EXECUTION:
  0s:  Entry at $3,000 ✓
  10s: Price at $3,005
  20s: Price at $3,008
  30s: Price at $3,007 → TIME EXPIRED
  
RESULT:
  Force close at market: ~$3,007
  Gross PnL: 0.3344 × $7 = $2.34
  Fees: $0.70
  Net PnL: $2.34 - $0.70 = $1.64
  
  User gets back: $5 + $1.64 = $6.64
  Outcome: Partial win (didn't hit box, but price moved favorably)
```

### 11.4 Scenario: High Multiplier

```
SETUP:
  Current Price: $3,000
  User taps: Box at $3,060 (2% up)
  Time: 5 minutes
  Bet: $5
  Multiplier: 5x

CALCULATION:
  Direction: LONG
  TP: $3,060
  SL: $3,048.75 (very tight - only 0.5% from TP!)
  Position Size: 1.67 ETH ($5,000 notional)
  Collateral: $250

NOTE: High multipliers have VERY tight SL!
      Price must go up without ANY significant dip.
      
RISK: Even a 0.5% dip triggers SL.
      5x multiplier ≈ 20% win rate expectation.
```

---

## 12. Known Limitations

### 12.1 Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Order execution latency | 200-500ms delay | Boxes disappear when too close to price |
| TP/SL slippage | Actual profit ~10-20% less than shown | Display "effective" multiplier |
| Minimum order size | $10 minimum | Minimum $1 bet enforced |
| Funding costs | Accumulate on long-duration bets | Warn for >15m time windows |

### 12.2 UX Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Collateral >> bet | Confusing for users | Clear "collateral reserved" display |
| Not true binary option | Expiry gives partial results | Explain outcomes clearly |
| SL can exceed bet loss | Slippage may increase loss | Build in buffer, warn users |

### 12.3 Market Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Low liquidity periods | Higher slippage | Increase minimum box distance |
| High volatility | Rapid TP/SL hits | Shorter maximum time windows |
| Network congestion | Order delays | Queue management, retries |

---

## Appendix A: Configuration Constants

```typescript
export const CONFIG = {
  // Grid
  BOXES_ABOVE: 4,
  BOXES_BELOW: 4,
  BOX_HEIGHT_PERCENT: 0.5,
  MIN_DISTANCE_PERCENT: 0.5,
  
  // Time windows (seconds)
  TIME_WINDOWS: [30, 60, 300, 900],
  
  // Multipliers
  MIN_MULTIPLIER: 1.2,
  MAX_MULTIPLIER: 20,
  BASE_MULTIPLIER: 1.5,
  
  // Betting
  MIN_BET_USD: 1,
  MAX_BET_USD: 10000,
  DEFAULT_BET_USD: 5,
  
  // Hyperliquid
  LEVERAGE: 20,
  TAKER_FEE: 0.00035,
  SLIPPAGE_ESTIMATE: 0.001,
  MIN_ORDER_USD: 10,
  
  // Monitoring
  POLL_INTERVAL_MS: 500,
  ORDER_TIMEOUT_MS: 5000,
};
```

---

## Appendix B: Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| E001 | Box too close | Increase box distance to 0.5%+ |
| E002 | Insufficient balance | Deposit more funds |
| E003 | Position size too small | Increase bet amount |
| E004 | Multiplier out of range | Use 1.2x - 20x |
| E005 | Order execution failed | Retry or cancel |
| E006 | Network error | Check connection |
| E007 | Price moved too fast | Box no longer valid |

---

## Appendix C: Testing Checklist

```
[ ] Basic UP box win
[ ] Basic UP box loss (SL hit)
[ ] Basic DOWN box win
[ ] Basic DOWN box loss (SL hit)
[ ] Time expiry with profit
[ ] Time expiry with loss
[ ] Minimum bet amount ($1)
[ ] Maximum bet amount
[ ] Minimum box distance (0.5%)
[ ] Maximum multiplier (20x)
[ ] Rapid price movement
[ ] Order cancellation on outcome
[ ] Network disconnection handling
[ ] Insufficient balance rejection
[ ] Multiple concurrent bets
```

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: Box Trading System Specification*