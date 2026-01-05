import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
			<div className="text-center space-y-3">
				<div className="space-y-1">
					<p className="text-3xs uppercase tracking-wider text-muted-foreground">404</p>
					<h1 className="text-sm font-semibold">
						<Trans>Page not found</Trans>
					</h1>
					<p className="text-xs text-muted-foreground">
						<Trans>The page you are looking for does not exist.</Trans>
					</p>
				</div>
				<Button asChild size="xs" variant="terminal">
					<a href="/" aria-label={t`Go to trading terminal`}>
						<Trans>Go to trading terminal</Trans>
					</a>
				</Button>
			</div>
		</div>
	);
}
