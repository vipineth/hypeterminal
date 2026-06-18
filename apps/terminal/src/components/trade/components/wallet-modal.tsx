import { Button, Drawer, DrawerContent, Modal, ModalContent, ModalPopup, TextInput } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowSquareOutIcon,
	CaretDownIcon,
	CopyIcon,
	DeviceMobileIcon,
	FlaskIcon,
	LinkIcon,
	QrCodeIcon,
	SpinnerGapIcon,
	WalletIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import { type Connector, useConnect, useConnectors } from "wagmi";
import { mock } from "wagmi/connectors";
import { MOCK_WALLETS } from "@/config/wagmi";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import {
	classifyQrValue,
	type QrFeedbackThrottleState,
	shouldShowQrFeedback,
} from "@/lib/mobile-sync/qr-classification";
import {
	addRecentWallet,
	getRecentWallets,
	getWalletConnectorGroups,
	getWalletInfo,
	isMockConnector,
	isWalletConnectConnector,
	subscribeWalletConnectUri,
} from "@/lib/wallet-utils";

const WALLET_LIST_MAX_HEIGHT = "max-h-[min(55vh,22rem)]";
const DRAWER_HANDLE_SIZE_CLASS = "w-8 h-1";
const WRONG_QR_FEEDBACK_THROTTLE_MS = 1800;

type ScannerDetectionResult = "stop" | "continue";

type BarcodeDetectorConstructor = new (options?: {
	formats?: string[];
}) => {
	detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

type WindowWithBarcodeDetector = Window &
	typeof globalThis & {
		BarcodeDetector?: BarcodeDetectorConstructor;
	};

type WalletConnectPairingClient = {
	core?: {
		pairing?: {
			activate?: (parameters: { topic: string }) => Promise<unknown>;
		};
	};
	pair?: (parameters: { activatePairing?: boolean; uri: string }) => Promise<unknown>;
};

type WalletConnectProviderWithPairing = {
	client?: WalletConnectPairingClient;
	signer?: {
		client?: WalletConnectPairingClient;
	};
};

function getWalletConnectPairingTopic(uri: string) {
	return /^wc:([^@]+)@2(?:\?|$)/.exec(uri)?.[1] ?? null;
}

async function pairWalletConnectUri(connector: Connector, uri: string) {
	const provider = (await connector.getProvider?.()) as WalletConnectProviderWithPairing | undefined;
	const pairingClient = provider?.client ?? provider?.signer?.client;
	if (typeof pairingClient?.pair !== "function") return;
	const pairingTopic = getWalletConnectPairingTopic(uri);
	await pairingClient.pair({ activatePairing: true, uri });
	if (pairingTopic && typeof pairingClient.core?.pairing?.activate === "function") {
		await pairingClient.core.pairing.activate({ topic: pairingTopic });
	}
}

function ConnectorRow({
	connector,
	isPending,
	connectingId,
	isRecent,
	onConnect,
}: {
	connector: Connector;
	isPending: boolean;
	connectingId: string | null;
	isRecent: boolean;
	onConnect: (connector: Connector) => void;
}) {
	const walletInfo = getWalletInfo(connector);
	const Icon = walletInfo.icon;
	const isConnecting = connectingId === connector.uid;

	return (
		<button
			type="button"
			onClick={() => onConnect(connector)}
			disabled={isPending}
			className={cn(
				"w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer text-left",
				"hover:bg-fill-hover active:bg-fill-press",
				"focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stroke-focus",
				"disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
				"group",
			)}
		>
			<div className="size-8 rounded-xs overflow-hidden flex-shrink-0" aria-hidden="true">
				<Icon className="size-full" />
			</div>
			<span className="flex-1 text-sm font-medium group-hover:text-brand transition-colors min-w-0 truncate">
				{connector.name}
			</span>
			{isRecent && (
				<span className="text-2xs uppercase tracking-wider font-medium text-fg-muted bg-fill-weak px-1.5 py-0.5 rounded-xs flex-shrink-0">
					<Trans>Recent</Trans>
				</span>
			)}
			{isConnecting ? (
				<SpinnerGapIcon
					className="size-3.5 animate-spin motion-reduce:animate-none text-brand flex-shrink-0"
					aria-hidden="true"
				/>
			) : (
				<CaretDownIcon
					className="size-3 -rotate-90 text-icon flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
					aria-hidden="true"
				/>
			)}
		</button>
	);
}

function LinkDesktopWalletRow({
	isPending,
	isConnecting,
	onOpenScanner,
}: {
	isPending: boolean;
	isConnecting: boolean;
	onOpenScanner: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpenScanner}
			disabled={isPending || isConnecting}
			className={cn(
				"m-3 w-[calc(100%-1.5rem)] flex items-center gap-3 rounded-xs border border-stroke-brand-strong/30 bg-fill-weak px-3 py-3 cursor-pointer text-left",
				"hover:bg-fill-hover active:bg-fill-press",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
				"disabled:opacity-50 disabled:cursor-not-allowed transition-colors group",
			)}
		>
			<div
				className="size-9 rounded-xs bg-brand/10 text-brand flex items-center justify-center flex-shrink-0"
				aria-hidden="true"
			>
				<QrCodeIcon className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-fg group-hover:text-brand transition-colors">
					<Trans>Link desktop wallet</Trans>
				</p>
				<p className="mt-0.5 text-xs text-fg-muted">
					<Trans>Scan a QR code from a desktop wallet.</Trans>
				</p>
			</div>
			{isConnecting ? (
				<SpinnerGapIcon
					className="size-3.5 animate-spin motion-reduce:animate-none text-brand flex-shrink-0"
					aria-hidden="true"
				/>
			) : (
				<CaretDownIcon
					className="size-3 -rotate-90 text-icon flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
					aria-hidden="true"
				/>
			)}
		</button>
	);
}

