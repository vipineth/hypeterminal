import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
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
	const { isReady, isEnabling, needsTrading, guardAction, error } = useTradingGuard();

	const handleClick = useCallback(() => {
		guardAction(onClick);
	}, [guardAction, onClick]);

	const showEnableTrading = needsTrading && !isEnabling;

	return (
		<div className="flex flex-col gap-1">
			<Button
				{...buttonProps}
				onClick={handleClick}
				disabled={disabled || isEnabling || !isReady && !needsTrading}
				className={cn(
					showEnableTrading &&
						"bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30",
					className,
				)}
			>
				{isEnabling ? (
					<>
						<Loader2 className="size-3 animate-spin" />
						{t`Enabling...`}
					</>
				) : showEnableTrading ? (
					t`Enable Trading`
				) : (
					children
				)}
			</Button>
			{error && <span className="text-4xs text-terminal-red">{error.message}</span>}
		</div>
	);
}
