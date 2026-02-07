# Design Token Audit — Light Mode Trading Terminal

Extracted from Figma file `4FXIKeuaLBMqjF9L21Bbqq`, node `0:32` (LightMode) and `0:1636` (Color Token Collage).

---

## Global Settings

| Property | Value |
|---|---|
| **Font Family** | `IBM Plex Sans` (Regular, Medium, SemiBold, Bold) |
| **Root Background** | `var(--surface/base)` = `#f1f3f4` |

---

## 1. Top Navigation Bar

**Container**: bg `var(--surface/execution)` = `white`, border-bottom `#eef0f5`, h=44px

| Element | Weight | Size | Color Token | Hex | Tracking |
|---|---|---|---|---|---|
| "HYPE" (logo) | Bold | 12px | `action/primary` | `#2563eb` | -0.3px |
| "TERMINAL" (logo) | Bold | 12px | hardcoded | `#2b2e48` | -0.3px |
| "Trade" (active nav) | Medium | 13px | `action/primary` | `#2563eb` | 0.5px |
| "Vaults" / "Portfolio" / "Staking" / "Leaderboard" / "More" | Regular | 13px | `text/primary` | `#2b2e48` | 0.5px |
| "Deposit" button text | Medium | 12px | `text/primary` | `#2b2e48` | — |
| "Connect to wallet" button text | Medium | 12px | `action/primary` | `#2563eb` | — |
| Vertical divider | — | — | — | `rgba(207,217,225,0.6)` | — |

**Deposit button**: bg=`surface/execution`, border=`#dcdcdd`, shadow=`0px 1px 1px rgba(0,0,0,0.05)`
**Connect wallet button**: bg=`surface/execution`, border=`action/primary`, shadow=`0px 1px 1px rgba(2,132,199,0.08)`

---

## 2. Market Info Bar (Favorites Strip)

### BTC-USDC Selector Dropdown
- bg: `surface/execution` = white, border: `#eef0f5`, h=28px, rounded 3px

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "BTC-USDC" | Bold | 11px | `text/primary` | `#2b2e48` |

### Favorite Pairs

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| Pair name (e.g. "BTC-USDC") | Medium | 10px | `text/primary` | `#2b2e48` |
| Price (e.g. "$78,265") | Regular | 10px | `text/tertiary` | `#8a919a` |
| Positive % (e.g. "+0.59%") | Regular | 10px | `market/up/primary` | `#056e05` |
| Negative % (e.g. "-0.19%") | Regular | 10px | `market/down/primary` | `#c8241b` |

---

## 3. Chart Area — Market Info Stats Bar

**Container**: bg `surface/analysis` = `#fdfdfd`, border-bottom `rgba(238,240,245,0.85)`, h=36px

| Element | Weight | Size | Color Token | Hex | Tracking |
|---|---|---|---|---|---|
| Labels ("Mark", "24H", "ORACLE", "OI", "Vol") | Regular | 10px | `text/tertiary` | `#8a919a` | -0.5px |
| Mark price ("$78,265.00") | Regular | 10px | `market/down/primary` | `#c8241b` | normal |
| 24h change ("+0.09") | Regular | 10px | `market/up/primary` | `#056e05` | normal |
| Oracle, OI, Vol values | Regular | 10px | `text/primary` | `#2b2e48` | normal |
| Funding rate ("0.00000%") | Regular | 10px | `market/up/primary` | `#056e05` | normal |

---

## 4. Order Book

**Panel**: bg `surface/analysis` = `#fdfdfd`, border `rgba(238,240,245,0.85)`

### Tabs

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Order book" (active) | SemiBold | 10px | `text/primary` | `#2b2e48` |
| "Trades" (inactive) | Regular | 10px | `text/secondary` | `#626b75` |

Active tab bg: `surface/execution` = white. Tab bar bg: `#eeeff2`.

### Column Headers

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Price", "Size (BTC)", "Total (BTC)" | Regular | 10px | `text/primary` | `#2b2e48` |
| "(BTC)" suffix | — | — | hardcoded | `#8a919a` |

### Orderbook Rows (10px inherited)

