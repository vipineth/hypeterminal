import { Button, Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CheckIcon,
	CopyIcon,
	DeviceMobileIcon,
	PlusCircleIcon,
	SignOutIcon,
	SpinnerGapIcon,
	WalletIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useConnection, useDisconnect, useEnsName } from "wagmi";
import { APP_BAR_BUTTON_HEIGHT_CLASS } from "@/config/layout";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { cn } from "@/lib/cn";
import { shortenAddress } from "@/lib/format";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { MobileAgentSyncModal } from "../components/mobile-agent-sync-modal";
import { WalletModal } from "../components/wallet-modal";

const USER_MENU_BUTTON_MIN_WIDTH = "min-w-[9rem]";
const USER_MENU_LABEL_MAX_WIDTH = "max-w-[11rem]";

export function UserMenu() {
	const { address, isConnected, isConnecting } = useConnection();
	const disconnect = useDisconnect();
	const { data: ensName } = useEnsName({ address });
	const { open: openDepositModal } = useDepositModalActions();
	const [isOpen, setIsOpen] = useState(false);
	const [mobileSyncOpen, setMobileSyncOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { copied, copy } = useCopyToClipboard();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || isConnecting) {
		return (
			<>
				<Button
					variant="outline"
					intent="neutral"
					size="sm"
					className={cn(
						APP_BAR_BUTTON_HEIGHT_CLASS,
						USER_MENU_BUTTON_MIN_WIDTH,
						"shrink-0 px-3 transition-[color,background-color,border-color] duration-150 ease-out",
					)}
					disabled
				>
					<SpinnerGapIcon className="size-3.5 animate-spin" />
					<Trans>Connecting...</Trans>
				</Button>
				<WalletModal open={isOpen} onOpenChange={setIsOpen} />
			</>
		);
	}

	if (!isConnected) {
		return (
			<>
				<Button
					variant="outline"
					intent="neutral"
					size="sm"
					onClick={() => setIsOpen(true)}
					iconLeft={<WalletIcon className="size-3.5" />}
					className={cn(
						APP_BAR_BUTTON_HEIGHT_CLASS,
						"shrink-0 px-3 transition-[color,background-color,border-color] duration-150 ease-out",
					)}
				>
					<Trans>Connect Wallet</Trans>
				</Button>
				<WalletModal open={isOpen} onOpenChange={setIsOpen} />
			</>
		);
	}

	const displayLabel = ensName ?? (address ? shortenAddress(address) : "");

	const actionItems = [
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
			onSelect: () => openDepositModal("deposit"),
		},
		{
			label: t`Link mobile device`,
			icon: <DeviceMobileIcon className="size-3.5" />,
			onSelect: () => setMobileSyncOpen(true),
		},
	];

	return (
		<>
			<Dropdown
				align="end"
				size="sm"
				triggerVariant="minimal"
				className="flex shrink-0 items-center"
				triggerClassName={cn(
					APP_BAR_BUTTON_HEIGHT_CLASS,
					"max-h-8 shrink-0 !rounded-8 border border-stroke-weak bg-transparent px-3 shadow-raised",
					"!py-0 text-xs gap-1.5",
					"items-center justify-start font-semibold text-fg",
					"hover:bg-fill-hover active:bg-fill-press",
					"data-[popup-open]:border-stroke-brand-strong/40 data-[popup-open]:bg-fill-hover",
					"transition-[color,background-color,border-color] duration-150 ease-out",
				)}
				triggerAriaLabel={t`Account and wallet`}
				trigger={
					<>
						<span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden />
						<span className={cn("min-w-0 truncate font-mono text-xs text-fg", USER_MENU_LABEL_MAX_WIDTH)}>
							{displayLabel}
						</span>
					</>
				}
				groups={[
					{
						items: actionItems,
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
			<MobileAgentSyncModal open={mobileSyncOpen} onOpenChange={setMobileSyncOpen} />
		</>
	);
}
