import { type ReactNode, Profiler as ReactProfiler } from "react";
import { logRender } from "./render-tracker";

interface Props {
	id: string;
	children: ReactNode;
	enabled?: boolean;
}

function handleRender(
	id: string,
	phase: "mount" | "update" | "nested-update",
	actualDuration: number,
	baseDuration: number,
	startTime: number,
	commitTime: number,
) {
	logRender(id, phase, actualDuration, baseDuration, startTime, commitTime);
}

export function PerfProfiler({ id, children, enabled = import.meta.env.DEV }: Props) {
	if (!enabled) {
		return <>{children}</>;
	}

	return (
		<ReactProfiler id={id} onRender={handleRender}>
			{children}
		</ReactProfiler>
	);
}
