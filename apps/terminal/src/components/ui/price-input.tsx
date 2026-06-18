import { t } from "@lingui/core/macro";
import { CrosshairIcon } from "@phosphor-icons/react";
import type React from "react";
import { szDecimalsToPriceDecimals } from "@/lib/format";
import { toFixed } from "@/lib/trade/numbers";
import { NumberInput } from "./number-input";

const PRICE_INPUT_DEFAULT_DECIMALS = 4;

interface Props extends Omit<React.ComponentPropsWithoutRef<typeof NumberInput>, "maxLabel" | "onMaxClick"> {
	midPrice?: number | null;
	szDecimals?: number;
	onMidClick?: (formattedPrice: string) => void;
}

export function PriceInput({ midPrice, szDecimals, onMidClick, labelValue, ...props }: Props) {
	const hasMid = midPrice != null && midPrice > 0 && onMidClick != null;
	const priceDecimals = szDecimalsToPriceDecimals(szDecimals ?? PRICE_INPUT_DEFAULT_DECIMALS);
	const formattedMid = midPrice != null && midPrice > 0 ? toFixed(midPrice, priceDecimals) : undefined;
	const handleMidClick = hasMid && formattedMid ? () => onMidClick(formattedMid) : undefined;

	return (
		<NumberInput
			{...props}
			labelValue={labelValue ?? formattedMid}
			maxLabel={
				hasMid ? (
					<span className="flex items-center gap-1">
						<CrosshairIcon className="size-3" />
						{t`Mid`}
					</span>
				) : undefined
			}
			onMaxClick={handleMidClick}
		/>
	);
}
