import { Trans } from "@lingui/react/macro";
import { ChevronDown, Copy, CopyCheck, Loader2, LogOut, PlusCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useConnection, useDisconnect, useEnsName } from "wagmi";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { shortenAddress } from "@/lib/format";
import { WalletDialog } from "../components/wallet-dialog";

function CopyAddressMenuItem({ address }: { address: string }) {
	const { copied, copy } = useCopyToClipboard();

	function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		copy(address);
	}

	return (
		<DropdownMenuItem className="flex items-center gap-2" onClick={handleClick}>
			{copied ? <CopyCheck className="size-3.5" /> : <Copy className="size-3.5" />}
			<span>
				<Trans>Copy Address</Trans>
			</span>
		</DropdownMenuItem>
	);
}

export function UserMenu() {
	const { address, isConnected, isConnecting } = useConnection();
	const disconnect = useDisconnect();
	const { data: ensName } = useEnsName({ address });
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || isConnecting) {
		return (
			<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-3xs uppercase tracking-wider" disabled>
				<Loader2 className="size-3 animate-spin" />
				<Trans>Connecting...</Trans>
			</Button>
		);
	}

	if (!isConnected) {
		return (
			<>
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-3xs uppercase tracking-wider border-positive/40 text-positive hover:bg-positive/10 hover:text-positive"
					onClick={() => setIsOpen(true)}
				>
					<Zap className="size-3 mr-1" />
					<Trans>Connect Wallet</Trans>
				</Button>
				<WalletDialog open={isOpen} onOpenChange={setIsOpen} />
			</>
		);
	}

	return (
		<div className="flex items-center gap-1.5">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-3xs uppercase tracking-wider">
						<div className="size-1.5 rounded-full bg-positive animate-pulse" />
						{ensName ?? (address ? shortenAddress(address) : "")}
						<ChevronDown className="size-2.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-40 text-xs font-mono">
					{address && <CopyAddressMenuItem address={address} />}
					<DropdownMenuItem className="flex items-center gap-2">
						<PlusCircle className="size-3.5 text-muted-fg" />
						<span>
							<Trans>Add funds</Trans>
						</span>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						className="flex items-center gap-2"
						onClick={() => disconnect.mutate()}
					>
						<LogOut className="size-3.5" />
						<span>
							<Trans>Disconnect</Trans>
						</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
