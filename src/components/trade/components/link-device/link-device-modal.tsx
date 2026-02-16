import { DeviceMobileIcon, ShieldWarningIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useMobileSync } from "@/lib/hyperliquid/signing/use-mobile-sync";
import { useLinkDeviceModalActions, useLinkDeviceModalOpen } from "@/stores/use-global-modal-store";
import { ShuffledQrCode } from "./shuffled-qr-code";

export function LinkDeviceModal() {
	const open = useLinkDeviceModalOpen();
	const { close } = useLinkDeviceModalActions();
	const { start, status, payload, error, reset } = useMobileSync();

	const [revealed, setRevealed] = useState(false);
	const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleClose();
		}
	}

	function handleClose() {
		close();
		setRevealed(false);
		reset();
	}

	useEffect(() => {
		if (open && status === "idle") {
			start();
		}
	}, [open, status, start]);

	function handlePointerDown() {
		if (status !== "ready") return;
		holdTimeoutRef.current = setTimeout(() => {
			setRevealed(true);
		}, 150);
	}

	function handlePointerUp() {
		if (holdTimeoutRef.current) {
			clearTimeout(holdTimeoutRef.current);
			holdTimeoutRef.current = null;
		}
		setRevealed(false);
	}

	function handleContextMenu(e: React.MouseEvent) {
		e.preventDefault();
	}

	const isLoading = status === "generating" || status === "approving";

	return (
		<ResponsiveModal open={open} onOpenChange={handleOpenChange}>
			<ResponsiveModalContent className="sm:max-w-md">
				<ResponsiveModalHeader>
					<ResponsiveModalTitle className="flex items-center gap-2">
						<DeviceMobileIcon className="size-5" />
						Link Mobile Device
					</ResponsiveModalTitle>
					<ResponsiveModalDescription>
						Scan this QR code on your mobile device to enable trading.
					</ResponsiveModalDescription>
				</ResponsiveModalHeader>

				<div className="px-6 pb-6 space-y-4">
					{isLoading && (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<SpinnerIcon className="size-8 text-primary-default animate-spin" />
							<span className="text-sm text-text-600">
								{status === "generating" ? "Generating agent key..." : "Approve in wallet..."}
							</span>
						</div>
					)}

					{status === "ready" && payload && (
						<>
							<div className="flex items-start gap-3 p-3 rounded-xs bg-warning-100 border border-warning-700/20">
								<ShieldWarningIcon className="size-5 text-warning-700 shrink-0 mt-0.5" />
								<p className="text-2xs text-warning-700">
									This QR grants trading access. Do not share or screenshot it.
								</p>
							</div>

							<button
								type="button"
								className="flex items-center justify-center py-4 touch-none select-none w-full cursor-default"
								onPointerDown={handlePointerDown}
								onPointerUp={handlePointerUp}
								onPointerLeave={handlePointerUp}
								onContextMenu={handleContextMenu}
							>
								<ShuffledQrCode payload={JSON.stringify(payload)} revealed={revealed} />
							</button>

							<p className="text-2xs text-text-500 text-center">Hold to reveal QR code</p>
						</>
					)}

					{status === "error" && (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<p className="text-sm text-error-700">{error?.message ?? "Failed to generate agent key"}</p>
							<Button variant="outlined" size="sm" onClick={reset}>
								Retry
							</Button>
						</div>
					)}
				</div>
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}
