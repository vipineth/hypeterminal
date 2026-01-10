import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Deposit Funds</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Transfer USDC to your Hyperliquid account to start trading.</Trans>
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<Button variant="outline" className="justify-start gap-3 h-12" asChild>
						<a href="https://app.hyperliquid.xyz/portfolio" target="_blank" rel="noopener noreferrer">
							<div className="size-6 rounded-full bg-terminal-cyan/20 flex items-center justify-center">
								<span className="text-xs font-bold text-terminal-cyan">H</span>
							</div>
							<span className="flex-1 text-left">{t`Deposit on Hyperliquid`}</span>
							<ExternalLink className="size-4 text-muted-foreground" />
						</a>
					</Button>
					<p className="text-xs text-muted-foreground text-center">
						<Trans>Bridge USDC from Arbitrum or other chains to your Hyperliquid account.</Trans>
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