| Element | Weight | Color Token | Hex |
|---|---|---|---|
| Ask price (e.g. "88,033") | Medium | `market/down/muted` | `#e06a63` |
| Ask size (e.g. "1.10840") | Regular | `text/primary` | `#2b2e48` |
| Ask total (e.g. "17.58173") | Regular | `text/tertiary` | `#8a919a` |
| Bid price (e.g. "88,033") | Medium | `market/up/muted` | `#4fa14f` |
| Bid size (e.g. "1.10840") | Regular | `text/primary` | `#2b2e48` |
| Bid total (e.g. "17.58173") | Regular | `text/tertiary` | `#8a919a` |

### Spread Row

Border top/bottom: `#eef0f5`, h=28px

| Element | Weight | Color Token | Hex |
|---|---|---|---|
| Spread price (e.g. "88,023.50000") | Medium | `market/down/muted` | `#e06a63` |
| Right value (e.g. "1.10840") | Regular | `text/primary` | `#2b2e48` |

---

## 5. Trade Panel (Right Side)

**Panel**: bg `surface/execution` = white, border `rgba(238,240,245,0.85)`

### Cross / Leverage

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Cross" | Medium | 11px | `text/primary` | `#2b2e48` |
| "Leverage" label | Regular | 11px | hardcoded | `#626b75` |
| "10x" value | Medium | 11px | `text/primary` | `#2b2e48` |

### Market / Limit / Others Tabs

| Element | Weight | Size | Color Token | Hex | Tracking |
|---|---|---|---|---|---|
| Active tab (e.g. "Market") | SemiBold | 12px | `text/primary` | `#2b2e48` | 0.5px |
| Inactive tab (e.g. "Limit", "Others") | Regular | 12px | `text/secondary` | `#626b75` | 0.5px |

Active border: `text/primary` = `#2b2e48`. Inactive border: `#eeeff2`.

### Long / Short Toggle

Container bg: `#eeeff2`, h=32px, padding 2px, rounded 2px

| Element | Weight | Size | Color Token | Hex | Tracking |
|---|---|---|---|---|---|
| "LONG" (active) | Bold | 11px | `market/up/primary` | `#056e05` | 0.5px, uppercase |
| "SHORT" (inactive) | Regular | 11px | `text/secondary` | `#626b75` | 0.5px, uppercase |

Active side bg: `surface/execution` = white.

### Input Fields

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Hype" token selector | Medium | 11px | `text/primary` | `#2b2e48` |
| "Enter amount" placeholder | Regular | 11px | hardcoded | `#9aa1a9` |

Input: bg=`surface/execution`, border=`#b2b7c2`, h=28px

### Available / Position

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Available" label | Regular | 10px | `text/primary` | `#2b2e48` |
| "20,154,392 USDC" value | Regular | 10px | `market/up/primary` | `#056e05` |
| "Position" label | Regular | 10px | `text/primary` | `#2b2e48` |

### Slider

| Element | Value |
|---|---|
| Track bg | `#eaeff3` (50% opacity) |
| Filled track | `action/primary` = `#2563eb` |
| Thumb | `#7ca1f3`, border `rgba(37,99,235,0.4)`, 16x16px |
| "20%" value | Regular 11px, `text/secondary` = `#626b75` |

### Checkboxes

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Reduce only" / "TP/SL" | Regular | 10px | `text/primary` | `#2b2e48` |

### Connect to Wallet CTA

bg: `action/primary` = `#2563eb`, border: same, h=28px, rounded 2px
Text: Medium 14px, color `surface/execution` = white

### Order Summary Rows

Font: Regular 11px, tracking 0.5px. Row border: `rgba(238,240,245,0.3)`, h=20px.

| Label (tertiary) | Value | Value Token | Hex |
|---|---|---|---|
| "Liq. Price" | "$27.2614" | `market/down/primary` | `#c8241b` |
| "Order Value" | "$25.50M" | `text/secondary` | `#626b75` |
| "Margin Req." | "$5.50M" | `text/secondary` | `#626b75` |
| "Slippage" | "2.5%" | `market/down/primary` | `#c8241b` |
| "Est. Fee" | "1.10840" | `text/secondary` | `#626b75` |
| "Builder Fee" | "0.01%" | `text/secondary` | `#626b75` |

