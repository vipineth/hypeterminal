import { useRef, useState } from "react";
import { useConnection } from "wagmi";
import type { BridgeToken } from "@/lib/lifi/use-balances";
import { useBridgeExecutor } from "@/lib/lifi/use-bridge";
import type { BridgeQuote } from "@/lib/lifi/use-quote";
import { AmountEntryScreen } from "./amount-entry-screen";
import { AssetSelectionScreen } from "./asset-selection-screen";
import { BridgeErrorScreen } from "./bridge-error-screen";
import { ConfirmationScreen } from "./confirmation-screen";
import { ExecutingScreen } from "./executing-screen";
import { BridgeWalletNotConnected } from "./shared-ui";
import { SuccessScreen } from "./success-screen";
import type { BridgeScreen } from "./types";

export function BridgeTab() {
	const { address } = useConnection();
	const [screen, setScreen] = useState<BridgeScreen>("select");
	const [selectedToken, setSelectedToken] = useState<BridgeToken | null>(null);
	const [usdInput, setUsdInput] = useState("");
	const [tokenAmount, setTokenAmount] = useState("");
	const lastQuoteRef = useRef<BridgeQuote | null>(null);
	const bridge = useBridgeExecutor();

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

	async function runBridge(quote: BridgeQuote) {
		setScreen("executing");
		const outcome = await bridge.execute(quote);
		if (outcome === "rejected") setScreen("confirm");
	}

	function handleConfirm(quote: BridgeQuote) {
		lastQuoteRef.current = quote;
		runBridge(quote);
	}

	function handleRetry() {
		if (lastQuoteRef.current) runBridge(lastQuoteRef.current);
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
