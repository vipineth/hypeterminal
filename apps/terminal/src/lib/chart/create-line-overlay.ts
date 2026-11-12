import Big from "big.js";
import { registerOverlay } from "klinecharts";
import { colorToHex, colorToRgba, getChartColors } from "./theme-colors";

interface LineOverlayStyle {
	lineAlpha: number;
}

interface ResolveInput {
	extendData: unknown;
}

interface Resolved {
	label: string;
	isBuy: boolean;
}

interface Config {
	name: string;
	style: LineOverlayStyle;
	resolve: (input: ResolveInput) => Resolved;
}

export function createLineOverlay({ name, style, resolve }: Config): () => void {
	let registered = false;

	return function register() {
		if (registered) return;
		registered = true;

		registerOverlay({
			name,
			needDefaultPointFigure: false,
			needDefaultXAxisFigure: false,
			needDefaultYAxisFigure: false,
			totalStep: 1,
			lock: true,
			zLevel: -1,
			createPointFigures: ({ chart, overlay, coordinates, bounding }) => {
				const y = coordinates[0]?.y;
				if (y === undefined) return [];

				const { label, isBuy } = resolve({ extendData: overlay.extendData });

				const colors = getChartColors();
				const marketColor = isBuy ? colors.green : colors.red;
				const color = colorToHex(marketColor);
				const lineColor = colorToRgba(marketColor, style.lineAlpha);
				const bgColor = colorToHex(colors.background);

				const rawPrice = overlay.points[0]?.value;
				const priceText = rawPrice != null ? Big(rawPrice).toFixed(chart.getSymbol()?.pricePrecision ?? 2) : "";

				const badgeX = bounding.width - 110;
				const priceX = bounding.width - 4;

				return [
					{
						type: "line",
						attrs: {
							coordinates: [
								{ x: 0, y },
								{ x: bounding.width, y },
							],
						},
						styles: { style: "dashed" as const, color: lineColor, size: 1, dashedValue: [4, 3] },
						ignoreEvent: true,
					},
					{
						type: "text",
						attrs: { x: badgeX, y, text: label, align: "center", baseline: "middle" },
						styles: {
							color,
							size: 10,
							paddingLeft: 4,
							paddingRight: 4,
							paddingTop: 2,
							paddingBottom: 2,
							backgroundColor: bgColor,
							borderColor: "transparent",
							borderSize: 0,
							style: "fill" as const,
						},
						ignoreEvent: true,
					},
					{
						type: "text",
						attrs: { x: priceX, y, text: priceText, align: "right", baseline: "middle" },
						styles: {
							color,
							size: 10,
							paddingLeft: 4,
							paddingRight: 4,
							paddingTop: 2,
							paddingBottom: 2,
							backgroundColor: bgColor,
							borderColor: "transparent",
							borderSize: 0,
							style: "fill" as const,
						},
						ignoreEvent: true,
					},
				];
			},
		});
	};
}