function DesktopWalletScannerPanel({
	errorMessage,
	isConnecting,
	onCancel,
	onQrValue,
}: {
	errorMessage: string | null;
	isConnecting: boolean;
	onCancel: () => void;
	onQrValue: (value: string) => ScannerDetectionResult;
}) {
	const titleId = useId();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [manualUri, setManualUri] = useState("");
	const visibleError = errorMessage ?? cameraError;
	const hasQrTypeError = !!errorMessage;

	function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!manualUri.trim()) return;
		const result = onQrValue(manualUri);
		if (result === "stop") setManualUri("");
	}

	useEffect(() => {
		panelRef.current?.focus();
	}, []);

	useEffect(() => {
		if (isConnecting) {
			setCameraReady(false);
			return;
		}

		let animationFrame = 0;
		let cancelled = false;
		let decoderUnavailable = false;
		let canvas: HTMLCanvasElement | null = null;
		let context: CanvasRenderingContext2D | null = null;
		let jsQrDecoder: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null =
			null;
		let stream: MediaStream | null = null;

		async function readQrCode(video: HTMLVideoElement) {
			const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
			if (BarcodeDetector) {
				try {
					const detector = new BarcodeDetector({ formats: ["qr_code"] });
					const codes = await detector.detect(video);
					const detectedValue = codes.find(
						(code) => typeof code.rawValue === "string" && code.rawValue.length > 0,
					)?.rawValue;
					return detectedValue ?? null;
				} catch {
					// Fall back to canvas decoding below.
				}
			}

			if (decoderUnavailable) return null;

			if (!jsQrDecoder) {
				try {
					jsQrDecoder = (await import("jsqr")).default;
				} catch {
					decoderUnavailable = true;
					setCameraError(t`QR scanning is not available in this browser.`);
					return null;
				}
			}

			if (!canvas) canvas = document.createElement("canvas");
			if (!context) context = canvas.getContext("2d", { willReadFrequently: true });
			if (!context) return null;

			const width = video.videoWidth;
			const height = video.videoHeight;
			if (width <= 0 || height <= 0) return null;

			canvas.width = width;
			canvas.height = height;
			context.drawImage(video, 0, 0, width, height);
			const imageData = context.getImageData(0, 0, width, height);
			return jsQrDecoder(imageData.data, width, height)?.data ?? null;
		}

		async function scanNextFrame() {
			if (cancelled) return;
			const video = videoRef.current;
			if (video) {
				const detectedValue = await readQrCode(video);
				if (cancelled) return;
				if (detectedValue) {
					const result = onQrValue(detectedValue);
					if (result === "stop") {
						cancelled = true;
						if (animationFrame) window.cancelAnimationFrame(animationFrame);
						stream?.getTracks().forEach((track) => {
							track.stop();
						});
						return;
					}
				}
			}
			if (cancelled) return;
			animationFrame = window.requestAnimationFrame(scanNextFrame);
		}

		async function startCamera() {
			setCameraReady(false);
			setCameraError(null);

			async function requestCameraStream() {
				try {
					return await navigator.mediaDevices.getUserMedia({
						audio: false,
						video: { facingMode: { ideal: "environment" } },
					});
				} catch (error) {
					if (
						error instanceof DOMException &&
						(error.name === "OverconstrainedError" || error.name === "NotFoundError")
					) {
						return await navigator.mediaDevices.getUserMedia({
							audio: false,
							video: true,
						});
					}
					throw error;
				}
			}

			try {
				if (!navigator.mediaDevices?.getUserMedia) {
					setCameraError(t`Camera access is not available in this browser.`);
					return;
				}

				const cameraStream = await requestCameraStream();
				if (cancelled) {
					cameraStream.getTracks().forEach((track) => {
						track.stop();
					});
					return;
				}

				stream = cameraStream;
				const video = videoRef.current;
				if (video) {
					video.srcObject = cameraStream;
					await video.play().catch(() => undefined);
				}
				if (cancelled) return;

				setCameraReady(true);
				animationFrame = window.requestAnimationFrame(scanNextFrame);
			} catch (error) {
				if (cancelled) return;
				if (error instanceof DOMException && error.name === "NotFoundError") {
					setCameraError(t`No camera was found on this device.`);
					return;
				}
				if (error instanceof DOMException && error.name === "NotReadableError") {
					setCameraError(t`Could not open the camera.`);
					return;
				}
				setCameraError(
					error instanceof DOMException && error.name === "NotAllowedError"
						? t`Camera permission was denied.`
						: t`Could not open the camera.`,
				);
			}
		}

		startCamera();

		return () => {
			cancelled = true;
			if (animationFrame) window.cancelAnimationFrame(animationFrame);
			stream?.getTracks().forEach((track) => {
				track.stop();
			});
			if (videoRef.current) videoRef.current.srcObject = null;
		};
	}, [isConnecting, onQrValue]);

	return (
		<section
			ref={panelRef}
			tabIndex={-1}
			aria-labelledby={titleId}
			className="flex max-h-[min(76dvh,40rem)] flex-col gap-3 px-4 pb-4 focus:outline-none"
		>
			<div className="flex items-start gap-2">
				<QrCodeIcon className="size-4 text-brand mt-0.5 shrink-0" aria-hidden="true" />
				<div className="min-w-0 space-y-0.5">
					<p id={titleId} className="text-sm font-semibold text-fg">
						{hasQrTypeError ? <Trans>Wrong QR type</Trans> : <Trans>Scan WalletConnect QR</Trans>}
					</p>
					<p className="text-xs text-fg-muted">
						{isConnecting ? (
							<Trans>Connecting</Trans>
						) : cameraReady ? (
							<Trans>Looking for a WalletConnect QR code</Trans>
						) : (
							<Trans>Point your camera at the WalletConnect QR code on your desktop wallet.</Trans>
						)}
					</p>
				</div>
			</div>

			<div className="relative min-h-0 overflow-hidden rounded-xs border border-stroke-weak bg-fill">
				<video
					ref={videoRef}
					aria-label={t`Desktop wallet QR scanner`}
					autoPlay
					muted
					playsInline
					className="aspect-[4/3] max-h-[min(48dvh,24rem)] w-full bg-neutral-950 object-cover"
				/>
				<div className="pointer-events-none absolute inset-[18%] rounded-xs border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
				{isConnecting && (
					<div className="absolute inset-0 flex items-center justify-center bg-fill/80 backdrop-blur-sm">
						<div className="flex items-center gap-2 text-sm font-medium text-fg">
							<SpinnerGapIcon
								className="size-4 animate-spin motion-reduce:animate-none text-brand"
								aria-hidden="true"
							/>
							<Trans>Connecting desktop wallet</Trans>
						</div>
					</div>
				)}
			</div>

			{visibleError ? (
				<p role="alert" className="text-xs text-error">
					{visibleError}
				</p>
			) : (
				<p className="text-xs text-fg-muted">
					{cameraReady ? (
						<Trans>Camera is on. Looking for a WalletConnect QR code.</Trans>
					) : (
						<Trans>Opening camera...</Trans>
					)}
				</p>
			)}

			<form className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleManualSubmit}>
				<TextInput
					aria-label={t`Paste WalletConnect URI`}
					value={manualUri}
					onChange={(event: ChangeEvent<HTMLInputElement>) => setManualUri(event.target.value)}
					placeholder={t`Paste WalletConnect URI`}
					autoCapitalize="none"
					autoCorrect="off"
					inputMode="url"
					spellCheck={false}
					disabled={isConnecting}
				/>
				<Button type="submit" variant="outline" intent="neutral" size="md" disabled={isConnecting || !manualUri.trim()}>
					<Trans>Connect</Trans>
				</Button>
			</form>

			<button
				type="button"
				onClick={onCancel}
				className={cn(
					"sticky bottom-0 z-10 inline-flex h-11 w-full items-center justify-center rounded-xs border border-stroke-weak px-3 text-sm font-medium",
					"bg-fill-weak text-fg hover:bg-fill-hover active:bg-fill-press transition-colors",
					"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
				)}
			>
				<Trans>Back</Trans>
			</button>
		</section>
	);
}

