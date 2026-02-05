import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { type ComponentProps, type ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTradingGuard } from "@/lib/hyperliquid";

type ButtonProps = ComponentProps<typeof Button>;

interface Props extends Omit<ButtonProps, "onClick"> {
	onClick: () => void | Promise<void>;
	children: ReactNode;
}

export function TradingActionButton({ onClick, children, disabled, className, ...buttonProps }: Props) {
	const { isReady, isEnabling, needsTrading, guardAction } = useTradingGuard();

	const handleClick = useCallback(() => {
		guardAction(onClick);
	}, [guardAction, onClick]);

	const showEnableTrading = needsTrading && !isEnabling;

	return (
		<div className="flex flex-col gap-1">
			<Button
				{...buttonProps}
				variant="link"
				onClick={handleClick}
				disabled={disabled || isEnabling || (!isReady && !needsTrading)}
				className={cn(
					showEnableTrading &&
						"bg-info/20 border-info text-info hover:border-negative hover:text-negative hover:bg-info/30",
					className,
				)}
			>
				{isEnabling ? (
					<>
						<SpinnerGapIcon className="size-3 animate-spin" />
						{t`Enabling`}
					</>
				) : showEnableTrading ? (
					t`Enable`
				) : (
					children
				)}
			</Button>
		</div>
	);
}
