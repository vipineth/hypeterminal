import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { buildPageHead } from "@/lib/seo";
import { colorThemes, useTheme } from "@/providers/theme";

export const Route = createFileRoute("/design/tokens")({
	head: () =>
		buildPageHead({
			title: "Design Tokens",
			description: "Live CSS variable values for all themes",
			path: "/design/tokens",
		}),
	component: TokensPage,
});

type TokenGroup = {
	name: string;
	description: string;
	tokens: TokenDef[];
};

type TokenDef = {
	name: string;
	variable: string;
	description: string;
	fgVariable?: string;
};

const tokenGroups: TokenGroup[] = [
	{
		name: "Core UI",
		description: "Primary interface colors and surfaces",
		tokens: [
			{ name: "Background", variable: "--bg", description: "Base page background", fgVariable: "--fg" },
			{ name: "Foreground", variable: "--fg", description: "Base text color" },
			{ name: "Surface", variable: "--surface", description: "Elevated panels/cards", fgVariable: "--surface-fg" },
			{ name: "Surface Foreground", variable: "--surface-fg", description: "Text on surfaces" },
			{ name: "Primary", variable: "--primary", description: "Primary actions/CTAs", fgVariable: "--primary-fg" },
			{ name: "Primary Foreground", variable: "--primary-fg", description: "Text on primary" },
			{
				name: "Secondary",
				variable: "--secondary",
				description: "Secondary actions",
				fgVariable: "--secondary-fg",
			},
			{ name: "Secondary Foreground", variable: "--secondary-fg", description: "Text on secondary" },
			{ name: "Muted", variable: "--muted", description: "Muted backgrounds", fgVariable: "--muted-fg" },
			{ name: "Muted Foreground", variable: "--muted-fg", description: "Muted text" },
			{ name: "Accent", variable: "--accent", description: "Accent highlights", fgVariable: "--accent-fg" },
			{ name: "Accent Foreground", variable: "--accent-fg", description: "Text on accent" },
			{ name: "Danger", variable: "--danger", description: "Destructive actions", fgVariable: "--danger-fg" },
			{ name: "Danger Foreground", variable: "--danger-fg", description: "Text on danger" },
		],
	},
	{
		name: "Inputs & Borders",
		description: "Form elements and structural colors",
		tokens: [
			{ name: "Border", variable: "--border", description: "Border color" },
			{ name: "Input", variable: "--input", description: "Input background" },
			{ name: "Ring", variable: "--ring", description: "Focus ring color" },
			{ name: "Selection", variable: "--sel", description: "Text selection background" },
		],
	},
	{
		name: "Signals",
		description: "Trading and status semantics",
		tokens: [
			{ name: "Positive", variable: "--positive", description: "Gains, buy orders, upward movement" },
			{ name: "Negative", variable: "--negative", description: "Losses, sell orders, downward movement" },
			{ name: "Info", variable: "--info", description: "Informational highlights" },
			{ name: "Warning", variable: "--warning", description: "Warning states" },
			{ name: "Highlight", variable: "--highlight", description: "Special highlights" },
		],
	},
];

function getComputedValue(variable: string): string {
	if (typeof window === "undefined") return "";
	const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
	return value || "undefined";
}

function getContrastRatio(fg: string, bg: string): number {
	if (typeof window === "undefined") return 0;

	const getLuminance = (color: string): number => {
		const rgb = color.match(/[\d.]+/g);
		if (!rgb || rgb.length < 3) return 0;

		const [r, g, b] = rgb.map((val) => {
			const num = Number.parseFloat(val) / 255;
			return num <= 0.03928 ? num / 12.92 : ((num + 0.055) / 1.055) ** 2.4;
		});

		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return 0;

	canvas.width = 1;
	canvas.height = 1;

	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, 1, 1);
	const bgData = ctx.getImageData(0, 0, 1, 1).data;

	ctx.fillStyle = fg;
	ctx.fillRect(0, 0, 1, 1);
	const fgData = ctx.getImageData(0, 0, 1, 1).data;

	const bgLum = getLuminance(`rgb(${bgData[0]}, ${bgData[1]}, ${bgData[2]})`);
	const fgLum = getLuminance(`rgb(${fgData[0]}, ${fgData[1]}, ${fgData[2]})`);

	const lighter = Math.max(bgLum, fgLum);
	const darker = Math.min(bgLum, fgLum);

	return (lighter + 0.05) / (darker + 0.05);
}

function TokenRow({ token }: { token: TokenDef }) {
	const [computedValue, setComputedValue] = useState("");
	const [contrast, setContrast] = useState<number | null>(null);

	useEffect(() => {
		const value = getComputedValue(token.variable);
		setComputedValue(value);

		if (token.fgVariable) {
			const fgValue = getComputedValue(token.fgVariable);
			const ratio = getContrastRatio(fgValue, value);
			setContrast(ratio);
		}
	}, [token.variable, token.fgVariable]);

	const contrastLevel = contrast
		? contrast >= 7
			? "AAA"
			: contrast >= 4.5
				? "AA"
				: "Fail"
		: null;

	return (
		<div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-border/40 py-2 text-2xs last:border-0">
			<div>
				<div className="font-medium text-fg">{token.name}</div>
				<div className="text-muted-fg">{token.description}</div>
			</div>
			<div className="font-mono text-3xs text-muted-fg">{token.variable}</div>
			<div className="flex items-center gap-2">
				<div className="size-6 rounded-sm border border-border shadow-xs" style={{ backgroundColor: computedValue }} />
				<code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-3xs text-muted-fg">{computedValue}</code>
			</div>
			<div className="text-right">
				{contrastLevel && (
					<span
						className={cn(
							"rounded-sm px-1.5 py-0.5 font-mono text-3xs font-medium",
							contrastLevel === "AAA" && "bg-positive/20 text-positive",
							contrastLevel === "AA" && "bg-info/20 text-info",
							contrastLevel === "Fail" && "bg-negative/20 text-negative",
						)}
					>
						{contrastLevel} {contrast && `(${contrast.toFixed(2)})`}
					</span>
				)}
			</div>
		</div>
	);
}

function TokensPage() {
	const { theme, setTheme, colorTheme, setColorTheme } = useTheme();

	return (
		<div className="min-h-screen bg-bg p-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-2xl font-semibold text-fg">Design Tokens</h1>
						<p className="text-sm text-muted-fg">
							Live computed CSS variable values for the active theme
						</p>
					</div>
					<Link to="/design">
						<Button variant="outline" size="sm">
							Back
						</Button>
					</Link>
				</header>

				<Card>
					<CardHeader>
						<CardTitle>Theme Controls</CardTitle>
						<CardDescription>Switch themes to see live token updates</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="text-xs font-medium text-fg">Light/Dark Mode</label>
							<div className="flex gap-2">
								<Button
									variant={theme === "light" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("light")}
								>
									Light
								</Button>
								<Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
									Dark
								</Button>
								<Button
									variant={theme === "system" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("system")}
								>
									System
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-medium text-fg">Color Theme</label>
							<div className="flex gap-2">
								{colorThemes.map((ct) => (
									<Button
										key={ct.id}
										variant={colorTheme === ct.id ? "default" : "outline"}
										size="sm"
										onClick={() => setColorTheme(ct.id)}
									>
										{ct.name}
									</Button>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{tokenGroups.map((group) => (
					<Card key={group.name}>
						<CardHeader>
							<CardTitle>{group.name}</CardTitle>
							<CardDescription>{group.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-0">
								{group.tokens.map((token) => (
									<TokenRow key={token.variable} token={token} />
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
