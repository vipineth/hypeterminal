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
	online: "bg-fill-success-strong",
	busy: "bg-fill-error-strong",
	away: "bg-fill-yellow",
	offline: "bg-fill-disabled",
	notification: "bg-fill-error-strong",
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
		const [imgError, setImgError] = React.useState(false);
		const showImage = src && !imgError;
		const showInitials = !showImage && initials;
		const showIcon = !showImage && !initials;

		return (
			<div className={cn(avatarVariants({ size, className }))} ref={ref} {...props}>
				<div className="size-full rounded-full overflow-hidden flex items-center justify-center">
					{showImage && (
						<img
							src={src}
							alt={alt || ""}
							className="size-full object-cover outline outline-1 -outline-offset-1 outline-stroke-weak"
							onError={() => setImgError(true)}
						/>
					)}
					{showInitials && (
						<div
							className={cn(
								"size-full flex items-center justify-center bg-fill-weak font-semibold text-text-strong",
								size === "lg" ? "text-sm" : "text-xs",
							)}
						>
							{initials}
						</div>
					)}
					{showIcon && (
						<div className="size-full flex items-center justify-center bg-fill-weak text-icon-neutral">
							<UserIcon size={iconSizes[size ?? "md"]} weight="bold" />
						</div>
					)}
				</div>
				{status && (
					<span
						className={cn(
							"absolute bottom-0 right-0 rounded-full border-bg-base",
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
				{visible.map((child, i) => (
					<div key={i} className="ring-2 ring-bg-base rounded-full">
						{child}
					</div>
				))}
				{overflow > 0 && (
					<div
						className={cn(
							"flex items-center justify-center rounded-full bg-fill-weak font-semibold text-text-strong ring-2 ring-bg-base",
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
