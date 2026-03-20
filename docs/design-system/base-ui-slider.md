# Base UI Slider Notes

This repo uses `@base-ui/react/slider` for slider behavior.

## Official Anatomy

Use the documented structure:

```tsx
<Slider.Root>
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      <Slider.Thumb aria-label="..." />
    </Slider.Track>
  </Slider.Control>
</Slider.Root>
```

## Local Policy

- The shared wrapper lives at `src/components/ui/slider.tsx`.
- The shared wrapper is a single-thumb wrapper over `Slider.Root.Props<number>`.
- Pass a `thumbLabel` string so the nested thumb input always has an accessible name.
- Keep the wrapper close to Base UI. It should mainly provide styling and the required thumb label, not a parallel API.
- Use the wrapper `thickness` prop for approved visual density differences: `sm`, `md`, or `lg`.
- Do not add synthetic `marks`, tick dots, or label rows to the shared wrapper unless the product explicitly needs them and the behavior is documented here first.
- If a feature requires true range-slider behavior or custom visualization that does not map cleanly to the documented API, compose `@base-ui/react/slider` directly in feature code or create a dedicated feature wrapper.

## Usage in This Repo

```tsx
<Slider
  thumbLabel="Order size percentage"
  thickness="lg"
  value={value}
  onValueChange={setValue}
  min={0}
  max={100}
  step={0.1}
/>
```

## Guardrails

- Do not move `Slider.Thumb` outside `Slider.Track`.
- Do not force range semantics for single-value sliders.
- Do not replace Base UI event names such as `onValueCommitted` with custom aliases.
- Prefer Base UI defaults unless product behavior clearly requires an override.
