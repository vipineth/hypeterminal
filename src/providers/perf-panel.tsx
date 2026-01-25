import { createContext, useCallback, useContext, useState } from "react";
import { PerfPanel } from "@/components/performance/perf-panel";

const ENABLED_KEY = "perf-panel-enabled";
const VISIBILITY_KEY = "perf-panel-visible";

function checkPerfEnabled(): boolean {
	if (typeof window === "undefined") return false;
	if (import.meta.env.DEV) return true;
	if (import.meta.env.VITE_PERF_PANEL === "true") return true;
	try {
		if (localStorage.getItem(ENABLED_KEY) === "true") return true;
		const url = new URL(window.location.href);
		if (url.searchParams.get("perf") === "true") {
			localStorage.setItem(ENABLED_KEY, "true");
			return true;
		}
	} catch {
		// ignore
	}
	return false;
}

interface PerfPanelContextValue {
	isVisible: boolean;
	isEnabled: boolean;
	show: () => void;
	hide: () => void;
	toggle: () => void;
	enable: () => void;
	disable: () => void;
}

const PerfPanelContext = createContext<PerfPanelContextValue | null>(null);

interface Props {
	children: React.ReactNode;
}

export function PerfPanelProvider({ children }: Props) {
	const [isEnabled, setIsEnabled] = useState(checkPerfEnabled);
	const [isVisible, setIsVisible] = useState(() => {
		if (typeof window === "undefined") return false;
		try {
			return localStorage.getItem(VISIBILITY_KEY) === "true";
		} catch {
			return false;
		}
	});

	const show = useCallback(() => {
		setIsVisible(true);
		try {
			localStorage.setItem(VISIBILITY_KEY, "true");
		} catch {
			// ignore
		}
	}, []);

	const hide = useCallback(() => {
		setIsVisible(false);
		try {
			localStorage.setItem(VISIBILITY_KEY, "false");
		} catch {
			// ignore
		}
	}, []);

	const toggle = useCallback(() => {
		setIsVisible((prev) => {
			const next = !prev;
			try {
				localStorage.setItem(VISIBILITY_KEY, String(next));
			} catch {
				// ignore
			}
			return next;
		});
	}, []);

	const enable = useCallback(() => {
		setIsEnabled(true);
		try {
			localStorage.setItem(ENABLED_KEY, "true");
		} catch {
			// ignore
		}
	}, []);

	const disable = useCallback(() => {
		setIsEnabled(false);
		setIsVisible(false);
		try {
			localStorage.removeItem(ENABLED_KEY);
			localStorage.removeItem(VISIBILITY_KEY);
		} catch {
			// ignore
		}
	}, []);

	return (
		<PerfPanelContext.Provider value={{ isVisible, isEnabled, show, hide, toggle, enable, disable }}>
			{children}
			{isEnabled && isVisible && <PerfPanel onClose={hide} />}
		</PerfPanelContext.Provider>
	);
}

export function usePerfPanel() {
	const ctx = useContext(PerfPanelContext);
	if (!ctx) {
		throw new Error("usePerfPanel must be used within PerfPanelProvider");
	}
	return ctx;
}
