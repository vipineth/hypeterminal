import { useEffect } from "react";

export function PwaRegistration() {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.PROD) return;

		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Non-blocking progressive enhancement.
		});
	}, []);

	return null;
}
