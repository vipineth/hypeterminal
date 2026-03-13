import { useEffect, useState } from "react";

export function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof navigator === "undefined") {
			return true;
		}

		return navigator.onLine;
	});

	useEffect(() => {
		function handleOnline() {
			setIsOnline(true);
		}

		function handleOffline() {
			setIsOnline(false);
		}

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}
