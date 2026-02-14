import { BookOpenIcon, CurrencyCircleDollarIcon, ListIcon, TrendUpIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/cn";
import { MobileAccountView } from "./views/account-view";
import { MobileBookView } from "./views/book-view";
import { MobilePositionsView } from "./views/positions-view";
import { MobileTradeView } from "./views/trade-view";

type DrawerTab = "trade" | "positions" | "book" | "account";

interface NavItem {
	id: DrawerTab;
	label: string;
	icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "trade", label: "Trade", icon: <TrendUpIcon className="size-5" weight="bold" /> },
	{ id: "book", label: "Book", icon: <BookOpenIcon className="size-5" weight="bold" /> },
	{ id: "positions", label: "Positions", icon: <ListIcon className="size-5" weight="bold" /> },
	{ id: "account", label: "Account", icon: <CurrencyCircleDollarIcon className="size-5" weight="bold" /> },
];

function haptic(style: "light" | "medium" = "light") {
	if (typeof navigator === "undefined" || !navigator.vibrate) return;
	navigator.vibrate(style === "light" ? 8 : 15);
}

const DRAWER_CONTENT_MAP: Record<DrawerTab, () => ReactNode> = {
	trade: () => <MobileTradeView />,
	book: () => <MobileBookView />,
	positions: () => <MobilePositionsView />,
	account: () => <MobileAccountView />,
};

interface Props {
	badges?: Partial<Record<DrawerTab, number>>;
	className?: string;
}

export function MobileFloatingNav({ badges, className }: Props) {
	const [activeDrawer, setActiveDrawer] = useState<DrawerTab | null>(null);

	function handleTabPress(tab: DrawerTab) {
		setActiveDrawer((prev) => {
			const next = prev === tab ? null : tab;
			haptic(next ? "medium" : "light");
			return next;
		});
	}

	function handleDrawerChange(tab: DrawerTab, open: boolean) {
		if (!open) {
			haptic("light");
			setActiveDrawer((prev) => (prev === tab ? null : prev));
		}
	}

	return (
		<>
			<nav
				className={cn("fixed inset-x-0 bottom-0 z-50", "px-4 pb-safe-bottom", className)}
				aria-label="Primary navigation"
			>
				<div className={cn("bg-fill-900 rounded-full shadow-xl", "grid grid-cols-4 items-stretch")}>
					{NAV_ITEMS.map((item) => {
						const isActive = activeDrawer === item.id;
						const badgeCount = badges?.[item.id];
						const showBadge = typeof badgeCount === "number" && badgeCount > 0;

						return (
							<Button
								key={item.id}
								variant="text"
								size="none"
								type="button"
								onClick={() => handleTabPress(item.id)}
								className={cn(
									"relative flex flex-col items-center justify-center gap-0.5 rounded-full",
									"min-h-[56px] py-2 px-1",
									"transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform",
									"active:scale-[0.92]",
									"hover:bg-transparent",
									isActive ? "text-primary-default" : "text-text-950",
								)}
								aria-label={showBadge ? `${item.label}, ${badgeCount} pending` : item.label}
							>
								<span className="relative">
									<span aria-hidden>{item.icon}</span>
									{showBadge && (
										<span
											className={cn(
												"absolute -top-1 -right-2 min-w-4 h-4 px-1",
												"flex items-center justify-center",
												"rounded-full text-3xs font-medium tabular-nums",
												"bg-primary-default text-text-10",
											)}
											aria-hidden
										>
											{badgeCount > 99 ? "99+" : badgeCount}
										</span>
									)}
								</span>
								<span className="text-3xs font-medium">{item.label}</span>
								{isActive && <span className="absolute bottom-1.5 h-0.5 w-4 rounded-full bg-primary-default" />}
							</Button>
						);
					})}
				</div>
			</nav>

			{NAV_ITEMS.map((item) => (
				<Drawer
					key={item.id}
					open={activeDrawer === item.id}
					onOpenChange={(open) => handleDrawerChange(item.id, open)}
				>
					<DrawerContent className="h-[85vh]">
						<div className="flex-1 min-h-0 overflow-y-auto">{DRAWER_CONTENT_MAP[item.id]()}</div>
					</DrawerContent>
				</Drawer>
			))}
		</>
	);
}
