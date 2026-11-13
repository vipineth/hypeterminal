import { Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsClockwiseIcon, LightningIcon, TagIcon } from "@phosphor-icons/react";

interface Props {
	canClose: boolean;
	canReverse: boolean;
	isRowClosing: boolean;
	onMarketClose: () => void;
	onLimitClose: () => void;
	onReverse: () => void;
}

export function PositionActionsDropdown({
	canClose,
	canReverse,
	isRowClosing,
	onMarketClose,
	onLimitClose,
	onReverse,
}: Props) {
	return (
		<Dropdown
			className="flex justify-end text-xs text-fg-muted"
			triggerVariant="minimal"
			triggerClassName="font-medium"
			triggerAriaLabel={t`Position close actions`}
			trigger={isRowClosing ? t`Closing...` : t`Close`}
			disabled={!canClose || isRowClosing}
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
							disabled: !canReverse,
							onSelect: onReverse,
						},
					],
				},
			]}
		/>
	);
}
