import { WifiSlashIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";

interface Props {
	className?: string;
}

export function OfflineBanner({ className }: Props) {
	const isOnline = useOnlineStatus();
	const [dismissed, setDismissed] = useState(false);
	const [wasOffline, setWasOffline] = useState(false);
	const [showReconnected, setShowReconnected] = useState(false);

	useEffect(() => {
		if (!isOnline) {
			setWasOffline(true);
			setDismissed(false);
		}
	}, [isOnline]);

	useEffect(() => {
		if (isOnline && wasOffline) {
			setShowReconnected(true);
			const timer = setTimeout(() => {
				setShowReconnected(false);
				setWasOffline(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [isOnline, wasOffline]);

	if (isOnline && !showReconnected) return null;
	if (!isOnline && dismissed) return null;

	return (
		<div
			role="alert"
			aria-live="polite"
			className={cn(
				"fixed top-[calc(48px+env(safe-area-inset-top))] inset-x-0 z-50",
				"px-3 py-2",
				"flex items-center justify-between gap-2",
				"text-sm font-medium",
				"animate-in slide-in-from-top-2 duration-300",
				isOnline
					? "bg-market-up-100 text-market-up-600 border-b border-market-up-600/30"
					: "bg-warning-700/20 text-warning-700 border-b border-warning-700/30",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				{isOnline ? (
					<>
						<span className="size-2 rounded-full bg-market-up-600 animate-pulse" />
						<span>Back online - syncing data...</span>
					</>
				) : (
					<>
						<WifiSlashIcon className="size-4" />
						<span>You're offline. Some features may be limited.</span>
					</>
				)}
			</div>

			{!isOnline && (
				<Button
					variant="text"
					size="none"
					onClick={() => setDismissed(true)}
					className={cn(
						"size-8 flex items-center justify-center",
						"rounded-md hover:bg-warning-700/20",
						"transition-colors",
					)}
					aria-label="Dismiss offline notification"
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}