function WalletConnectPairingPanel({ uri, isMobile }: { uri: string; isMobile: boolean }) {
	const [copied, setCopied] = useState(false);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [qrError, setQrError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setQrDataUrl(null);
		setQrError(null);

		async function renderQr() {
			try {
				const QRCode = await import("qrcode");
				const dataUrl = await QRCode.toDataURL(uri, {
					errorCorrectionLevel: "M",
					margin: 1,
					width: 224,
					color: {
						dark: "#111827",
						light: "#FFFFFF",
					},
				});
				if (!cancelled) setQrDataUrl(dataUrl);
			} catch {
				if (!cancelled) setQrError(t`Could not render QR`);
			}
		}

		renderQr();

		return () => {
			cancelled = true;
		};
	}, [uri]);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(uri);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	}

	return (
		<div className="mx-4 mb-3 rounded-xs border border-stroke-brand-strong/25 bg-fill-weak p-3 space-y-3">
			<div className="flex items-start gap-2">
				<LinkIcon className="size-4 text-brand mt-0.5 shrink-0" aria-hidden="true" />
				<div className="min-w-0 space-y-0.5">
					<p className="text-sm font-medium text-fg">
						<Trans>WalletConnect pairing ready</Trans>
					</p>
					<p className="text-xs text-fg-muted">
						{isMobile ? (
							<Trans>Scan this QR with your desktop wallet.</Trans>
						) : (
							<Trans>Scan this QR with your mobile wallet.</Trans>
						)}
					</p>
				</div>
			</div>
			<div className="flex justify-center rounded-xs border border-stroke-weak bg-white p-3">
				{qrDataUrl ? (
					<img src={qrDataUrl} alt={t`WalletConnect QR code`} className="size-56 max-w-full" />
				) : qrError ? (
					<div className="flex h-56 w-56 items-center justify-center text-center text-xs font-semibold text-error">
						{qrError}
					</div>
				) : (
					<div className="flex h-56 w-56 items-center justify-center">
						<SpinnerGapIcon className="size-5 animate-spin motion-reduce:animate-none text-brand" aria-hidden="true" />
					</div>
				)}
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{isMobile && (
					<a
						href={uri}
						className={cn(
							"inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xs text-sm font-medium",
							"bg-brand text-fg-inverse hover:bg-brand-hover active:bg-brand-press transition-colors",
							"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
						)}
					>
						<DeviceMobileIcon className="size-4" aria-hidden="true" />
						<Trans>Open wallet</Trans>
					</a>
				)}
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						"inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xs text-sm font-medium",
						"border border-stroke-weak bg-fill hover:bg-fill-hover active:bg-fill-press transition-colors",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
						!isMobile && "sm:col-span-2",
					)}
				>
					<CopyIcon className="size-4" aria-hidden="true" />
					{copied ? <Trans>Copied</Trans> : <Trans>Copy link</Trans>}
				</button>
			</div>
		</div>
	);
}

