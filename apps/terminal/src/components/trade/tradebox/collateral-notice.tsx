import type { Collateral } from "@/domain/trade/account-mode";
import { cn } from "@/lib/cn";
import { ACCOUNT_MODES_DOCS_URL, getShortfallCopy } from "@/lib/trade/collateral-copy";

interface Props {
	collateral: Collateral;
	className?: string;
}

export function CollateralNotice({ collateral, className }: Props) {
	if (collateral.status !== "ready" || !collateral.shortfall) return null;
	const { title, detail, help } = getShortfallCopy(collateral.shortfall);
	return (
		<div role="status" className={cn("flex flex-col gap-0.5 text-xs", className)}>
			<span className="text-warning">{title}</span>
			{detail && <span className="text-fg-muted">{detail}</span>}
			{help && (
				<a
					href={ACCOUNT_MODES_DOCS_URL}
					target="_blank"
					rel="noreferrer"
					className="text-brand underline-offset-2 hover:underline"
				>
					{help}
				</a>
			)}
		</div>
	);
}
