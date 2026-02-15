import { ArrowCounterClockwiseIcon, SpinnerIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useQrConnect } from "@/lib/hyperliquid/signing/use-qr-connect";
import { useScanQrModalActions, useScanQrModalOpen } from "@/stores/use-global-modal-store";
import { QrScanner } from "./qr-scanner";

type ScanState = "scanning" | "connecting" | "error";

export function ScanQrModal() {
	const open = useScanQrModalOpen();
	const { close } = useScanQrModalActions();
	const { connect, error: connectError, reset: resetConnect } = useQrConnect();
	const [state, setState] = useState<ScanState>("scanning");
	const [cameraError, setCameraError] = useState<string | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) handleClose();
	}

	function handleClose() {
		close();
		setState("scanning");
		setCameraError(null);
		resetConnect();
	}

	async function handleScan(raw: string) {
		if (state !== "scanning") return;
		setState("connecting");

		try {
			await connect(raw);
			handleClose();
		} catch {
			setState("error");
		}
	}

	function handleCameraError(message: string) {
		setCameraError(message);
		setState("error");
	}

	function handleRetry() {
		setState("scanning");
		setCameraError(null);
		resetConnect();
	}

	const errorMessage = cameraError ?? connectError ?? "Something went wrong";

	return (
		<ResponsiveModal open={open} onOpenChange={handleOpenChange}>
			<ResponsiveModalContent className="sm:max-w-md">
				<ResponsiveModalHeader>
					<ResponsiveModalTitle>Scan QR to Connect</ResponsiveModalTitle>
					<ResponsiveModalDescription>Scan the QR code from your desktop to connect.</ResponsiveModalDescription>
				</ResponsiveModalHeader>

				<div className="px-6 pb-6">
					{state === "scanning" && (
						<ClientOnly fallback={null}>
							<QrScanner onScan={handleScan} onError={handleCameraError} />
						</ClientOnly>
					)}

					{state === "connecting" && (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<SpinnerIcon className="size-8 text-primary-default animate-spin" />
							<span className="text-sm text-text-600">Connecting...</span>
						</div>
					)}

					{state === "error" && (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<WarningCircleIcon className="size-8 text-error-700" />
							<p className="text-sm text-error-700 text-center">{errorMessage}</p>
							<Button variant="outlined" size="sm" onClick={handleRetry}>
								<ArrowCounterClockwiseIcon className="size-4" />
								Retry
							</Button>
						</div>
					)}
				</div>
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}
