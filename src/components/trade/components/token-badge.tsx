import { cn } from "@/lib/cn";
import { TokenAvatar } from "./token-avatar";

interface Props {
	token: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeClasses = {
	sm: {
		container: "px-2 py-1 gap-1.5",
		avatar: "size-4",
		text: "text-xs",
	},
	md: {
		container: "px-3 py-1.5 gap-2",
		avatar: "size-5",
		text: "text-sm",
	},
	lg: {
		container: "px-4 py-2 gap-2.5",
		avatar: "size-6",
		text: "text-base",
	},
};

export function TokenBadge({ token, size = "md", className }: Props) {
	const sizes = sizeClasses[size];

	return (
		<div
			className={cn(
				"inline-flex items-center bg-surface/50 border border-border/40 rounded-sm",
				sizes.container,
				className,
			)}
		>
			<TokenAvatar symbol={token} className={sizes.avatar} />
			<span className={cn("font-medium", sizes.text)}>{token}</span>
		</div>
	);
}
