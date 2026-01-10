import clsx from "clsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTokenIconUrl } from "@/config/token";

interface Props {
	symbol: string;
	className?: string;
	fallbackClassName?: string;
}

export function TokenAvatar({ symbol, className, fallbackClassName }: Props) {
	const fallbackText = symbol.slice(0, 2).toUpperCase();

	return (
		<Avatar className={clsx("size-4", className)}>
			<AvatarImage className="size-4" src={getTokenIconUrl(symbol)} alt={symbol} />
			<AvatarFallback className={clsx("text-3xs bg-terminal-amber/20 text-terminal-amber", fallbackClassName)}>
				{fallbackText}
			</AvatarFallback>
		</Avatar>
	);
}
