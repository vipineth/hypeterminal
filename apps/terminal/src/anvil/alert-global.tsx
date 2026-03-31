import { XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

type AlertGlobalTone =
	| "error"
	| "warning"
	| "success"
	| "information"
	| "neutral"
	| "brand"
	| "inverse-neutral"
	| "inverse-brand";

const alertGlobalVariants = cva(["flex items-start rounded-8 shadow-raised overflow-clip"], {
	variants: {
		tone: {
			error: "bg-fill-error-weak border border-stroke-error-weak",
			warning: "bg-fill-warning-weak border border-stroke-warning-weak",
			success: "bg-fill-success-weak border border-stroke-success-weak",
			information: "bg-fill-info-weak border border-stroke-info-weak",
			neutral: "bg-fill-weaker border border-stroke-weak",
			brand: "bg-fill-brand-weak border border-stroke-brand-weak",
			"inverse-neutral": "bg-bg-inverse",
			"inverse-brand": "bg-bg-brand",
		},
	},
	defaultVariants: {
		tone: "neutral",
	},
});

const toneColors: Record<AlertGlobalTone, { icon: string; text: string; close: string }> = {
	error: { icon: "text-icon-error", text: "text-text-weak", close: "text-icon-neutral" },
	warning: { icon: "text-icon-warning", text: "text-text-weak", close: "text-icon-neutral" },
	success: { icon: "text-icon-success", text: "text-text-weak", close: "text-icon-neutral" },
	information: { icon: "text-icon-info", text: "text-text-weak", close: "text-icon-neutral" },
	neutral: { icon: "text-icon-neutral", text: "text-text-weak", close: "text-icon-neutral" },
	brand: { icon: "text-icon-brand", text: "text-text-weak", close: "text-icon-neutral" },
	"inverse-neutral": { icon: "text-icon-inverse", text: "text-text-inverse-strong", close: "text-icon-inverse" },
	"inverse-brand": { icon: "text-icon-inverse", text: "text-text-inverse-strong", close: "text-icon-inverse" },
};

interface AlertGlobalProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertGlobalVariants> {
	tone?: AlertGlobalTone;
	icon?: React.ReactNode;
	action?: React.ReactNode;
	onClose?: () => void;
}

const AlertGlobal = React.forwardRef<HTMLDivElement, AlertGlobalProps>(
	({ className, tone = "neutral", icon, action, onClose, children, ...props }, ref) => {
		const colors = toneColors[tone];

		return (
			<div className={cn(alertGlobalVariants({ tone, className }))} ref={ref} role="alert" {...props}>
				<div className="flex flex-1 items-start gap-3 p-3 md:items-center">
					{icon && <div className={cn("shrink-0 flex items-center justify-center size-6", colors.icon)}>{icon}</div>}
					<div className="flex flex-col flex-1 gap-2 md:flex-row md:items-center md:gap-3">
						<p className={cn("text-xs font-normal flex-1", colors.text)}>{children}</p>
						{action && <div className="shrink-0">{action}</div>}
					</div>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className={cn(
							"relative shrink-0 size-6 flex items-center justify-center cursor-pointer m-3",
							"hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus rounded-4",
							"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-10",
							colors.close,
						)}
						aria-label="Dismiss alert"
					>
						<XIcon size={12} weight="bold" />
					</button>
				)}
			</div>
		);
	},
);
AlertGlobal.displayName = "AlertGlobal";

export { AlertGlobal, alertGlobalVariants };
export type { AlertGlobalProps, AlertGlobalTone };
