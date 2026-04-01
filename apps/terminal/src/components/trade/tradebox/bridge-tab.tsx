import { Badge, Button } from "@hypeterminal/ui";
import { Trans } from "@lingui/react/macro";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ArrowSquareOutIcon,
	CaretDownIcon,
	CaretUpIcon,
	CheckCircleIcon,
	ClockIcon,
	CoinIcon,
	SpinnerGapIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import Big from "big.js";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { cn } from "@/lib/cn";
import { formatDateTimeShort, formatDuration, formatUSD, shortenAddress } from "@/lib/format";
import { initLiFi } from "@/lib/lifi/config";
import { type BridgeToken, useBridgeBalances } from "@/lib/lifi/use-balances";
import { type ProcessDetail, useBridgeExecutor } from "@/lib/lifi/use-bridge";
import { type BridgeQuote, useBridgeQuote } from "@/lib/lifi/use-quote";

type BridgeScreen = "select" | "amount" | "confirm" | "executing" | "success";

const BRIDGE_TIMEOUT_MS = 10 * 60 * 1000;
const PERCENT_OPTIONS = [25, 50, 75] as const;
const USDC_ICON_URL = "https://app.hyperliquid.xyz/coins/USDC.svg";
const HL_ICON_URL = "https://app.hyperliquid.xyz/coins/HYPE.svg";
const LIFI_EXPLORER_URL = "https://explorer.li.fi/tx";
function LiFiLogo({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 132 48"
			fill="none"
			className={className}
			role="img"
			aria-label="LI.FI"
		>
			<path
				fill="currentColor"
				d="m19.314 0 9.878 9.879a3 3 0 0 1 0 4.242L23.314 20l-4-4c-4.419-4.418-4.419-11.582 0-16Z"
			/>
			<path
				fill="currentColor"
				fillRule="evenodd"
				d="m19.314 48-16-16c-4.419-4.418-4.419-11.582 0-16l13.878 13.879a3 3 0 0 0 4.243 0L35.314 16c4.418 4.418 4.418 11.582 0 16l-16 16Z"
				clipRule="evenodd"
			/>
			<path
				fill="currentColor"
				d="M123.319 36s.034-21 0-22 .985-2 1.966-2h4.034v22c.035 1-.965 2-1.965 2h-4.035ZM99.32 14v22h6v-8h10c1 0 2-1 2-2v-4h-12v-4h12c1 0 2-1 2-2v-4h-18c-1 0-2 1-2 2Zm-9.998 18c0-1 1-2 2-2h2c1 0 2 1 2 2v2c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-2Zm-10.001 4s.034-21 0-22 .985-2 1.966-2h4.034v22c.035 1-.965 2-1.965 2h-4.035ZM55.32 30V14c0-1 .87-2 2-2h4v18h14v4c0 1-1 2-2 2h-18v-6Z"
			/>
		</svg>
	);
}

function PoweredByLiFi() {
	return (
		<a
			href="https://li.fi"
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center justify-center gap-1.5 py-2 text-text-disabled opacity-60 hover:opacity-100 transition-opacity"
		>
			<span className="text-xs">Powered by</span>
			<LiFiLogo className="h-2.5" />
		</a>
	);
}

function HyperCoreUsdcIcon({ size = "md" }: { size?: "sm" | "md" }) {
	const iconSize = size === "sm" ? "size-5" : "size-8";
	const badgeSize = size === "sm" ? "size-2.5" : "size-3.5";
	return (
		<div className="relative shrink-0">
			<img src={USDC_ICON_URL} alt="USDC" className={cn(iconSize, "rounded-full")} />
			<img
				src={HL_ICON_URL}
				alt="Hyperliquid"
				className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border border-bg-overlay", badgeSize)}
			/>
		</div>
	);
}

function BridgeWalletNotConnected() {
	return (
		<div className="flex flex-col items-center gap-4 py-8">
			<div className="flex size-12 items-center justify-center rounded-full bg-bg-raised border border-stroke-weak/40">
				<WalletIcon className="size-6 text-text-strong" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>Wallet not connected</Trans>
				</p>
				<p className="text-xs text-text-strong">
					<Trans>Connect your wallet to bridge funds</Trans>
				</p>
			</div>
		</div>
	);
}

