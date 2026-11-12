# HypeTerminal

An open-source trading terminal for [Hyperliquid](https://hyperliquid.xyz): perps, spot and builder-deployed perp DEXes, with real-time market data and agent-wallet signing.

**Live:** [app.hypeterminal.com](https://app.hypeterminal.com) · **About:** [hypeterminal.com](https://hypeterminal.com)

## Layout

```
apps/terminal      trading app (TanStack Start + Vite + SSR, React 19)
apps/website       marketing site (Astro)
packages/hl-react  @hypeterminal/hl-react: React bindings for Hyperliquid (transports, useInfo / useSub / useExchange, agent wallets)
packages/ui        @hypeterminal/ui: design system (Base UI + Tailwind v4 + CVA)
.claude/rules      coding conventions
```

`hl-react` and `ui` ship source (`"main": "./src/index.ts"`), so there is no package build step.

## Quick start

Node 22.19+ and pnpm.

```bash
pnpm install
cp apps/terminal/.env.example apps/terminal/.env
pnpm dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Trading app dev server |
| `pnpm build` | Lingui compile + Vite production build |
| `pnpm serve` | Preview the built app |
| `pnpm build:website` | Build the marketing site |
| `pnpm typecheck` | `tsc` across packages |
| `pnpm lint` / `format` / `check` / `fix` | Biome |
| `pnpm i18n:extract` / `i18n:compile` | Lingui catalogs |

## License

[MIT](LICENSE)
