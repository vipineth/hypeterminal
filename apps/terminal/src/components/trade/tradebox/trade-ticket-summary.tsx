import type { TradeTicket } from "@/hooks/trade/use-trade-ticket";
import { OrderSummary } from "./order-summary";
import { ScaleOrderSummary } from "./scale-order-summary";
import { TwapOrderSummary } from "./twap-order-summary";

interface Props {
	ticket: TradeTicket;
}

export function TradeTicketSummary({ ticket }: Props) {
	const { market, entry } = ticket;

	if (ticket.twapOrder) {
		return (
			<TwapOrderSummary
				twapMinutesNum={ticket.twapMinutesNum}
				sizeValue={entry.sizeValue}
				orderValue={entry.orderValue}
				estimatedFee={ticket.estimatedFee}
				feeRatePercent={ticket.feeRatePercent}
				baseToken={entry.baseToken}
				szDecimals={market?.szDecimals}
			/>
		);
	}

	if (ticket.scaleOrder) {
		return (
			<ScaleOrderSummary
				scaleStart={ticket.scaleStartPriceNum}
				scaleEnd={ticket.scaleEndPriceNum}
				scaleLevels={ticket.scaleLevelsNum}
				orderValue={entry.orderValue}
				marginRequired={ticket.marginRequired}
				estimatedFee={ticket.estimatedFee}
				feeRatePercent={ticket.feeRatePercent}
				szDecimals={market?.szDecimals}
				marketKind={market?.kind}
			/>
		);
	}

	return (
		<OrderSummary
			liqPrice={ticket.liqPrice}
			liqWarning={ticket.liqWarning}
			orderValue={entry.orderValue}
			marginRequired={ticket.marginRequired}
			estimatedFee={ticket.estimatedFee}
			feeRatePercent={ticket.feeRatePercent}
			slippagePercent={ticket.slippagePercent}
			szDecimals={market?.szDecimals}
			onSlippageClick={ticket.openSettingsDialog}
			orderType={ticket.orderType}
			marketKind={market?.kind}
		/>
	);
}
