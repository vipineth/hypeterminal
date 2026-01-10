import { t } from "@lingui/core/macro";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

interface Props {
	leverage: number;
	onClick?: () => void;
	isLoading?: boolean;
	className?: string;
}

export const LeverageBadge = forwardRef<HTMLButtonElement, Props>(
	({ leverage, onClick, isLoading, className }, ref) => {
		return (
			<button
				ref={ref}
				type="button"
				onClick={onClick}
				className={clsx(
					"px-2 py-0.5 text-3xs border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1 transition-colors",
					"hover:bg-terminal-cyan/10 hover:border-terminal-cyan/60",
					"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terminal-cyan",
					isLoading && "opacity-70",
					className,
				)}
				aria-label={t`Change leverage`}
			>
				<span className="tabular-nums font-medium">{leverage}x</span>
				<ChevronDown className="size-2.5" />
			</button>
		);
	},
);

LeverageBadge.displayName = "LeverageBadge";
