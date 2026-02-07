import { t } from "@lingui/core/macro";
import { PulseIcon, SpinnerGapIcon, WifiHighIcon, WifiSlashIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { APP_VERSION } from "@/config/constants";
import { formatTime } from "@/lib/format";
import { type ApiStatus, useApiStatus } from "@/lib/hyperliquid";
import { usePerfPanel } from "@/providers/perf-panel";

function getStatusDisplay(status: ApiStatus) {
	switch (status) {
		case "connected":
			return {
				icon: <WifiHighIcon className="size-3 text-market-up-primary" />,
				text: t`Connected`,
				className: "text-market-up-primary",
			};
		case "connecting":
			return {
				icon: <SpinnerGapIcon className="size-3 text-status-warning animate-spin" />,
				text: t`Connecting`,
				className: "text-status-warning",
			};
		case "error":
			return {
				icon: <WifiSlashIcon className="size-3 text-market-down-primary" />,
				text: t`Disconnected`,
				className: "text-market-down-primary",
			};
		default:
			return {
				icon: <WifiHighIcon className="size-3 text-fg-700" />,
				text: t`Offline`,
				className: "text-fg-700",
			};
	}
}

function PerfToggle() {
	const { isVisible, isEnabled, toggle, enable, show } = usePerfPanel();

	function handleClick() {
		if (isEnabled) {
			toggle();
		} else {
			enable();
			show();
		}
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex items-center gap-1 hover:text-status-info transition-colors"
			title="Toggle Performance Panel"
		>
			<PulseIcon className={`size-3 ${isVisible ? "text-status-info" : "text-fg-700"}`} />
			<span className={isVisible ? "text-status-info" : "text-fg-700"}>Perf</span>
		</button>
	);
}

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-border/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface-800">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<PerfToggle />
			</div>
			<div className="flex items-center gap-3">
				<div className="h-3 w-px bg-border/60" />
				<ClientOnly>
					<span className="text-fg-700 tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-fg-700">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
