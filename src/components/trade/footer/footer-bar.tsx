import { ClientOnly } from "@tanstack/react-router";
import { Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { FOOTER_TIME_TICK_MS, UI_TEXT } from "@/constants/app";
import { formatTime } from "@/lib/format";

const FOOTER_TEXT = UI_TEXT.FOOTER;

export function FooterBar() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setTime(new Date()), FOOTER_TIME_TICK_MS);
		return () => clearInterval(interval);
	}, []);

	return (
		<footer className="h-6 border-t border-border/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface/40">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Wifi className="size-3 text-terminal-green" />
					<span className="text-terminal-green">{FOOTER_TEXT.STATUS_CONNECTED}</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>{FOOTER_TEXT.BLOCK_LABEL}</span>
					<span className="tabular-nums text-terminal-cyan">{FOOTER_TEXT.BLOCK_VALUE}</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>{FOOTER_TEXT.GAS_LABEL}</span>
					<span className="tabular-nums text-terminal-amber">{FOOTER_TEXT.GAS_VALUE}</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-muted-foreground">
					{FOOTER_TEXT.LATENCY_LABEL}{" "}
					<span className="tabular-nums text-terminal-green">{FOOTER_TEXT.LATENCY_VALUE}</span>
				</span>
				<div className="h-3 w-px bg-border/60" />
				<ClientOnly>
					<span className="text-muted-foreground tabular-nums">{formatTime(time)}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground">{FOOTER_TEXT.VERSION}</span>
			</div>
		</footer>
	);
}
