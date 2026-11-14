import { Dropdown, type DropdownItem } from "@hypeterminal/ui";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import type { SpotToken } from "@/lib/hyperliquid/markets";
import { AssetDisplay } from "./asset-display";

interface Props {
	tokens: SpotToken[];
	selectedToken: string;
	onSelect: (token: string) => void;
	getBalance: (token: string) => string | null;
	disabled?: boolean;
	className?: string;
}

export function TokenSelectorDropdown({ tokens, selectedToken, onSelect, getBalance, disabled, className }: Props) {
	const selected = tokens.find((t) => t.name === selectedToken);

	const items: DropdownItem[] = tokens.map((token) => {
		const balance = getBalance(token.name);
		return {
			label: `${token.name}  ${formatToken(balance, 4)}`,
			icon: <AssetDisplay coin={token.name} hideName iconClassName="size-5" />,
			active: token.name === selectedToken,
			onSelect: () => onSelect(token.name),
		};
	});

	return (
		<Dropdown
			items={items}
			disabled={disabled}
			trigger={
				<span className={cn("inline-flex items-center gap-2", className)}>
					{selected ? (
						<AssetDisplay coin={selected.name} iconClassName="size-5" nameClassName="text-sm font-medium" />
					) : (
						<span className="text-sm font-medium">{selectedToken}</span>
					)}
				</span>
			}
			className={cn(disabled && "opacity-50 cursor-not-allowed")}
		/>
	);
}
