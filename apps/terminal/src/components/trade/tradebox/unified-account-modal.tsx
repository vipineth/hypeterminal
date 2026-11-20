import {
	Button,
	Modal,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalPopup,
	ModalTitle,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { useIsPhoneLinked } from "@/hooks/use-is-phone-linked";
import { useExchange } from "@/lib/hyperliquid";
import { ACCOUNT_MODES_DOCS_URL } from "@/lib/trade/collateral-copy";
import { MainWalletOnlyNotice } from "../components/main-wallet-only-notice";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UnifiedAccountModal({ open, onOpenChange }: Props) {
	const [error, setError] = useState<string | null>(null);
	const { address } = useConnection();
	const isPhoneLinked = useIsPhoneLinked();
	const { mutateAsync: setAbstraction, isPending } = useExchange("userSetAbstraction");

	async function handleSwitch() {
		if (!address || isPending) return;
		setError(null);
		try {
			await setAbstraction({ user: address, abstraction: "unifiedAccount" });
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : t`Could not switch account mode`);
		}
	}

	const changes = [
		t`One balance in Spot backs perps, spot and every builder dex. You stop moving funds between dexes.`,
		t`Your USDC in Perps and on builder dexes moves into Spot when you switch.`,
		t`Positions on every dex draw on that one balance, so a loss on one dex can liquidate positions on another.`,
		t`Hyperliquid caps unified accounts at 50,000 actions a day.`,
		t`If this address earns builder fees, they stop accruing while it is unified.`,
		t`You can switch back later. Your funds stay in Spot and each dex needs its own transfer again.`,
	];

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>{t`Switch to a unified account?`}</ModalTitle>
					<ModalDescription>{t`This changes how your whole account holds margin, not just this market.`}</ModalDescription>
				</ModalHeader>
				<ModalContent>
					<ul className="flex flex-col gap-2 text-xs text-fg-muted list-disc pl-4">
						{changes.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
					<a
						href={ACCOUNT_MODES_DOCS_URL}
						target="_blank"
						rel="noreferrer"
						className="mt-3 inline-block text-xs text-brand underline-offset-2 hover:underline"
					>
						{t`How account modes work`}
					</a>
					{isPhoneLinked && <MainWalletOnlyNotice className="mt-3" />}
					{error && (
						<div className="mt-3 flex items-center gap-2 p-2.5 rounded-xs bg-error-soft border border-stroke-error-weak text-xs text-error">
							<WarningCircleIcon className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}
				</ModalContent>
				<ModalFooter>
					<Button variant="outline" intent="neutral" onClick={() => onOpenChange(false)} disabled={isPending}>
						{t`Keep standard`}
					</Button>
					<Button
						variant="filled"
						intent="brand"
						onClick={handleSwitch}
						disabled={!address || isPending || isPhoneLinked}
					>
						{isPending && <SpinnerGapIcon className="size-3.5 animate-spin mr-2" />}
						{t`Switch to unified`}
					</Button>
				</ModalFooter>
			</ModalPopup>
		</Modal>
	);
}
