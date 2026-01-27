import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design/")({
	head: () =>
		buildPageHead({
			title: "Design System",
			description: "Internal design system workspace derived from current project patterns",
			path: "/design",
		}),
	component: DesignSystemPage,
});

function DesignSystemPage() {
	return (
		<div className="min-h-screen bg-bg p-8">
			<div className="mx-auto max-w-6xl space-y-8">
				<header className="space-y-2">
					<h1 className="text-2xl font-semibold text-fg">Design System</h1>
					<p className="text-sm text-muted-fg">
						Internal workspace for design consistency — derived from current project patterns
					</p>
				</header>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
					<Link to="/design/tokens">
						<Card className="transition-colors hover:border-primary/40">
							<CardHeader>
								<CardTitle>Tokens</CardTitle>
								<CardDescription>View live CSS variable values for all themes</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-muted-fg">
									Core UI tokens (background, foreground, primary, etc.) and signal colors (positive, negative,
									info, etc.)
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link to="/design/components">
						<Card className="transition-colors hover:border-primary/40">
							<CardHeader>
								<CardTitle>Components</CardTitle>
								<CardDescription>Gallery of components used in the app</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-muted-fg">
									Preview all component variants and states in the actual app context
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link to="/design/preview">
						<Card className="transition-colors hover:border-primary/40">
							<CardHeader>
								<CardTitle>Preview Environment</CardTitle>
								<CardDescription>Test components in app-context conditions</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-muted-fg">
									Renders components with the same backgrounds, surfaces, and elevations as the real app
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link to="/design/consistency">
						<Card className="transition-colors hover:border-primary/40">
							<CardHeader>
								<CardTitle>Consistency Checks</CardTitle>
								<CardDescription>Visual validation of design consistency</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-muted-fg">Quick checks for radius, borders, rings, and surface elevations</p>
							</CardContent>
						</Card>
					</Link>
				</div>

				<Card className="border-info/20 bg-info/5">
					<CardHeader>
						<CardTitle className="text-info">About this workspace</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-2xs text-muted-fg">
						<p>
							This design system is <strong>not a redesign</strong>. It is a visibility and consistency layer over
							what already exists in the project.
						</p>
						<ul className="ml-4 list-disc space-y-1">
							<li>Uses existing CSS variables exactly as defined</li>
							<li>Border radius stays consistent with current patterns</li>
							<li>Default shadcn + Tailwind patterns are the baseline</li>
							<li>Components reflect actual usage in the app</li>
						</ul>
					</CardContent>
				</Card>

				<div className="flex gap-2">
					<Link to="/">
						<Button variant="outline" size="sm">
							Back to App
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
