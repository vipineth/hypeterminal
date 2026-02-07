import { t } from "@lingui/core/macro";
import { CaretDownIcon } from "@phosphor-icons/react";
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
				variant="outlined"
				onClick={onClick}
				className={cn(isLoading && "opacity-70", className)}
				aria-label={t`Change leverage`}
			>
				<span className="text-fg-700">{t`Leverage`}</span>
				<span className="tabular-nums font-medium text-fg-900">{leverage}x</span>
				<CaretDownIcon className="size-2.5 text-fg-700" />
			</Button>
		);
	},
);

LeverageBadge.displayName = "LeverageBadge";
