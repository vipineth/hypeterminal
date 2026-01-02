import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UI_TEXT } from "@/constants/app";

const DEPOSIT_TEXT = UI_TEXT.DEPOSIT_MODAL;

interface DepositModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{DEPOSIT_TEXT.TITLE}</DialogTitle>
					<DialogDescription>{DEPOSIT_TEXT.DESCRIPTION}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<Button variant="outline" className="justify-start gap-3 h-12" asChild>
						<a href="https://app.hyperliquid.xyz/portfolio" target="_blank" rel="noopener noreferrer">
							<div className="size-6 rounded-full bg-terminal-cyan/20 flex items-center justify-center">
								<span className="text-xs font-bold text-terminal-cyan">H</span>
							</div>
							<span className="flex-1 text-left">{DEPOSIT_TEXT.BUTTON_LABEL}</span>
							<ExternalLink className="size-4 text-muted-foreground" />
						</a>
					</Button>
					<p className="text-xs text-muted-foreground text-center">
						{DEPOSIT_TEXT.HELP_TEXT}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
