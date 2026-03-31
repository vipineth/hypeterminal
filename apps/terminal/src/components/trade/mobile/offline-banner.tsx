import { ArrowClockwiseIcon, WifiHighIcon, WifiSlashIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
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
				"shrink-0 px-3 py-2.5",
				"flex items-center justify-between gap-2",
				"text-xs font-medium",
				isOnline
					? "bg-fill-success-weak text-text-success border-b border-stroke-success-strong/20"
					: "bg-fill-warning-weak text-text-warning border-b border-stroke-warning-weak/20",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				{isOnline ? (
					<>
						<WifiHighIcon className="size-4" />
						<span>Back online</span>
					</>
				) : (
					<>
						<WifiSlashIcon className="size-4" />
						<span>You're offline</span>
					</>
				)}
			</div>

			{!isOnline && (
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="flex items-center gap-1 rounded-8 px-2 py-1 text-xs font-medium bg-fill-warning-weak hover:bg-fill-warning-weak/80 active:scale-[0.97] transition touch-manipulation"
					>
						<ArrowClockwiseIcon className="size-3" />
						Retry
					</button>
					<button
						type="button"
						onClick={() => setDismissed(true)}
						className="flex items-center justify-center size-7 rounded-8 hover:bg-fill-warning-weak active:scale-[0.97] transition touch-manipulation"
						aria-label="Dismiss"
					>
						<XIcon className="size-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}
