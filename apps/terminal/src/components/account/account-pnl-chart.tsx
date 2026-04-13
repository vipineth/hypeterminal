import { Trans } from "@lingui/react/macro";
import { ChartLineUpIcon } from "@phosphor-icons/react";

export function AccountPnlChart() {
	return (
		<div className="rounded-xs border border-stroke-weak bg-bg-raised">
			<div className="px-4 py-3 border-b border-stroke-weak/40">
				<span className="text-xs font-medium">
					<Trans>Portfolio PNL</Trans>
				</span>
			</div>
			<div className="flex flex-col items-center justify-center gap-2 py-10 text-text-weak">
				<ChartLineUpIcon className="size-8 text-text-weak/50" />
				<span className="text-sm">
					<Trans>Coming soon</Trans>
				</span>
			</div>
		</div>
	);
}
