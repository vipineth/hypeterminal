import { PencilIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SummaryLayout = "list" | "grid";
export type SummaryTone = "default" | "muted" | "warning" | "error";

export interface SummaryItem {
	label: string;
	value: ReactNode;
	tone: SummaryTone;
	onEdit?: () => void;
}

const TONE_CLASS: Record<SummaryTone, string> = {
	default: "text-fg",
	muted: "text-fg-muted",
	warning: "text-warning",
	error: "text-error",
};

interface Props {
	items: SummaryItem[];
	layout: SummaryLayout;
}

export function SummaryItems({ items, layout }: Props) {
	if (layout === "list") {
		return (
			<div className="flex flex-col">
				{items.map((item) => (
					<div key={item.label} className="flex items-center justify-between py-1.5">
						<span className="text-xs tracking-[0.5px] text-fg-muted">{item.label}</span>
						<span className="text-xs tabular-nums">
							<ItemValue item={item} />
						</span>
					</div>
				))}
			</div>
		);
	}

	const rows: SummaryItem[][] = [];
	for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

	return (
		<div className="rounded-xs border border-stroke-weak">
			{rows.map((row, index) => (
				<div
					key={row[0].label}
					className={cn(
						"grid grid-cols-2 divide-x divide-stroke-weak/40",
						index > 0 && "border-t border-stroke-weak/40",
					)}
				>
					{row.map((item) => (
						<GridCell key={item.label} item={item} isFullRow={row.length === 1} />
					))}
				</div>
			))}
		</div>
	);
}

function ItemValue({ item }: { item: SummaryItem }) {
	if (!item.onEdit) return <span className={TONE_CLASS[item.tone]}>{item.value}</span>;
	return (
		<button
			type="button"
			onClick={item.onEdit}
			className="inline-flex cursor-pointer items-center gap-1 hover:opacity-80"
		>
			<span className={TONE_CLASS[item.tone]}>{item.value}</span>
			<PencilIcon className="size-2.5 text-fg-muted" />
		</button>
	);
}

function GridCell({ item, isFullRow }: { item: SummaryItem; isFullRow: boolean }) {
	const className = cn("flex min-w-0 flex-col gap-0.5 px-3 py-2 text-left", isFullRow && "col-span-2");
	const content = (
		<>
			<span className="text-2xs text-fg-muted">{item.label}</span>
			<span className={cn("flex items-center gap-1 truncate text-xs font-medium tabular-nums", TONE_CLASS[item.tone])}>
				{item.value}
				{item.onEdit && <PencilIcon className="size-2.5 shrink-0 text-fg-muted" />}
			</span>
		</>
	);

	if (!item.onEdit) return <div className={className}>{content}</div>;

	return (
		<button type="button" onClick={item.onEdit} className={cn(className, "cursor-pointer active:bg-fill-press")}>
			{content}
		</button>
	);
}
