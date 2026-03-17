# Component Policy

## Native Layer

These stay stock shadcn:

- `Button`
- `Input`
- `Textarea`
- `Label`
- `Card`
- `Badge`
- `Tabs`
- `Dialog`
- `Sheet`
- `DropdownMenu`
- `Tooltip`
- `Table`
- `Select`
- `Checkbox`
- `Switch`
- `Command`

Do not add custom props like `tone`, `contained`, `outlined`, `text`, `underline`, or app-specific sizes to those files.
Do not add unsupported pseudo-APIs to Base UI wrappers in `src/components/ui`; keep them aligned with the underlying primitive docs.

## App Layer

Product-specific behavior belongs outside `src/components/ui`.

Examples:

- `NumberInput`
- chart wrappers
- virtualized tables
- trading ticket sections
- settings sections
- metric panels

If a pattern is repeated and product-specific, wrap native shadcn primitives instead of extending them.
