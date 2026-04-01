import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

export function NotFoundPage() {
	return (
		<div className="min-h-screen bg-bg-sunken text-text-strong flex items-center justify-center p-6">
			<div className="text-center space-y-3">
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-wider text-text-strong">404</p>
					<h1 className="text-sm font-semibold">
						<Trans>Page not found</Trans>
					</h1>
					<p className="text-xs text-text-weak">
						<Trans>The page you are looking for does not exist.</Trans>
					</p>
				</div>
				<a href="/" aria-label={t`Go to trading terminal`}>
					<Button variant="filled" intent="brand" size="sm">
						<Trans>Go to trading terminal</Trans>
					</Button>
				</a>
			</div>
		</div>
	);
}
