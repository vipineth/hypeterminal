import { t } from "@lingui/core/macro";
import { CaretDown } from "@phosphor-icons/react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface Props {
	leverage: number;
	onClick?: () => void;
	isLoading?: boolean;
	className?: string;
}

export const LeverageBadge = forwardRef<HTMLButtonElement, Props>(
	({ leverage, onClick, isLoading, className }, ref) => {
		return (
			<Button
				ref={ref}
				variant="terminal"
				size="none"
				onClick={onClick}
				className={cn(
					"px-2 py-0.5 text-3xs gap-1",
					"hover:bg-info/10",
					"focus-visible:ring-1 focus-visible:ring-info",
					isLoading && "opacity-70",
					className,
				)}
				aria-label={t`Change leverage`}
			>
				<span className="tabular-nums font-medium">{leverage}x</span>
				<CaretDown className="size-2.5" />
			</Button>
		);
	},
);

LeverageBadge.displayName = "LeverageBadge";