function TokenIcon({ token, size = "md" }: { token: BridgeToken; size?: "sm" | "md" }) {
	const iconSize = size === "sm" ? "size-5" : "size-8";
	const badgeSize = size === "sm" ? "size-2.5" : "size-3.5";
	const fallbackIconSize = size === "sm" ? "size-3" : "size-4";
	return (
		<div className="relative shrink-0">
			{token.logoURI ? (
				<img
					src={token.logoURI}
					alt={token.symbol}
					className={cn(iconSize, "rounded-full")}
					onError={(e) => {
						e.currentTarget.style.display = "none";
						e.currentTarget.nextElementSibling?.classList.remove("hidden");
					}}
				/>
			) : null}
			<div
				className={cn(
					"rounded-full bg-bg-raised flex items-center justify-center",
					iconSize,
					token.logoURI && "hidden",
				)}
			>
				<CoinIcon className={cn(fallbackIconSize, "text-text-weak")} />
			</div>
			{token.chainLogoURI ? (
				<img
					src={token.chainLogoURI}
					alt={token.chainName}
					className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border border-bg-overlay", badgeSize)}
				/>
			) : null}
		</div>
	);
}

function formatTokenBalance(amount: string, decimals: number): string {
	const value = Big(amount).div(Big(10).pow(decimals));
	if (value.lt(0.001)) return "<0.001";
	if (value.lt(1)) return value.toFixed(4);
	if (value.lt(1000)) return value.toFixed(3);
	return value.toFixed(2);
}

function formatTokenAmount(amount: string, decimals: number): string {
	const value = Big(amount).div(Big(10).pow(decimals));
	if (value.lt(0.0001)) return "<0.0001";
	if (value.lt(1)) return value.toFixed(6);
	if (value.lt(1000)) return value.toFixed(4);
	return value.toFixed(2);
}

function formatSendAmount(amount: string, maxSigFigs = 5): string {
	try {
		const value = Big(amount);
		if (value.eq(0)) return "0";
		if (value.gte(1)) return value.toPrecision(maxSigFigs);
		const str = value.toFixed(18);
		let sigCount = 0;
		let endIdx = 0;
		for (let i = 2; i < str.length; i++) {
			if (str[i] !== "0" || sigCount > 0) sigCount++;
			if (sigCount >= maxSigFigs) {
				endIdx = i + 1;
				break;
			}
		}
		return endIdx > 0 ? str.slice(0, endIdx) : str;
	} catch {
		return amount;
	}
}

function isValidUsdInput(value: string): boolean {
	if (!value || value === "." || value === "0") return false;
	try {
		return Big(value).gt(0);
	} catch {
		return false;
	}
}

function usdToTokenAmount(usd: string, priceUSD: string, decimals: number): string {
	try {
		const price = Big(priceUSD);
		if (price.lte(0)) return "";
		return Big(usd).div(price).toFixed(decimals);
	} catch {
		return "";
	}
}

function processTypeLabel(type: string): string {
	switch (type) {
		case "TOKEN_ALLOWANCE":
			return "Approval tx";
		case "SWAP":
			return "Swap tx";
		case "CROSS_CHAIN":
			return "Bridge tx";
		case "RECEIVING_CHAIN":
			return "Deposit tx";
		default:
			return "Transaction";
	}
}

function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 text-text-brand hover:opacity-80"
		>
			{children}
			<ArrowSquareOutIcon className="size-3" />
		</a>
	);
}

