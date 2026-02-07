import { t } from "@lingui/core/macro";
import type { Icon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { getValueColorClass, isPositive } from "@/lib/trade/numbers";

interface Props {
	label: string;
	icon: Icon;
	value: string;
	onChange: (value: string) => void;
	percentOptions: readonly number[];
	onPercentClick: (percent: number) => void;
	pnlValue: number | null;
	error?: string | null;
	disabled?: boolean;
	referencePrice: number;
}

export function PriceInputWithPercent({
	label,
	icon: Icon,
	value,
	onChange,
	percentOptions,
	onPercentClick,
	pnlValue,
	error,
	disabled,
	referencePrice,
}: Props) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-fg-700">
					<span className="text-3xs font-medium uppercase tracking-wide">{label}</span>
					<Icon className="size-3" />
				</div>
				{pnlValue !== null && (
					<span className={cn("text-3xs tabular-nums", getValueColorClass(pnlValue))}>
						{formatUSD(pnlValue, { signDisplay: "exceptZero" })}
					</span>
				)}
			</div>
			<div
				className={cn(
					"flex items-center rounded-md border bg-surface-200 overflow-hidden",
					error ? "border-market-down-primary" : "border-border/60 focus-within:border-fg-400",
				)}
			>
				<Input
					placeholder={t`Price`}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-8 flex-1 text-xs border-0 focus-visible:ring-0 tabular-nums"
					disabled={disabled}
				/>
				<div className="flex items-center gap-0.5 px-1.5 border-l border-border/40">
					{percentOptions.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => onPercentClick(p)}
							disabled={disabled || !isPositive(referencePrice)}
							className="px-1.5 py-1 text-4xs font-medium text-fg-700 bg-surface-alt hover:text-fg-900 hover:bg-status-info/20 rounded-xs transition-colors disabled:opacity-50"
							aria-label={t`Set to ${p}%`}
						>
							{p}%
						</button>
					))}
				</div>
			</div>
			{error && <div className="text-4xs text-market-down-primary">{error}</div>}
		</div>
	);
}
