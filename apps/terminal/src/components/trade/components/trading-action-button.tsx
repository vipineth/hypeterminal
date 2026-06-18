import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { type ComponentProps, type ReactNode, useCallback } from "react";
import { useTradingGuard } from "@/lib/hyperliquid";

type ButtonProps = ComponentProps<typeof Button>;

interface Props extends Omit<ButtonProps, "onClick"> {
	onClick: () => void | Promise<void>;
	children: ReactNode;
}

export function TradingActionButton({
	onClick,
	children,
	disabled,
	className,
	variant = "filled",
	intent = "neutral",
	...buttonProps
}: Props) {
	const { isReady, isEnabling, needsTrading, guardAction } = useTradingGuard();

	const runGuardedAction = useCallback(() => {
		guardAction(onClick);
	}, [guardAction, onClick]);

	const showEnableTrading = needsTrading && !isEnabling;

	return (
		<div className="flex flex-col gap-1 items-end">
			<Button
				{...buttonProps}
				variant={variant}
				intent={intent}
				onClick={runGuardedAction}
				disabled={disabled || isEnabling || (!isReady && !needsTrading)}
				className={className}
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
