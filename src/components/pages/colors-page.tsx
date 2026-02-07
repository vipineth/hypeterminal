import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/providers/theme";

type ColorDef = { name: string; light: string; dark: string; usage: string };

const COLOR_GROUPS: { label: string; description: string; colors: ColorDef[] }[] = [
	{
		label: "Foreground",
		description: "Ink intensity — higher = more prominent",
		colors: [
			{ name: "fg-100", light: "#E2E5E9", dark: "#2A3040", usage: "Barely visible" },
			{ name: "fg-200", light: "#CCD1D7", dark: "#3A4150", usage: "Very faint" },
			{ name: "fg-300", light: "#B3B8BF", dark: "#4E5563", usage: "Disabled" },
			{ name: "fg-400", light: "#8B939D", dark: "#6A7280", usage: "Placeholder" },
			{ name: "fg-500", light: "#727B87", dark: "#7F8896", usage: "Tertiary text" },
			{ name: "fg-600", light: "#6B7380", dark: "#939BAA", usage: "Between secondary/tertiary" },
			{ name: "fg-700", light: "#5A6370", dark: "#A9B0BC", usage: "Secondary text" },
			{ name: "fg-800", light: "#3D4255", dark: "#CDD2DC", usage: "Between primary/secondary" },
			{ name: "fg-900", light: "#2B2E48", dark: "#E6E9EF", usage: "Primary text" },
			{ name: "fg-950", light: "#111827", dark: "#F4F5F7", usage: "Max contrast" },
		],
	},
	{
		label: "Surface",
		description: "Elevation scale — higher = more elevated",
		colors: [
			{ name: "surface-100", light: "#EDF0F1", dark: "#090A0B", usage: "Sunken/inset" },
			{ name: "surface-200", light: "#F1F3F4", dark: "#0D0F11", usage: "Page background" },
			{ name: "surface-300", light: "#F5F6F7", dark: "#111417", usage: "Subtle elevation" },
			{ name: "surface-400", light: "#F9FAFA", dark: "#15181D", usage: "Between base & panels" },
			{ name: "surface-500", light: "#FDFDFD", dark: "#191D23", usage: "Panels" },
			{ name: "surface-600", light: "#FEFEFE", dark: "#1D2229", usage: "Between panels & elevated" },
			{ name: "surface-700", light: "#FEFEFE", dark: "#222730", usage: "Near elevated" },
			{ name: "surface-800", light: "#FFFFFF", dark: "#262C36", usage: "Cards/execution" },
			{ name: "surface-900", light: "#FFFFFF", dark: "#2A313C", usage: "Most elevated" },
			{ name: "surface-alt", light: "#F9F9FA", dark: "#262C36", usage: "Alternating rows, pills" },
		],
	},
	{
		label: "Action",
		description: "Interactive elements",
		colors: [
			{ name: "action-primary", light: "#2563EB", dark: "#4F7DFF", usage: "Default" },
			{ name: "action-primary-hover", light: "#1D4ED8", dark: "#3B6CF6", usage: "Hover" },
			{ name: "action-primary-active", light: "#1E40AF", dark: "#2F5CE0", usage: "Active/pressed" },
			{ name: "action-primary-disabled", light: "#A5B4FC", dark: "#2A3A5F", usage: "Disabled" },
		],
	},
	{
		label: "Market",
		description: "Trading data — PnL, prices, percentages",
		colors: [
			{ name: "market-up-primary", light: "#056E05", dark: "#4CAF6A", usage: "Positive primary" },
			{ name: "market-up-muted", light: "#4FA14F", dark: "#2E8B4F", usage: "Positive muted" },
			{ name: "market-up-subtle", light: "#E6F4E6", dark: "#123524", usage: "Positive background" },
			{ name: "market-down-primary", light: "#C8241B", dark: "#E26D63", usage: "Negative primary" },
			{ name: "market-down-muted", light: "#E06A63", dark: "#C94B44", usage: "Negative muted" },
			{ name: "market-down-subtle", light: "#FCE9E8", dark: "#3A1C1C", usage: "Negative background" },
			{ name: "market-neutral", light: "#8A919A", dark: "#9AA4B2", usage: "Neutral/unchanged" },
		],
	},
	{
		label: "Status",
		description: "System feedback",
		colors: [
			{ name: "status-success", light: "#1F7A3F", dark: "#4CAF6A", usage: "Success" },
			{ name: "status-success-subtle", light: "#E4F3EA", dark: "#123524", usage: "Success background" },
			{ name: "status-warning", light: "#FFAD0D", dark: "#FFAD0D", usage: "Warning" },
			{ name: "status-warning-subtle", light: "#FFF3D6", dark: "#4A3A12", usage: "Warning background" },
			{ name: "status-error", light: "#A63A2B", dark: "#E26D63", usage: "Error" },
			{ name: "status-error-subtle", light: "#FBEAE7", dark: "#3A1C1C", usage: "Error background" },
			{ name: "status-info", light: "#2563EB", dark: "#4F7DFF", usage: "Info" },
			{ name: "status-info-subtle", light: "#EAF0FF", dark: "#1B2A4A", usage: "Info background" },
		],
	},
	{
		label: "Structural",
		description: "Borders, inputs, focus rings",
		colors: [
			{ name: "border", light: "#CFD9E1", dark: "#2D3748", usage: "Default border" },
			{ name: "input", light: "#F1F3F4", dark: "#1A1F28", usage: "Input background" },
			{ name: "ring", light: "#2563EB", dark: "#4F7DFF", usage: "Focus ring" },
			{ name: "sel", light: "rgba(37,99,235,0.15)", dark: "rgba(79,125,255,0.15)", usage: "Selection highlight" },
			{ name: "highlight", light: "#F7931A", dark: "#F7931A", usage: "Accent highlight" },
		],
	},
];

