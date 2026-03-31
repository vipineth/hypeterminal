## Anvil Component Library — Read-Only

The `src/anvil/` directory is a **vendored copy** of the design system from the upstream repo at `/Users/ankit/Documents/make/practical-ui-design-system`.

### Rules

1. **Never modify files in `src/anvil/`** — Treat them as read-only third-party code
2. **Make upstream changes first** — If a component needs a fix, variant, or new prop, change it in `practical-ui-design-system` and sync
3. **Use className overrides** — For project-specific styling, override at the usage site: `<Button className="custom-class">`
4. **Use `styles.css` for tokens** — Theme/token changes go in `src/styles.css`, not in anvil component files
5. **Create wrappers when needed** — If you need a specialized version of an anvil component, create a wrapper in `src/components/ui/` that composes the anvil primitive

### Import convention
```tsx
// Correct — import from anvil
import { Button, Modal, Tabs } from "@/anvil";

// Correct — project wrapper that composes anvil
import { NumberInput } from "@/components/ui/number-input";

// Wrong — never import from old radix-based components (deleted)
// import { Button } from "@/components/ui/button";
```
