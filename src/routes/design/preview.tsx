import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design/preview")({
	head: () =>
		buildPageHead({
			title: "Preview Environment",
			description: "Test components in app-context conditions",
			path: "/design/preview",
		}),
	component: PreviewEnvironmentPage,
});

function PreviewEnvironmentPage() {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div className="min-h-screen bg-bg">
			<div className="p-8">
				<div className="mx-auto max-w-6xl space-y-6">
					<header className="flex items-start justify-between">
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold text-fg">Preview Environment</h1>
							<p className="text-sm text-muted-fg">
								Components rendered in the same context as the main app
							</p>
						</div>
						<Link to="/design">
							<Button variant="outline" size="sm">
								Back
							</Button>
						</Link>
					</header>

					<Card className="border-info/20 bg-info/5">
						<CardHeader>
							<CardTitle className="text-info">App Context</CardTitle>
							<CardDescription>
								This page uses the same background, surfaces, and styling as the main app
							</CardDescription>
						</CardHeader>
						<CardContent className="text-2xs text-muted-fg">
							<ul className="ml-4 list-disc space-y-1">
								<li>Background uses <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">bg-bg</code></li>
								<li>Cards use <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">bg-surface</code> with elevation</li>
								<li>All focus states show the standard ring behavior</li>
								<li>Overlays (dialogs, popovers) use proper z-index layering</li>
							</ul>
						</CardContent>
					</Card>

					<div className="grid gap-6 lg:grid-cols-2">
						<section className="space-y-4">
							<h2 className="text-lg font-semibold text-fg">Base Surface</h2>
							<Card>
								<CardHeader>
									<CardTitle>Standard Card</CardTitle>
									<CardDescription>This is an elevated surface (card)</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="name">Name</Label>
										<Input id="name" placeholder="Enter your name" inputSize="sm" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input id="email" type="email" placeholder="you@example.com" inputSize="sm" />
									</div>
									<Button className="w-full" size="sm">
										Submit
									</Button>
								</CardContent>
							</Card>

							<Card className="bg-muted">
								<CardHeader>
									<CardTitle>Muted Card</CardTitle>
									<CardDescription>Using muted background variant</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-2xs text-fg">
										Some cards use <code className="bg-surface px-1 py-0.5 rounded-sm font-mono text-3xs">bg-muted</code> for visual hierarchy.
									</p>
								</CardContent>
							</Card>
						</section>

						<section className="space-y-4">
							<h2 className="text-lg font-semibold text-fg">Overlay Surfaces</h2>

							<Card>
								<CardHeader>
									<CardTitle>Dialog Preview</CardTitle>
									<CardDescription>Test dialog overlay with proper z-index</CardDescription>
								</CardHeader>
								<CardContent>
									<Button onClick={() => setDialogOpen(true)} size="sm">
										Open Dialog
									</Button>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Popover Preview</CardTitle>
									<CardDescription>Test popover positioning and styling</CardDescription>
								</CardHeader>
								<CardContent>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm">
												Open Popover
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-80">
											<div className="space-y-2">
												<h4 className="text-xs font-semibold text-fg">Popover Title</h4>
												<p className="text-2xs text-muted-fg">
													Popovers are rendered as overlays with elevated surface styling.
												</p>
												<div className="flex gap-2 pt-2">
													<Button size="sm" className="w-full">
														Action
													</Button>
												</div>
											</div>
										</PopoverContent>
									</Popover>
								</CardContent>
							</Card>
						</section>
					</div>

					<section className="space-y-4">
						<h2 className="text-lg font-semibold text-fg">Focus & Interactive States</h2>
						<Card>
							<CardHeader>
								<CardTitle>Focus Ring Behavior</CardTitle>
								<CardDescription>Tab through these elements to see focus rings</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-3 sm:grid-cols-3">
									<Button size="sm">Button 1</Button>
									<Button variant="outline" size="sm">
										Button 2
									</Button>
									<Button variant="ghost" size="sm">
										Button 3
									</Button>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<Input placeholder="Input 1" inputSize="sm" />
									<Input placeholder="Input 2" inputSize="sm" />
								</div>
								<p className="text-2xs text-muted-fg">
									Focus rings use <code className="bg-muted px-1 py-0.5 rounded-sm font-mono text-3xs">--ring</code> color with consistent thickness
								</p>
							</CardContent>
						</Card>
					</section>

					<section className="space-y-4">
						<h2 className="text-lg font-semibold text-fg">Border Consistency</h2>
						<div className="grid gap-4 sm:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle>Card Border</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xs text-muted-fg">Standard card border</p>
								</CardContent>
							</Card>
							<div className="border border-border rounded-sm p-4">
								<p className="text-xs font-semibold text-fg mb-1">Simple Border</p>
								<p className="text-2xs text-muted-fg">Using border-border utility</p>
							</div>
							<div className="border border-border/60 rounded-sm p-4">
								<p className="text-xs font-semibold text-fg mb-1">Subtle Border</p>
								<p className="text-2xs text-muted-fg">Using border-border/60</p>
							</div>
						</div>
					</section>
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Dialog Example</DialogTitle>
						<DialogDescription>
							This dialog demonstrates the overlay surface styling used throughout the app
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="dialog-name">Name</Label>
							<Input id="dialog-name" placeholder="Enter name" inputSize="sm" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="dialog-email">Email</Label>
							<Input id="dialog-email" type="email" placeholder="Enter email" inputSize="sm" />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button size="sm" onClick={() => setDialogOpen(false)}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
