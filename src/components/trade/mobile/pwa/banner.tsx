import { ArrowClockwiseIcon, DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface Props {
	className?: string;
}

type NavigatorWithStandalone = Navigator & {
	standalone?: boolean;
};

function isStandaloneMode() {
	if (typeof window === "undefined") return false;
	const isIosStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
	return window.matchMedia("(display-mode: standalone)").matches || isIosStandalone;
}

export function MobilePwaBanner({ className }: Props) {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [dismissInstall, setDismissInstall] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
	const [isPromptingInstall, setIsPromptingInstall] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(display-mode: standalone)");
		const syncStandaloneState = () => setIsStandalone(isStandaloneMode());

		syncStandaloneState();
		mediaQuery.addEventListener("change", syncStandaloneState);
		window.addEventListener("appinstalled", syncStandaloneState);

		return () => {
			mediaQuery.removeEventListener("change", syncStandaloneState);
			window.removeEventListener("appinstalled", syncStandaloneState);
		};
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleBeforeInstallPrompt = (event: Event) => {
			const installEvent = event as BeforeInstallPromptEvent;
			installEvent.preventDefault();
			setDismissInstall(false);
			setInstallPrompt(installEvent);
		};

		const handleAppInstalled = () => {
			setInstallPrompt(null);
			setDismissInstall(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.PROD) return;

		let disposed = false;

		const wireUpdateListener = (swRegistration: ServiceWorkerRegistration) => {
			const setIfWaiting = () => {
				if (swRegistration.waiting && navigator.serviceWorker.controller) {
					setRegistration(swRegistration);
				}
			};

			setIfWaiting();
			swRegistration.addEventListener("updatefound", () => {
				const installingWorker = swRegistration.installing;
				if (!installingWorker) return;

				installingWorker.addEventListener("statechange", () => {
					if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
						setRegistration(swRegistration);
					}
				});
			});
		};

		navigator.serviceWorker
			.register("/sw.js")
			.then((swRegistration) => {
				if (disposed) return;
				wireUpdateListener(swRegistration);
			})
			.catch(() => {
				// Service worker registration is optional enhancement.
			});

		return () => {
			disposed = true;
		};
	}, []);

	const shouldShowInstall = Boolean(installPrompt) && !dismissInstall && !isStandalone;

	const shouldShowUpdate = Boolean(registration?.waiting);
	if (!shouldShowInstall && !shouldShowUpdate) return null;

	async function handleInstall() {
		if (!installPrompt || isPromptingInstall) return;

		setIsPromptingInstall(true);
		try {
			await installPrompt.prompt();
			const choice = await installPrompt.userChoice;
			if (choice.outcome !== "accepted") {
				setDismissInstall(true);
			}
		} finally {
			setInstallPrompt(null);
			setIsPromptingInstall(false);
		}
	}

	function handleRefresh() {
		const waitingWorker = registration?.waiting;
		if (!waitingWorker || isRefreshing) return;

		setIsRefreshing(true);
		waitingWorker.postMessage({ type: "SKIP_WAITING" });
		navigator.serviceWorker.addEventListener(
			"controllerchange",
			() => {
				window.location.reload();
			},
			{ once: true },
		);
	}

	return (
		<div className={cn("fixed inset-x-3 md:hidden z-50", "bottom-[calc(80px+env(safe-area-inset-bottom))]", className)}>
			<div className="rounded-md border border-border-200/70 bg-surface-analysis shadow-md px-3 py-2">
				{shouldShowUpdate ? (
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium text-text-950">Update ready</p>
							<p className="text-xs text-text-600">Reload to use the latest trading and PWA improvements.</p>
						</div>
						<Button
							type="button"
							variant="outlined"
							tone="accent"
							size="sm"
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="min-h-[40px] px-3"
						>
							<ArrowClockwiseIcon className="size-4" aria-hidden />
							<span>{isRefreshing ? "Updating" : "Refresh"}</span>
						</Button>
					</div>
				) : (
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium text-text-950">Install HypeTerminal</p>
							<p className="text-xs text-text-600">Add to your home screen for a native app experience.</p>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="outlined"
								tone="accent"
								size="sm"
								onClick={handleInstall}
								disabled={isPromptingInstall}
								className="min-h-[40px] px-3"
							>
								<DownloadSimpleIcon className="size-4" aria-hidden />
								<span>{isPromptingInstall ? "Installing" : "Install"}</span>
							</Button>
							<Button
								type="button"
								variant="text"
								size="none"
								onClick={() => setDismissInstall(true)}
								className="size-10 rounded-md"
								aria-label="Dismiss install prompt"
							>
								<XIcon className="size-4" aria-hidden />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
