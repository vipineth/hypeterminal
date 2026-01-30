import { BUILDER_DEX_SEPARATOR } from "@/domain/market/display";
import { cn } from "@/lib/cn";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { TokenAvatar } from "./token-avatar";

interface Props {
	name: string;
	fallback?: string;
	showIcon?: boolean;
	showName?: boolean;
	className?: string;
	iconClassName?: string;
	nameClassName?: string;
}

function normalizeMarketName(name: string): string {
	if (name.includes(BUILDER_DEX_SEPARATOR)) {
		return name.split(BUILDER_DEX_SEPARATOR)[1];
	}
	return name;
}

export function Token({
	name,
	fallback,
	showIcon = false,
	showName = true,
	className,
	iconClassName,
	nameClassName,
}: Props) {
	const { getDisplayName } = useSpotTokens();
	const normalizedName = normalizeMarketName(name);
	const iconName = getDisplayName(name);
	const displayName = getDisplayName(normalizedName) || fallback || normalizedName;

	const iconOnly = showIcon && !showName;
	const nameOnly = !showIcon && showName;

	if (iconOnly) {
		return <TokenAvatar symbol={iconName} className={cn("size-4", iconClassName, className)} />;
	}

	if (nameOnly) {
		return <span className={cn(nameClassName, className)}>{displayName}</span>;
	}

	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			<TokenAvatar symbol={iconName} className={cn("size-4", iconClassName)} />
			<span className={nameClassName}>{displayName}</span>
		</span>
	);
}

export function useTokenDisplayName(name: string): string {
	const { getDisplayName } = useSpotTokens();
	return getDisplayName(name);
}
