import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { MOBILE_BREAKPOINT_PX } from "@/config/constants";

function subscribeToMediaQuery(callback: () => void): () => void {
	const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

function getIsMobile(): boolean {
	if (typeof window === "undefined") return false;
	return window.innerWidth < MOBILE_BREAKPOINT_PX;
}

function getServerSnapshot(): boolean {
	return false;
}

export function useIsMobile(): boolean {
	return useSyncExternalStore(subscribeToMediaQuery, getIsMobile, getServerSnapshot);
}

export function useMobileContext() {
	const isMobile = useIsMobile();
	const [hasTouchScreen, setHasTouchScreen] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [safeAreaInsets, setSafeAreaInsets] = useState({
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});

	useEffect(() => {
		setHasTouchScreen("ontouchstart" in window || navigator.maxTouchPoints > 0);
		const isInstalledPwa =
			window.matchMedia("(display-mode: standalone)").matches ||
			// @ts-expect-error - iOS Safari specific
			window.navigator?.standalone === true;
		setIsStandalone(isInstalledPwa);

		const computeInsets = () => {
			const style = getComputedStyle(document.documentElement);
			setSafeAreaInsets({
				top: Number.parseInt(style.getPropertyValue("--sat") || "0", 10),
				right: Number.parseInt(style.getPropertyValue("--sar") || "0", 10),
				bottom: Number.parseInt(style.getPropertyValue("--sab") || "0", 10),
				left: Number.parseInt(style.getPropertyValue("--sal") || "0", 10),
			});
		};

		computeInsets();
		window.addEventListener("resize", computeInsets);
		return () => window.removeEventListener("resize", computeInsets);
	}, []);

	return {
		isMobile,
		hasTouchScreen,
		isStandalone,
		safeAreaInsets,
		useMobileLayout: isMobile || (hasTouchScreen && window.innerWidth < 1024),
	};
}

export function usePrefersReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mql.matches);

		const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return prefersReducedMotion;
}

export function useOnlineStatus(): boolean {
	const getOnline = useCallback(() => navigator.onLine, []);

	return useSyncExternalStore(
		(callback) => {
			window.addEventListener("online", callback);
			window.addEventListener("offline", callback);
			return () => {
				window.removeEventListener("online", callback);
				window.removeEventListener("offline", callback);
			};
		},
		getOnline,
		() => true,
	);
}

export function useVirtualKeyboardVisible(): boolean {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!("visualViewport" in window)) return;

		const viewport = window.visualViewport;
		if (!viewport) return;

		const handleResize = () => {
			const heightDiff = window.innerHeight - viewport.height;
			setIsVisible(heightDiff > 150);
		};

		viewport.addEventListener("resize", handleResize);
		return () => viewport.removeEventListener("resize", handleResize);
	}, []);

	return isVisible;
}
