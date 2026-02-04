---
name: icons
description: Find Phosphor icons for UI components
user_invocable: true
---

Use `@phosphor-icons/react` for all icons. Do NOT use `lucide-react`.

## Usage

```tsx
import { Bell, Gear } from "@phosphor-icons/react";

<Bell size={20} weight="bold" />
```

## Weights

`thin`, `light`, `regular` (default), `bold`, `fill`, `duotone`

## Finding Icons

```bash
grep -i "<keyword>" node_modules/@phosphor-icons/react/dist/index.d.ts
```

Browse: https://phosphoricons.com

## Instructions

1. Search the package for matching icon names using grep
2. Suggest the most appropriate Phosphor icon(s)
3. Show import and usage example
