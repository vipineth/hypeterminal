import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Drawer, DrawerClose, DrawerContent } from "./drawer";
import { cn } from "./utils";

// ─── Mobile detection ────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

function subscribeToMobileQuery(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

function getIsMobile(): boolean {
	if (typeof window === "undefined") return false;
	return window.innerWidth < MOBILE_BREAKPOINT;
}

function useMobile(): boolean {
	return React.useSyncExternalStore(subscribeToMobileQuery, getIsMobile, () => false);
}

// ─── Modal (centered overlay) ─────────────────────────────────────────────────

const modalPopupVariants = cva(["relative w-full bg-overlay shadow-overlay rounded-12", "flex flex-col outline-none"], {
	variants: {
		size: {
			sm: "max-w-sm",
			md: "max-w-md",
			lg: "max-w-lg",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

const Modal = Dialog.Root;

const ModalTrigger = Dialog.Trigger;

const ModalClose = Dialog.Close;

interface ModalPopupProps
	extends React.ComponentPropsWithoutRef<typeof Dialog.Popup>,
		VariantProps<typeof modalPopupVariants> {
	showClose?: boolean;
}

const ModalPopup = React.forwardRef<HTMLDivElement, ModalPopupProps>(
	({ className, size, showClose = true, children, ...props }, ref) => (
		<Dialog.Portal>
			<Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0" />
			<div className="fixed inset-0 z-50 overflow-y-auto p-6">
				<div className="flex min-h-full items-center justify-center">
					<Dialog.Popup
						className={cn(
							modalPopupVariants({ size, className }),
							"max-h-[calc(100dvh-3rem)] overflow-y-auto",
							"transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95",
						)}
						ref={ref}
						{...props}
					>
						{children}
						{showClose && (
							<Dialog.Close
								className={cn(
									"absolute top-4 right-4 z-10",
									"flex items-center justify-center size-8 rounded-8",
									"text-icon cursor-pointer",
									"hover:bg-fill-hover active:bg-fill-press",
									"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
									"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-11",
								)}
								aria-label="Close"
							>
								<XIcon size={16} weight="bold" />
							</Dialog.Close>
						)}
					</Dialog.Popup>
				</div>
			</div>
		</Dialog.Portal>
	),
);
ModalPopup.displayName = "ModalPopup";

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	divider?: boolean;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
	({ className, divider = true, ...props }, ref) => (
		<div
			className={cn("flex flex-col gap-1 p-4 pr-14", divider && "border-b border-stroke-weak", className)}
			ref={ref}
			{...props}
		/>
	),
);
ModalHeader.displayName = "ModalHeader";

interface ModalTitleProps extends React.ComponentPropsWithoutRef<typeof Dialog.Title> {}

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(({ className, ...props }, ref) => (
	<Dialog.Title className={cn("text-base font-semibold text-fg text-balance", className)} ref={ref} {...props} />
));
ModalTitle.displayName = "ModalTitle";

interface ModalDescriptionProps extends React.ComponentPropsWithoutRef<typeof Dialog.Description> {}

const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
	({ className, ...props }, ref) => (
		<Dialog.Description className={cn("text-xs text-fg-muted text-pretty", className)} ref={ref} {...props} />
	),
);
ModalDescription.displayName = "ModalDescription";

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(({ className, ...props }, ref) => (
	<div className={cn("p-4", className)} ref={ref} {...props} />
));
ModalContent.displayName = "ModalContent";

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(({ className, ...props }, ref) => (
	<div className={cn("flex items-center justify-end gap-3 p-4", className)} ref={ref} {...props} />
));
ModalFooter.displayName = "ModalFooter";

// ─── AdaptiveModal ────────────────────────────────────────────────────────────
// On mobile (< 768px): renders as a bottom drawer with swipe-to-close.
// On desktop: renders as a centered modal.
// Children are shared between both — use ModalHeader / ModalContent / ModalFooter as usual.

interface AdaptiveModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	size?: VariantProps<typeof modalPopupVariants>["size"];
	showClose?: boolean;
	children: React.ReactNode;
	className?: string;
}

function AdaptiveModal({ open, onOpenChange, size, showClose = true, children, className }: AdaptiveModalProps) {
	const isMobile = useMobile();

	if (isMobile) {
		return (
			<Drawer side="bottom" open={open} onOpenChange={onOpenChange}>
				<DrawerContent className={cn("relative pb-[env(safe-area-inset-bottom)]", className)}>
					<div
						className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-fill/20"
						aria-hidden="true"
					/>
					{showClose && (
						<DrawerClose
							className={cn(
								"absolute top-4 right-4 z-10",
								"flex items-center justify-center size-8 rounded-8",
								"text-icon cursor-pointer",
								"hover:bg-fill-hover active:bg-fill-press",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
								"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-11",
							)}
							aria-label="Close"
						>
							<XIcon size={16} weight="bold" />
						</DrawerClose>
					)}
					{children}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size={size} showClose={showClose} className={className}>
				{children}
			</ModalPopup>
		</Modal>
	);
}
AdaptiveModal.displayName = "AdaptiveModal";

export type {
	AdaptiveModalProps,
	ModalContentProps,
	ModalDescriptionProps,
	ModalFooterProps,
	ModalHeaderProps,
	ModalPopupProps,
	ModalTitleProps,
};
export {
	AdaptiveModal,
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalPopup,
	ModalTitle,
	ModalTrigger,
	modalPopupVariants,
};
