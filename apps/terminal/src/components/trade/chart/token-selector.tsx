import { Drawer, DrawerTrigger } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { MARKET_SELECTOR_TRIGGER_CLASSNAME, TokenSelectorTriggerContent } from "./token-selector-trigger";

const TokenSelectorPopup = createLazyComponent(() => import("./token-selector-popup"), "TokenSelectorPopup");

export type TokenSelectorProps = {
	selectedMarket: UnifiedMarketInfo | undefined;
	onValueChange: (value: string) => void;
};

export function TokenSelector({ selectedMarket, onValueChange }: TokenSelectorProps) {
	const isMobile = useIsMobile();
	const headingId = useId();
	const popupId = useId();
	const [open, setOpen] = useState(false);
	const [hasOpened, setHasOpened] = useState(false);
	const preloadPopup = useCallback(() => TokenSelectorPopup.preload?.(), []);
	const handleOpenChange = useCallback((nextOpen: boolean) => {
		if (nextOpen) {
			setHasOpened(true);
		}
		setOpen(nextOpen);
	}, []);

	useEffect(() => {
		if (hasOpened || typeof window === "undefined") return;

		const requestIdleCallback = window.requestIdleCallback?.bind(window);
		const cancelIdleCallback = window.cancelIdleCallback?.bind(window);
		if (requestIdleCallback && cancelIdleCallback) {
			const idleId = requestIdleCallback(() => preloadPopup(), { timeout: 2_000 });
			return () => cancelIdleCallback(idleId);
		}

		const timeoutId = window.setTimeout(preloadPopup, 1_000);
		return () => window.clearTimeout(timeoutId);
	}, [hasOpened, preloadPopup]);

	const popup =
		open || hasOpened ? (
			<Suspense fallback={null}>
				<TokenSelectorPopup
					selectedMarket={selectedMarket}
					onValueChange={onValueChange}
					open={open}
					onOpenChange={handleOpenChange}
					mobile={isMobile}
					headingId={headingId}
					contentId={popupId}
				/>
			</Suspense>
		) : null;

	if (isMobile) {
		return (
			<Drawer side="bottom" open={open} onOpenChange={handleOpenChange}>
				<DrawerTrigger
					role="combobox"
					aria-expanded={open}
					aria-controls={popupId}
					aria-label={t`Select token`}
					className={MARKET_SELECTOR_TRIGGER_CLASSNAME}
					onPointerEnter={preloadPopup}
					onPointerDown={preloadPopup}
					onFocus={preloadPopup}
				>
					<TokenSelectorTriggerContent selectedMarket={selectedMarket} />
				</DrawerTrigger>
				{popup}
			</Drawer>
		);
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					aria-controls={popupId}
					aria-label={t`Select token`}
					className={MARKET_SELECTOR_TRIGGER_CLASSNAME}
					onPointerEnter={preloadPopup}
					onPointerDown={preloadPopup}
					onFocus={preloadPopup}
				>
					<TokenSelectorTriggerContent selectedMarket={selectedMarket} />
				</button>
			</PopoverTrigger>
			{popup}
		</Popover>
	);
}
