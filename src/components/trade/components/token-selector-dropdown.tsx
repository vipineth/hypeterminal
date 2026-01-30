import { Trans } from "@lingui/react/macro";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SwapableToken } from "@/domain/trade/swap";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { TokenAvatar } from "./token-avatar";

interface Props {
	tokens: SwapableToken[];
	selectedToken: string;
	onSelect: (token: string) => void;
	getBalance: (token: string) => number;
	disabled?: boolean;
	className?: string;
}

export function TokenSelectorDropdown({
	tokens,
	selectedToken,
	onSelect,
	getBalance,
	disabled,
	className,
}: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button
					variant="ghost"
					size="none"
					className={cn(
						"flex items-center gap-2 px-2.5 py-1.5 border border-border/40 bg-surface/30 hover:bg-surface/50 hover:border-border/60 transition-colors",
						disabled && "opacity-50 cursor-not-allowed",
						className,
					)}
				>
					<TokenAvatar symbol={selectedToken} className="size-5" />
					<span className="text-sm font-medium">{selectedToken}</span>
					<ChevronDown className="size-3.5 text-muted-fg ml-1" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{tokens.length === 0 ? (
					<div className="px-3 py-2 text-xs text-muted-fg">
						<Trans>No tokens available</Trans>
					</div>
				) : (
					tokens.map((token) => {
						const balance = getBalance(token.name);
						const isSelected = token.name === selectedToken;

						return (
							<DropdownMenuItem
								key={token.name}
								onClick={() => onSelect(token.name)}
								className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer"
							>
								<div className="flex items-center gap-2">
									<TokenAvatar symbol={token.name} className="size-5" />
									<span className="text-sm font-medium">{token.name}</span>
									{isSelected && <Check className="size-3.5 text-info" />}
								</div>
								<span className="text-xs text-muted-fg tabular-nums">
									{formatToken(balance, 4)}
								</span>
							</DropdownMenuItem>
						);
					})
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