function QuoteCountdown({ dataUpdatedAt }: { dataUpdatedAt: number }) {
	const [remaining, setRemaining] = useState(30);

	useEffect(() => {
		function tick() {
			const elapsed = (Date.now() - dataUpdatedAt) / 1000;
			setRemaining(Math.max(0, Math.ceil(30 - elapsed)));
		}
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [dataUpdatedAt]);

	const circumference = 2 * Math.PI * 10;
	const offset = circumference * (1 - remaining / 30);

	return (
		<div className="relative flex size-7 items-center justify-center shrink-0">
			<svg className="size-7 -rotate-90" viewBox="0 0 24 24" role="img" aria-label="Quote countdown">
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-stroke-weak" />
				<circle
					cx="12"
					cy="12"
					r="10"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="text-text-brand transition-[stroke-dashoffset] duration-1000 ease-linear"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
				/>
			</svg>
			<span className="absolute text-xs tabular-nums font-medium text-text-strong">{remaining}</span>
		</div>
	);
}

interface TokenRowProps {
	token: BridgeToken;
	isSelected: boolean;
	onSelect: (token: BridgeToken) => void;
}

function tokenRowStyle(isDust: boolean, isSelected: boolean): string {
	if (isDust) return "opacity-50 cursor-not-allowed border-transparent";
	if (isSelected) return "border-stroke-brand-strong bg-fill-brand-strong/5 cursor-pointer";
	return "border-transparent hover:bg-bg-sunken/50 active:bg-bg-sunken cursor-pointer";
}

function TokenRow({ token, isSelected, onSelect }: TokenRowProps) {
	return (
		<button
			type="button"
			disabled={token.isDust}
			onClick={() => onSelect(token)}
			className={cn(
				"flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-8 w-full border",
				tokenRowStyle(token.isDust, isSelected),
			)}
		>
			<TokenIcon token={token} />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<span className="text-xs font-medium text-text-strong truncate">{token.symbol}</span>
					<span className="text-xs text-text-weak truncate">{token.chainName}</span>
				</div>
				<span className="text-xs text-text-weak truncate block">{token.name}</span>
			</div>
			<div className="text-right shrink-0">
				<div className="text-xs tabular-nums text-text-strong">{formatTokenBalance(token.amount, token.decimals)}</div>
				<div className="text-xs tabular-nums text-text-weak">{formatUSD(token.amountUSD, 2)}</div>
			</div>
			{token.isDust ? (
				<Badge tone="neutral" size="sm" className="shrink-0">
					<Trans>Low Balance</Trans>
				</Badge>
			) : null}
		</button>
	);
}

function AssetSelectionLoading() {
	return (
		<div className="flex flex-col items-center gap-4 py-8">
			<SpinnerGapIcon className="size-6 animate-spin text-text-weak" />
			<p className="text-xs text-text-weak">
				<Trans>Loading balances across all chains...</Trans>
			</p>
		</div>
	);
}

function AssetSelectionError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex flex-col items-center gap-4 py-8">
			<div className="flex size-12 items-center justify-center rounded-full bg-fill-error-weak border border-stroke-error-strong/30">
				<WarningCircleIcon className="size-6 text-text-error" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>Failed to load balances</Trans>
				</p>
				<p className="text-xs text-text-weak">
					<Trans>Could not fetch your token balances</Trans>
				</p>
			</div>
			<Button variant="outline" intent="neutral" size="sm" onClick={onRetry}>
				<Trans>Try Again</Trans>
			</Button>
		</div>
	);
}

function AssetSelectionEmpty() {
	return (
		<div className="flex flex-col items-center gap-4 py-8">
			<div className="flex size-12 items-center justify-center rounded-full bg-bg-raised border border-stroke-weak/40">
				<WalletIcon className="size-6 text-text-weak" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>No balances found</Trans>
				</p>
				<p className="text-xs text-text-weak">
					<Trans>No tokens with value found across supported chains</Trans>
				</p>
			</div>
		</div>
	);
}

interface AssetSelectionScreenProps {
	address: string;
	onSelect: (token: BridgeToken) => void;
}

function AssetSelectionScreen({ address, onSelect }: AssetSelectionScreenProps) {
	const { data: tokens, isLoading, isError, refetch } = useBridgeBalances(address);

	if (isLoading) return <AssetSelectionLoading />;
	if (isError) return <AssetSelectionError onRetry={() => refetch()} />;
	if (!tokens || tokens.length === 0) return <AssetSelectionEmpty />;

	return (
		<div className="flex flex-1 flex-col">
			<div className="max-h-80 overflow-y-auto -mx-1">
				{tokens.map((token) => (
					<TokenRow key={`${token.chainId}-${token.address}`} token={token} isSelected={false} onSelect={onSelect} />
				))}
			</div>
			<PoweredByLiFi />
		</div>
	);
}

