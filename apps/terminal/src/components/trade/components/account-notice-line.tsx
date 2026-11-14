import { t } from "@lingui/core/macro";
import { WarningIcon } from "@phosphor-icons/react";
import type { QuoteToken } from "@/domain/market/model";
import type { AccountNotice } from "@/domain/trade/balances";
import { cn } from "@/lib/cn";

interface Props {
	notice: AccountNotice;
	token: QuoteToken;
	className?: string;
}

export function AccountNoticeLine({ notice, token, className }: Props) {
	if (notice === "legacy") {
		return (
			<p
				className={cn(
					"flex items-start gap-1.5 rounded-xs border border-stroke-warning-weak bg-warning-soft p-2 text-xs text-warning",
					className,
				)}
			>
				<WarningIcon className="size-3.5 shrink-0 mt-px" />
				{t`Your account uses DEX abstraction, which Hyperliquid has discontinued. Balances on builder dexes may differ from before.`}
			</p>
		);
	}
	const tokenName = token.displayName;
	return (
		<p className={cn("text-xs text-fg-muted", className)}>
			{notice === "shared"
				? t`One ${tokenName} balance backs perps, builder dexes and spot.`
				: t`Unrecognised account mode. Using exchange limits only.`}
		</p>
	);
}
