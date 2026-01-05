import { t } from "@lingui/core/macro";
import { ClientOnly } from "@tanstack/react-router";
import { Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION, FOOTER_TIME_TICK_MS } from "@/constants/app";
import { formatTime } from "@/lib/format";

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
					<span className="text-terminal-green">{t`Connected`}</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>{t`Block:`}</span>
					<span className="tabular-nums text-terminal-cyan">18,942,103</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>{t`Gas:`}</span>
					<span className="tabular-nums text-terminal-amber">24 gwei</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-muted-foreground">
					{t`Latency:`}{" "}
					<span className="tabular-nums text-terminal-green">12ms</span>
				</span>
				<div className="h-3 w-px bg-border/60" />
				<ClientOnly>
					<span className="text-muted-foreground tabular-nums">{formatTime(time)}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