interface AmountEntryScreenProps {
	token: BridgeToken;
	initialUsd: string;
	onBack: () => void;
	onContinue: (tokenAmount: string, usdInput: string) => void;
}

function AmountEntryScreen({ token, initialUsd, onBack, onContinue }: AmountEntryScreenProps) {
	const [usdInput, setUsdInput] = useState(initialUsd);

	function handleUsdChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		if (raw === "") {
			setUsdInput("");
			return;
		}
		if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
		setUsdInput(raw);
	}

	function handlePercent(percent: number) {
		const usd = Big(token.amountUSD).times(percent).div(100).toFixed(2);
		setUsdInput(usd);
	}

	function handleMax() {
		setUsdInput(Big(token.amountUSD).toFixed(2));
	}

	const canContinue = isValidUsdInput(usdInput) && Big(usdInput).lte(token.amountUSD);

	function handleSubmit() {
		if (!canContinue) return;
		const tokenAmount = usdToTokenAmount(usdInput, token.priceUSD, token.decimals);
		if (tokenAmount) onContinue(tokenAmount, usdInput);
	}

	return (
		<div className="flex flex-1 flex-col gap-6">
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-1 text-xs text-text-brand hover:opacity-80 self-start"
			>
				<ArrowLeftIcon className="size-3" />
				<Trans>Back</Trans>
			</button>

			<div className="flex flex-col items-center gap-4 py-4">
				<div className="flex items-baseline justify-center">
					<span className="text-4xl font-semibold text-text-strong tabular-nums">$</span>
					<input
						type="text"
						inputMode="decimal"
						value={usdInput}
						onChange={handleUsdChange}
						placeholder="0.00"
						className="text-4xl font-semibold text-text-strong tabular-nums bg-transparent border-none outline-none text-center w-36 placeholder:text-text-disabled"
					/>
				</div>

				<div className="flex items-center gap-2">
					{PERCENT_OPTIONS.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => handlePercent(p)}
							className="px-3 py-1.5 text-xs font-medium text-text-strong bg-bg-raised hover:bg-fill-brand-strong/20 rounded-8 transition-colors"
						>
							<Trans>{p}%</Trans>
						</button>
					))}
					<button
						type="button"
						onClick={handleMax}
						className="px-3 py-1.5 text-xs font-medium text-text-strong bg-bg-raised hover:bg-fill-brand-strong/20 rounded-8 transition-colors"
					>
						<Trans>Max</Trans>
					</button>
				</div>
			</div>

			<div className="flex items-center justify-center gap-3 rounded-8 border border-stroke-weak p-3">
				<div className="flex items-center gap-2">
					<TokenIcon token={token} />
					<div className="text-left">
						<p className="text-xs text-text-weak">
							<Trans>You send</Trans>
						</p>
						<p className="text-xs font-medium text-text-strong">{token.symbol}</p>
					</div>
				</div>
				<ArrowRightIcon className="size-4 text-text-weak shrink-0" />
				<div className="flex items-center gap-2">
					<HyperCoreUsdcIcon />
					<div className="text-left">
						<p className="text-xs text-text-weak">
							<Trans>You receive</Trans>
						</p>
						<p className="text-xs font-medium text-text-strong">USDC</p>
					</div>
				</div>
			</div>

			<Button
				variant="filled"
				intent="brand"
				size="lg"
				className="w-full mt-auto"
				disabled={!canContinue}
				onClick={handleSubmit}
			>
				<Trans>Continue</Trans>
			</Button>
		</div>
	);
}

interface ConfirmationScreenProps {
	token: BridgeToken;
	tokenAmount: string;
	address: string;
	onBack: () => void;
	onConfirm: (quote: BridgeQuote) => void;
}

