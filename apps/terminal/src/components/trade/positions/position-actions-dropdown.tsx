import { Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsClockwiseIcon, LightningIcon, TagIcon } from "@phosphor-icons/react";

interface Props {
	canClose: boolean;
	isClosing: boolean;
	isRowClosing: boolean;
	onMarketClose: () => void;
	onLimitClose: () => void;
	onReverse: () => void;
}

export function PositionActionsDropdown({
	canClose,
	isClosing,
	isRowClosing,
	onMarketClose,
	onLimitClose,
	onReverse,
}: Props) {
	return (
		<Dropdown
			trigger={isRowClosing ? t`Closing...` : t`Close`}
			disabled={!canClose || isClosing}
			align="end"
			groups={[
				{
					items: [
						{
							label: t`Market Close`,
							icon: <LightningIcon className="size-3.5" />,
							onSelect: onMarketClose,
						},
						{
							label: t`Limit Close`,
							icon: <TagIcon className="size-3.5" />,
							onSelect: onLimitClose,
						},
					],
				},
				{
					items: [
						{
							label: t`Reverse`,
							icon: <ArrowsClockwiseIcon className="size-3.5" />,
							onSelect: onReverse,
						},
					],
				},
			]}
		/>
	);
}
