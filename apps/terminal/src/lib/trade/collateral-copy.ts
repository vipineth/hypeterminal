import { t } from "@lingui/core/macro";
import type { Shortfall } from "@/domain/trade/account-mode";
import { formatToken } from "@/lib/format";

export const ACCOUNT_MODES_DOCS_URL =
	"https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes";

export interface ShortfallCopy {
	title: string;
	detail: string | null;
	help: string | null;
}

export function getShortfallCopy(shortfall: Shortfall): ShortfallCopy {
	const token = shortfall.token.displayName;
	switch (shortfall.kind) {
		case "dexEmpty": {
			const dex = shortfall.dex.name;
			const holdings = shortfall.elsewhere.map(({ place, amount }) => {
				const value = formatToken(amount, { decimals: 2, symbol: token });
				return place.kind === "perp" ? t`${value} in Perps` : t`${value} in Spot`;
			});
			return {
				title: dex === "" ? t`No ${token} in Perps. Move funds to trade.` : t`No ${token} on ${dex}. Move funds to trade.`,
				detail: holdings.length > 0 ? t`You have ${holdings.join(" and ")}.` : null,
				help: dex === "" ? null : t`Builder dexes hold their own funds.`,
			};
		}
		case "inUse":
			return { title: t`All your ${token} for this market is in use as margin.`, detail: null, help: null };
		case "noFunds":
			return { title: t`No ${token} in your account.`, detail: null, help: null };
		default:
			return shortfall satisfies never;
	}
}
