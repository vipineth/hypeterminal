import {
	createMobileAgentApproval,
	createMobileAgentRevocationApproval,
	isStoredMobileAgent,
} from "@hypeterminal/hl-react/signing/mobile-agent";
import {
	AdaptiveModal,
	Button,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CheckIcon,
	CopyIcon,
	DeviceMobileIcon,
	KeyIcon,
	QrCodeIcon,
	ShieldCheckIcon,
	SpinnerGapIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { shortenAddress } from "@/lib/format";
import { useAgentWalletActions, useAgentWalletStorage, useExchange, useHyperliquid } from "@/lib/hyperliquid";
import { createMobileAgentSyncUrl } from "@/lib/mobile-sync/sync-core";

interface MobileAgentSyncModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type SyncState =
	| { status: "idle" }
	| { status: "approving" }
	| { status: "creating" }
	| {
			status: "ready";
			url: string;
			pairingCode: string;
			agentAddress: string;
			expiresAtMs: number;
			agentValidUntilMs: number;
	  }
	| { status: "link-expired"; agentAddress: string; agentValidUntilMs: number }
	| { status: "error"; message: string };

type ResetState =
	| { status: "idle" }
	| { status: "resetting" }
	| { status: "success"; agentAddress: string; expiresAtMs: number }
	| { status: "error"; message: string };

export function MobileAgentSyncModal({ open, onOpenChange }: MobileAgentSyncModalProps) {
	const { address } = useConnection();
	const { env } = useHyperliquid();
	const localAgent = useAgentWalletStorage(env, address);
	const { clearAgent } = useAgentWalletActions();
	const approveAgent = useExchange("approveAgent");
	const { copied: copiedPhoneLink, copy: copyPhoneLink } = useCopyToClipboard(1500);
	const { copied: copiedPairingCode, copy: copyPairingCode } = useCopyToClipboard(1500);
	const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });
	const [resetState, setResetState] = useState<ResetState>({ status: "idle" });
	const [showQr, setShowQr] = useState(false);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [qrError, setQrError] = useState<string | null>(null);

	const readyUrl = syncState.status === "ready" ? syncState.url : null;

	useEffect(() => {
		if (syncState.status !== "ready") return;
		const delay = syncState.expiresAtMs - Date.now();
		if (delay <= 0) {
			setSyncState({
				status: "link-expired",
				agentAddress: syncState.agentAddress,
				agentValidUntilMs: syncState.agentValidUntilMs,
			});
			return;
		}
		const timer = setTimeout(() => {
			setSyncState((prev) => {
				if (prev.status !== "ready") return prev;
				return { status: "link-expired", agentAddress: prev.agentAddress, agentValidUntilMs: prev.agentValidUntilMs };
			});
		}, delay);
		return () => clearTimeout(timer);
	}, [syncState]);

	useEffect(() => {
		if (!showQr || !readyUrl) {
			setQrDataUrl(null);
			setQrError(null);
			return;
		}

		let cancelled = false;
		const qrText = readyUrl;
		setQrDataUrl(null);
		setQrError(null);

		async function renderQr() {
			try {
				const QRCode = await import("qrcode");
				const dataUrl = await QRCode.toDataURL(qrText, {
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
	}, [readyUrl, showQr]);

	const primaryButtonLabel = getPrimaryButtonLabel(syncState.status);

	function resetSyncState() {
		setSyncState({ status: "idle" });
		setResetState({ status: "idle" });
		setShowQr(false);
		setQrDataUrl(null);
		setQrError(null);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) resetSyncState();
		onOpenChange(nextOpen);
	}

	async function handleCreateSync() {
		if (!address) {
			setSyncState({ status: "error", message: t`Connect your wallet before linking a mobile device.` });
			return;
		}

		const approval = createMobileAgentApproval();
		resetSyncState();
		setSyncState({ status: "approving" });

		try {
			await approveAgent.mutateAsync({
				agentAddress: approval.publicKey,
				agentName: approval.agentName,
			});
			setSyncState({ status: "creating" });

			const syncCreatedAtMs = Date.now();
			const syncUrl = await createMobileAgentSyncUrl({
				appOrigin: window.location.origin,
				env,
				userAddress: address,
				agentPrivateKey: approval.privateKey,
				agentName: approval.agentName,
				agentValidUntilMs: approval.agentValidUntilMs,
				nowMs: syncCreatedAtMs,
			});

			setSyncState({
				status: "ready",
				url: syncUrl.url,
				pairingCode: syncUrl.pairingCode,
				agentAddress: syncUrl.agentAddress,
				expiresAtMs: syncUrl.expiresAtMs,
				agentValidUntilMs: syncUrl.agentValidUntilMs,
			});
		} catch (error) {
			setSyncState({
				status: "error",
				message: error instanceof Error ? error.message : t`Could not link mobile device.`,
			});
		}
	}

	async function handleResetMobileAccess() {
		if (!address) {
			setResetState({ status: "error", message: t`Connect your wallet before resetting mobile access.` });
			return;
		}

		const revocation = createMobileAgentRevocationApproval();
		setResetState({ status: "resetting" });

		try {
			await approveAgent.mutateAsync({
				agentAddress: revocation.publicKey,
				agentName: revocation.agentName,
			});
			if (isStoredMobileAgent(localAgent)) {
				clearAgent(env, address);
			}
			setResetState({
				status: "success",
				agentAddress: revocation.publicKey,
				expiresAtMs: revocation.agentValidUntilMs,
			});
			setSyncState({ status: "idle" });
			setShowQr(false);
			setQrDataUrl(null);
		} catch (error) {
			setResetState({
				status: "error",
				message: error instanceof Error ? error.message : t`Could not reset mobile access.`,
			});
		}
	}

	const isPending = syncState.status === "approving" || syncState.status === "creating";
	const isReady = syncState.status === "ready";
	const isLinkExpired = syncState.status === "link-expired";
	const isResetting = resetState.status === "resetting";

	return (
		<AdaptiveModal open={open} onOpenChange={handleOpenChange} size="md" className="max-h-[min(92dvh,46rem)]">
			<ModalHeader>
				<div className="flex items-center gap-2">
					<DeviceMobileIcon className="size-4 text-brand" weight="duotone" aria-hidden />
					<ModalTitle>
						<Trans>Link mobile device</Trans>
					</ModalTitle>
				</div>
				<ModalDescription>
					<Trans>Create secure phone access for trading from this account.</Trans>
				</ModalDescription>
			</ModalHeader>

			<ModalContent className="space-y-4">
				<div className="flex items-center justify-between gap-3 rounded-8 border border-stroke-weak bg-fill-weak px-3 py-2 text-xs">
					<span className="text-fg-muted">
						<Trans>Using</Trans>
					</span>
					<span className="min-w-0 truncate font-medium text-fg">
						{address ? (
							<>
								<span className="font-mono">{shortenAddress(address)}</span>
								<span className="text-fg-muted"> · {env}</span>
							</>
						) : (
							<Trans>Wallet not connected</Trans>
						)}
					</span>
				</div>

				{syncState.status === "error" && (
					<div
						role="alert"
						className="flex items-start gap-2 rounded-8 border border-stroke-error-strong/25 bg-error-soft p-3 text-xs text-error"
					>
						<WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="fill" aria-hidden />
						<p>{syncState.message}</p>
					</div>
				)}

				{!isReady && !isLinkExpired && (
					<div className="rounded-8 border border-stroke-weak bg-fill-weak p-3">
						<div className="flex items-start gap-3">
							<ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-brand" weight="duotone" aria-hidden />
							<div className="min-w-0 space-y-1">
								<p className="text-sm font-semibold text-fg">
									<Trans>Create phone access</Trans>
								</p>
								<p className="text-xs text-fg-muted">
									<Trans>Your wallet approves one trading key for this phone. It cannot withdraw funds.</Trans>
								</p>
							</div>
						</div>
					</div>
				)}

				{isReady && (
					<ReadySyncPanel
						state={syncState}
						copiedPhoneLink={copiedPhoneLink}
						copiedPairingCode={copiedPairingCode}
						showQr={showQr}
						qrDataUrl={qrDataUrl}
						qrError={qrError}
						onCopyPhoneLink={() => copyPhoneLink(syncState.url)}
						onCopyPairingCode={() => copyPairingCode(syncState.pairingCode)}
						onReveal={() => setShowQr(true)}
					/>
				)}

				{isLinkExpired && (
					<ExpiredLinkPanel state={syncState} onCreateNew={handleCreateSync} disabled={isPending || !address} />
				)}

				<ResetMobileAccessPanel
					state={resetState}
					disabled={isPending || isResetting || !address}
					onReset={handleResetMobileAccess}
				/>
			</ModalContent>

			{!isReady && !isLinkExpired && (
				<ModalFooter className="border-t border-stroke-weak">
					<Button
						type="button"
						variant="filled"
						intent="brand"
						size="sm"
						onClick={handleCreateSync}
						disabled={isPending || !address}
						iconLeft={
							isPending ? (
								<SpinnerGapIcon className="size-3.5 animate-spin" />
							) : (
								<DeviceMobileIcon className="size-3.5" />
							)
						}
					>
						{primaryButtonLabel}
					</Button>
				</ModalFooter>
			)}
		</AdaptiveModal>
	);
}

function getPrimaryButtonLabel(status: SyncState["status"]): string {
	if (status === "approving") return t`Approve in wallet...`;
	if (status === "creating") return t`Creating link...`;
	if (status === "error") return t`Try again`;
	return t`Create phone link`;
}

function ReadySyncPanel({
	state,
	copiedPhoneLink,
	copiedPairingCode,
	showQr,
	qrDataUrl,
	qrError,
	onCopyPhoneLink,
	onCopyPairingCode,
	onReveal,
}: {
	state: Extract<SyncState, { status: "ready" }>;
	copiedPhoneLink: boolean;
	copiedPairingCode: boolean;
	showQr: boolean;
	qrDataUrl: string | null;
	qrError: string | null;
	onCopyPhoneLink: () => void;
	onCopyPairingCode: () => void;
	onReveal: () => void;
}) {
	const linkExpiresLabel = new Date(state.expiresAtMs).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	const agentExpiresLabel = new Date(state.agentValidUntilMs).toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});

	return (
		<div className="space-y-3">
			<div className="flex items-start gap-2 rounded-8 border border-stroke-brand-strong/25 bg-fill-weak p-3">
				<CheckIcon className="mt-0.5 size-4 shrink-0 text-success" weight="bold" aria-hidden />
				<div className="min-w-0">
					<p className="text-sm font-semibold text-fg">
						<Trans>Phone link ready</Trans>
					</p>
					<p className="mt-0.5 truncate text-xs text-fg-muted">
						<Trans>Trading key approved until {agentExpiresLabel}</Trans>
					</p>
				</div>
			</div>

			<div className="rounded-8 border border-stroke-weak bg-fill-weak p-3">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<KeyIcon className="size-4 shrink-0 text-icon" aria-hidden />
						<p className="truncate text-xs font-semibold text-fg-muted">
							<Trans>Pairing code</Trans>
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						intent="neutral"
						size="sm"
						onClick={onCopyPairingCode}
						iconLeft={copiedPairingCode ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
						className="shrink-0"
					>
						{copiedPairingCode ? <Trans>Copied</Trans> : <Trans>Copy code</Trans>}
					</Button>
				</div>
				<p className="mt-2 select-all rounded-8 border border-stroke-weak bg-background px-3 py-2 text-center font-mono text-base font-semibold tracking-[0.12em] text-fg">
					{state.pairingCode}
				</p>
			</div>

			<div className="rounded-8 border border-stroke-weak bg-fill-weak p-3">
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-semibold text-fg">
							<Trans>Scan on your phone</Trans>
						</p>
						<p className="mt-0.5 text-xs text-fg-muted">
							<Trans>Phone link expires {linkExpiresLabel}</Trans>
						</p>
					</div>
				</div>

				{showQr && (
					<div className="mt-3 flex justify-center rounded-8 border border-stroke-weak bg-white p-3">
						{qrDataUrl ? (
							<img src={qrDataUrl} alt={t`Phone link QR`} className="size-56 max-w-full" />
						) : qrError ? (
							<div className="flex h-56 w-56 items-center justify-center text-center text-xs font-semibold text-error">
								{qrError}
							</div>
						) : (
							<div className="flex h-56 w-56 items-center justify-center">
								<SpinnerGapIcon className="size-5 animate-spin text-brand" aria-hidden />
							</div>
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<Button
					type="button"
					variant="outline"
					intent="neutral"
					size="sm"
					onClick={onCopyPhoneLink}
					iconLeft={copiedPhoneLink ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
					className="w-full"
				>
					{copiedPhoneLink ? <Trans>Copied</Trans> : <Trans>Copy phone link</Trans>}
				</Button>
				<Button
					type="button"
					variant="outline"
					intent="neutral"
					size="sm"
					onClick={onReveal}
					iconLeft={<QrCodeIcon className="size-3.5" />}
					className="w-full"
				>
					{showQr ? <Trans>QR visible</Trans> : <Trans>Show QR</Trans>}
				</Button>
			</div>
		</div>
	);
}

function ExpiredLinkPanel({
	state,
	onCreateNew,
	disabled,
}: {
	state: Extract<SyncState, { status: "link-expired" }>;
	onCreateNew: () => void;
	disabled: boolean;
}) {
	const agentExpiresLabel = new Date(state.agentValidUntilMs).toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});

	return (
		<div className="space-y-3">
			<div className="flex items-start gap-2 rounded-8 border border-stroke-error-strong/25 bg-error-soft p-3">
				<WarningCircleIcon className="mt-0.5 size-4 shrink-0 text-error" weight="fill" aria-hidden />
				<div className="min-w-0">
					<p className="text-sm font-semibold text-fg">
						<Trans>Phone link expired</Trans>
					</p>
					<p className="mt-0.5 text-xs text-fg-muted">
						<Trans>
							Trading key still approved until {agentExpiresLabel}. Create a new link to import on your phone.
						</Trans>
					</p>
				</div>
			</div>
			<Button
				type="button"
				variant="filled"
				intent="brand"
				size="sm"
				onClick={onCreateNew}
				disabled={disabled}
				iconLeft={<DeviceMobileIcon className="size-3.5" />}
				className="w-full"
			>
				<Trans>Create new phone link</Trans>
			</Button>
		</div>
	);
}

function ResetMobileAccessPanel({
	state,
	disabled,
	onReset,
}: {
	state: ResetState;
	disabled: boolean;
	onReset: () => void;
}) {
	const expiresAtLabel =
		state.status === "success"
			? new Date(state.expiresAtMs).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})
			: null;

	return (
		<div className="rounded-8 border border-stroke-weak bg-fill-weak p-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<p className="text-sm font-semibold text-fg">
						<Trans>Reset phone access</Trans>
					</p>
					<p className="text-xs text-fg-muted">
						<Trans>Replaces the current phone key. The old phone must link again.</Trans>
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					intent="error"
					size="sm"
					disabled={disabled}
					onClick={onReset}
					iconLeft={
						state.status === "resetting" ? (
							<SpinnerGapIcon className="size-3.5 animate-spin" />
						) : (
							<WarningCircleIcon className="size-3.5" />
						)
					}
				>
					{state.status === "resetting" ? <Trans>Resetting...</Trans> : <Trans>Reset</Trans>}
				</Button>
			</div>
			{state.status === "success" && (
				<div className="mt-3 flex items-start gap-2 rounded-8 border border-stroke-brand-strong/25 bg-background p-2.5 text-xs text-fg-muted">
					<CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" weight="bold" aria-hidden />
					<p>
						<Trans>Phone access reset. The replacement key expires at {expiresAtLabel}.</Trans>
					</p>
				</div>
			)}
			{state.status === "error" && (
				<div
					role="alert"
					className="mt-3 flex items-start gap-2 rounded-8 border border-stroke-error-strong/25 bg-error-soft p-2.5 text-xs text-error"
				>
					<WarningCircleIcon className="mt-0.5 size-3.5 shrink-0" weight="fill" aria-hidden />
					<p>{state.message}</p>
				</div>
			)}
		</div>
	);
}
