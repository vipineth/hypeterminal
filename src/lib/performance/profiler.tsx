import { type ProfilerOnRenderCallback, type ReactNode, Profiler as ReactProfiler } from "react";
import { logRender } from "./render-tracker";

interface Props {
	id: string;
	children: ReactNode;
	enabled?: boolean;
}

const onRenderCallback: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
	logRender(id, phase, actualDuration, baseDuration, startTime, commitTime);
};

export function PerfProfiler({ id, children, enabled = import.meta.env.DEV }: Props) {
	if (!enabled) {
		return <>{children}</>;
	}

	return (
		<ReactProfiler id={id} onRender={onRenderCallback}>
			{children}
		</ReactProfiler>
	);
}
