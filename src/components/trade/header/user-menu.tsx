import { ChevronDown, Copy, CopyCheck, Loader2, LogOut, PlusCircle, Zap } from "lucide-react";
import { useState } from "react";
import { useConnection, useDisconnect, useEnsName } from "wagmi";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { shortenAddress } from "@/lib/format";
import { WalletDialog } from "./wallet-dialog";

function CopyAddressMenuItem({ address }: { address: string }) {
	const { copied, copy } = useCopyToClipboard();

	function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		copy(address);
	}

	return (
		<DropdownMenuItem className="flex items-center gap-2" onClick={handleClick}>
			{copied ? <CopyCheck className="size-3.5" /> : <Copy className="size-3.5" />}
			<span>Copy Address</span>
		</DropdownMenuItem>
	);
}

export function UserMenu() {
	const { address, isConnected, isConnecting } = useConnection();
	const disconnect = useDisconnect();
	const { data: ensName } = useEnsName({ address });
	const [isOpen, setIsOpen] = useState(false);

	if (isConnecting) {
		return (
			<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-3xs uppercase tracking-wider" disabled>
				<Loader2 className="size-3 animate-spin" />
				Connecting...
			</Button>
		);
	}

	if (!isConnected) {
		return (
			<>
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-3xs uppercase tracking-wider border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green"
					onClick={() => setIsOpen(true)}
				>
					<Zap className="size-3 mr-1" />
					Connect Wallet
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
						<div className="size-1.5 rounded-full bg-terminal-green animate-pulse" />
						{ensName ?? (address ? shortenAddress(address) : "")}
						<ChevronDown className="size-2.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44 text-xs font-mono">
					{address && <CopyAddressMenuItem address={address} />}
					<DropdownMenuItem className="flex items-center gap-2">
						<PlusCircle className="size-3.5 text-muted-foreground" />
						<span>Add funds</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="flex items-center gap-2 text-terminal-red focus:text-terminal-red"
						onClick={() => disconnect.mutate()}
					>
						<LogOut className="size-3.5" />
						<span>Disconnect</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
