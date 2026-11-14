import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowLineDownIcon,
	ArrowLineUpIcon,
	ClockIcon,
	SpinnerGapIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { InfoRow } from "@/components/ui/info-row";
import { NumberInput } from "@/components/ui/number-input";
import { FALLBACK_VALUE_PLACEHOLDER, USDC_TRANSFER_DECIMALS } from "@/config/app";
import { WITHDRAWAL_FEE_USD } from "@/config/contracts";
import { NETWORKS } from "@/config/networks";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { floorToString, limitDecimalInput, toNumber } from "@/lib/trade/numbers";
import { NetworkSelect } from "./shared-ui";

const ARBITRUM_NETWORK = NETWORKS[0];

interface Props {
	amount: string;
	onAmountChange: (value: string) => void;
	available: string | null;
	validation: { valid: boolean; error: string | null };
	isPending: boolean;
	onSubmit: () => void;
}

export function WithdrawForm({ amount, onAmountChange, available, validation, isPending, onSubmit }: Props) {
	const amountNum = toNumber(amount);
	const netReceived = amountNum !== null && amountNum > 0 ? Math.max(amountNum - WITHDRAWAL_FEE_USD, 0) : null;

	return (
		<div className="flex flex-1 flex-col gap-2">
			<NetworkSelect label={<Trans>To</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div>
				<NumberInput
					label={t`Amount`}
					labelValue={
						<>
							Available:{" "}
							<span className="underline decoration-dashed underline-offset-2 decoration-fg-muted/50">
								{available === null ? FALLBACK_VALUE_PLACEHOLDER : `${formatNumber(available, 2)} USDC`}
							</span>
						</>
					}
					onLabelValueClick={() =>
						!isPending && available !== null && onAmountChange(floorToString(available, USDC_TRANSFER_DECIMALS))
					}
					placeholder="0.00"
					value={amount}
					onChange={(e) => onAmountChange(limitDecimalInput(e.target.value, USDC_TRANSFER_DECIMALS))}
					disabled={isPending}
					className={cn(
						"w-full tabular-nums",
						validation.error && "border-stroke-error-strong focus:border-stroke-error-strong",
					)}
				/>
				<p className={cn("h-4 text-xs flex items-center gap-1", validation.error ? "text-error" : "invisible")}>
					<WarningCircleIcon className="size-3" />
					{validation.error || " "}
				</p>
			</div>

			<div className="rounded-8 border border-stroke-weak/40 bg-surface p-3 space-y-2 text-xs">
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-fg"
					label={
						<>
							<WalletIcon className="size-3" />
							<Trans>Network fee</Trans>
						</>
					}
					value={`$${WITHDRAWAL_FEE_USD}`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-fg"
					label={
						<>
							<ArrowLineDownIcon className="size-3" />
							<Trans>Net received</Trans>
						</>
					}
					value={netReceived === null ? "--" : `$${formatNumber(netReceived, 2)}`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-fg"
					label={
						<>
							<ClockIcon className="size-3" />
							<Trans>Estimated time</Trans>
						</>
					}
					value={ARBITRUM_NETWORK.estimatedWithdrawTime}
					valueClassName="font-medium"
				/>
			</div>

			<Button
				variant="filled"
				intent="neutral"
				onClick={onSubmit}
				disabled={!validation.valid || isPending}
				className="mt-auto w-full"
			>
				{isPending ? (
					<>
						<SpinnerGapIcon className="size-4 animate-spin" />
						<Trans>Processing...</Trans>
					</>
				) : (
					<>
						<ArrowLineUpIcon className="size-4" />
						<Trans>Withdraw</Trans>
					</>
				)}
			</Button>
		</div>
	);
}
