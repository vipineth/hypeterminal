import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
	label: ReactNode;
	hint?: ReactNode;
	value?: ReactNode;
	trailing?: ReactNode;
	expanded?: boolean;
	disabled?: boolean;
	onClick?: () => void;
}

export function MobileTicketRow({ label, hint, value, trailing, expanded, disabled, onClick }: Props) {
	const content = (
		<>
			<span className="min-w-0 flex-1">
				<span className="block text-xs font-medium text-fg">{label}</span>
				{hint && <span className="block text-2xs text-fg-muted">{hint}</span>}
			</span>
			{value && <span className="shrink-0 text-right text-xs font-medium tabular-nums text-fg">{value}</span>}
			{trailing}
			{onClick &&
				(expanded === undefined ? (
					<CaretRightIcon className="size-3.5 shrink-0 text-icon" />
				) : (
					<CaretDownIcon className={cn("size-3.5 shrink-0 text-icon transition-transform", expanded && "rotate-180")} />
				))}
		</>
	);

	const rowClass = "flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left";

	if (!onClick) return <div className={rowClass}>{content}</div>;

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-expanded={expanded}
			className={cn(rowClass, "active:bg-fill-press disabled:cursor-not-allowed disabled:opacity-50")}
		>
			{content}
		</button>
	);
}
