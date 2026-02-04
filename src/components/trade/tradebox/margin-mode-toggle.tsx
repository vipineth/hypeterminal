import { t } from "@lingui/core/macro";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { MarginMode } from "@/lib/trade/margin-mode";

interface Props {
	mode: MarginMode;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
}

export function MarginModeToggle({ mode, disabled, onClick, className }: Props) {
	const label = mode === "cross" ? t`Cross` : t`Isolated`;

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"flex items-center gap-1.5 px-2 py-1 rounded-sm",
				"text-3xs font-medium uppercase tracking-wider",
				"border border-border/60",
				"transition-colors duration-150",
				disabled && "opacity-50 cursor-not-allowed",
				!disabled && "hover:border-info/50 hover:text-info",
				className,
			)}
		>
			<span>{label}</span>
			<ArrowsLeftRight className="size-3" />
		</button>
	);
}
