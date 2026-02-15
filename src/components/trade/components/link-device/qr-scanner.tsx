import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
	onScan: (decodedText: string) => void;
	onError: (message: string) => void;
}

const SCANNER_ELEMENT_ID = "qr-scanner-region";

export function QrScanner({ onScan, onError }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
	const onScanRef = useRef(onScan);
	const onErrorRef = useRef(onError);
	const [started, setStarted] = useState(false);

	onScanRef.current = onScan;
	onErrorRef.current = onError;

	useEffect(() => {
		let cancelled = false;

		async function startScanner() {
			const { Html5Qrcode } = await import("html5-qrcode");
			if (cancelled) return;

			const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
			scannerRef.current = scanner;

			try {
				await scanner.start(
					{ facingMode: "environment" },
					{ fps: 10, qrbox: { width: 250, height: 250 } },
					(decodedText) => {
						onScanRef.current(decodedText);
					},
					() => {},
				);
				if (!cancelled) setStarted(true);
			} catch (err) {
				if (!cancelled) {
					const message = err instanceof Error ? err.message : "Camera access denied";
					onErrorRef.current(message);
				}
			}
		}

		startScanner();

		return () => {
			cancelled = true;
			const scanner = scannerRef.current;
			if (scanner) {
				scanner.stop().catch(() => {});
				scannerRef.current = null;
			}
		};
	}, []);

	return (
		<div className="relative w-full aspect-square max-w-[320px] mx-auto overflow-hidden rounded-xs">
			<div id={SCANNER_ELEMENT_ID} ref={containerRef} className="size-full" />
			{started && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div
						className={cn(
							"size-[250px] border-2 border-primary-default rounded-xs",
							"shadow-[0_0_0_9999px] shadow-fill-900/40",
						)}
					/>
				</div>
			)}
		</div>
	);
}
