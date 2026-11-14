import { t } from "@lingui/core/macro";
import type { QuoteToken } from "@/domain/market/model";
import type { OverviewPlace } from "@/domain/trade/balances";

interface Props {
	place: OverviewPlace;
	token: QuoteToken;
	className?: string;
}

function getPlaceName(place: OverviewPlace): string {
	switch (place.kind) {
		case "perps":
			return t`Perps`;
		case "dex":
			return place.name;
		case "spot":
			return t`Spot`;
		case "unified":
			return t`Unified`;
		case "portfolio":
			return t`Portfolio`;
		case "unknown":
			return t`Account`;
		default:
			return place satisfies never;
	}
}

export function PerpsSourceLabel({ place, token, className }: Props) {
	return <span className={className}>{`${getPlaceName(place)} · ${token.displayName}`}</span>;
}
