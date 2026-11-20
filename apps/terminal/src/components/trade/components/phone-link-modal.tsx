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
import { DeviceMobileIcon, ShieldWarningIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useConnection } from "wagmi";
import { PHONE_LINK_AGENT_NAME, PHONE_LINK_QR_VISIBLE_MS, PHONE_LINK_VALIDITY_MS } from "@/config/phone-link";
import { useExchange, useHyperliquid } from "@/lib/hyperliquid";
import { createPhoneLinkUrl } from "@/lib/phone-link/link-payload";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type LinkState =
	| { status: "idle" }
	| { status: "approving" }
	| { status: "ready"; qrDataUrl: string; validUntil: number }
	| { status: "error"; message: string };

function formatExpiry(validUntil: number): string {
	return new Date(validUntil).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function PhoneLinkModal({ open, onOpenChange }: Props) {
	const { address } = useConnection();
	const { env } = useHyperliquid();
	const approveAgent = useExchange("approveAgent");
	const [state, setState] = useState<LinkState>({ status: "idle" });

	const readyUntil = state.status === "ready" ? state.validUntil : null;

	useEffect(() => {
		if (readyUntil === null) return;
		const timer = window.setTimeout(() => {
			setState({ status: "idle" });
			onOpenChange(false);
		}, PHONE_LINK_QR_VISIBLE_MS);
		return () => window.clearTimeout(timer);
	}, [readyUntil, onOpenChange]);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) setState({ status: "idle" });
		onOpenChange(nextOpen);
	}

	async function handleCreate() {
		if (!address) return;
		setState({ status: "approving" });
		const agentKey = generatePrivateKey();
		const validUntil = Date.now() + PHONE_LINK_VALIDITY_MS;
		try {
			await approveAgent.mutateAsync({
				agentAddress: privateKeyToAccount(agentKey).address,
				agentName: `${PHONE_LINK_AGENT_NAME} valid_until ${validUntil}`,
			});
			const url = createPhoneLinkUrl(window.location.origin, { address, agentKey, network: env, validUntil });
			const QRCode = await import("qrcode");
			const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: 256 });
			setState({ status: "ready", qrDataUrl, validUntil });
		} catch (error) {
			setState({ status: "error", message: error instanceof Error ? error.message : t`Could not link your phone.` });
		}
	}

	const qrSeconds = PHONE_LINK_QR_VISIBLE_MS / 1000;
	const expiryLabel = formatExpiry(state.status === "ready" ? state.validUntil : Date.now() + PHONE_LINK_VALIDITY_MS);

	return (
		<AdaptiveModal open={open} onOpenChange={handleOpenChange} size="sm">
			<ModalHeader>
				<div className="flex items-center gap-2">
					<DeviceMobileIcon className="size-4 text-brand" weight="duotone" aria-hidden />
					<ModalTitle>
						<Trans>Link phone</Trans>
					</ModalTitle>
				</div>
				<ModalDescription>
					<Trans>Trade this account from your phone without connecting your wallet there.</Trans>
				</ModalDescription>
			</ModalHeader>

			<ModalContent className="space-y-3">
				{state.status === "ready" ? (
					<>
						<div className="flex justify-center rounded-xs border border-stroke-weak bg-white p-3">
							<img src={state.qrDataUrl} alt={t`Phone link QR code`} className="size-64 max-w-full" />
						</div>
						<p className="text-xs text-fg-muted">
							<Trans>
								Scan it with your phone camera, or in HypeTerminal on your phone under Connect Wallet, Link desktop
								wallet. This QR closes after {qrSeconds} seconds.
							</Trans>
						</p>
					</>
				) : (
					<p className="text-xs text-fg-muted">
						<Trans>Your wallet signs once to approve a trading key for your phone, then this window shows a QR.</Trans>
					</p>
				)}

				<div className="flex items-start gap-2 rounded-xs border border-stroke-warning-weak bg-warning-soft p-3 text-xs text-fg">
					<ShieldWarningIcon className="mt-0.5 size-4 shrink-0 text-warning" weight="fill" aria-hidden />
					<p>
						<Trans>
							Anyone who scans this QR can trade this account until {expiryLabel}. It cannot withdraw or send funds. Do
							not share it or take a screenshot. Linking another phone replaces this one.
						</Trans>
					</p>
				</div>

				{state.status === "error" && (
					<div
						role="alert"
						className="flex items-start gap-2 rounded-xs border border-stroke-error-weak bg-error-soft p-3 text-xs text-error"
					>
						<WarningCircleIcon className="mt-0.5 size-4 shrink-0" weight="fill" aria-hidden />
						<p className="min-w-0 break-words">{state.message}</p>
					</div>
				)}
			</ModalContent>

			{state.status !== "ready" && (
				<ModalFooter className="border-t border-stroke-weak">
					<Button
						type="button"
						variant="filled"
						intent="brand"
						size="sm"
						onClick={handleCreate}
						disabled={state.status === "approving" || !address}
						iconLeft={
							state.status === "approving" ? (
								<SpinnerGapIcon className="size-3.5 animate-spin" />
							) : (
								<DeviceMobileIcon className="size-3.5" />
							)
						}
					>
						{state.status === "approving" ? <Trans>Approve in wallet...</Trans> : <Trans>Approve and show QR</Trans>}
					</Button>
				</ModalFooter>
			)}
		</AdaptiveModal>
	);
}
