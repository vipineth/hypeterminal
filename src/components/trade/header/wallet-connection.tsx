import { ChevronDown, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletDialog } from "./wallet-dialog";

export function WalletConnection() {
	const { address, isConnected, isConnecting } = useAccount();
	const { disconnect } = useDisconnect();
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
			{/* Deposit button - keeping it separate as in original design, or integrate? 
                 The original design had "Deposit" AND "Connect/Address". 
                 I'll assume "Deposit" is a separate action available to all or just connected?
                 In original logic, it was just there. I will leave it out of *this* component 
                 if it's handled in TopNav, OR include it. 
                 The prompt said "Connect Wallet using wagmi", implying replacing the auth part.
                 I'll stick to just the Wallet part here to be safe and let TopNav compose them.
             */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-3xs uppercase tracking-wider">
						<div className="size-1.5 rounded-full bg-terminal-green animate-pulse" />
						{ensName ?? (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "")}
						<ChevronDown className="size-2.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44 text-xs font-mono">
					{/* Placeholder menu items from original */}
					<DropdownMenuItem>Account</DropdownMenuItem>
					<DropdownMenuItem>Add funds</DropdownMenuItem>
					<DropdownMenuItem>Change network</DropdownMenuItem>
					<DropdownMenuItem className="text-terminal-red focus:text-terminal-red" onClick={() => disconnect()}>
						Disconnect
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
