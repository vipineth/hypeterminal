import { t } from "@lingui/core/macro";
import { ClientOnly } from "@tanstack/react-router";
import { Wifi } from "lucide-react";
import { APP_VERSION } from "@/config/constants";
import { formatTime } from "@/lib/format";

export function FooterBar() {
	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-border/60 px-2 text-4xs uppercase tracking-wider flex items-center justify-between bg-surface">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Wifi className="size-3 text-positive" />
					<span className="text-positive">{t`Connected`}</span>
				</div>
				{/* <div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-fg">
					<span>{t`Block:`}</span>
					<span className="tabular-nums text-info">18,942,103</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-fg">
					<span>{t`Gas:`}</span>
					<span className="tabular-nums text-warning">24 gwei</span>
				</div> */}
			</div>
			<div className="flex items-center gap-3">
				<div className="h-3 w-px bg-border/60" />
				<ClientOnly>
					<span className="text-muted-fg tabular-nums">{formatTime(new Date())}</span>
				</ClientOnly>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-fg">{APP_VERSION}</span>
			</div>
		</footer>
	);
}
