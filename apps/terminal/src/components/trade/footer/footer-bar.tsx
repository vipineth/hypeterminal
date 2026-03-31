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
				icon: <WifiHighIcon className="size-3 text-text-success" />,
				text: t`Connected`,
				className: "text-text-success",
			};
		case "connecting":
			return {
				icon: <SpinnerGapIcon className="size-3 text-text-warning animate-spin" />,
				text: t`Connecting`,
				className: "text-text-warning",
			};
		case "error":
			return {
				icon: <WifiSlashIcon className="size-3 text-text-error" />,
				text: t`Disconnected`,
				className: "text-text-error",
			};
		default:
			return {
				icon: <WifiHighIcon className="size-3 text-text-strong" />,
				text: t`Offline`,
				className: "text-text-strong",
			};
	}
}

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);
	const { open } = useCommandMenuActions();

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-stroke-weak/60 px-2 text-xs uppercase tracking-wider flex items-center justify-between bg-bg-overlay">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
			</div>
			<button
				type="button"
				onClick={open}
				className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-text-weak hover:text-text-strong transition-colors"
			>
				<kbd className="ml-0.5 rounded-8 border border-stroke-weak bg-bg-raised px-1 py-px text-xs text-text-weak">
					{"\u2318K"}
				</kbd>
			</button>
			<div className="flex items-center gap-3">
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center text-text-strong hover:text-text-brand transition-colors"
					aria-label="GitHub"
				>
					<GithubLogoIcon className="size-3" />
				</a>
				<div className="h-3 w-px bg-stroke-weak/60" />
				<ClientOnly>
					<span className="text-text-strong tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-stroke-weak/60" />
				<span className="text-text-strong">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
