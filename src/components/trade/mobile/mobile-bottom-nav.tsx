import { BookOpenIcon, ChartBarIcon, CurrencyCircleDollarIcon, ListIcon, TrendUpIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MobileTab = "chart" | "book" | "trade" | "positions" | "account";

interface NavItem {
	id: MobileTab;
	label: string;
	icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "chart", label: "Chart", icon: <ChartBarIcon className="size-5" /> },
	{ id: "book", label: "Book", icon: <BookOpenIcon className="size-5" /> },
	{ id: "trade", label: "Trade", icon: <TrendUpIcon className="size-5" /> },
	{ id: "positions", label: "Positions", icon: <ListIcon className="size-5" /> },
	{ id: "account", label: "Account", icon: <CurrencyCircleDollarIcon className="size-5" /> },
];

interface Props {
	activeTab: MobileTab;
	onTabChange: (tab: MobileTab) => void;
	badges?: Partial<Record<MobileTab, number>>;
	className?: string;
}

export function MobileBottomNav({ activeTab, onTabChange, badges, className }: Props) {
	return (
		<nav
			className={cn(
				"fixed inset-x-0 bottom-0 z-50 bg-bg/95 backdrop-blur-sm border-t border-border/60",
				"pb-[env(safe-area-inset-bottom)]",
				className,
			)}
			aria-label="Primary navigation"
		>
			<div className="flex items-stretch">
				{NAV_ITEMS.map((item) => {
					const isActive = activeTab === item.id;
					const badgeCount = badges?.[item.id];
					const showBadge = typeof badgeCount === "number" && badgeCount > 0;

					return (
						<Button
							key={item.id}
							variant="ghost"
							size="none"
							onClick={() => onTabChange(item.id)}
							className={cn(
								"flex-1 flex flex-col items-center justify-center gap-0.5 rounded-none",
								"min-h-[56px] py-2 px-1",
								"transition-colors duration-150 ease-out",
								"active:bg-accent/50 active:scale-95",
								"hover:bg-transparent",
								isActive ? "text-info" : "text-muted-fg hover:text-fg",
							)}
							aria-current={isActive ? "page" : undefined}
							aria-label={item.label}
						>
							<span className="relative">
								{item.icon}
								{isActive && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-info" />}
								{showBadge && (
									<span
										className={cn(
											"absolute -top-1 -right-2 min-w-4 h-4 px-1",
											"flex items-center justify-center",
											"rounded-full text-[10px] font-medium tabular-nums",
											"bg-info text-bg",
										)}
									>
										{badgeCount > 99 ? "99+" : badgeCount}
									</span>
								)}
							</span>
							<span className="text-[10px] font-medium tracking-wide">{item.label}</span>
						</Button>
					);
				})}
			</div>
		</nav>
	);
}

export function MobileBottomNavSpacer({ className }: { className?: string }) {
	return <div className={cn("h-[calc(56px+env(safe-area-inset-bottom))]", "shrink-0", className)} aria-hidden="true" />;
}
