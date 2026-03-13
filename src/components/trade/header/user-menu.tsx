import { Trans } from "@lingui/react/macro";
import {
	CaretDownIcon,
	CheckIcon,
	CopyIcon,
	PlusCircleIcon,
	SignOutIcon,
	SpinnerGapIcon,
	WalletIcon,
} from "@phosphor-icons/react";
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
			{copied ? (
				<CheckIcon className="size-3.5 animate-in zoom-in-50 fade-in-0 duration-150 ease-out" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
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
			<Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-sm text-text-500" disabled>
				<SpinnerGapIcon className="size-3 animate-spin" />
				<Trans>Connecting...</Trans>
			</Button>
		);
	}

	if (!isConnected) {
		return (
			<>
				<Button
					size="default"
					variant="outline"
					className="h-8 rounded-lg px-3 text-sm"
					onClick={() => setIsOpen(true)}
				>
					<WalletIcon className="size-4" />
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
					<Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-sm text-text-950">
						<div className="size-1.5 rounded-full bg-market-up-600 animate-pulse" />
						{ensName ?? (address ? shortenAddress(address) : "")}
						<CaretDownIcon className="size-2.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-44 text-sm">
					{address && <CopyAddressMenuItem address={address} />}
					<DropdownMenuItem className="flex items-center gap-2">
						<PlusCircleIcon className="size-3.5 text-text-600" />
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
						<SignOutIcon className="size-3.5" />
						<span>
							<Trans>Disconnect</Trans>
						</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
