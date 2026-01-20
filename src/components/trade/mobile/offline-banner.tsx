import { WifiOff, X } from "lucide-react";
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
					? "bg-positive/20 text-positive border-b border-positive/30"
					: "bg-warning/20 text-warning border-b border-warning/30",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				{isOnline ? (
					<>
						<span className="size-2 rounded-full bg-positive animate-pulse" />
						<span>Back online - syncing data...</span>
					</>
				) : (
					<>
						<WifiOff className="size-4" />
						<span>You're offline. Some features may be limited.</span>
					</>
				)}
			</div>

			{!isOnline && (
				<Button
					variant="ghost"
					size="none"
					onClick={() => setDismissed(true)}
					className={cn(
						"size-8 flex items-center justify-center",
						"rounded-md hover:bg-warning/20",
						"transition-colors",
					)}
					aria-label="Dismiss offline notification"
				>
					<X className="size-4" />
				</Button>
			)}
		</div>
	);
}
