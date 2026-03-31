import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const modalPopupVariants = cva(
	["relative w-full bg-bg-overlay shadow-overlay rounded-12", "flex flex-col outline-none"],
	{
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
	},
);

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
			<Dialog.Backdrop className="fixed inset-0 bg-fill-overlay transition-opacity duration-200 ease-out motion-reduce:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0" />
			<div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-6">
				<Dialog.Popup
					className={cn(
						modalPopupVariants({ size, className }),
						"transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95",
					)}
					ref={ref}
					{...props}
				>
					{children}
					{showClose && (
						<Dialog.Close
							className={cn(
								"absolute top-4 right-4",
								"flex items-center justify-center size-8 rounded-8",
								"text-icon-neutral cursor-pointer",
								"hover:bg-fill-hover active:bg-fill-press",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
								"after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-1/2 after:size-10",
							)}
							aria-label="Close"
						>
							<XIcon size={16} weight="bold" />
						</Dialog.Close>
					)}
				</Dialog.Popup>
			</div>
		</Dialog.Portal>
	),
);
ModalPopup.displayName = "ModalPopup";

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(({ className, ...props }, ref) => (
	<div className={cn("flex flex-col gap-1 px-6 pt-6 pr-14", className)} ref={ref} {...props} />
));
ModalHeader.displayName = "ModalHeader";

interface ModalTitleProps extends React.ComponentPropsWithoutRef<typeof Dialog.Title> {}

const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(({ className, ...props }, ref) => (
	<Dialog.Title
		className={cn("text-base font-semibold text-text-strong text-balance", className)}
		ref={ref}
		{...props}
	/>
));
ModalTitle.displayName = "ModalTitle";

interface ModalDescriptionProps extends React.ComponentPropsWithoutRef<typeof Dialog.Description> {}

const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
	({ className, ...props }, ref) => (
		<Dialog.Description className={cn("text-sm text-text-weak text-pretty", className)} ref={ref} {...props} />
	),
);
ModalDescription.displayName = "ModalDescription";

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(({ className, ...props }, ref) => (
	<div className={cn("px-6 py-4", className)} ref={ref} {...props} />
));
ModalContent.displayName = "ModalContent";

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(({ className, ...props }, ref) => (
	<div className={cn("flex items-center justify-end gap-3 px-6 pb-6", className)} ref={ref} {...props} />
));
ModalFooter.displayName = "ModalFooter";

export {
	Modal,
	ModalTrigger,
	ModalClose,
	ModalPopup,
	ModalHeader,
	ModalTitle,
	ModalDescription,
	ModalContent,
	ModalFooter,
	modalPopupVariants,
};
export type {
	ModalPopupProps,
	ModalHeaderProps,
	ModalTitleProps,
	ModalDescriptionProps,
	ModalContentProps,
	ModalFooterProps,
};
