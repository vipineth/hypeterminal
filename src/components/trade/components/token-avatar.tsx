import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PERP_MARKET_NAME_SEPARATOR } from "@/domain/market";
import { getIconUrlFromMarketName } from "@/domain/market/tokens";
import { cn } from "@/lib/cn";

interface Props {
	symbol?: string | undefined;
	className?: string;
	fallbackClassName?: string;
}

function getFallbackText(symbol?: string): string {
	if (!symbol) return "";
	if (symbol.includes(PERP_MARKET_NAME_SEPARATOR)) {
		return symbol.split(PERP_MARKET_NAME_SEPARATOR)[1]?.slice(0, 2).toUpperCase() ?? "";
	}
	const [, base] = symbol.split(PERP_MARKET_NAME_SEPARATOR);
	return base?.slice(0, 2).toUpperCase() ?? "";
}

export function TokenAvatar({ symbol, className, fallbackClassName }: Props) {
	const fallbackText = getFallbackText(symbol);

	if (!symbol) {
		return null;
	}

	return (
		<Avatar className={cn("size-4", className)}>
			<AvatarImage src={getIconUrlFromMarketName(symbol)} alt={symbol} />
			<AvatarFallback className={cn("text-4xs bg-muted", fallbackClassName)}>{fallbackText}</AvatarFallback>
		</Avatar>
	);
}
