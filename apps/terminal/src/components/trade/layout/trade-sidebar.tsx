import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useIsTestnet } from "@/stores/use-global-settings-store";
import { AccountPanel } from "../tradebox/account-panel";
import { TradePanel } from "../tradebox/trade-panel";

const appHeaderHeightPx = 44;
const appHeaderWithBannerHeightPx = 76;
const appFooterHeightPx = 32;

type SidebarFrame = {
	isPinned: boolean;
	left: number;
	maxHeight: number;
	top: number;
	width: number;
};

export function TradeSidebar() {
	const sidebarRef = useRef<HTMLDivElement>(null);
	const { data: market } = useSelectedMarketInfo();
	const isTestnet = useIsTestnet();
	const formKey = market?.name ?? "default";
	const stickyTopPx = isTestnet ? appHeaderWithBannerHeightPx : appHeaderHeightPx;
	const [frame, setFrame] = useState<SidebarFrame | null>(null);
	const updateMaxHeightRef = useRef<() => void>(() => {});

	const updateMaxHeight = useCallback(() => {
		const sidebar = sidebarRef.current;
		if (!sidebar || typeof window === "undefined") return;

		const panelRect = sidebar.parentElement?.getBoundingClientRect() ?? sidebar.getBoundingClientRect();
		const isPinned = panelRect.top <= stickyTopPx;
		const top = isPinned ? stickyTopPx : panelRect.top;
		const nextFrame = {
			isPinned,
			left: panelRect.left,
			maxHeight: Math.max(0, Math.floor(window.innerHeight - top - appFooterHeightPx)),
			top,
			width: panelRect.width,
		};

		setFrame((current) => {
			if (
				current &&
				current.isPinned === nextFrame.isPinned &&
				current.left === nextFrame.left &&
				current.maxHeight === nextFrame.maxHeight &&
				current.top === nextFrame.top &&
				current.width === nextFrame.width
			) {
				return current;
			}
			return nextFrame;
		});
	}, [stickyTopPx]);
	updateMaxHeightRef.current = updateMaxHeight;

	useLayoutEffect(() => {
		updateMaxHeight();
	}, [updateMaxHeight]);

	useEffect(() => {
		const sidebar = sidebarRef.current;
		if (!sidebar) return;

		function updateFrame() {
			updateMaxHeightRef.current();
		}

		window.addEventListener("resize", updateFrame);
		window.addEventListener("scroll", updateFrame, { passive: true });

		const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateFrame) : null;
		observer?.observe(sidebar);
		if (sidebar.parentElement) observer?.observe(sidebar.parentElement);

		updateFrame();
		return () => {
			window.removeEventListener("resize", updateFrame);
			window.removeEventListener("scroll", updateFrame);
			observer?.disconnect();
		};
	}, []);

	const sidebarStyle: CSSProperties = frame
		? {
				left: frame.isPinned ? frame.left : undefined,
				maxHeight: frame.maxHeight,
				position: frame.isPinned ? "fixed" : "relative",
				top: frame.isPinned ? frame.top : undefined,
				width: frame.isPinned ? frame.width : undefined,
			}
		: {};

	return (
		<div ref={sidebarRef} className="h-full min-h-0 overflow-y-auto overscroll-contain bg-surface" style={sidebarStyle}>
			<div className="flex min-h-full flex-col">
				<TradePanel key={formKey} />
				<div className="flex-1" />
				<AccountPanel />
			</div>
		</div>
	);
}