function ConfirmationScreen({ token, tokenAmount, address, onBack, onConfirm }: ConfirmationScreenProps) {
	const quoteParams = {
		fromChainId: token.chainId,
		fromTokenAddress: token.address,
		fromTokenDecimals: token.decimals,
		fromAddress: address,
		amount: tokenAmount,
	};

	const { data: quote, isLoading: quoteLoading, isError: quoteError, dataUpdatedAt } = useBridgeQuote(quoteParams);

	const usdDisplay = (() => {
		try {
			return formatUSD(Big(tokenAmount).times(token.priceUSD).toNumber(), 2);
		} catch {
			return "$0.00";
		}
	})();

	const receiveAmount = quote ? formatTokenAmount(quote.toAmount, 6) : "---";
	const receiveAmountUSD = quote ? formatUSD(quote.toAmountUSD, 2) : "";

	return (
		<div className="flex flex-1 flex-col gap-3">
			<div>
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-1 text-xs text-text-brand hover:opacity-80"
					>
						<ArrowLeftIcon className="size-3" />
						<Trans>Back</Trans>
					</button>
					{quote ? <QuoteCountdown dataUpdatedAt={dataUpdatedAt} /> : null}
				</div>

				<p className="text-4xl font-semibold text-text-strong tabular-nums text-center py-2">{usdDisplay}</p>

				<InfoRowGroup className="text-xs">
					<InfoRow
						label={<Trans>Source</Trans>}
						value={
							<span className="flex items-center gap-1.5">
								<WalletIcon className="size-3" />
								<Trans>Wallet ({shortenAddress(address)})</Trans>
							</span>
						}
					/>
					<InfoRow label={<Trans>Destination</Trans>} value="Hyperliquid" />
					<InfoRow
						label={
							<span className="flex items-center gap-1">
								<ClockIcon className="size-3" />
								<Trans>Estimated time</Trans>
							</span>
						}
						value={quote ? `~${formatDuration(Math.ceil(quote.executionDuration / 60))}` : "---"}
					/>
				</InfoRowGroup>

				<InfoRowGroup className="text-xs mt-3">
					<InfoRow
						label={<Trans>You send</Trans>}
						value={
							<span className="flex items-center gap-1.5">
								<TokenIcon token={token} size="sm" />
								{formatSendAmount(tokenAmount)} {token.symbol}
							</span>
						}
					/>
					<InfoRow
						label={<Trans>You receive</Trans>}
						value={
							<span className="flex items-center gap-1.5">
								<HyperCoreUsdcIcon size="sm" />
								{receiveAmount} USDC
								{receiveAmountUSD ? <span className="text-text-weak ml-1">{receiveAmountUSD}</span> : null}
							</span>
						}
					/>
				</InfoRowGroup>
			</div>

			{quote ? (
				<Collapsible>
					<CollapsibleTrigger className="flex w-full items-center justify-between rounded-8 px-2 py-1.5 text-xs text-text-weak hover:bg-bg-sunken/50 transition-colors group">
						<span>
							<Trans>Transaction breakdown</Trans> ({formatUSD(quote.totalFeesUSD, 2)})
						</span>
						<CaretDownIcon className="size-3 group-data-[state=open]:hidden" />
						<CaretUpIcon className="size-3 hidden group-data-[state=open]:block" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<InfoRowGroup className="text-xs">
							{quote.gasCosts.map((gas) => (
								<InfoRow
									key={`gas-${gas.token.symbol}-${gas.amount}`}
									label={<Trans>Gas ({gas.token.symbol})</Trans>}
									value={formatUSD(gas.amountUSD, 2)}
								/>
							))}
							{quote.feeCosts.map((fee) => (
								<InfoRow key={`fee-${fee.name}-${fee.amount}`} label={fee.name} value={formatUSD(fee.amountUSD, 2)} />
							))}
						</InfoRowGroup>
					</CollapsibleContent>
				</Collapsible>
			) : null}

			{quoteError ? (
				<div className="flex items-center gap-2 rounded-8 border border-stroke-error-strong/30 bg-fill-error-weak p-2.5">
					<WarningCircleIcon className="size-4 text-text-error shrink-0" />
					<span className="text-xs text-text-error">
						<Trans>No route available. Try a different amount or asset.</Trans>
					</span>
				</div>
			) : null}

			<Button
				variant="filled"
				intent="brand"
				size="lg"
				className="w-full mt-auto"
				disabled={!quote || quoteLoading}
				onClick={() => quote && onConfirm(quote)}
			>
				{quoteLoading ? (
					<>
						<SpinnerGapIcon className="size-4 animate-spin" />
						<Trans>Preparing your quote...</Trans>
					</>
				) : (
					<Trans>Confirm</Trans>
				)}
			</Button>
		</div>
	);
}

