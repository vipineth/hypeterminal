import { writeAgentToStorage } from "@hypeterminal/hl-react";
import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DeviceMobileIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { getAddress } from "viem";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { PHONE_LINK_ROUTE } from "@/config/phone-link";
import { useHyperliquid } from "@/lib/hyperliquid";
import { PHONE_LINK_CONNECTOR_ID, writePhoneLinkSession } from "@/lib/phone-link/connector";
import { type PhoneLink, readPhoneLink } from "@/lib/phone-link/link-payload";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/link")({
	ssr: false,
	head: () => buildPageHead({ title: "Link phone", path: PHONE_LINK_ROUTE, noIndex: true }),
	component: PhoneLinkRoute,
});

function PhoneLinkRoute() {
	const { env } = useHyperliquid();
	const [result, setResult] = useState(() => readPhoneLink(window.location.hash, { nowMs: Date.now(), network: env }));

	useEffect(() => {
		function takeLinkFromUrl() {
			if (!window.location.hash) return;
			setResult(readPhoneLink(window.location.hash, { nowMs: Date.now(), network: env }));
			window.history.replaceState(window.history.state, "", window.location.pathname);
		}
		takeLinkFromUrl();
		window.addEventListener("hashchange", takeLinkFromUrl);
		return () => window.removeEventListener("hashchange", takeLinkFromUrl);
	}, [env]);

	return (
		<main className="min-h-[100dvh] bg-background px-4 py-6 text-fg">
			<div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-sm flex-col justify-center">
				<div className="rounded-xs border border-stroke-weak bg-surface p-4">
					{result.status === "ok" ? (
						<ConfirmLink key={result.link.agentAddress} link={result.link} />
					) : (
						<LinkProblem result={result} />
					)}
				</div>
			</div>
		</main>
	);
}

function ConfirmLink({ link }: { link: PhoneLink }) {
	const navigate = useNavigate();
	const { isConnected } = useConnection();
	const connectors = useConnectors();
	const { mutateAsync: connect } = useConnect();
	const { mutateAsync: disconnect } = useDisconnect();
	const [isLinking, setIsLinking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const expiryLabel = new Date(link.validUntil).toLocaleDateString([], {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	async function handleConfirm() {
		const connector = connectors.find((candidate) => candidate.id === PHONE_LINK_CONNECTOR_ID);
		if (!connector) return;
		setIsLinking(true);
		setError(null);
		try {
			if (isConnected) await disconnect();
			writeAgentToStorage(link.network, link.address, link.agentKey, link.agentAddress);
			writePhoneLinkSession({ address: link.address, env: link.network });
			await connect({ connector });
			await navigate({ to: "/" });
		} catch {
			setError(t`Could not link this phone. Try scanning the QR again.`);
			setIsLinking(false);
		}
	}

	return (
		<div className="space-y-4">
			<Heading icon={<DeviceMobileIcon className="size-5 text-brand" weight="duotone" aria-hidden />}>
				<Trans>Trade as this account?</Trans>
			</Heading>

			<p className="break-all rounded-xs bg-sunken p-3 font-mono text-sm text-fg">{getAddress(link.address)}</p>

			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
				<dt className="text-fg-muted">
					<Trans>Network</Trans>
				</dt>
				<dd className="text-right text-fg">{link.network}</dd>
				<dt className="text-fg-muted">
					<Trans>Access ends</Trans>
				</dt>
				<dd className="text-right text-fg">{expiryLabel}</dd>
			</dl>

			<p className="text-xs text-fg-muted">
				<Trans>
					Only continue if this is your own account. This phone can place and cancel orders. Deposits, withdrawals and
					sending to other addresses stay on desktop.
				</Trans>
			</p>

			{isConnected && (
				<p className="text-xs text-warning">
					<Trans>This replaces the wallet connected on this phone.</Trans>
				</p>
			)}

			{error && (
				<p role="alert" className="text-xs text-error">
					{error}
				</p>
			)}

			<div className="grid grid-cols-2 gap-2">
				<Button variant="outline" intent="neutral" size="md" onClick={() => navigate({ to: "/" })} disabled={isLinking}>
					<Trans>Cancel</Trans>
				</Button>
				<Button
					variant="filled"
					intent="brand"
					size="md"
					onClick={handleConfirm}
					disabled={isLinking}
					iconLeft={isLinking ? <SpinnerGapIcon className="size-4 animate-spin" aria-hidden /> : undefined}
				>
					<Trans>Link account</Trans>
				</Button>
			</div>
		</div>
	);
}

function LinkProblem({ result }: { result: Exclude<ReturnType<typeof readPhoneLink>, { status: "ok" }> }) {
	const navigate = useNavigate();

	return (
		<div className="space-y-4">
			<Heading icon={<WarningCircleIcon className="size-5 text-error" weight="fill" aria-hidden />}>
				{result.status === "expired" && <Trans>This link has expired</Trans>}
				{result.status === "wrong-network" && <Trans>This link is for {result.link.network}</Trans>}
				{result.status === "invalid" && <Trans>This link is not valid</Trans>}
			</Heading>
			<p className="text-xs text-fg-muted">
				{result.status === "wrong-network" ? (
					<Trans>Switch the network in Settings on this phone, then scan the QR again.</Trans>
				) : (
					<Trans>On desktop, open the account menu and choose Link phone to get a new QR.</Trans>
				)}
			</p>
			<Button variant="outline" intent="neutral" size="md" onClick={() => navigate({ to: "/" })} className="w-full">
				<Trans>Go to HypeTerminal</Trans>
			</Button>
		</div>
	);
}

function Heading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
	return (
		<div className="flex items-center gap-2">
			{icon}
			<h1 className="text-base font-semibold text-fg">{children}</h1>
		</div>
	);
}
