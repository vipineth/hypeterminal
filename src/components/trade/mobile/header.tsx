import { GearIcon, QrCodeIcon, TerminalIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/config/constants";
import { cn } from "@/lib/cn";
import { useScanQrModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { ThemeToggle } from "../header/theme-toggle";
import { UserMenu } from "../header/user-menu";

const TOP_NAV_TEXT = UI_TEXT.TOP_NAV;

interface Props {
	className?: string;
}

export function MobileHeader({ className }: Props) {
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { open: openScanQr } = useScanQrModalActions();
	const { isConnected } = useConnection();

	return (
		<header
			className={cn(
				"pt-[env(safe-area-inset-top)]",
				"sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm",
				"border-b border-border-200/60",
				className,
			)}
		>
			<div className="h-12 px-3 flex items-center justify-between">
				<div className="size-6 rounded bg-market-up-100 border border-market-up-600/40 flex items-center justify-center">
					<TerminalIcon className="size-3.5 text-market-up-600" />
				</div>

				<div className="flex items-center gap-0.5">
					<UserMenu />
					{!isConnected && (
						<Button
							variant="text"
							size="sm"
							className="size-8 text-text-600 active:bg-surface-analysis/50"
							aria-label="Scan QR to connect"
							onClick={openScanQr}
						>
							<QrCodeIcon className="size-4" />
						</Button>
					)}
					<ThemeToggle />
					<Button
						variant="text"
						size="sm"
						className="size-8 text-text-600 active:bg-surface-analysis/50"
						aria-label={TOP_NAV_TEXT.SETTINGS_ARIA}
						onClick={openSettingsDialog}
					>
						<GearIcon className="size-4" />
					</Button>
				</div>
			</div>
		</header>
	);
}
