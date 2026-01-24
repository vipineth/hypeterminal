import { useEffect, useId } from "react";
import { trackMount, trackUnmount } from "./leak-detector";

export function useLeakTracker(componentName: string) {
	const id = useId();

	useEffect(() => {
		trackMount(componentName, id);
		return () => trackUnmount(componentName, id);
	}, [componentName, id]);
}
