# Theme and responsive layout

The app has a dark and a light theme, plus separate desktop and mobile layouts chosen by viewport width.

## Sub-features

- `theme-toggle` switches dark and light from the top nav. The choice persists.
- `settings` opens the settings dialog from `Settings`.
- `mobile-layout` renders the mobile terminal at phone widths.

## How to get to it (user POV)

- Click the sun or moon icon in the top nav.
- Click the gear icon (`Settings`).
- Open the app on a phone.

## Driving it with agent-browser

- **Theme.** `ab find role button click --name "Switch to light mode"`. The button's name flips to `Switch to dark mode` and the page background turns light. Reload with `ab reload` and `ab wait 6000`. The light theme persists.
- **Settings.** `ab find role button click --name "Settings"`. A dialog opens. Capture evidence and close it with `ab press Escape`.
- **Mobile.** `ab set viewport 390 844`, `ab open http://localhost:4320/perp`, `ab wait 6000`, then `ab snapshot -i` to read the mobile handles. Capture evidence. The desktop order book and positions panel are absent, and the mobile navigation is present.
- **Proof.** Capture evidence in both themes and at both viewports.

## Gotchas

- Mobile accessible names are not mapped here yet. Read them from a fresh snapshot and add them to this file via `/maintain-verification-skill`.
- The theme persists in localStorage. Switch back to dark before ending a run that other recipes reuse.
