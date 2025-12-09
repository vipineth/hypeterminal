import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Moon, Sun, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTheme } from "@/providers/theme";

export const Route = createFileRoute("/components")({
	component: ComponentShowcase,
});

function CodeBlock({ code, className = "" }: { code: string; className?: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`relative group ${className}`}>
			<pre className="bg-muted/50 border border-border/40 rounded-sm px-3 py-2 text-2xs font-mono overflow-x-auto">
				<code>{code}</code>
			</pre>
			<button
				type="button"
				onClick={handleCopy}
				className="absolute top-1.5 right-1.5 size-6 flex items-center justify-center rounded-sm bg-background/80 border border-border/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
				aria-label="Copy code"
			>
				{copied ? (
					<Check className="size-3 text-terminal-green" />
				) : (
					<Copy className="size-3 text-muted-foreground" />
				)}
			</button>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="space-y-3">
			<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
				{title}
			</h2>
			<div className="space-y-4">{children}</div>
		</div>
	);
}

function ComponentRow({ 
	label, 
	code, 
	children 
}: { 
	label: string; 
	code: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-4">
				<span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
				<div className="flex flex-wrap items-center gap-2">{children}</div>
			</div>
			<CodeBlock code={code} className="ml-28" />
		</div>
	);
}

function ComponentShowcase() {
	const { theme, setTheme } = useTheme();
	const [inputValue, setInputValue] = useState("");

	const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	return (
		<div className="min-h-screen bg-background text-foreground p-6">
			<div className="max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold">Component Showcase</h1>
						<p className="text-sm text-muted-foreground">Hover over code blocks to copy</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setTheme(isDark ? "light" : "dark")}
					>
						{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
						<span>{isDark ? "Light" : "Dark"}</span>
					</Button>
				</div>

				{/* Button */}
				<Section title="Button">
					<ComponentRow 
						label="Variants" 
						code={`<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`}
					>
						<Button variant="default" size="sm">Default</Button>
						<Button variant="secondary" size="sm">Secondary</Button>
						<Button variant="outline" size="sm">Outline</Button>
						<Button variant="ghost" size="sm">Ghost</Button>
						<Button variant="destructive" size="sm">Destructive</Button>
					</ComponentRow>

					<ComponentRow 
						label="Trading" 
						code={`<Button variant="long">Long</Button>
<Button variant="short">Short</Button>
<Button variant="terminal">Terminal</Button>`}
					>
						<Button variant="long" size="sm">Long</Button>
						<Button variant="short" size="sm">Short</Button>
						<Button variant="terminal" size="sm">Terminal</Button>
					</ComponentRow>

					<ComponentRow 
						label="Sizes" 
						code={`<Button size="lg">Large</Button>
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="xs">XS</Button>
<Button size="2xs">2XS</Button>`}
					>
						<Button size="lg">Large</Button>
						<Button size="default">Default</Button>
						<Button size="sm">Small</Button>
						<Button size="xs">XS</Button>
						<Button size="2xs">2XS</Button>
					</ComponentRow>

					<ComponentRow 
						label="Icon Sizes" 
						code={`<Button size="icon-lg" variant="outline"><Terminal /></Button>
<Button size="icon" variant="outline"><Terminal /></Button>
<Button size="icon-sm" variant="outline"><Terminal /></Button>
<Button size="icon-xs" variant="outline"><Terminal /></Button>
<Button size="icon-2xs" variant="outline"><Terminal /></Button>`}
					>
						<Button size="icon-lg" variant="outline"><Terminal /></Button>
						<Button size="icon" variant="outline"><Terminal /></Button>
						<Button size="icon-sm" variant="outline"><Terminal /></Button>
						<Button size="icon-xs" variant="outline"><Terminal /></Button>
						<Button size="icon-2xs" variant="outline"><Terminal /></Button>
					</ComponentRow>
				</Section>

				{/* Input */}
				<Section title="Input">
					<ComponentRow 
						label="Sizes" 
						code={`<Input inputSize="lg" placeholder="Large" />
<Input inputSize="default" placeholder="Default" />
<Input inputSize="sm" placeholder="Small" />`}
					>
						<Input inputSize="lg" placeholder="Large" className="w-28" />
						<Input inputSize="default" placeholder="Default" className="w-28" />
						<Input inputSize="sm" placeholder="Small" className="w-28" />
					</ComponentRow>
				</Section>

				{/* Badge */}
				<Section title="Badge">
					<ComponentRow 
						label="Variants" 
						code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`}
					>
						<Badge variant="default">Default</Badge>
						<Badge variant="secondary">Secondary</Badge>
						<Badge variant="outline">Outline</Badge>
						<Badge variant="destructive">Destructive</Badge>
					</ComponentRow>

					<ComponentRow 
						label="Trading" 
						code={`<Badge variant="long">+5.24%</Badge>
<Badge variant="short">-2.15%</Badge>
<Badge variant="neutral">0.00%</Badge>`}
					>
						<Badge variant="long">+5.24%</Badge>
						<Badge variant="short">-2.15%</Badge>
						<Badge variant="neutral">0.00%</Badge>
					</ComponentRow>

					<ComponentRow 
						label="Sizes" 
						code={`<Badge size="default">Default</Badge>
<Badge size="sm">Small</Badge>
<Badge size="xs">XS</Badge>`}
					>
						<Badge size="default">Default</Badge>
						<Badge size="sm">Small</Badge>
						<Badge size="xs">XS</Badge>
					</ComponentRow>

					<ComponentRow 
						label="Trading + Sizes" 
						code={`<Badge variant="long" size="sm">LONG</Badge>
<Badge variant="short" size="xs">S</Badge>`}
					>
						<Badge variant="long" size="default">LONG</Badge>
						<Badge variant="long" size="sm">LONG</Badge>
						<Badge variant="long" size="xs">L</Badge>
						<Badge variant="short" size="default">SHORT</Badge>
						<Badge variant="short" size="sm">SHORT</Badge>
						<Badge variant="short" size="xs">S</Badge>
					</ComponentRow>
				</Section>

				{/* Card */}
				<Section title="Card">
					<CodeBlock 
						code={`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
</Card>`} 
						className="mb-4"
					/>
					<div className="grid grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Card Title</CardTitle>
								<CardDescription>Card description text</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground">Compact card with reduced padding.</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Position Data</CardTitle>
								<CardDescription>ETH-PERP</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Badge variant="long">LONG</Badge>
									<span className="text-xs tabular-nums">2.5 ETH @ $2,450.00</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</Section>

				{/* Tabs */}
				<Section title="Tabs">
					<CodeBlock 
						code={`<Tabs defaultValue="positions">
  <TabsList>
    <TabsTrigger value="positions">Positions</TabsTrigger>
    <TabsTrigger value="orders">Orders</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="positions">Content here</TabsContent>
</Tabs>`} 
						className="mb-4"
					/>
					<Tabs defaultValue="positions">
						<TabsList>
							<TabsTrigger value="positions">Positions</TabsTrigger>
							<TabsTrigger value="orders">Orders</TabsTrigger>
							<TabsTrigger value="history">History</TabsTrigger>
						</TabsList>
						<TabsContent value="positions" className="p-3 border rounded-sm mt-2">
							<p className="text-xs text-muted-foreground">Active positions content</p>
						</TabsContent>
						<TabsContent value="orders" className="p-3 border rounded-sm mt-2">
							<p className="text-xs text-muted-foreground">Open orders content</p>
						</TabsContent>
						<TabsContent value="history" className="p-3 border rounded-sm mt-2">
							<p className="text-xs text-muted-foreground">Trade history content</p>
						</TabsContent>
					</Tabs>
				</Section>

				{/* Select */}
				<Section title="Select">
					<ComponentRow 
						label="Sizes" 
						code={`<Select defaultValue="eth">
  <SelectTrigger size="default">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="eth">ETH-PERP</SelectItem>
  </SelectContent>
</Select>

<SelectTrigger size="sm">...</SelectTrigger>
<SelectTrigger size="xs">...</SelectTrigger>`}
					>
						<Select defaultValue="eth">
							<SelectTrigger size="default">
								<SelectValue placeholder="Default" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="btc">BTC-PERP</SelectItem>
								<SelectItem value="eth">ETH-PERP</SelectItem>
								<SelectItem value="sol">SOL-PERP</SelectItem>
							</SelectContent>
						</Select>
						<Select defaultValue="eth">
							<SelectTrigger size="sm">
								<SelectValue placeholder="Small" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="btc">BTC-PERP</SelectItem>
								<SelectItem value="eth">ETH-PERP</SelectItem>
								<SelectItem value="sol">SOL-PERP</SelectItem>
							</SelectContent>
						</Select>
						<Select defaultValue="eth">
							<SelectTrigger size="xs">
								<SelectValue placeholder="XS" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="btc">BTC-PERP</SelectItem>
								<SelectItem value="eth">ETH-PERP</SelectItem>
								<SelectItem value="sol">SOL-PERP</SelectItem>
							</SelectContent>
						</Select>
					</ComponentRow>
				</Section>

				{/* Table */}
				<Section title="Table">
					<CodeBlock 
						code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Symbol</TableHead>
      <TableHead>Side</TableHead>
      <TableHead className="text-right">PnL</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>ETH-PERP</TableCell>
      <TableCell><Badge variant="long" size="xs">LONG</Badge></TableCell>
      <TableCell className="text-right text-terminal-green">+$125.50</TableCell>
    </TableRow>
  </TableBody>
</Table>`} 
						className="mb-4"
					/>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Symbol</TableHead>
								<TableHead>Side</TableHead>
								<TableHead className="text-right">Size</TableHead>
								<TableHead className="text-right">Entry</TableHead>
								<TableHead className="text-right">PnL</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">ETH-PERP</TableCell>
								<TableCell><Badge variant="long" size="xs">LONG</Badge></TableCell>
								<TableCell className="text-right tabular-nums">2.5</TableCell>
								<TableCell className="text-right tabular-nums">$2,450.00</TableCell>
								<TableCell className="text-right tabular-nums text-terminal-green">+$125.50</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">BTC-PERP</TableCell>
								<TableCell><Badge variant="short" size="xs">SHORT</Badge></TableCell>
								<TableCell className="text-right tabular-nums">0.15</TableCell>
								<TableCell className="text-right tabular-nums">$42,100.00</TableCell>
								<TableCell className="text-right tabular-nums text-terminal-red">-$85.20</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</Section>

				{/* Typography Reference */}
				<Section title="Typography">
					<CodeBlock 
						code={`<p className="text-sm">Default body (14px)</p>
<p className="text-xs">Small text (12px)</p>
<p className="text-2xs">Dense UI (11px)</p>
<p className="text-3xs">Labels (10px)</p>
<p className="text-4xs">Micro (9px)</p>

<span className="text-terminal-green">Green</span>
<span className="text-terminal-red">Red</span>
<span className="text-terminal-cyan">Cyan</span>
<span className="text-terminal-amber">Amber</span>
<span className="text-terminal-purple">Purple</span>`} 
						className="mb-4"
					/>
					<div className="space-y-1">
						<p className="text-sm">text-sm: Default body (14px)</p>
						<p className="text-xs">text-xs: Small text (12px)</p>
						<p className="text-2xs">text-2xs: Dense UI (11px)</p>
						<p className="text-3xs">text-3xs: Labels (10px)</p>
						<p className="text-4xs">text-4xs: Micro (9px)</p>
					</div>
					<div className="flex gap-4 mt-4">
						<span className="text-terminal-green">terminal-green</span>
						<span className="text-terminal-red">terminal-red</span>
						<span className="text-terminal-cyan">terminal-cyan</span>
						<span className="text-terminal-amber">terminal-amber</span>
						<span className="text-terminal-purple">terminal-purple</span>
					</div>
				</Section>
			</div>
		</div>
	);
}
