import { useAgentStatus } from "@hypeterminal/hl-react";
import {
	Button,
	Modal,
	ModalContent,
	ModalDescription,
	ModalHeader,
	ModalPopup,
	ModalTitle,
	Select,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { NumberInput } from "@/components/ui/number-input";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { exceedsBalance, getTokenTransferDecimals, isAmountWithinBalance } from "@/domain/market";
import type { Dex } from "@/domain/market/model";
import {
	buildSendAsset,
	getRouteToken,
	getTradableDexes,
	getTransferVenues,
	getVenueLimit,
	MAIN_PERP,
	SPOT,
	type TransferRoute,
	toWireDex,
	type Venue,
} from "@/domain/trade/dex-transfer";
import { useAccountState } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useExchange } from "@/lib/hyperliquid";
import { useMarkets } from "@/lib/hyperliquid/markets/use-markets";
import { floorToString, limitDecimalInput } from "@/lib/trade/numbers";
import { bumpCollateralGeneration } from "@/stores/use-collateral-generation-store";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialRoute?: TransferRoute;
	initialAmount?: string;
}

const PERP_TO_SPOT: TransferRoute = { from: MAIN_PERP, to: SPOT };

export function TransferModal({ open, onOpenChange, initialRoute = PERP_TO_SPOT, initialAmount = "" }: Props) {
	const key = `${toWireDex(initialRoute.from)}>${toWireDex(initialRoute.to)}:${initialAmount}:${open ? "open" : "closed"}`;
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm">
				<TransferModalBody
					key={key}
					onOpenChange={onOpenChange}
					initialRoute={initialRoute}
					initialAmount={initialAmount}
				/>
			</ModalPopup>
		</Modal>
	);
}

interface BodyProps {
	onOpenChange: (open: boolean) => void;
	initialRoute: TransferRoute;
	initialAmount: string;
}

function venueValue(venue: Venue): string {
	return venue.kind === "spot" ? "spot" : `perp:${venue.dex}`;
}

function venueLabel(venue: Venue, dexes: readonly Dex[]): string {
	if (venue.kind === "spot") return t`Spot`;
	if (venue.dex === "") return t`Perps`;
	const token = dexes.find((dex) => dex.name === venue.dex)?.collateralToken.displayName;
	return token ? `${venue.dex} · ${token}` : venue.dex;
}

function TransferModalBody({ onOpenChange, initialRoute, initialAmount }: BodyProps) {
	const [route, setRoute] = useState<TransferRoute>(initialRoute);
	const [amount, setAmount] = useState(initialAmount);
	const [error, setError] = useState<string | null>(null);

	const { address } = useConnection();
	const { dexes, listed, getToken } = useMarkets();
	const { isReady: isAgentReady } = useAgentStatus();
	const { mutateAsync: sendAsset, isPending: isUserPending } = useExchange("sendAsset");
	const { mutateAsync: agentSendAsset, isPending: isAgentPending } = useExchange("agentSendAsset");
	const account = useAccountState();
	const isPending = isUserPending || isAgentPending;

	const usdc = dexes.find((dex) => dex.name === "")?.collateralToken;
	const token = usdc ? getRouteToken(route, dexes, usdc) : null;
	const decimals = getTokenTransferDecimals(token ? getToken(token.name) : undefined);
	const limit = token ? getVenueLimit(account, route.from, token) : null;
	const available = limit?.status === "ready" ? limit.amount : null;
	const venues = getTransferVenues(account, dexes, getTradableDexes(listed), route);
	const options = venues.map((venue) => ({ value: venueValue(venue), label: venueLabel(venue, dexes) }));
	const params = address && token ? buildSendAsset(address, route, token, amount) : null;
	const isValidAmount = available !== null && params !== null && isAmountWithinBalance(amount, available);

	function pick(side: "from" | "to", value: string | null) {
		const venue = venues.find((entry) => venueValue(entry) === value);
		if (!venue) return;
		setRoute((prev) => ({ ...prev, [side]: venue }));
		setError(null);
	}

	function handleFlip() {
		setRoute((prev) => ({ from: prev.to, to: prev.from }));
		setAmount("");
	}

	async function handleTransfer() {
		if (!isValidAmount || isPending || !params) return;
		setError(null);
		try {
			await (isAgentReady ? agentSendAsset(params) : sendAsset(params));
			bumpCollateralGeneration();
			setAmount("");
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : t`Transfer failed`);
		}
	}

	function handleMaxClick() {
		if (available === null) return;
		setAmount(route.from.kind === "perp" ? available : floorToString(available, decimals));
	}

	if (limit?.status === "unverifiedTransferLimit") {
		return (
			<ModalHeader>
				<ModalTitle>{t`Transfer`}</ModalTitle>
				<ModalDescription>
					{t`Unified accounts share one balance across perps, spot and builder dexes, so there is nothing to move.`}
				</ModalDescription>
			</ModalHeader>
		);
	}

	const symbol = token?.displayName ?? "";
	const unsupported = usdc !== undefined && token === null;

	return (
		<>
			<ModalHeader>
				<ModalTitle>{symbol ? t`Transfer ${symbol}` : t`Transfer`}</ModalTitle>
				<ModalDescription>{t`Move funds between Perps, Spot and builder dexes. Each builder dex holds its own margin.`}</ModalDescription>
			</ModalHeader>

			<ModalContent>
				<div className="space-y-4">
					<div className="flex items-end gap-2">
						<Select
							label={t`From`}
							size="sm"
							className="flex-1 min-w-0"
							value={venueValue(route.from)}
							onValueChange={(value) => pick("from", value)}
							options={options}
						/>
						<button
							type="button"
							onClick={handleFlip}
							aria-label={t`Flip transfer direction`}
							className="mb-1 p-1.5 rounded-xs hover:bg-fill-hover transition-colors text-fg-muted hover:text-brand"
						>
							<ArrowsLeftRightIcon className="size-4" />
						</button>
						<Select
							label={t`To`}
							size="sm"
							className="flex-1 min-w-0"
							value={venueValue(route.to)}
							onValueChange={(value) => pick("to", value)}
							options={options}
						/>
					</div>

					{unsupported && (
						<p className="text-xs text-warning">{t`These two can't hold the same token. Pick another source or destination.`}</p>
					)}

					<NumberInput
						label={t`Amount`}
						labelValue={
							<>
								{t`Available`}:{" "}
								<span className="underline decoration-dashed underline-offset-2 decoration-stroke-weak">
									{available === null ? FALLBACK_VALUE_PLACEHOLDER : `${floorToString(available, decimals)} ${symbol}`}
								</span>
							</>
						}
						onLabelValueClick={handleMaxClick}
						placeholder="0.00"
						value={amount}
						onChange={(e) => setAmount(limitDecimalInput(e.target.value, decimals))}
						className={cn(
							"w-full tabular-nums",
							available !== null &&
								exceedsBalance(amount, available) &&
								"border-stroke-error-strong focus:border-stroke-error-strong",
						)}
					/>

					{error && (
						<div className="flex items-center gap-2 p-2.5 rounded-xs bg-error-soft border border-stroke-error-weak text-xs text-error">
							<WarningCircleIcon className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}

					<Button
						variant="filled"
						intent="neutral"
						onClick={handleTransfer}
						disabled={!isValidAmount || isPending}
						className="w-full"
					>
						{isPending && <SpinnerGapIcon className="size-3.5 animate-spin mr-2" />}
						{isPending ? t`Transferring...` : t`Transfer`}
					</Button>
				</div>
			</ModalContent>
		</>
	);
}
