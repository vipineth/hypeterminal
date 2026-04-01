import { Button, Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, CopyIcon, PlusCircleIcon, SignOutIcon, SpinnerGapIcon, WalletIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useConnection, useDisconnect, useEnsName } from "wagmi";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { shortenAddress } from "@/lib/format";
import { WalletDialog } from "../components/wallet-dialog";

export function UserMenu() {
	const { address, isConnected, isConnecting } = useConnection();
	const disconnect = useDisconnect();
	const { data: ensName } = useEnsName({ address });
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { copied, copy } = useCopyToClipboard();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || isConnecting) {
		return (
			<Button variant="link" intent="neutral" className="h-7 gap-1.5 text-xs uppercase tracking-wider" disabled>
				<SpinnerGapIcon className="size-3 animate-spin" />
				<Trans>Connecting...</Trans>
			</Button>
		);
	}

	if (!isConnected) {
		return (
			<>
				<Button
					variant="outline"
					intent="neutral"
					onClick={() => setIsOpen(true)}
					iconLeft={<WalletIcon className="size-4" />}
				>
					<Trans>Connect Wallet</Trans>
				</Button>
				<WalletDialog open={isOpen} onOpenChange={setIsOpen} />
			</>
		);
	}

	return (
		<div className="flex items-center gap-1.5">
			<Dropdown
				align="end"
				trigger={
					<>
						<div className="size-1.5 rounded-full bg-fill-success-strong animate-pulse" />
						{ensName ?? (address ? shortenAddress(address) : "")}
					</>
				}
				groups={[
					{
						items: [
							...(address
								? [
										{
											label: copied ? t`Copied!` : t`Copy Address`,
											icon: copied ? (
												<CheckIcon className="size-3.5 animate-in zoom-in-50 fade-in-0 duration-150 ease-out" />
											) : (
												<CopyIcon className="size-3.5" />
											),
											onSelect: () => copy(address),
										},
									]
								: []),
							{
								label: t`Add funds`,
								icon: <PlusCircleIcon className="size-3.5" />,
							},
						],
					},
					{
						items: [
							{
								label: t`Disconnect`,
								icon: <SignOutIcon className="size-3.5" />,
								danger: true,
								onSelect: () => disconnect.mutate(),
							},
						],
					},
				]}
			/>
		</div>
	);
}
