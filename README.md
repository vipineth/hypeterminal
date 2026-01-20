# HypeTerminal

A modern, high-performance trading terminal for [Hyperliquid](https://hyperliquid.xyz) - the decentralized perpetual exchange.

## Features

- **Advanced Order Types** - Market, limit, stop-loss, take-profit, TWAP, and scale orders
- **Real-time Data** - Live orderbook, trades, and position updates via WebSocket
- **TradingView Charts** - Professional charting with full indicator support
- **Position Management** - Cross and isolated margin modes with configurable leverage
- **Multi-wallet Support** - MetaMask, WalletConnect, Coinbase, Rabby, and more
- **Mobile Responsive** - Full trading experience on mobile devices
- **Internationalization** - Multi-language support

## Tech Stack

- **React 19** with TypeScript
- **TanStack Router & Query** for routing and data fetching
- **Tailwind CSS v4** for styling
- **Wagmi v3** for wallet connections
- **Radix UI** for accessible components
- **Zustand** for state management
- **Big.js** for precise financial calculations

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/hypeterminal.git
cd hypeterminal

# Install dependencies
pnpm install

# Start development server
pnpm start
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
pnpm build
```

### Running Tests

```bash
pnpm test
```

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
pnpm lint      # Check for issues
pnpm format    # Format code
pnpm check     # Run all checks
```

## Project Structure

```
src/
├── components/       # React components
│   ├── trade/       # Trading UI (orderbook, chart, positions)
│   ├── ui/          # Reusable UI primitives
│   └── pages/       # Page-level components
├── lib/             # Utilities and business logic
│   ├── hyperliquid/ # Exchange SDK integration
│   ├── trade/       # Trading calculations
│   └── format.ts    # Number formatting
├── stores/          # Zustand state stores
├── hooks/           # Custom React hooks
├── routes/          # File-based routing
└── locales/         # i18n translations
```

## Contributing

We welcome contributions! Please follow these guidelines to ensure a smooth process.

### Getting Started

1. **Fork the repository** and clone your fork
2. **Create a branch** for your changes: `git checkout -b feat/your-feature`
3. **Make your changes** following our code style guidelines
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description

### Feature Requests

Have an idea for a new feature? We'd love to hear it!

1. **Check existing issues** to see if it's already been suggested
2. **Open a new issue** using the feature request template
3. **Describe the feature** clearly, including:
   - What problem does it solve?
   - How should it work?
   - Any implementation ideas?

### Bug Reports

Found a bug? Help us fix it!

1. **Search existing issues** to avoid duplicates
2. **Open a new issue** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment details
   - Screenshots if applicable

### Code Style Guidelines

- **One component per file** - No barrel exports (index.ts)
- **Use `interface Props`** - Not `type ComponentProps`
- **Use `clsx` via `cn()`** - For combining class names
- **Keep components clean** - Business logic goes in `lib/`
- **Minimize useEffect** - Prefer derived state and useMemo
- **No unnecessary comments** - Code should be self-documenting
- **No console.log** - Remove debug statements before committing

See `.claude/rules/code-style.md` for detailed guidelines.

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <subject>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `style` - Formatting changes
- `test` - Adding tests
- `build` - Build system changes
- `i18n` - Translations

**Examples:**
```
feat: add isolated margin mode
fix: correct leverage calculation
refactor: simplify order validation
```

**Rules:**
- Max 50 characters
- Lowercase, no period
- Imperative mood ("add" not "added")

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all checks pass** (`pnpm check`)
4. **Request review** from maintainers
5. **Address feedback** promptly

### Development Tips

- Use `pnpm start` for hot-reload development
- Check `.claude/rules/` for detailed coding guidelines
- Run `pnpm check` before committing
- Keep PRs focused and reasonably sized

## Number Handling

This project uses `big.js` for precise financial calculations. Always use utilities from `@/lib/trade/numbers`:

```tsx
import { parseNumber, calc, isPositive } from "@/lib/trade/numbers";

// Parse API values
const price = parseNumber(response.price);

// Calculations
const pnl = calc.pnl(entryPrice, exitPrice, size);

// Validation
if (isPositive(price)) {
  // Safe to use
}
```

See `.claude/rules/calculations.md` for details.

## Color System

This project uses a semantic color system with Tailwind CSS v4 and OKLch color format for perceptually uniform colors across light and dark modes.

### Semantic UI Colors

| Token | Purpose | Usage |
|-------|---------|-------|
| `bg` | Page background | Main app background |
| `fg` | Primary text | Body text, headings |
| `surface` | Elevated surfaces | Cards, panels, modals |
| `surface-fg` | Text on surfaces | Content inside cards |
| `primary` | Brand/main action | Primary buttons, links |
| `primary-fg` | Text on primary | Button labels |
| `secondary` | Secondary actions | Secondary buttons, tabs |
| `secondary-fg` | Text on secondary | Secondary button text |
| `muted` | Subdued elements | Disabled states, backgrounds |
| `muted-fg` | Subdued text | Placeholders, captions |
| `accent` | Highlights | Hover states, selections |
| `accent-fg` | Text on accent | Selected item text |
| `danger` | Danger actions | Delete buttons, errors |
| `danger-fg` | Text on danger | Delete button text |
| `border` | Borders | Dividers, input borders |
| `input` | Input backgrounds | Form field backgrounds |
| `ring` | Focus rings | Keyboard focus indicators |

### Trading Colors

| Token | Purpose | Usage |
|-------|---------|-------|
| `positive` | Long/buy/positive | Buy orders, profit, positive PnL |
| `negative` | Short/sell/negative | Sell orders, loss, negative PnL |
| `info` | Information/chart | Chart lines, info highlights |
| `warning` | Warning/caution | Warnings, pending states |
| `highlight` | Secondary accent | Special highlights, badges |

### Usage Examples

```tsx
// Tailwind classes
<span className="text-positive">+$1,234.56</span>
<span className="text-negative">-$567.89</span>
<button className="bg-primary text-primary-fg">Place Order</button>
<button className="bg-danger text-danger-fg">Cancel Order</button>
<div className="bg-surface border-border">Card content</div>

// Conditional styling
<span className={cn(
  "tabular-nums",
  pnl >= 0 ? "text-positive" : "text-negative"
)}>
  {formatUSD(pnl)}
</span>
```

### Color Naming Convention

Colors follow a **semantic naming** approach (describing purpose, not appearance):

| Pattern | Example | Description |
|---------|---------|-------------|
| `{role}` | `primary`, `muted` | Base color for a role |
| `{role}-fg` | `primary-fg` | Text color on that role |
| `signal` | `positive`, `negative`, `info`, `warning`, `highlight` | Trading-specific colors |

Colors are defined in `src/styles.css` and automatically adapt between light and dark modes.

## License

[MIT](LICENSE)

## Acknowledgments

- [Hyperliquid](https://hyperliquid.xyz) for the exchange protocol
- [TanStack](https://tanstack.com) for excellent React libraries
- [Radix UI](https://radix-ui.com) for accessible components
