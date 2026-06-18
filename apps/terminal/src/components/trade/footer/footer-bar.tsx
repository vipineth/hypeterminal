import { Divider } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { GithubLogoIcon, SpinnerGapIcon, WifiHighIcon, WifiSlashIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_VERSION, GITHUB_URL } from "@/config/app";
import { APP_BAR_BUTTON_HEIGHT_CLASS, APP_FOOTER_HEIGHT_CLASS } from "@/config/layout";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { type ApiStatus, useApiStatus } from "@/lib/hyperliquid";
import { useCommandMenuActions } from "@/stores/use-global-modal-store";

function getStatusDisplay(status: ApiStatus) {
	switch (status) {
		case "connected":
			return {
				icon: <WifiHighIcon className="size-2.5 text-success" aria-hidden />,
				text: t`Connected`,
				className: "text-success",
			};
		case "connecting":
			return {
				icon: <SpinnerGapIcon className="size-2.5 text-warning animate-spin" aria-hidden />,
				text: t`Connecting`,
				className: "text-warning",
			};
		case "error":
			return {
				icon: <WifiSlashIcon className="size-2.5 text-error" aria-hidden />,
				text: t`Disconnected`,
				className: "text-error",
			};
		default:
			return {
				icon: <WifiHighIcon className="size-2.5 text-fg" aria-hidden />,
				text: t`Offline`,
				className: "text-fg",
			};
	}
}

function FooterClock() {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const interval = window.setInterval(() => setNow(new Date()), 1_000);
		return () => window.clearInterval(interval);
	}, []);

	return <span className="tabular-nums text-fg">{formatTime(now)}</span>;
}

export function FooterBar() {
	const { status } = useApiStatus();
	const { icon, text, className } = getStatusDisplay(status);
	const { open } = useCommandMenuActions();

	return (
		<footer
			className={cn(
				APP_FOOTER_HEIGHT_CLASS,
				"fixed bottom-0 left-0 right-0 z-40 border-t border-stroke-weak px-4 text-3xs font-medium uppercase tracking-wide leading-none flex items-center justify-between bg-background",
			)}
		>
			<div className="flex min-w-0 items-center gap-2">
				<div className="flex min-w-0 items-center gap-1.5">
					{icon}
					<span className={className}>{text}</span>
				</div>
			</div>
			<button
				type="button"
				onClick={open}
				className={cn(
					APP_BAR_BUTTON_HEIGHT_CLASS,
					"absolute left-1/2 flex min-w-8 -translate-x-1/2 items-center justify-center rounded-8 text-fg-muted transition-colors hover:bg-fill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
				)}
				aria-label={t`Open command menu`}
			>
				<kbd className="pointer-events-none rounded-6 border border-stroke-weak bg-sunken px-1 py-px font-sans text-3xs leading-none text-fg-muted">
					{"\u2318K"}
				</kbd>
			</button>
			<div className="flex shrink-0 items-center gap-2.5 text-fg-muted">
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center rounded-6 p-0.5 text-fg-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
					aria-label="GitHub"
				>
					<GithubLogoIcon className="size-2.5" />
				</a>
				<Divider orientation="vertical" className="my-1.5" />
				<ClientOnly>
					<FooterClock />
				</ClientOnly>
				<Divider orientation="vertical" className="my-1.5" />
				<span className="text-fg">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