All labels use `text/tertiary` = `#8a919a`.

---

## 6. Account Panel (Bottom Right)

**Panel**: bg `surface/execution` = white, border `rgba(238,240,245,0.85)`

### Header

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Account" | Regular | 10px | `text/primary` | `#2b2e48` |

### Equity / PnL

| Element | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Equity" / "PnL" labels | Regular | 10px | `text/primary` | `#2b2e48` |
| "$21.94M" / "+$12.38M" values | Medium | 10px | `market/up/primary` | `#056e05` |

### Perps / Spot Tabs

| Element | Weight | Size | Color Token | Hex | Tracking |
|---|---|---|---|---|---|
| "Perps" (active) | SemiBold | 12px | `text/primary` | `#2b2e48` | 0.5px |
| "Spot" (inactive) | Regular | 12px | `text/secondary` | `#626b75` | 0.5px |

### Detail Rows

Font: Regular 11px, tracking 0.5px. Border: `rgba(238,240,245,0.3)`, h=20px.

| Label (tertiary) | Value | Value Token | Hex |
|---|---|---|---|
| "Balance" | "$27.2614" | `market/down/primary` | `#c8241b` |
| "Unrealized PnL" | "$25.50M" | `text/secondary` | `#626b75` |
| "Available" | "$5.50M" | `text/secondary` | `#626b75` |
| "Margin used" | "$5.50M" | `text/secondary` | `#626b75` |
| "Margin Ratio" | "+12.22%" | `text/secondary` | `#626b75` |
| "Cross Leverage" | "1.25x" | `text/secondary` | `#626b75` |

### Buttons

| Button | Weight | Size | Text Color | Border Color |
|---|---|---|---|---|
| "Withdraw" | Medium | 12px | `text/secondary` `#626b75` | `#dcdcdd` |
| "Deposit" | Medium | 12px | `status/success` `#1f7a3f` | `status/success` `#1f7a3f` |

---

## 7. Positions Panel (Bottom)

**Panel**: bg `surface/execution` = white, border `rgba(238,240,245,0.85)`

### Tab Bar

All tabs: 12px, tracking 0.5px

| Tab | Weight | Color Token | Hex | Active Border |
|---|---|---|---|---|
| "Balances (11)" (active) | SemiBold | `text/primary` | `#2b2e48` | `text/primary` |
| "Positions(10)" | Regular | `text/secondary` | `#626b75` | `#eeeff2` |
| "Orders(1)" | Regular | `text/secondary` | `#626b75` | `#eeeff2` |
| "TWAP" | Regular | `text/secondary` | `#626b75` | `#eeeff2` |
| "History" | Regular | `text/secondary` | `#626b75` | `#eeeff2` |
| "Funding" | Regular | `text/secondary` | `#626b75` | `#eeeff2` |

### Active Positions Indicator

| Element | Weight | Size | Color |
|---|---|---|---|
| "Active positions" | Regular | 10px | `text/primary` `#2b2e48` |
| "10" count | SemiBold | 10px | hardcoded `#056e05` |

### Table Header Row

bg: `surface/monitoring/row/b` = `#f9f9fa`
Font: Medium 9px, color `text/tertiary` = `#8a919a`
Columns: Asset, Size, Margin, Entry, Mark, Liq, Funding, PNL, TP/SL, Actions

### Position Data Rows

Base: Regular 10px, `text/primary` = `#2b2e48`
Alternating bg: `surface/monitoring/row/b` = `#f9f9fa`, border `#eef0f5`, h=36px

| Element | Weight | Color Token | Hex |
|---|---|---|---|
| Asset name ("BTC-USDC") | Medium | `text/primary` | `#2b2e48` |
| Entry price ("$91.69K") | Regular | `text/tertiary` | `#8a919a` |
| Mode ("Cross") | Regular | `text/tertiary` | `#8a919a` |
| Return % ("+231.4%") | Regular | `text/tertiary` | `#8a919a` |
| Size / Margin / Mark values | Regular | `text/primary` | `#2b2e48` |
| Liq price | Regular | `market/down/primary` | `#c8241b` |
| Funding | Regular | `market/down/primary` | `#c8241b` |
| PNL cumulative ("+$16.03M") | Regular | `market/up/muted` | `#4fa14f` |
| PNL recent ("+$27.27K") | Regular | `market/up/primary` | `#056e05` |