function WalletContent({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
	const connectors = useConnectors();
	const { mutateAsync: connectAsync, isPending, error } = useConnect();
	const [connectingId, setConnectingId] = useState<string | null>(null);
	const [walletConnectUri, setWalletConnectUri] = useState<string | null>(null);
	const [desktopWalletScannerOpen, setDesktopWalletScannerOpen] = useState(false);
	const [desktopWalletScannerError, setDesktopWalletScannerError] = useState<string | null>(null);
	const lastScannerFeedbackRef = useRef<QrFeedbackThrottleState | null>(null);
	const [showAll, setShowAll] = useState(false);
	const [showMock, setShowMock] = useState(false);
	const [recentWallets] = useState(() => getRecentWallets());
	const [customAddress, setCustomAddress] = useState("");
	const [customAddressError, setCustomAddressError] = useState<string | null>(null);

	const { mockConnectors, popular, other } = getWalletConnectorGroups(connectors, recentWallets);
	const walletConnectConnector = connectors.find(isWalletConnectConnector) ?? null;
	const showDesktopWalletLink = isMobile && walletConnectConnector !== null;

	const handleScannedWalletConnectUri = useCallback(
		async (uri: string) => {
			if (!walletConnectConnector) return;

			const pairingTopic = getWalletConnectPairingTopic(uri);
			if (!pairingTopic) {
				setDesktopWalletScannerError(t`Scan a WalletConnect QR code.`);
				return;
			}

			setDesktopWalletScannerError(null);
			setConnectingId(walletConnectConnector.uid);
			try {
				await pairWalletConnectUri(walletConnectConnector, uri);
				await connectAsync({ connector: walletConnectConnector, pairingTopic } as Parameters<typeof connectAsync>[0] & {
					pairingTopic: string;
				});
				addRecentWallet(walletConnectConnector.id);
				onClose();
			} catch (error) {
				setDesktopWalletScannerError(error instanceof Error ? error.message : t`Failed to link desktop wallet`);
			} finally {
				setConnectingId(null);
			}
		},
		[connectAsync, onClose, walletConnectConnector],
	);

	const showScannerFeedback = useCallback((message: string) => {
		const nowMs = Date.now();
		const lastFeedback = lastScannerFeedbackRef.current;
		if (!shouldShowQrFeedback(lastFeedback, message, nowMs, WRONG_QR_FEEDBACK_THROTTLE_MS)) return;

		lastScannerFeedbackRef.current = { message, atMs: nowMs };
		setDesktopWalletScannerError(message);
	}, []);

	const handleScannerQrValue = useCallback(
		(value: string): ScannerDetectionResult => {
			const classification = classifyQrValue(value);
			if (classification.type === "walletconnect") {
				if (!getWalletConnectPairingTopic(classification.uri)) {
					showScannerFeedback(t`Scan a WalletConnect QR code.`);
					return "continue";
				}
				handleScannedWalletConnectUri(classification.uri);
				return "stop";
			}
			if (classification.type === "phoneAccessLink") {
				showScannerFeedback(
					t`This is a phone-access QR. Open it with the phone camera or paste it on the phone access page.`,
				);
				return "continue";
			}

			showScannerFeedback(t`This is not a WalletConnect QR code.`);
			return "continue";
		},
		[handleScannedWalletConnectUri, showScannerFeedback],
	);

	async function handleConnect(connector: Connector) {
		setConnectingId(connector.uid);
		setDesktopWalletScannerOpen(false);
		setDesktopWalletScannerError(null);
		if (isWalletConnectConnector(connector)) setWalletConnectUri(null);
		const unsubscribeWalletConnectUri = subscribeWalletConnectUri(connector, setWalletConnectUri);
		try {
			await connectAsync({ connector });
			if (!isMockConnector(connector)) {
				addRecentWallet(connector.id);
			}
			onClose();
		} finally {
			unsubscribeWalletConnectUri();
			if (isWalletConnectConnector(connector)) setWalletConnectUri(null);
			setConnectingId(null);
		}
	}

	async function handleCustomAddressConnect() {
		const trimmed = customAddress.trim();
		if (!trimmed) {
			setCustomAddressError(t`Please enter an address`);
			return;
		}
		if (!isAddress(trimmed)) {
			setCustomAddressError(t`Invalid Ethereum address`);
			return;
		}
		setCustomAddressError(null);

		const mockWalletIndex = MOCK_WALLETS.findIndex((w) => w.address.toLowerCase() === trimmed.toLowerCase());

		if (mockWalletIndex !== -1 && mockConnectors[mockWalletIndex]) {
			await handleConnect(mockConnectors[mockWalletIndex]);
		} else {
			const customMockConnector = mock({
				accounts: [trimmed as Address],
				features: { reconnect: true },
			});
			setConnectingId("custom-mock");
			try {
				await connectAsync({ connector: customMockConnector });
				onClose();
			} catch {
				setCustomAddressError(t`Failed to connect with custom address`);
			} finally {
				setConnectingId(null);
			}
		}
	}

	const hasConnectors = popular.length > 0 || other.length > 0 || mockConnectors.length > 0;
	const shouldPromoteWalletConnectRow =
		showDesktopWalletLink &&
		walletConnectConnector !== null &&
		!showAll &&
		!popular.some((connector) => connector.uid === walletConnectConnector.uid);
	const visibleConnectors = showAll
		? [...popular, ...other]
		: shouldPromoteWalletConnectRow
			? [...popular, walletConnectConnector]
			: popular;
	const otherConnectors =
		showDesktopWalletLink && walletConnectConnector
			? other.filter((connector) => connector.uid !== walletConnectConnector.uid)
			: other;
	const isScannerMode = desktopWalletScannerOpen && walletConnectConnector !== null;

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-4 pt-4 pb-3">
				{isMobile && (
					<div
						className={cn(DRAWER_HANDLE_SIZE_CLASS, "absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-fill/20")}
						aria-hidden="true"
					/>
				)}
				<div className="flex items-center gap-2">
					<WalletIcon className="size-4 text-brand" weight="duotone" aria-hidden="true" />
					<h2 className="text-sm font-semibold text-fg">
						<Trans>Connect Wallet</Trans>
					</h2>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label={t`Close`}
					className="flex items-center justify-center size-8 rounded-8 text-icon hover:bg-fill-hover active:bg-fill-press cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-stroke-focus focus-visible:outline-offset-2"
				>
					<XIcon size={16} weight="bold" aria-hidden="true" />
				</button>
			</div>

			<div
				className={cn(
					"overflow-y-auto overscroll-contain",
					isScannerMode ? "max-h-[min(82dvh,42rem)]" : WALLET_LIST_MAX_HEIGHT,
				)}
			>
				{isScannerMode && walletConnectConnector ? (
					<DesktopWalletScannerPanel
						errorMessage={desktopWalletScannerError}
						isConnecting={connectingId === walletConnectConnector.uid}
						onCancel={() => {
							setDesktopWalletScannerOpen(false);
							setDesktopWalletScannerError(null);
						}}
						onQrValue={handleScannerQrValue}
					/>
				) : hasConnectors ? (
					<>
						{showDesktopWalletLink && walletConnectConnector && (
							<LinkDesktopWalletRow
								isPending={isPending}
								isConnecting={connectingId === walletConnectConnector.uid}
								onOpenScanner={() => {
									setWalletConnectUri(null);
									setDesktopWalletScannerError(null);
									setDesktopWalletScannerOpen(true);
								}}
							/>
						)}

						<div className="divide-y divide-stroke-weak/30">
							{visibleConnectors.map((connector) => (
								<ConnectorRow
									key={connector.uid}
									connector={connector}
									isPending={isPending}
									connectingId={connectingId}
									isRecent={recentWallets.includes(connector.id)}
									onConnect={handleConnect}
								/>
							))}
						</div>

						{otherConnectors.length > 0 && (
							<button
								type="button"
								onClick={() => setShowAll((v) => !v)}
								aria-expanded={showAll}
								className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-fg-muted hover:text-fg hover:bg-fill-hover transition-colors cursor-pointer border-t border-stroke-weak/20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stroke-focus"
							>
								<span>
									{showAll ? <Trans>Show fewer wallets</Trans> : <Trans>{otherConnectors.length} more wallets</Trans>}
								</span>
								<CaretDownIcon
									aria-hidden="true"
									className={cn("size-3 transition-transform duration-150", showAll && "rotate-180")}
								/>
							</button>
						)}

						{walletConnectUri && connectingId && (
							<WalletConnectPairingPanel uri={walletConnectUri} isMobile={isMobile} />
						)}
					</>
				) : (
					<div className="px-4 py-8 text-center space-y-1.5">
						<WarningCircleIcon className="size-8 text-fg-muted mx-auto" aria-hidden="true" />
						<p className="text-sm font-medium">
							<Trans>No wallets found</Trans>
						</p>
						<p className="text-xs text-fg-muted">
							<Trans>Install a wallet extension to continue</Trans>
						</p>
					</div>
				)}

				{error && (
					<div
						role="alert"
						className="mx-4 mb-3 flex items-start gap-2 p-2.5 rounded-xs bg-error-soft border border-stroke-error-strong/20"
					>
						<WarningCircleIcon className="size-3.5 text-error shrink-0 mt-0.5" aria-hidden="true" />
						<p className="text-xs text-error">{error.message}</p>
					</div>
				)}
			</div>

			{!isScannerMode && mockConnectors.length > 0 && (
				<div className="border-t border-stroke-warning-strong/20 bg-warning-soft/10">
					<button
						type="button"
						onClick={() => setShowMock((v) => !v)}
						aria-expanded={showMock}
						className="w-full flex items-center justify-between px-4 py-2.5 text-2xs font-medium uppercase tracking-wider text-warning hover:bg-warning-soft/20 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stroke-focus"
					>
						<span>
							<Trans>Mock Wallet (Testing)</Trans>
						</span>
						<CaretDownIcon
							aria-hidden="true"
							className={cn("size-3 transition-transform duration-150", showMock && "rotate-180")}
						/>
					</button>

					{showMock && (
						<div className="px-3 pb-3 space-y-2">
							<div className="divide-y divide-stroke-warning-strong/20 border border-stroke-warning-strong/25 rounded-xs overflow-hidden">
								{mockConnectors.map((connector, index) => {
									const config = MOCK_WALLETS[index];
									const isConnecting = connectingId === connector.uid;
									return (
										<button
											key={connector.uid}
											type="button"
											onClick={() => handleConnect(connector)}
											disabled={isPending}
											className={cn(
												"w-full flex items-center gap-3 px-3 py-2.5 text-left",
												"bg-warning-soft/30 hover:bg-warning-soft/60 transition-colors cursor-pointer",
												"focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stroke-focus",
												"disabled:opacity-50 disabled:cursor-not-allowed group",
											)}
										>
											<div
												className="size-7 rounded-xs bg-warning-soft flex items-center justify-center flex-shrink-0"
												aria-hidden="true"
											>
												<FlaskIcon className="size-3.5 text-warning" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium group-hover:text-warning transition-colors truncate">
													{config?.name ?? connector.name}
												</p>
												<p className="text-2xs text-fg-muted font-mono truncate">{config?.address ?? "Mock wallet"}</p>
											</div>
											{isConnecting && (
												<SpinnerGapIcon
													className="size-3.5 animate-spin motion-reduce:animate-none text-warning flex-shrink-0"
													aria-hidden="true"
												/>
											)}
										</button>
									);
								})}
							</div>

							<div className="space-y-1">
								<div className="flex gap-2">
									<TextInput
										aria-label={t`Custom wallet address`}
										placeholder="0x…"
										spellCheck={false}
										autoComplete="off"
										value={customAddress}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setCustomAddress(e.target.value);
											setCustomAddressError(null);
										}}
										className="font-mono text-xs"
									/>
									<Button
										variant="outline"
										intent="neutral"
										size="sm"
										onClick={handleCustomAddressConnect}
										disabled={isPending}
										className="shrink-0"
									>
										<Trans>Connect</Trans>
									</Button>
								</div>
								{customAddressError && (
									<p role="alert" className="text-xs text-error px-1">
										{customAddressError}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{!isScannerMode && (
				<div className="border-t border-stroke-weak/40 px-4 py-2.5 flex items-center justify-center gap-1.5">
					<span className="text-xs text-fg-muted">
						<Trans>New to wallets?</Trans>
					</span>
					<a
						href="https://ethereum.org/en/wallets/"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-brand hover:underline focus-visible:outline-2 focus-visible:outline-stroke-focus focus-visible:rounded-xs"
					>
						<Trans>Learn more</Trans>
						<ArrowSquareOutIcon className="size-3" aria-hidden="true" />
					</a>
				</div>
			)}
		</div>
	);
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: Props) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Drawer side="bottom" open={open} onOpenChange={onOpenChange}>
				<DrawerContent className="pb-[env(safe-area-inset-bottom)]">
					<WalletContent onClose={() => onOpenChange(false)} isMobile />
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm" showClose={false}>
				<ModalContent className="p-0">
					<WalletContent onClose={() => onOpenChange(false)} isMobile={false} />
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}
