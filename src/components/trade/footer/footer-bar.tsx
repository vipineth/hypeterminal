import { t } from "@lingui/core/macro";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { APP_VERSION } from "@/config/constants";
import { formatTime } from "@/lib/format";
import { type ApiStatus, useApiStatus } from "@/lib/hyperliquid";

function getStatusDisplay(status: ApiStatus) {
	switch (status) {
		case "connected":
			return {
				icon: <Wifi className="size-3 text-positive" />,
				text: t`Connected`,
				className: "text-positive",
			};
		case "connecting":
			return {
				icon: <Loader2 className="size-3 text-warning animate-spin" />,
				text: t`Connecting`,
				className: "text-warning",
			};
		case "error":
			return {
				icon: <WifiOff className="size-3 text-negative" />,
				text: t`Disconnected`,
				className: "text-negative",
			};
		default:
			return {
				icon: <Wifi className="size-3 text-muted-fg" />,
				text: t`Offline`,
				className: "text-muted-fg",
			};
	}
}

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-border/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<div className="h-3 w-px bg-border/60" />
				<ClientOnly>
					<span className="text-muted-fg tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-fg">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