interface ExecutingScreenProps {
	address: string;
	statusText: string;
	txHash: string | null;
	onDone: () => void;
}

function ExecutingScreen({ address, statusText, txHash, onDone }: ExecutingScreenProps) {
	const [isTimedOut, setIsTimedOut] = useState(false);
	const startTimeRef = useRef(Date.now());

	useEffect(() => {
		const timer = setInterval(() => {
			if (Date.now() - startTimeRef.current >= BRIDGE_TIMEOUT_MS) {
				setIsTimedOut(true);
				clearInterval(timer);
			}
		}, 30_000);
		return () => clearInterval(timer);
	}, []);

	if (isTimedOut) {
		return (
			<div className="flex flex-1 flex-col">
				<div className="flex flex-1 flex-col items-center justify-center gap-4">
					<div className="flex size-12 items-center justify-center rounded-full bg-fill-warning-weak border border-fill-warning-weak/30">
						<ClockIcon className="size-6 text-text-warning" />
					</div>
					<div className="text-center space-y-1">
						<p className="text-sm font-medium text-text-strong">
							<Trans>Taking longer than expected</Trans>
						</p>
						<p className="text-xs text-text-weak max-w-70">
							<Trans>Your bridge is still processing. Funds are safe.</Trans>
						</p>
					</div>
					{txHash ? (
						<ExplorerLink href={`${LIFI_EXPLORER_URL}/${txHash}`}>
							<Trans>Track on LI.FI Explorer</Trans>
						</ExplorerLink>
					) : null}
				</div>
				<Button variant="outline" intent="neutral" size="lg" className="w-full mt-auto" onClick={onDone}>
					<Trans>Close</Trans>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="flex flex-1 flex-col items-center justify-center gap-4">
				<div className="flex size-12 items-center justify-center rounded-full bg-fill-brand-strong/10 border border-stroke-brand-strong/30">
					<SpinnerGapIcon className="size-6 animate-spin text-text-brand" />
				</div>
				<div className="text-center space-y-1">
					<p className="text-sm font-medium text-text-strong">{statusText}</p>
					<p className="text-xs text-text-weak">
						{txHash ? (
							<Trans>Your transaction is being processed</Trans>
						) : (
							<Trans>Confirm transaction in your wallet</Trans>
						)}
					</p>
				</div>
			</div>

			{txHash ? (
				<div className="space-y-3">
					<InfoRowGroup className="text-xs">
						<InfoRow
							label={<Trans>Fill status</Trans>}
							value={
								<Badge tone="neutral" size="sm">
									<Trans>Processing</Trans>
								</Badge>
							}
						/>
						<InfoRow
							label={<Trans>Source</Trans>}
							value={
								<ExplorerLink href={`${LIFI_EXPLORER_URL}/${txHash}`}>
									<WalletIcon className="size-3" />
									{shortenAddress(address)}
								</ExplorerLink>
							}
						/>
						<InfoRow label={<Trans>Destination</Trans>} value="Hyperliquid" />
					</InfoRowGroup>

					<InfoRowGroup className="text-xs">
						<InfoRow
							label={<Trans>You receive</Trans>}
							value={
								<span className="flex items-center gap-1.5">
									<HyperCoreUsdcIcon size="sm" />
									<Trans>USDC</Trans>
								</span>
							}
						/>
					</InfoRowGroup>
				</div>
			) : null}

			<Button variant="outline" intent="neutral" size="lg" className="w-full mt-auto" onClick={onDone}>
				<Trans>Close</Trans>
			</Button>
		</div>
	);
}

interface SuccessScreenProps {
	address: string;
	receivedAmount: string;
	txHash: string | null;
	startTime: number | null;
	endTime: number | null;
	processDetails: ProcessDetail[];
	onDone: () => void;
	onNewDeposit: () => void;
}

function SuccessScreen({
	address,
	receivedAmount,
	txHash,
	startTime,
	endTime,
	processDetails,
	onDone,
	onNewDeposit,
}: SuccessScreenProps) {
	const formatted = formatTokenAmount(receivedAmount, 6);
	const totalSeconds = startTime && endTime ? Math.round((endTime - startTime) / 1000) : null;

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="flex flex-col items-center gap-3 pt-6 pb-2">
				<div className="flex size-12 items-center justify-center rounded-full bg-fill-success-weak border border-fill-success-weak/30">
					<CheckCircleIcon className="size-6 text-text-success" weight="fill" />
				</div>
				<div className="text-center space-y-1">
					<p className="text-sm font-medium text-text-strong">
						<Trans>Deposit successful</Trans>
					</p>
					<p className="text-xs text-text-weak">
						<Trans>Your funds were successfully deposited.</Trans>
					</p>
				</div>
			</div>

			<InfoRowGroup className="text-xs">
				<InfoRow
					label={<Trans>Fill status</Trans>}
					value={
						<span className="text-text-success font-medium">
							<Trans>Successful</Trans>
						</span>
					}
				/>
				{totalSeconds !== null ? (
					<InfoRow label={<Trans>Total time</Trans>} value={<Trans>{totalSeconds} seconds</Trans>} />
				) : null}
			</InfoRowGroup>

			<InfoRowGroup className="text-xs">
				<InfoRow
					label={<Trans>Source</Trans>}
					value={
						txHash ? (
							<ExplorerLink href={`${LIFI_EXPLORER_URL}/${txHash}`}>
								<WalletIcon className="size-3" />
								{shortenAddress(address)}
							</ExplorerLink>
						) : (
							<span className="flex items-center gap-1.5">
								<WalletIcon className="size-3" />
								{shortenAddress(address)}
							</span>
						)
					}
				/>
				<InfoRow label={<Trans>Destination</Trans>} value="Hyperliquid" />
			</InfoRowGroup>

			<InfoRowGroup className="text-xs">
				<InfoRow
					label={<Trans>You receive</Trans>}
					value={
						<span className="flex items-center gap-1.5">
							<HyperCoreUsdcIcon size="sm" />
							{formatted} USDC
						</span>
					}
				/>
			</InfoRowGroup>

			{processDetails.length > 0 ? (
				<Collapsible>
					<CollapsibleTrigger className="flex w-full items-center justify-between rounded-8 px-2 py-1.5 text-xs text-text-weak hover:bg-bg-sunken/50 transition-colors group">
						<Trans>More details</Trans>
						<CaretDownIcon className="size-3 group-data-[state=open]:hidden" />
						<CaretUpIcon className="size-3 hidden group-data-[state=open]:block" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<InfoRowGroup className="text-xs">
							{processDetails.map((detail) => (
								<InfoRow
									key={detail.txHash}
									label={processTypeLabel(detail.type)}
									value={
										<ExplorerLink href={detail.txLink || `${LIFI_EXPLORER_URL}/${detail.txHash}`}>
											{shortenAddress(detail.txHash)}
										</ExplorerLink>
									}
								/>
							))}
							{processDetails[0]?.startedAt ? (
								<InfoRow
									label={<Trans>Order submitted</Trans>}
									value={formatDateTimeShort(processDetails[0].startedAt)}
								/>
							) : null}
							{(() => {
								const lastDetail = processDetails.at(-1);
								if (!lastDetail?.doneAt) return null;
								return <InfoRow label={<Trans>Order filled</Trans>} value={formatDateTimeShort(lastDetail.doneAt)} />;
							})()}
						</InfoRowGroup>
					</CollapsibleContent>
				</Collapsible>
			) : null}

			<div className="flex gap-2 w-full mt-auto">
				<Button variant="outline" intent="neutral" size="lg" className="flex-1" onClick={onDone}>
					<Trans>Close</Trans>
				</Button>
				<Button variant="filled" intent="brand" size="lg" className="flex-1" onClick={onNewDeposit}>
					<Trans>New deposit</Trans>
				</Button>
			</div>
		</div>
	);
}

