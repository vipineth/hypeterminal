import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { getTokenIconUrl } from "@/lib/tokens";

interface Props {
	symbol: string;
	className?: string;
	fallbackClassName?: string;
}

export function TokenAvatar({ symbol, className, fallbackClassName }: Props) {
	const fallbackText = symbol.slice(0, 2).toUpperCase();

	return (
		<Avatar className={cn("size-4", className)}>
			<AvatarImage className="size-4" src={getTokenIconUrl(symbol)} alt={symbol} />
			<AvatarFallback className={cn("text-3xs bg-terminal-amber/20 text-terminal-amber", fallbackClassName)}>
				{fallbackText}
			</AvatarFallback>
		</Avatar>
	);
}
