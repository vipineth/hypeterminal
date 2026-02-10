import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { SpotToken, UnifiedMarket } from "@/lib/hyperliquid/markets/types";
import { useMarkets } from "@/lib/hyperliquid/markets/use-markets";

interface Props {
	coin: string;
	variant?: "short" | "full";
	subtitle?: ReactNode;
	hideIcon?: boolean;
	hideName?: boolean;
	className?: string;
	iconClassName?: string;
	nameClassName?: string;
	subtitleClassName?: string;
}

function resolveName(
	market: UnifiedMarket | undefined,
	token: SpotToken | undefined,
	coin: string,
	variant: "short" | "full" | undefined,
): string {
	if (market) {
		if (variant === "full") return market.pairName;
		if (variant === "short") return market.shortName;
		return market.kind === "spot" ? market.pairName : market.shortName;
	}
	if (token) return token.displayName;
	return coin;
}

function resolveIconUrl(market: UnifiedMarket | undefined, token: SpotToken | undefined): string | undefined {
	return market?.iconUrl ?? token?.iconUrl;
}

function getFallbackText(name: string): string {
	return name.slice(0, 2).toUpperCase();
}

export function AssetDisplay({
	coin,
	variant,
	subtitle,
	hideIcon = false,
	hideName = false,
	className,
	iconClassName,
	nameClassName,
	subtitleClassName,
}: Props) {
	const markets = useMarkets();
	const market = markets.getMarket(coin);
	const token = !market ? markets.getToken(coin) : undefined;

	const showIcon = !hideIcon;
	const showName = !hideName;
	const name = resolveName(market, token, coin, variant);
	const iconUrl = resolveIconUrl(market, token);
	const fallbackText = getFallbackText(name);

	const icon = (
		<Avatar className={cn("size-4 border border-border-200", iconClassName)}>
			<AvatarImage src={iconUrl} alt={name} />
			<AvatarFallback className="text-4xs text-text-950 bg-surface-analysis">{fallbackText}</AvatarFallback>
		</Avatar>
	);

	if (showIcon && !showName) {
		return <span className={className}>{icon}</span>;
	}

	if (!showIcon && showName) {
		return <span className={cn(nameClassName, className)}>{name}</span>;
	}

	if (!showIcon && !showName) {
		return null;
	}

	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			{icon}
			{subtitle ? (
				<span className="flex flex-col items-start">
					<span className={nameClassName}>{name}</span>
					<span className={subtitleClassName}>{subtitle}</span>
				</span>
			) : (
				<span className={nameClassName}>{name}</span>
			)}
		</span>
	);
}
