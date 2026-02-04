---
name: icons
description: Find Phosphor icons for UI components
user_invocable: true
---

Use `@phosphor-icons/react` for all icons. Do NOT use `lucide-react`.

## Usage

All icons have an `Icon` suffix (e.g., `BellIcon`, `GearIcon`):

```tsx
import { BellIcon, GearIcon } from "@phosphor-icons/react";

<BellIcon size={20} weight="bold" />
<GearIcon className="size-4" />
```

## Weights

`thin`, `light`, `regular` (default), `bold`, `fill`, `duotone`

## Finding Icons

```bash
grep -i "<keyword>.*Icon" node_modules/@phosphor-icons/react/dist/index.d.ts
```

Browse: https://phosphoricons.com

## Instructions

1. Search the package for matching icon names using grep (all end with `Icon`)
2. Suggest the most appropriate Phosphor icon(s)
3. Show import and usage example with the `Icon` suffix
