import type { LucideIcon } from "lucide-react";

type ToolRailButtonProps = {
	Icon: LucideIcon;
};

export function ToolRailButton({ Icon }: ToolRailButtonProps) {
	return (
		<button
			type="button"
			className="size-7 flex items-center justify-center text-muted-foreground hover:text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors"
			tabIndex={0}
			aria-label="chart tool"
		>
			<Icon className="size-3.5" />
		</button>
	);
}

