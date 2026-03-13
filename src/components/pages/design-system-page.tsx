import type { CSSProperties } from "react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const swatches = [
	{ label: "Background", token: "--background", foreground: "var(--foreground)" },
	{ label: "Foreground", token: "--foreground", foreground: "var(--background)" },
	{ label: "Primary", token: "--primary", foreground: "var(--primary-foreground)" },
	{ label: "Secondary", token: "--secondary", foreground: "var(--secondary-foreground)" },
	{ label: "Muted", token: "--muted", foreground: "var(--muted-foreground)" },
	{ label: "Accent", token: "--accent", foreground: "var(--accent-foreground)" },
	{ label: "Destructive", token: "--destructive", foreground: "var(--destructive-foreground)" },
	{ label: "Border", token: "--border", foreground: "var(--foreground)" },
] satisfies Array<{ label: string; token: string; foreground: string }>;

const chartTokens = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] as const;

function swatchStyle(token: string, foreground: string): CSSProperties {
	return {
		backgroundColor: `var(${token})`,
		color: foreground,
	};
}

export function DesignSystemPage() {
	const marketInputId = useId();
	const sizeInputId = useId();
	const confirmCheckboxId = useId();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
				<header className="space-y-3">
					<Badge variant="secondary">Shadcn Native Baseline</Badge>
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight">Design System</h1>
						<p className="max-w-3xl text-sm text-muted-foreground">
							Native shadcn primitives, Practical UI color values, and no custom primitive APIs.
						</p>
					</div>
				</header>

				<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
					<Card>
						<CardHeader>
							<CardTitle>Semantic Colors</CardTitle>
							<CardDescription>
								These swatches come directly from the theme variables in <code>src/styles.css</code>.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{swatches.map((swatch) => (
								<div
									key={swatch.token}
									className="rounded-xl border border-border p-3 shadow-sm"
									style={swatchStyle(swatch.token, swatch.foreground)}
								>
									<div className="space-y-1">
										<p className="text-sm font-medium">{swatch.label}</p>
										<p className="text-xs opacity-80">{swatch.token}</p>
									</div>
								</div>
							))}
							<div className="rounded-xl border border-border bg-card p-3 sm:col-span-2 xl:col-span-4">
								<p className="mb-3 text-sm font-medium">Chart Palette</p>
								<div className="grid grid-cols-5 gap-2">
									{chartTokens.map((token) => (
										<div key={token} className="space-y-2">
											<div
												className="h-12 rounded-lg border border-border"
												style={{ backgroundColor: `var(${token})` }}
											/>
											<p className="text-xs text-muted-foreground">{token}</p>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Accent Usage</CardTitle>
							<CardDescription>Accent stays subtle. Primary carries the main action state.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-xl border border-border bg-accent p-4 text-accent-foreground">
								<p className="text-sm font-medium">Accent surface</p>
								<p className="mt-1 text-sm opacity-80">
									Use for hover, selection, and soft emphasis. Do not use it as the main CTA fill.
								</p>
							</div>
							<div className="grid gap-2">
								<Button>Primary Action</Button>
								<div className="grid grid-cols-2 gap-2">
									<Button variant="secondary">Secondary</Button>
									<Button variant="outline">Outline</Button>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button variant="ghost">Ghost</Button>
									<Button variant="destructive">Destructive</Button>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge>Primary</Badge>
								<Badge variant="secondary">Secondary</Badge>
								<Badge variant="outline">Outline</Badge>
								<Badge variant="destructive">Risk</Badge>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
					<Card>
						<CardHeader>
							<CardTitle>Form Controls</CardTitle>
							<CardDescription>Use native shadcn primitives directly in straightforward forms.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={marketInputId}>Market</Label>
								<Input id={marketInputId} placeholder="BTC-USD" />
							</div>
							<div className="space-y-2">
								<Label htmlFor={sizeInputId}>Order Size</Label>
								<Input id={sizeInputId} inputMode="decimal" placeholder="0.01" />
							</div>
							<div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
								<div className="space-y-1">
									<p className="text-sm font-medium">Reduce only</p>
									<p className="text-xs text-muted-foreground">Example of a native switch row.</p>
								</div>
								<Switch defaultChecked />
							</div>
							<div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
								<Checkbox defaultChecked id={confirmCheckboxId} />
								<Label htmlFor={confirmCheckboxId}>Require confirmation before submit</Label>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Patterns</CardTitle>
							<CardDescription>
								Use wrappers later for repeated product patterns, not by extending primitives.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="overview">
								<TabsList variant="line">
									<TabsTrigger value="overview">Overview</TabsTrigger>
									<TabsTrigger value="table">Table</TabsTrigger>
								</TabsList>
								<TabsContent value="overview" className="pt-4">
									<div className="grid gap-3 md:grid-cols-3">
										<div className="rounded-xl border border-border bg-card p-4">
											<p className="text-sm text-muted-foreground">Account Value</p>
											<p className="mt-2 text-2xl font-semibold">$24,182.40</p>
										</div>
										<div className="rounded-xl border border-border bg-card p-4">
											<p className="text-sm text-muted-foreground">Open PnL</p>
											<p className="mt-2 text-2xl font-semibold text-primary">+$1,284.22</p>
										</div>
										<div className="rounded-xl border border-border bg-card p-4">
											<p className="text-sm text-muted-foreground">Margin Used</p>
											<p className="mt-2 text-2xl font-semibold">38.2%</p>
										</div>
									</div>
								</TabsContent>
								<TabsContent value="table" className="pt-4">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Market</TableHead>
												<TableHead>Side</TableHead>
												<TableHead className="text-right">Price</TableHead>
												<TableHead className="text-right">Size</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											<TableRow>
												<TableCell>BTC</TableCell>
												<TableCell>
													<Badge>Buy</Badge>
												</TableCell>
												<TableCell className="text-right">$88,140.12</TableCell>
												<TableCell className="text-right">0.012</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>ETH</TableCell>
												<TableCell>
													<Badge variant="secondary">Sell</Badge>
												</TableCell>
												<TableCell className="text-right">$3,426.80</TableCell>
												<TableCell className="text-right">0.450</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
