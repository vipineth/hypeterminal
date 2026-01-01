import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalancesTab } from "./balances-tab";
import { FundingTab } from "./funding-tab";
import { HistoryTab } from "./history-tab";
import { OrdersTab } from "./orders-tab";
import { PositionsTab } from "./positions-tab";
import { TwapTab } from "./twap-tab";

const TABS = [
	{ value: "balances", label: "Balances" },
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Orders" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "History" },
	{ value: "funding", label: "Funding" },
] as const;

export function PositionsPanel() {
	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<Tabs defaultValue="positions" className="flex-1 min-h-0 flex flex-col">
				<div className="px-2 pt-1.5 border-b border-border/40">
					<TabsList className="pb-1.5">
						{TABS.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								variant="underline"
							>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value="balances" className="flex-1 min-h-0 flex flex-col mt-0">
					<BalancesTab />
				</TabsContent>
				<TabsContent value="positions" className="flex-1 min-h-0 flex flex-col mt-0">
					<PositionsTab />
				</TabsContent>
				<TabsContent value="orders" className="flex-1 min-h-0 flex flex-col mt-0">
					<OrdersTab />
				</TabsContent>
				<TabsContent value="twap" className="flex-1 min-h-0 flex flex-col mt-0">
					<TwapTab />
				</TabsContent>
				<TabsContent value="history" className="flex-1 min-h-0 flex flex-col mt-0">
					<HistoryTab />
				</TabsContent>
				<TabsContent value="funding" className="flex-1 min-h-0 flex flex-col mt-0">
					<FundingTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
