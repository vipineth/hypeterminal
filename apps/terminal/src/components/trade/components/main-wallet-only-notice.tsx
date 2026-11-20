import { Trans } from "@lingui/react/macro";
import { DesktopIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

interface Props {
	className?: string;
}

export function MainWalletOnlyNotice({ className }: Props) {
	return (
		<p className={cn("flex items-center gap-1.5 text-xs text-fg-muted", className)}>
			<DesktopIcon className="size-3.5 shrink-0" aria-hidden />
			<Trans>Switch to desktop to use your main wallet</Trans>
		</p>
	);
}
