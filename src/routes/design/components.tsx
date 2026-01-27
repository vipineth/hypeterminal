import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Plus, Search, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design/components")({
	head: () =>
		buildPageHead({
			title: "Components",
			description: "Gallery of components used in the app",
			path: "/design/components",
		}),
	component: ComponentsPage,
});

function PreviewSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}

function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[120px_1fr] items-center gap-4 border-b border-border/40 py-3 last:border-0">
			<div className="text-2xs font-medium text-muted-fg">{label}</div>
			<div className="flex flex-wrap items-center gap-2">{children}</div>
		</div>
	);
}

function ComponentsPage() {
	return (
		<div className="min-h-screen bg-bg p-8">
			<div className="mx-auto max-w-6xl space-y-6">
				<header className="flex items-start justify-between">
					<div className="space-y-2">
						<h1 className="text-2xl font-semibold text-fg">Components</h1>
						<p className="text-sm text-muted-fg">Gallery of components used in the app with all variants and states</p>
					</div>
					<Link to="/design">
						<Button variant="outline" size="sm">
							Back
						</Button>
					</Link>
				</header>

				<PreviewSection title="Buttons" description="All button variants and states">
					<StateRow label="Default">
						<Button size="sm">Default</Button>
						<Button size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Destructive">
						<Button variant="destructive" size="sm">
							Destructive
						</Button>
						<Button variant="destructive" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Outline">
						<Button variant="outline" size="sm">
							Outline
						</Button>
						<Button variant="outline" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Ghost">
						<Button variant="ghost" size="sm">
							Ghost
						</Button>
						<Button variant="ghost" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Terminal">
						<Button variant="terminal" size="sm">
							Terminal
						</Button>
						<Button variant="terminal" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Danger">
						<Button variant="danger" size="sm">
							Danger
						</Button>
						<Button variant="danger" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Link">
						<Button variant="link" size="sm">
							Link
						</Button>
						<Button variant="link" size="sm" disabled>
							Disabled
						</Button>
					</StateRow>
					<StateRow label="Sizes">
						<Button size="xs">Extra Small</Button>
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
					</StateRow>
					<StateRow label="Icon Buttons">
						<Button variant="outline" size="icon-sm">
							<Plus className="size-3.5" />
						</Button>
						<Button variant="outline" size="icon">
							<Search className="size-4" />
						</Button>
						<Button variant="outline" size="icon-lg">
							<X className="size-5" />
						</Button>
					</StateRow>
					<StateRow label="With Icons">
						<Button size="sm">
							Next <ArrowRight className="size-3.5" />
						</Button>
						<Button variant="outline" size="sm">
							<Check className="size-3.5" /> Confirm
						</Button>
					</StateRow>
				</PreviewSection>

				<PreviewSection title="Badges" description="Badge variants for status indicators">
					<StateRow label="Default">
						<Badge>Default</Badge>
					</StateRow>
					<StateRow label="Secondary">
						<Badge variant="secondary">Secondary</Badge>
					</StateRow>
					<StateRow label="Outline">
						<Badge variant="outline">Outline</Badge>
					</StateRow>
					<StateRow label="Positive">
						<Badge variant="positive">Positive</Badge>
					</StateRow>
					<StateRow label="Negative">
						<Badge variant="negative">Negative</Badge>
					</StateRow>
					<StateRow label="Info">
						<Badge variant="info">Info</Badge>
					</StateRow>
					<StateRow label="Warning">
						<Badge variant="warning">Warning</Badge>
					</StateRow>
				</PreviewSection>

				<PreviewSection title="Form Inputs" description="Input fields and form controls">
					<StateRow label="Default">
						<Input placeholder="Enter text..." inputSize="sm" className="w-64" />
					</StateRow>
					<StateRow label="Focused">
						<Input placeholder="Focus state" inputSize="sm" className="w-64 ring-ring/50 border-ring ring-[3px]" />
					</StateRow>
					<StateRow label="Disabled">
						<Input placeholder="Disabled" inputSize="sm" className="w-64" disabled />
					</StateRow>
					<StateRow label="Invalid">
						<Input placeholder="Invalid state" inputSize="sm" className="w-64" aria-invalid />
					</StateRow>
					<StateRow label="Sizes">
						<Input placeholder="Small" inputSize="sm" className="w-48" />
						<Input placeholder="Default" inputSize="default" className="w-48" />
						<Input placeholder="Large" inputSize="lg" className="w-48" />
					</StateRow>
					<StateRow label="Textarea">
						<Textarea placeholder="Enter longer text..." className="w-64" rows={3} />
					</StateRow>
				</PreviewSection>

				<PreviewSection title="Toggles & Checkboxes" description="Boolean input controls">
					<StateRow label="Checkbox">
						<div className="flex items-center gap-2">
							<Checkbox id="c1" />
							<Label htmlFor="c1">Unchecked</Label>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox id="c2" checked />
							<Label htmlFor="c2">Checked</Label>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox id="c3" disabled />
							<Label htmlFor="c3">Disabled</Label>
						</div>
					</StateRow>
					<StateRow label="Switch">
						<div className="flex items-center gap-2">
							<Switch id="s1" />
							<Label htmlFor="s1">Off</Label>
						</div>
						<div className="flex items-center gap-2">
							<Switch id="s2" checked />
							<Label htmlFor="s2">On</Label>
						</div>
						<div className="flex items-center gap-2">
							<Switch id="s3" disabled />
							<Label htmlFor="s3">Disabled</Label>
						</div>
					</StateRow>
				</PreviewSection>

				<PreviewSection title="Progress & Sliders" description="Visual feedback components">
					<StateRow label="Progress">
						<div className="w-64 space-y-2">
							<Progress value={33} />
							<Progress value={66} />
							<Progress value={100} />
						</div>
					</StateRow>
					<StateRow label="Slider">
						<div className="w-64 space-y-4">
							<Slider defaultValue={[33]} max={100} step={1} />
							<Slider defaultValue={[25, 75]} max={100} step={1} />
						</div>
					</StateRow>
				</PreviewSection>

				<PreviewSection title="Cards" description="Container components with elevation">
					<div className="grid gap-4 sm:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Card Title</CardTitle>
								<CardDescription>Card description goes here</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-fg">This is a standard card with header and content.</p>
							</CardContent>
						</Card>
						<Card className="border-info/30 bg-info/5">
							<CardHeader>
								<CardTitle className="text-info">Info Card</CardTitle>
								<CardDescription>Card with custom styling</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xs text-fg">Cards can have custom colors and borders.</p>
							</CardContent>
						</Card>
					</div>
				</PreviewSection>

				<PreviewSection title="Alerts" description="Notification and status messages">
					<div className="space-y-3">
						<Alert>
							<div className="text-xs font-medium">Default Alert</div>
							<div className="text-2xs text-muted-fg">This is a default alert message.</div>
						</Alert>
						<Alert variant="destructive">
							<div className="text-xs font-medium">Destructive Alert</div>
							<div className="text-2xs">This indicates an error or destructive action.</div>
						</Alert>
					</div>
				</PreviewSection>

				<PreviewSection title="Tabs" description="Tabbed navigation component">
					<Tabs defaultValue="tab1" className="w-full">
						<TabsList>
							<TabsTrigger value="tab1">Tab One</TabsTrigger>
							<TabsTrigger value="tab2">Tab Two</TabsTrigger>
							<TabsTrigger value="tab3">Tab Three</TabsTrigger>
							<TabsTrigger value="tab4" disabled>
								Disabled
							</TabsTrigger>
						</TabsList>
						<TabsContent value="tab1" className="p-4 border border-border rounded-sm mt-2">
							<p className="text-xs text-fg">Content for tab one</p>
						</TabsContent>
						<TabsContent value="tab2" className="p-4 border border-border rounded-sm mt-2">
							<p className="text-xs text-fg">Content for tab two</p>
						</TabsContent>
						<TabsContent value="tab3" className="p-4 border border-border rounded-sm mt-2">
							<p className="text-xs text-fg">Content for tab three</p>
						</TabsContent>
					</Tabs>
				</PreviewSection>
			</div>
		</div>
	);
}
