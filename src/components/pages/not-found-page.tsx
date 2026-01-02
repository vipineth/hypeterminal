import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/constants/app";

const NOT_FOUND_TEXT = UI_TEXT.NOT_FOUND;

export function NotFoundPage() {
	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
			<div className="text-center space-y-3">
				<div className="space-y-1">
					<p className="text-3xs uppercase tracking-wider text-muted-foreground">{NOT_FOUND_TEXT.CODE}</p>
					<h1 className="text-sm font-semibold">{NOT_FOUND_TEXT.TITLE}</h1>
					<p className="text-xs text-muted-foreground">{NOT_FOUND_TEXT.DESCRIPTION}</p>
				</div>
				<Button asChild size="xs" variant="terminal">
					<a href="/" aria-label={NOT_FOUND_TEXT.CTA_ARIA}>
						{NOT_FOUND_TEXT.CTA_LABEL}
					</a>
				</Button>
			</div>
		</div>
	);
}
