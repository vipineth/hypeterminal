interface ShowcaseSectionProps {
	title: string;
	children: React.ReactNode;
}

export function ShowcaseSection({ title, children }: ShowcaseSectionProps) {
	return (
		<div className="space-y-3">
			<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
				{title}
			</h2>
			<div className="space-y-4">{children}</div>
		</div>
	);
}
