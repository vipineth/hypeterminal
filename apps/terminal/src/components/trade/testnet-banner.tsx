import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { WarningIcon } from "@phosphor-icons/react";
import { useGlobalSettingsActions, useIsTestnet } from "@/stores/use-global-settings-store";

export function TestnetBanner() {
	const isTestnet = useIsTestnet();
	const { setNetwork } = useGlobalSettingsActions();

	if (!isTestnet) return null;

	return (
		<div className="fixed top-0 left-0 right-0 z-50 h-8 bg-fill-warning-strong text-text-inverse-strong flex items-center justify-center gap-2 text-xs font-medium">
			<WarningIcon className="size-3.5" />
			<span>{t`You are on Testnet`}</span>
			<Button
				variant="outline"
				intent="inverse"
				size="sm"
				onClick={() => setNetwork("mainnet")}
				className="h-5 px-2 text-xs font-medium"
			>
				{t`Switch to Mainnet`}
			</Button>
		</div>
	);
}
