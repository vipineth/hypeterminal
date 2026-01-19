import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import { type ComponentProps, type ReactNode, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTradingAgent } from "@/lib/hyperliquid";

type ButtonProps = ComponentProps<typeof Button>;

interface Props extends Omit<ButtonProps, "onClick"> {
	onClick: () => void | Promise<void>;
	children: ReactNode;
}

export function TradingActionButton({ onClick, children, disabled, className, ...buttonProps }: Props) {
	const { status, registerStatus, registerAgent } = useTradingAgent();
	const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null);
	const prevStatusRef = useRef(status);

	const isReady = status === "valid";
	const isEnabling = registerStatus === "signing" || registerStatus === "verifying";
	const isLoading = status === "loading";

	useEffect(() => {
		const wasValid = prevStatusRef.current === "valid";
		const isNowValid = status === "valid";

		if (!wasValid && isNowValid && pendingActionRef.current) {
			const action = pendingActionRef.current;
			pendingActionRef.current = null;
			Promise.resolve(action()).catch(() => {});
		}

		if (wasValid && !isNowValid) {
			pendingActionRef.current = null;
		}

		prevStatusRef.current = status;
	}, [status]);

	const handleClick = useCallback(() => {
		if (isReady) {
			onClick();
			return;
		}
		pendingActionRef.current = onClick;
		registerAgent().catch(() => {
			pendingActionRef.current = null;
		});
	}, [isReady, onClick, registerAgent]);

	const showEnableTrading = !isReady && !isLoading;

	return (
		<Button
			{...buttonProps}
			onClick={handleClick}
			disabled={disabled || isEnabling || isLoading}
			className={cn(
				showEnableTrading &&
					!isEnabling &&
					"bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30",
				className,
			)}
		>
			{isEnabling ? (
				<>
					<Loader2 className="size-3 animate-spin" />
					{registerStatus === "signing" ? t`Sign in wallet...` : t`Verifying...`}
				</>
			) : showEnableTrading ? (
				t`Enable Trading`
			) : (
				children
			)}
		</Button>
	);
}
