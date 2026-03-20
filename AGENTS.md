# Repo Notes

## Base UI

- `src/components/ui` wraps Base UI primitives. Preserve the official Base UI anatomy and prop names unless there is a documented product-specific wrapper reason.
- Do not invent unsupported props or behaviors on shared primitives. If Base UI does not support a feature natively, do not fake it in the shared primitive by default.
- For sliders specifically:
  - Follow `Slider.Root > Slider.Control > Slider.Track > Slider.Indicator > Slider.Thumb`
  - Keep `Slider.Thumb` inside `Slider.Track`
  - Give every thumb an accessible name with `Slider.Label` or `aria-label`
  - Use array values and multiple thumbs only for real range sliders
  - Use the shared wrapper `thickness` prop for approved track-density variants instead of ad hoc per-screen height overrides
  - Do not add shared `marks`/dot APIs unless the implementation is explicitly documented and required
- Read [docs/design-system/base-ui-slider.md](/Users/ankit/Documents/make/hypeterminal-shadcn-native/docs/design-system/base-ui-slider.md) before changing the shared slider wrapper.
