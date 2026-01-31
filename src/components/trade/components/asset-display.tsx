import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export interface AssetInfo {
	displayName: string;
	iconUrl?: string | undefined;
}

interface Props {
	asset: AssetInfo;
	hideIcon?: boolean;
	hideName?: boolean;
	className?: string;
	iconClassName?: string;
	nameClassName?: string;
}

function getFallbackText(displayName: string): string {
	return displayName.slice(0, 2).toUpperCase();
}

export function AssetDisplay({
	asset,
	hideIcon = false,
	hideName = false,
	className,
	iconClassName,
	nameClassName,
}: Props) {
	const { displayName, iconUrl } = asset;
	const showIcon = !hideIcon;
	const showName = !hideName;
	const fallbackText = getFallbackText(displayName);

	const icon = (
		<Avatar className={cn("size-4", iconClassName)}>
			<AvatarImage src={iconUrl} alt={displayName} />
			<AvatarFallback className="text-4xs bg-muted">{fallbackText}</AvatarFallback>
		</Avatar>
	);

	if (showIcon && !showName) {
		return <span className={className}>{icon}</span>;
	}

	if (!showIcon && showName) {
		return <span className={cn(nameClassName, className)}>{displayName}</span>;
	}

	if (!showIcon && !showName) {
		return null;
	}

	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			{icon}
			<span className={nameClassName}>{displayName}</span>
		</span>
	);
}
