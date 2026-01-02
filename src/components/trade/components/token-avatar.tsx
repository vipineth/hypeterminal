import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTokenIconUrl } from "@/config/token";
import { cn } from "@/lib/utils";

type TokenAvatarProps = {
	symbol: string;
	className?: string;
	fallbackClassName?: string;
};

export function TokenAvatar({ symbol, className, fallbackClassName }: TokenAvatarProps) {
	const fallbackText = symbol.slice(0, 2).toUpperCase();

	return (
		<Avatar className={cn("size-4", className)}>
			<AvatarImage src={getTokenIconUrl(symbol)} alt={symbol} />
			<AvatarFallback className={cn("text-3xs bg-terminal-amber/20 text-terminal-amber", fallbackClassName)}>
				{fallbackText}
			</AvatarFallback>
		</Avatar>
	);
}
