import { t } from "@lingui/core/macro";
import { GithubLogoIcon, SpinnerGapIcon, WifiHighIcon, WifiSlashIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { APP_VERSION, GITHUB_URL } from "@/config/constants";
import { formatTime } from "@/lib/format";
import { type ApiStatus, useApiStatus } from "@/lib/hyperliquid";
import { useCommandMenuActions } from "@/stores/use-global-modal-store";

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

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);
	const { open } = useCommandMenuActions();

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 flex h-8 items-center justify-between border-t border-border-100/80 bg-surface-base/88 px-3 text-[11px] text-text-500 backdrop-blur-xl">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
			</div>
			<button
				type="button"
				onClick={open}
				className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 transition-colors hover:text-text-950"
			>
				<kbd className="ml-0.5 rounded-md border border-border-100 bg-surface-analysis px-1.5 py-0.5 text-[10px] text-text-600">
					{"\u2318K"}
				</kbd>
			</button>
			<div className="flex items-center gap-3">
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center text-text-950 transition-colors hover:text-primary-default"
					aria-label="GitHub"
				>
					<GithubLogoIcon className="size-3" />
				</a>
				<div className="h-3 w-px bg-border-100/80" />
				<ClientOnly>
					<span className="text-text-950 tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border-100/80" />
				<span className="text-text-950">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
