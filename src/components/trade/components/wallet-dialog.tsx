import { Trans } from "@lingui/react/macro";
import { Loader2 } from "lucide-react";
import { type Connector, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WalletDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: WalletDialogProps) {
	const { connectors, connect, isPending, error } = useConnect();
	const hasConnector = connectors.length > 0;

	const handleConnect = (connector: Connector) => {
		connect({ connector });
		// Dialog will be closed by the parent or by connection success effect if needed
		// But usually we keep it open until connected or let the wallet handle it.
		// For injected, the modal closes often. For WC, it shows a QR code.
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle><Trans>Connect Wallet</Trans></DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{connectors.map((connector) => (
						<Button
							key={connector.uid}
							variant="outline"
							className="justify-start gap-3 h-12"
							onClick={() => handleConnect(connector)}
							disabled={isPending}
						>
							{/* We could add icons here based on connector.name or connector.id */}
							<div className="size-6 rounded-full bg-muted flex items-center justify-center">
								{/* Placeholder for icon if needed, or mapping logic */}
								<span className="text-xs font-bold">{connector.name.slice(0, 1)}</span>
							</div>
							<span className="flex-1 text-left">{connector.name}</span>
							{isPending && <Loader2 className="size-4 animate-spin" />}
						</Button>
					))}
					{!hasConnector && <p className="text-sm text-center text-muted-foreground"><Trans>No wallets found</Trans></p>}
					{error && <p className="text-sm text-center text-destructive">{error.message}</p>}
				</div>
			</DialogContent>
		</Dialog>
	);
}
