import { useEffect, useState } from "react";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { useIsMobile } from "@/hooks/use-mobile";
import { LeverageBadge } from "./leverage-badge";
import { LeveragePopover } from "./leverage-popover";
import { LeverageSheet } from "./leverage-sheet";

interface Props {
	marketKey?: string;
	className?: string;
}

export function LeverageControl({ marketKey, className }: Props) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

	const {
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		displayLeverage,
		isDirty,
		isUpdating,
		updateError,
		subscriptionStatus,
		setPendingLeverage,
		confirmLeverage,
		resetPending,
	} = useAssetLeverage();

	useEffect(() => {
		setOpen(false);
	}, [marketKey]);

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			resetPending();
		}
		setOpen(newOpen);
	};

	const isLoading = subscriptionStatus === "loading";

	if (isMobile) {
		return (
			<>
				<LeverageBadge
					leverage={displayLeverage}
					onClick={() => setOpen(true)}
					isLoading={isLoading}
					className={className}
				/>
				<LeverageSheet
					open={open}
					onOpenChange={handleOpenChange}
					currentLeverage={currentLeverage}
					pendingLeverage={pendingLeverage}
					maxLeverage={maxLeverage}
					isDirty={isDirty}
					isUpdating={isUpdating}
					updateError={updateError}
					onLeverageChange={setPendingLeverage}
					onConfirm={confirmLeverage}
					onCancel={resetPending}
				/>
			</>
		);
	}

	return (
		<LeveragePopover
			open={open}
			onOpenChange={handleOpenChange}
			currentLeverage={currentLeverage}
			pendingLeverage={pendingLeverage}
			maxLeverage={maxLeverage}
			isDirty={isDirty}
			isUpdating={isUpdating}
			updateError={updateError}
			onLeverageChange={setPendingLeverage}
			onConfirm={confirmLeverage}
			onCancel={resetPending}
			trigger={<LeverageBadge leverage={displayLeverage} isLoading={isLoading} className={className} />}
		/>
	);
}

export { useAssetLeverage };
