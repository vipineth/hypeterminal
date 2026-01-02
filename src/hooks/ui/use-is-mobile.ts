import { useEffect, useState } from "react";
import { MOBILE_BREAKPOINT_PX } from "@/constants/app";

export function useIsMobile() {
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
		};

		onChange();
		mql.addEventListener("change", onChange);

		return () => mql.removeEventListener("change", onChange);
	}, []);

	return isMobile ?? false;
}