interface ErrorScreenProps {
	error: string;
	onBack: () => void;
	onRetry: () => void;
}

function BridgeErrorScreen({ error, onBack, onRetry }: ErrorScreenProps) {
	return (
		<div className="flex flex-1 flex-col items-center">
			<div className="flex flex-1 flex-col items-center justify-center gap-4">
				<div className="flex size-12 items-center justify-center rounded-full bg-fill-error-weak border border-stroke-error-strong/30">
					<WarningCircleIcon className="size-6 text-text-error" />
				</div>
				<div className="text-center space-y-1">
					<p className="text-sm font-medium text-text-strong">
						<Trans>Bridge failed</Trans>
					</p>
					<p className="text-xs text-text-weak max-w-70">{error}</p>
				</div>
			</div>
			<div className="flex gap-2 w-full mt-auto">
				<Button variant="outline" intent="neutral" size="lg" className="flex-1" onClick={onBack}>
					<Trans>Back</Trans>
				</Button>
				<Button variant="filled" intent="brand" size="lg" className="flex-1" onClick={onRetry}>
					<Trans>Try Again</Trans>
				</Button>
			</div>
		</div>
	);
}

export function BridgeTab() {
	const { address } = useConnection();
	const lifiInitialized = useRef(false);
	const [screen, setScreen] = useState<BridgeScreen>("select");
	const [selectedToken, setSelectedToken] = useState<BridgeToken | null>(null);
	const [usdInput, setUsdInput] = useState("");
	const [tokenAmount, setTokenAmount] = useState("");
	const lastQuoteRef = useRef<BridgeQuote | null>(null);
	const bridge = useBridgeExecutor();

	useEffect(() => {
		if (!lifiInitialized.current) {
			initLiFi();
			lifiInitialized.current = true;
		}
	}, []);

	useEffect(() => {
		if (bridge.status === "idle" && screen === "executing") {
			setScreen("confirm");
		}
	}, [bridge.status, screen]);

	if (!address) {
		return <BridgeWalletNotConnected />;
	}

	function handleTokenSelect(token: BridgeToken) {
		setSelectedToken(token);
		setScreen("amount");
	}

	function handleAmountContinue(amount: string, usd: string) {
		setTokenAmount(amount);
		setUsdInput(usd);
		setScreen("confirm");
	}

	function handleBackFromAmount() {
		setScreen("select");
		setSelectedToken(null);
		setUsdInput("");
		setTokenAmount("");
	}

	function handleBackFromConfirm() {
		setScreen("amount");
	}

	function handleConfirm(quote: BridgeQuote) {
		lastQuoteRef.current = quote;
		setScreen("executing");
		bridge.execute(quote);
	}

	function handleRetry() {
		if (lastQuoteRef.current) {
			setScreen("executing");
			bridge.execute(lastQuoteRef.current);
		}
	}

	function resetToSelect() {
		setScreen("select");
		setSelectedToken(null);
		setUsdInput("");
		setTokenAmount("");
		bridge.reset();
		lastQuoteRef.current = null;
	}

	if (bridge.status === "error") {
		return <BridgeErrorScreen error={bridge.error ?? "Unknown error"} onRetry={handleRetry} onBack={resetToSelect} />;
	}

	if (bridge.status === "success" && bridge.receivedAmount) {
		return (
			<SuccessScreen
				address={address}
				receivedAmount={bridge.receivedAmount}
				txHash={bridge.txHash}
				startTime={bridge.startTime}
				endTime={bridge.endTime}
				processDetails={bridge.processDetails}
				onDone={resetToSelect}
				onNewDeposit={resetToSelect}
			/>
		);
	}

	if (screen === "executing") {
		return (
			<ExecutingScreen address={address} statusText={bridge.statusText} txHash={bridge.txHash} onDone={resetToSelect} />
		);
	}

	if (screen === "confirm" && selectedToken && tokenAmount) {
		return (
			<ConfirmationScreen
				token={selectedToken}
				tokenAmount={tokenAmount}
				address={address}
				onBack={handleBackFromConfirm}
				onConfirm={handleConfirm}
			/>
		);
	}

	if (screen === "amount" && selectedToken) {
		return (
			<AmountEntryScreen
				token={selectedToken}
				initialUsd={usdInput}
				onBack={handleBackFromAmount}
				onContinue={handleAmountContinue}
			/>
		);
	}

	return <AssetSelectionScreen address={address} onSelect={handleTokenSelect} />;
}
