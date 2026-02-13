import { BookOpenIcon, ChartBarIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MobileBookView } from "./mobile-book-view";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";
import { MobileChartView } from "./mobile-chart-view";

type MarketView = "chart" | "book";

interface Props {
	className?: string;
}

export function MobileMarketView({ className }: Props) {
	const [activeView, setActiveView] = useState<MarketView>("chart");
	const chartPanelId = useId();
	const bookPanelId = useId();

	return (
		<div className={cn("flex flex-col h-full min-h-0", className)}>
			<div className="shrink-0 border-b border-border-200/60 bg-surface-execution/30 px-3 py-2">
				<div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Market views">
					<Button
						type="button"
						variant="text"
						size="none"
						role="tab"
						aria-selected={activeView === "chart"}
						aria-controls={chartPanelId}
						onClick={() => setActiveView("chart")}
						className={cn(
							"min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium",
							activeView === "chart"
								? "border-primary-default/60 bg-primary-default/10 text-primary-default"
								: "border-border-200/60 text-text-600",
						)}
					>
						<ChartBarIcon className="size-4" aria-hidden />
						<span>Chart</span>
					</Button>
					<Button
						type="button"
						variant="text"
						size="none"
						role="tab"
						aria-selected={activeView === "book"}
						aria-controls={bookPanelId}
						onClick={() => setActiveView("book")}
						className={cn(
							"min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium",
							activeView === "book"
								? "border-primary-default/60 bg-primary-default/10 text-primary-default"
								: "border-border-200/60 text-text-600",
						)}
					>
						<BookOpenIcon className="size-4" aria-hidden />
						<span>Order Book</span>
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0">
				{activeView === "chart" ? (
					<div id={chartPanelId} role="tabpanel" aria-label="Chart view" className="h-full min-h-0">
						<MobileChartView withBottomSpacer={false} />
					</div>
				) : (
					<div id={bookPanelId} role="tabpanel" aria-label="Order book view" className="h-full min-h-0">
						<MobileBookView withBottomSpacer={false} />
					</div>
				)}
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}
