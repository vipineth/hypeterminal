# Chart engine and intervals

The chart renders with klinecharts (`Default`) or the vendored TradingView library (`TradingView`), with interval and chart-type controls.

## Sub-features

- `engine-toggle` switches between `Default` and `TradingView`.
- `intervals` switches between `1m`, `5m`, `1h`, `4h`, `1D` and `More intervals`.
- `chart-type` picks candles or other series from `Chart type`.

## How to get to it (user POV)

- Use the toolbar above the chart on desktop `/perp`.

## Driving it with agent-browser

- **Default engine.** Open `/perp`. The `Default` button is active and the toolbar shows `1m 5m 1h 4h 1D`.
- **Interval.** `ab find role button click --name "4h"`, then `ab wait 2000`. The OHLC legend timestamps step by 4 hours.
- **TradingView.** `ab find text "TradingView" click`, then `ab wait 6000`. The chart toolbar changes to `Indicators` and a drawing-tool rail appears on the left. `ab eval '[...performance.getEntriesByType("resource")].filter(r=>/charting_library\.|tradingview-theme/.test(r.name)).map(r=>r.name.split("/").pop()+" "+r.responseStatus)'` lists `charting_library.js 200` and `tradingview-theme.css 200`.
- **Proof.** Capture evidence on `Default` and on `TradingView`. The chart is a canvas, so the screenshot is the visual proof and the snapshot only proves the toolbar.

## Gotchas

- Both engines draw to canvas or iframe. Snapshots and DOM text cannot see candles. Rely on screenshots and the toolbar state.
- TradingView loads about 22 MB from `public/charting_library`. Allow the full 6000 ms after toggling.
- The mobile chart view uses klinecharts only and has no TradingView toggle.
