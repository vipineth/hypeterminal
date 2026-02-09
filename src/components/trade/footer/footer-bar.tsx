import { t } from "@lingui/core/macro";
import { GithubLogoIcon, PulseIcon, SpinnerGapIcon, WifiHighIcon, WifiSlashIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { APP_VERSION, GITHUB_URL } from "@/config/constants";
import { formatTime } from "@/lib/format";
import { type ApiStatus, useApiStatus } from "@/lib/hyperliquid";
import { usePerfPanel } from "@/providers/perf-panel";

function getStatusDisplay(status: ApiStatus) {
	switch (status) {
		case "connected":
			return {
				icon: <WifiHighIcon className="size-3 text-market-up-600" />,
				text: t`Connected`,
				className: "text-market-up-600",
			};
		case "connecting":
			return {
				icon: <SpinnerGapIcon className="size-3 text-warning-700 animate-spin" />,
				text: t`Connecting`,
				className: "text-warning-700",
			};
		case "error":
			return {
				icon: <WifiSlashIcon className="size-3 text-market-down-600" />,
				text: t`Disconnected`,
				className: "text-market-down-600",
			};
		default:
			return {
				icon: <WifiHighIcon className="size-3 text-text-950" />,
				text: t`Offline`,
				className: "text-text-950",
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
			className="flex items-center gap-1 hover:text-primary-default transition-colors"
			title="Toggle Performance Panel"
		>
			<PulseIcon className={`size-3 ${isVisible ? "text-primary-default" : "text-text-950"}`} />
			<span className={isVisible ? "text-primary-default" : "text-text-950"}>Perf</span>
		</button>
	);
}

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-border-200/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface-execution">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
				<div className="h-3 w-px bg-border-200/60" />
				<PerfToggle />
			</div>
			<div className="flex items-center gap-3">
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center text-text-950 hover:text-primary-default transition-colors"
					aria-label="GitHub"
				>
					<GithubLogoIcon className="size-3" />
				</a>
				<div className="h-3 w-px bg-border-200/60" />
				<ClientOnly>
					<span className="text-text-950 tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border-200/60" />
				<span className="text-text-950">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
