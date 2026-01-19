import { t } from "@lingui/core/macro";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { isPositive } from "@/lib/trade/numbers";

interface Props {
	label: string;
	icon: LucideIcon;
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
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span className="text-3xs font-medium uppercase tracking-wide">{label}</span>
					<Icon className="size-3" />
				</div>
				{pnlValue !== null && (
					<span className={cn("text-3xs tabular-nums", pnlValue >= 0 ? "text-terminal-green" : "text-terminal-red")}>
						{formatUSD(pnlValue, { signDisplay: "exceptZero" })}
					</span>
				)}
			</div>
			<div
				className={cn(
					"flex items-center rounded-md border bg-background overflow-hidden",
					error ? "border-terminal-red" : "border-border/60 focus-within:border-foreground/30",
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
							className="px-1.5 py-1 text-4xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-terminal-cyan/20 rounded-xs transition-colors disabled:opacity-50"
							aria-label={t`Set to ${p}%`}
						>
							{p}%
						</button>
					))}
				</div>
			</div>
			{error && <div className="text-4xs text-terminal-red">{error}</div>}
		</div>
	);
}
