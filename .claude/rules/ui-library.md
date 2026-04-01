## HyperTerminal UI (`@hypeterminal/ui`)

The design system lives in `packages/ui/` as a workspace package.

### Rules

1. **`packages/ui/src/` is the design system** — Only design system primitives belong here
2. **No app-specific components in packages/ui** — App components go in `apps/terminal/src/components/`
3. **Use className overrides** — For project-specific styling, override at the usage site: `<Button className="custom-class">`
4. **Use `styles.css` for tokens** — App-level token changes go in `src/styles.css`, not in the package
5. **Create wrappers when needed** — If you need a specialized component, create a wrapper in `src/components/ui/` that composes the UI primitive

### Import convention
```tsx
// Correct — import from the UI package
import { Button, Modal, Tabs } from "@hypeterminal/ui";

// Correct — app-specific component that composes UI primitives
import { InfoRow } from "@/components/ui/info-row";

// Wrong — old vendored path (deleted)
// import { Button } from "@/anvil";
```