### Short Badge

bg: `#faedec`, rounded 2px, h=14px, padding 4px/2px
Text: Bold 8px, `market/down/primary` = `#c8241b`, uppercase

### Action Buttons

| Button | Weight | Size | Color Token | Hex |
|---|---|---|---|---|
| "Add" | Medium | 12px | `text/secondary` | `#626b75` |
| "Enable" | Medium | 12px | `action/primary` | `#2563eb` |

---

## Quick Reference: Design Token Summary

### Color Tokens

| Token | Hex (Light) | Primary Usage |
|---|---|---|
| `surface/base` | `#f1f3f4` | Page background |
| `surface/execution` | `#ffffff` | Panels, cards, buttons bg |
| `surface/analysis` | `#fdfdfd` | Chart stats bar, orderbook panel bg |
| `surface/monitoring/row/b` | `#f9f9fa` | Alternating table rows, table header |
| `text/primary` | `#2b2e48` | Primary text, active tabs |
| `text/secondary` | `#626b75` | Inactive tabs, secondary values |
| `text/tertiary` | `#8a919a` | Labels, summary labels, column headers |
| `text/disabled` | `#b3b8bf` | Disabled text |
| `text/placeholder` | `#9aa1a9` | Input placeholders |
| `action/primary` | `#2563eb` | CTA buttons, active nav, Enable links, slider |
| `action/primary/hover` | `#1d4ed8` | Button hover state |
| `action/primary/active` | `#1e40af` | Button active/pressed state |
| `action/primary/disabled` | `#a5b4fc` | Disabled CTA buttons |
| `market/up/primary` | `#056e05` | Strong positive, Long active |
| `market/up/muted` | `#4fa14f` | Bid prices, cumulative PnL+ |
| `market/up/subtle` | `#e6f4e6` | Positive bg tints |
| `market/down/primary` | `#c8241b` | Strong negative, Short badge, liq prices |
| `market/down/muted` | `#e06a63` | Ask prices, spread price |
| `market/down/subtle` | `#fce9e8` | Negative bg tints |
| `market/neutral` | `#8a919a` | Neutral market state |
| `status/success` | `#1f7a3f` | Deposit button (account) |
| `status/success/subtle` | `#e4f3ea` | Success bg |
| `status/warning` | `#ffad0d` | Warning text |
| `status/warning/subtle` | `#fff3d6` | Warning bg |
| `status/error` | `#a63a2b` | Error text |
| `status/error/subtle` | `#fbeae7` | Error bg |
| `status/info` | `#2563eb` | Info text |
| `status/info/subtle` | `#eaf0ff` | Info bg |

### Border Colors

| Value | Usage |
|---|---|
| `#eef0f5` | Panel borders, dropdown borders, row separators |
| `#eeeff2` | Inactive tab underlines, toggle container bg |
| `#dcdcdd` | Secondary button borders (Deposit nav, Withdraw) |
| `#b2b7c2` | Input field border |
| `rgba(238,240,245,0.85)` | Panel outer borders |
| `rgba(238,240,245,0.3)` | Summary row separators |
| `rgba(207,217,225,0.6)` | Vertical dividers |

### Font Size Scale

| Size | Usage |
|---|---|
| 8px | Badges (Short/Long in positions) |
| 9px | Table header row |
| 10px | Orderbook rows, chart stats, favorites, position data, checkboxes |
| 11px | Trade panel inputs, Long/Short toggle, leverage, order summary, account details |
| 12px | Tab text, nav buttons, action buttons (Add/Enable, Deposit/Withdraw) |
| 13px | Top navigation links |
| 14px | Connect to wallet CTA |

### Font Weight Usage

| Weight | CSS | Usage |
|---|---|---|
| Regular | 400 | Body text, inactive tabs, data values, labels |
| Medium | 500 | Orderbook prices, active nav, buttons, dropdowns, PnL values |
| SemiBold | 600 | Active tab text (Balances, Order book, Market, Perps) |
| Bold | 700 | Logo, BTC-USDC selector, Long active, Short badge |
