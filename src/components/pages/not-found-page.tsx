import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
			<div className="space-y-3 text-center">
				<div className="space-y-1">
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
					<h1 className="text-sm font-semibold">
						<Trans>Page not found</Trans>
					</h1>
					<p className="text-xs text-muted-foreground">
						<Trans>The page you are looking for does not exist.</Trans>
					</p>
				</div>
				<Button asChild size="sm">
					<a href="/" aria-label={t`Go to trading terminal`}>
						<Trans>Go to trading terminal</Trans>
					</a>
				</Button>
			</div>
		</div>
	);
}
