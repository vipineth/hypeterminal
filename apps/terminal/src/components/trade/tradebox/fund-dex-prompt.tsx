import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { Collateral } from "@/domain/trade/account-mode";
import { type FundDexPlan, getFundDexPlan } from "@/domain/trade/dex-transfer";
import { useAccountState } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { TransferModal } from "../positions/transfer-modal";
import { UnifiedAccountModal } from "./unified-account-modal";

interface Props {
	collateral: Collateral;
	order: { margin: number; fee: number };
	className?: string;
}

const AMOUNT_DECIMALS = 2;

export function FundDexPrompt({ collateral, order, className }: Props) {
	const [plan, setPlan] = useState<FundDexPlan | null>(null);
	const [unifiedOpen, setUnifiedOpen] = useState(false);
	const account = useAccountState();

	if (collateral.status !== "ready" || collateral.shortfall?.kind !== "dexEmpty") return null;
	const shortfall = collateral.shortfall;
	const canGoUnified = account.status === "ready" && account.mode.kind === "standard";
	const dex = shortfall.dex.name;

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Button
				variant="outline"
				intent="brand"
				size="xs"
				className="w-full"
				iconLeft={<ArrowsLeftRightIcon className="size-3" />}
				onClick={() => setPlan(getFundDexPlan(shortfall, order, AMOUNT_DECIMALS))}
			>
				{t`Move ${shortfall.token.displayName} to ${dex}`}
			</Button>
			{canGoUnified && (
				<button
					type="button"
					onClick={() => setUnifiedOpen(true)}
					className="self-start text-xs text-fg-muted underline-offset-2 hover:text-brand hover:underline"
				>
					{t`Or use one balance for every dex`}
				</button>
			)}
			<TransferModal
				open={plan !== null}
				onOpenChange={(open) => !open && setPlan(null)}
				initialRoute={plan?.route}
				initialAmount={plan?.amount}
			/>
			<UnifiedAccountModal open={unifiedOpen} onOpenChange={setUnifiedOpen} />
		</div>
	);
}
