import { Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function FooterBar() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<footer className="h-6 border-t border-border/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface/40">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Wifi className="size-3 text-terminal-green" />
					<span className="text-terminal-green">Connected</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>Block:</span>
					<span className="tabular-nums text-terminal-cyan">18,942,103</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>Gas:</span>
					<span className="tabular-nums text-terminal-amber">24 gwei</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-muted-foreground">
					Latency: <span className="tabular-nums text-terminal-green">12ms</span>
				</span>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground tabular-nums">{time.toLocaleTimeString()}</span>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground">v0.1.0</span>
			</div>
		</footer>
	);
}