const LIGHT_BG = "#F1F3F4";
const LIGHT_FG = "#2B2E48";
const LIGHT_FG_SUB = "#6B7380";
const LIGHT_BORDER = "#CFD9E1";
const DARK_BG = "#0D0F11";
const DARK_FG = "#E6E9EF";
const DARK_FG_SUB = "#939BAA";
const DARK_BORDER = "#2D3748";

type ViewMode = "both" | "light" | "dark";

function ColorRow({ color }: { color: ColorDef }) {
	return (
		<div className="flex items-center gap-4 py-2">
			<div className="w-36 shrink-0 sm:w-44">
				<span className="text-xs font-medium text-fg-900">{color.name}</span>
				<p className="text-3xs text-fg-500">{color.usage}</p>
			</div>
			<div className="flex flex-1 overflow-hidden rounded-xs" style={{ border: `1px solid ${LIGHT_BORDER}` }}>
				<div className="flex flex-1 items-center gap-2.5 px-3 py-2" style={{ backgroundColor: LIGHT_BG }}>
					<div
						className="size-7 shrink-0 rounded-xs"
						style={{ backgroundColor: color.light, border: `1px solid ${LIGHT_BORDER}` }}
					/>
					<span className="text-3xs font-mono" style={{ color: LIGHT_FG_SUB }}>
						{color.light}
					</span>
				</div>
				<div
					className="flex flex-1 items-center gap-2.5 px-3 py-2"
					style={{ backgroundColor: DARK_BG, borderLeft: `1px solid ${DARK_BORDER}` }}
				>
					<div
						className="size-7 shrink-0 rounded-xs"
						style={{ backgroundColor: color.dark, border: `1px solid ${DARK_BORDER}` }}
					/>
					<span className="text-3xs font-mono" style={{ color: DARK_FG_SUB }}>
						{color.dark}
					</span>
				</div>
			</div>
		</div>
	);
}

function ColorRowSingle({ color, mode }: { color: ColorDef; mode: "light" | "dark" }) {
	const isLight = mode === "light";
	const hex = isLight ? color.light : color.dark;

	return (
		<div className="flex items-center gap-4 py-2">
			<div className="w-36 shrink-0 sm:w-44">
				<span className="text-xs font-medium text-fg-900">{color.name}</span>
				<p className="text-3xs text-fg-500">{color.usage}</p>
			</div>
			<div
				className="flex flex-1 items-center gap-2.5 overflow-hidden rounded-xs px-3 py-2"
				style={{
					backgroundColor: isLight ? LIGHT_BG : DARK_BG,
					border: `1px solid ${isLight ? LIGHT_BORDER : DARK_BORDER}`,
				}}
			>
				<div
					className="size-7 shrink-0 rounded-xs"
					style={{ backgroundColor: hex, border: `1px solid ${isLight ? LIGHT_BORDER : DARK_BORDER}` }}
				/>
				<span className="text-3xs font-mono" style={{ color: isLight ? LIGHT_FG_SUB : DARK_FG_SUB }}>
					{hex}
				</span>
			</div>
		</div>
	);
}

export function ColorsPage() {
	const { theme, setTheme } = useTheme();
	const [view, setView] = useState<ViewMode>("both");

	const isDark =
		theme === "dark" ||
		(theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	function handleThemeToggle() {
		setTheme(isDark ? "light" : "dark");
	}

	return (
		<div className="min-h-screen bg-surface-200 text-fg-900 p-6 md:p-10">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-base font-semibold text-fg-950">Design Tokens</h1>
						<p className="text-xs text-fg-700">All color tokens — light and dark side by side.</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex rounded-xs bg-surface-alt p-0.5 text-3xs">
							{(["both", "light", "dark"] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setView(v)}
									className={cn(
										"px-2.5 py-1 rounded-xs capitalize transition-colors",
										view === v ? "bg-surface-800 text-fg-950 font-semibold" : "text-fg-800 hover:text-fg-950",
									)}
								>
									{v}
								</button>
							))}
						</div>
						<button
							type="button"
							onClick={handleThemeToggle}
							className="flex items-center gap-1.5 rounded-xs bg-surface-alt px-2.5 py-1 text-3xs text-fg-800 transition-colors hover:text-fg-950"
						>
							{isDark ? <SunIcon className="size-3" /> : <MoonIcon className="size-3" />}
							{isDark ? "Light" : "Dark"}
						</button>
					</div>
				</div>

				{view === "both" && (
					<div className="flex gap-4 text-3xs font-semibold uppercase tracking-wider text-fg-600">
						<div className="w-36 shrink-0 sm:w-44" />
						<div className="flex flex-1 overflow-hidden">
							<div className="flex flex-1 items-center gap-1.5 px-3">
								<SunIcon className="size-3" />
								Light
							</div>
							<div className="flex flex-1 items-center gap-1.5 px-3">
								<MoonIcon className="size-3" />
								Dark
							</div>
						</div>
					</div>
				)}

				{COLOR_GROUPS.map((group) => (
					<section key={group.label}>
						<div className="mb-2">
							<h2 className="text-sm font-semibold text-fg-950">{group.label}</h2>
							<p className="text-3xs text-fg-600">{group.description}</p>
						</div>
						<div className="divide-y divide-border/50">
							{group.colors.map((color) =>
								view === "both" ? (
									<ColorRow key={color.name} color={color} />
								) : (
									<ColorRowSingle key={color.name} color={color} mode={view} />
								),
							)}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
