import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type FlashDirection = "up" | "down" | null;

type FlashProps = {
	value: number;
	children: ReactNode;
	className?: string;
	timeout?: number;
	transitionLength?: number;
	upColor?: string;
	downColor?: string;
};

export function Flash({
	value,
	children,
	className,
	timeout = 200,
	transitionLength = 100,
	upColor = "oklch(from var(--terminal-green) l c h / 0.35)",
	downColor = "oklch(from var(--terminal-red) l c h / 0.35)",
}: FlashProps) {
	const prevRef = useRef(value);
	const [flash, setFlash] = useState<FlashDirection>(null);

	useEffect(() => {
		if (prevRef.current === value) {
			setFlash(null);
			return;
		}

		setFlash(value > prevRef.current ? "up" : "down");

		const timer = setTimeout(() => setFlash(null), timeout);
		prevRef.current = value;

		return () => clearTimeout(timer);
	}, [value, timeout]);

	const style: CSSProperties = {
		transition: `background-color ${transitionLength}ms ease-in-out`,
		backgroundColor: flash === "up" ? upColor : flash === "down" ? downColor : undefined,
	};

	return (
		<span className={cn(className)} style={style}>
			{children}
		</span>
	);
}
