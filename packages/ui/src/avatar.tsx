import { UserIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

type AvatarStatus = "online" | "busy" | "away" | "offline" | "notification";

const avatarVariants = cva(["relative inline-flex shrink-0"], {
	variants: {
		size: {
			xxs: "size-5",
			xs: "size-6",
			sm: "size-8",
			md: "size-10",
			lg: "size-14",
		},
	},
	defaultVariants: {
		size: "sm",
	},
});

const statusColors: Record<AvatarStatus, string> = {
	online: "bg-success",
	busy: "bg-error",
	away: "bg-yellow",
	offline: "bg-fill-disabled",
	notification: "bg-error",
};

const statusSizes: Record<string, string> = {
	xxs: "size-1.5 border",
	xs: "size-2 border",
	sm: "size-2.5 border",
	md: "size-3 border-2",
	lg: "size-3.5 border-2",
};

const iconSizes: Record<string, number> = {
	xxs: 12,
	xs: 14,
	sm: 16,
	md: 20,
	lg: 24,
};

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
	src?: string;
	alt?: string;
	initials?: string;
	status?: AvatarStatus;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
	({ className, size: sizeProp, src, alt, initials, status, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const [failedSrc, setFailedSrc] = React.useState<string | undefined>(undefined);
		const showImage = src && failedSrc !== src;
		const showInitials = !showImage && initials;
		const showIcon = !showImage && !initials;

		return (
			<div className={cn(avatarVariants({ size, className }))} ref={ref} {...props}>
				<div className="size-full rounded-full overflow-hidden flex items-center justify-center">
					{showImage && (
						<img src={src} alt={alt || ""} className="size-full object-cover" onError={() => setFailedSrc(src)} />
					)}
					{showInitials && (
						<div
							className={cn(
								"size-full flex items-center justify-center bg-fill-weak font-semibold text-fg",
								size === "lg" ? "text-sm" : "text-xs",
							)}
						>
							{initials}
						</div>
					)}
					{showIcon && (
						<div className="size-full flex items-center justify-center bg-fill-weak text-icon">
							<UserIcon size={iconSizes[size ?? "md"]} weight="bold" />
						</div>
					)}
				</div>
				{status && (
					<span
						className={cn(
							"absolute bottom-0 right-0 rounded-full border-background",
							statusSizes[size ?? "md"],
							statusColors[status],
						)}
					/>
				)}
			</div>
		);
	},
);
Avatar.displayName = "Avatar";

const overflowSizes: Record<string, string> = {
	xxs: "size-5 text-xs",
	xs: "size-6 text-xs",
	sm: "size-8 text-xs",
	md: "size-10 text-xs",
	lg: "size-14 text-sm",
};

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	max?: number;
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
	({ className, max, size: sizeProp, children, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const childArray = React.Children.toArray(children);
		const visible = max ? childArray.slice(0, max) : childArray;
		const overflow = max ? childArray.length - max : 0;

		return (
			<div className={cn("flex items-center -space-x-2", className)} ref={ref} {...props}>
				{visible.map((child) => (
					<div
						key={React.isValidElement(child) && child.key != null ? child.key : String(child)}
						className="ring-2 ring-background rounded-full"
					>
						{child}
					</div>
				))}
				{overflow > 0 && (
					<div
						className={cn(
							"flex items-center justify-center rounded-full bg-fill-weak font-semibold text-fg ring-2 ring-background",
							overflowSizes[size],
						)}
					>
						{overflow}+
					</div>
				)}
			</div>
		);
	},
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup, avatarVariants };
export type { AvatarProps, AvatarGroupProps, AvatarStatus };
