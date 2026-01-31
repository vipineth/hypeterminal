import { useCallback, useSyncExternalStore } from "react";
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
