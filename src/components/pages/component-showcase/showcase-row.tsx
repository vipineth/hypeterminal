import { CodeBlock } from "./code-block";

interface ShowcaseRowProps {
	label: string;
	code: string;
	children: React.ReactNode;
}

export function ShowcaseRow({ label, code, children }: ShowcaseRowProps) {
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
