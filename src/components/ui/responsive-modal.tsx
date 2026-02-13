import type * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./drawer";

interface ResponsiveModalProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
}

function ResponsiveModal({ children, ...props }: ResponsiveModalProps) {
	const isMobile = useIsMobile();
	if (isMobile) {
		return (
			<Drawer direction="bottom" {...props}>
				{children}
			</Drawer>
		);
	}
	return <Dialog {...props}>{children}</Dialog>;
}

interface ResponsiveModalContentProps {
	className?: string;
	children: React.ReactNode;
	showCloseButton?: boolean;
}

function ResponsiveModalContent({ className, children, showCloseButton }: ResponsiveModalContentProps) {
	const isMobile = useIsMobile();
	if (isMobile) {
		return <DrawerContent className={className}>{children}</DrawerContent>;
	}
	return (
		<DialogContent className={className} showCloseButton={showCloseButton}>
			{children}
		</DialogContent>
	);
}

function ResponsiveModalHeader({ className, ...props }: React.ComponentProps<"div">) {
	const isMobile = useIsMobile();
	if (isMobile) return <DrawerHeader className={className} {...props} />;
	return <DialogHeader className={className} {...props} />;
}

function ResponsiveModalFooter({ className, ...props }: React.ComponentProps<"div">) {
	const isMobile = useIsMobile();
	if (isMobile) return <DrawerFooter className={className} {...props} />;
	return <DialogFooter className={className} {...props} />;
}

function ResponsiveModalTitle({ className, children }: { className?: string; children: React.ReactNode }) {
	const isMobile = useIsMobile();
	if (isMobile) return <DrawerTitle className={className}>{children}</DrawerTitle>;
	return <DialogTitle className={className}>{children}</DialogTitle>;
}

function ResponsiveModalDescription({ className, children }: { className?: string; children: React.ReactNode }) {
	const isMobile = useIsMobile();
	if (isMobile) return <DrawerDescription className={className}>{children}</DrawerDescription>;
	return <DialogDescription className={className}>{children}</DialogDescription>;
}

export {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
};
