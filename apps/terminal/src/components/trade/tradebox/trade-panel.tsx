import { Button } from "@hypeterminal/ui";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useTradeTicket } from "@/hooks/trade/use-trade-ticket";
import { cn } from "@/lib/cn";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { WalletModal } from "../components/wallet-modal";
import { MarginModeModal } from "./margin-mode-modal";
import { OrderToast } from "./order-toast";
import { TradeFormFields } from "./trade-form-fields";
import { TradeHeader } from "./trade-header";
import { TradeTicketSummary } from "./trade-ticket-summary";

export function TradePanel() {
	const ticket = useTradeTicket();
	const { market, entry, validation, buttonContent } = ticket;
	const { setSide, setOrderType } = useOrderEntryActions();

	return (
		<div className="flex flex-col bg-surface">
			<MarginModeModal {...ticket.marginModalProps} />

			<div className="flex flex-col gap-5 px-3 py-3">
				<TradeHeader
					orderType={ticket.orderType}
					side={ticket.side}
					sideLabels={entry.sideLabels}
					marketKind={market?.kind}
					onOrderTypeChange={setOrderType}
					onSideChange={setSide}
					marginMode={entry.marginMode}
					leverage={entry.leverage}
					onMarginLeverageClick={ticket.openMarginModal}
					isLeveraged={entry.capabilities.isLeveraged}
				/>

				<TradeFormFields
					price={ticket.price}
					positionSize={ticket.positionSize}
					swapTargetToken={ticket.swapTargetToken}
					onSizeModeToggle={ticket.handleSizeModeToggle}
					onSizePercentApply={ticket.handleSizePercentApply}
					onDepositClick={ticket.openDepositModal}
					onSwapClick={ticket.openSwapModal}
				/>

				<div className="flex flex-col gap-3 pt-5 pb-1">
					{validation.errors.length > 0 && ticket.isConnected && entry.availableBalance > 0 && (
						<div className="text-xs text-error">{validation.errors.join(" • ")}</div>
					)}

					{ticket.approvalError && <div className="text-xs text-error">{ticket.approvalError}</div>}

					<Button
						variant="filled"
						size="xs"
						intent={buttonContent.variant === "buy" ? "brand" : buttonContent.variant === "sell" ? "error" : "brand"}
						onClick={buttonContent.action}
						disabled={buttonContent.disabled}
						className={cn(
							"w-full px-3 py-2 text-sm font-semibold focus-visible:outline-offset-1",
							buttonContent.variant === "buy" && "bg-success text-background hover:opacity-90",
							buttonContent.variant === "sell" && "text-background",
						)}
						aria-label={buttonContent.text}
						iconLeft={
							ticket.isSubmitting || ticket.isRegistering ? (
								<SpinnerGapIcon className="size-3 animate-spin" />
							) : undefined
						}
					>
						{buttonContent.text}
					</Button>
				</div>

				<TradeTicketSummary ticket={ticket} />
			</div>

			<WalletModal {...ticket.walletModalProps} />

			<OrderToast />
		</div>
	);
}
