import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { MarketKind } from "@/lib/hyperliquid/market-key";
import { getTokenIconUrl } from "@/lib/tokens";

interface Props {
	symbol: string;
	kind?: MarketKind;
	className?: string;
	fallbackClassName?: string;
}

export function TokenAvatar({ symbol, kind, className, fallbackClassName }: Props) {
	const fallbackText = symbol.slice(0, 2).toUpperCase();

	return (
		<Avatar className={cn("size-4", className)}>
			<AvatarImage src={getTokenIconUrl(symbol, kind)} alt={symbol} />
			<AvatarFallback className={cn("text-4xs bg-muted", fallbackClassName)}>{fallbackText}</AvatarFallback>
		</Avatar>
	);
}
