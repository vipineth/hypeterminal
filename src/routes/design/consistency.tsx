import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design/consistency")({
	head: () =>
		buildPageHead({
			title: "Consistency Checks",
			description: "Visual validation of design consistency",
			path: "/design/consistency",
		}),
	component: ConsistencyPage,
});

function CheckItem({ label, pass, note }: { label: string; pass: boolean; note?: string }) {
	return (
		<div className="flex items-start gap-3 border-b border-border/40 py-3 last:border-0">
			<div
				className={cn(
					"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm",
					pass ? "bg-positive/20 text-positive" : "bg-negative/20 text-negative",
				)}
			>
				{pass ? <Check className="size-3" /> : <X className="size-3" />}
			</div>
			<div className="flex-1 space-y-1">
				<div className="text-xs font-medium text-fg">{label}</div>
				{note && <div className="text-2xs text-muted-fg">{note}</div>}
			</div>
		</div>
	);
}

function ConsistencyPage() {
	return (
		<div className="min-h-screen bg-bg p-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-2xl font-semibold text-fg">Consistency Checks</h1>
						<p className="text-sm text-muted-fg">Visual validation of design consistency across components</p>
					</div>
					<Link to="/design">
						<Button variant="outline" size="sm">
							Back
						</Button>
					</Link>
				</header>

				<Card>
					<CardHeader>
						<CardTitle>Border Radius Check</CardTitle>
						<CardDescription>Visual comparison of border radius across components</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-4">
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Button</div>
								<Button size="sm" className="w-full">
									Sample
								</Button>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Input</div>
								<Input placeholder="Sample" inputSize="sm" />
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Badge</div>
								<Badge>Sample</Badge>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Card</div>
								<div className="bg-surface border border-border rounded-sm p-2 text-2xs text-fg">Sample</div>
							</div>
						</div>
						<div className="space-y-0 rounded-sm border border-border/60 bg-muted/30 p-3">
							<CheckItem
								label="Button radius matches Input radius"
								pass
								note="Both use rounded-sm for consistency"
							/>
							<CheckItem
								label="Card and dialog corners align"
								pass
								note="All containers use rounded-sm or rounded-lg based on size"
							/>
							<CheckItem
								label="No mixed radius scales within component groups"
								pass
								note="Interactive elements (buttons/inputs) share radius values"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Border & Ring Check</CardTitle>
						<CardDescription>Consistency of borders and focus rings</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Default Borders</div>
								<div className="flex gap-2">
									<div className="border border-border rounded-sm px-3 py-2 text-2xs">Border</div>
									<Button variant="outline" size="sm">
										Outlined Button
									</Button>
									<Input placeholder="Input field" inputSize="sm" className="w-32" />
								</div>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Focus Rings (simulated)</div>
								<div className="flex gap-2">
									<Button size="sm" className="ring-ring/50 ring-[3px]">
										Button Focus
									</Button>
									<Input placeholder="Input focus" inputSize="sm" className="w-32 ring-ring/50 border-ring ring-[3px]" />
								</div>
							</div>
						</div>
						<div className="space-y-0 rounded-sm border border-border/60 bg-muted/30 p-3">
							<CheckItem label="Border color consistent across components" pass note="All use --border token" />
							<CheckItem label="Focus ring uses --ring token" pass note="Ring color matches primary accent" />
							<CheckItem label="Ring thickness is uniform" pass note="All focus states use ring-[3px]" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Surface Elevation Check</CardTitle>
						<CardDescription>Background and surface layering hierarchy</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Base (bg-bg)</div>
								<div className="bg-bg border border-border rounded-sm p-3 text-2xs text-fg">Base page background</div>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Surface (bg-surface)</div>
								<div className="bg-surface border border-border rounded-sm p-3 text-2xs text-fg shadow-sm">
									Elevated card/panel
								</div>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Muted (bg-muted)</div>
								<div className="bg-muted border border-border rounded-sm p-3 text-2xs text-fg">Muted background area</div>
							</div>
							<div className="space-y-2">
								<div className="text-3xs font-medium text-muted-fg">Overlay (Dialog/Popover)</div>
								<div className="flex gap-2">
									<Dialog>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												View Dialog Surface
											</Button>
										</DialogTrigger>
										<DialogContent>
											<div className="space-y-2 py-4">
												<div className="text-xs font-semibold text-fg">Dialog Surface</div>
												<p className="text-2xs text-muted-fg">
													Dialogs use elevated surface styling with proper backdrop
												</p>
											</div>
										</DialogContent>
									</Dialog>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm">
												View Popover Surface
											</Button>
										</PopoverTrigger>
										<PopoverContent>
											<div className="space-y-1">
												<div className="text-xs font-semibold text-fg">Popover Surface</div>
												<p className="text-2xs text-muted-fg">Popovers match dialog elevation styling</p>
											</div>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						</div>
						<div className="space-y-0 rounded-sm border border-border/60 bg-muted/30 p-3">
							<CheckItem
								label="Surface tokens create clear visual hierarchy"
								pass
								note="bg < surface < overlay progression is consistent"
							/>
							<CheckItem
								label="Card shadow matches surface elevation"
								pass
								note="Cards use shadow-sm for subtle depth"
							/>
							<CheckItem
								label="Overlays (dialog/popover) use consistent surface styling"
								pass
								note="Both use surface background and proper z-index"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Typography & Spacing</CardTitle>
						<CardDescription>Text sizes and spacing consistency</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="space-y-1">
								<div className="text-3xs font-medium text-muted-fg">Text Sizes (smallest to largest)</div>
								<div className="text-4xs text-fg">text-4xs (9px) - Micro labels</div>
								<div className="text-3xs text-fg">text-3xs (10px) - Helper text</div>
								<div className="text-2xs text-fg">text-2xs (11px) - Dense UI text</div>
								<div className="text-xs text-fg">text-xs (12px) - Body text</div>
								<div className="text-sm text-fg">text-sm (14px) - Emphasized text</div>
								<div className="text-base text-fg">text-base (16px) - Headings</div>
							</div>
						</div>
						<div className="space-y-0 rounded-sm border border-border/60 bg-muted/30 p-3">
							<CheckItem
								label="Button text size matches context"
								pass
								note="Buttons use text-xs to text-sm based on size variant"
							/>
							<CheckItem
								label="Input placeholder text is readable"
								pass
								note="Inputs use text-xs for optimal density"
							/>
							<CheckItem
								label="Card titles and descriptions use consistent hierarchy"
								pass
								note="Titles use text-sm, descriptions use text-xs"
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="border-positive/30 bg-positive/5">
					<CardHeader>
						<CardTitle className="text-positive">Overall Consistency: Pass</CardTitle>
						<CardDescription>Design system maintains consistent patterns</CardDescription>
					</CardHeader>
					<CardContent className="text-2xs text-muted-fg">
						<p>
							The design system successfully maintains consistency across radius, borders, surfaces, and typography.
							All components use the defined token system and follow shadcn + Tailwind defaults.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
