import { t } from "@lingui/core/macro";
import { ArrowsClockwiseIcon, CaretDownIcon, LightningIcon, TagIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="text"
					size="sm"
					disabled={!canClose || isClosing}
					className="gap-0.5"
					aria-label={t`Position actions`}
				>
					{isRowClosing ? t`Closing...` : t`Close`}
					{!isRowClosing && <CaretDownIcon className="size-3" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onMarketClose}>
					<LightningIcon className="size-3.5" />
					{t`Market Close`}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onLimitClose}>
					<TagIcon className="size-3.5" />
					{t`Limit Close`}
				</DropdownMenuItem>
				<DropdownMenuSeparator className="bg-border-200" />
				<DropdownMenuItem onClick={onReverse}>
					<ArrowsClockwiseIcon className="size-3.5" />
					{t`Reverse`}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
