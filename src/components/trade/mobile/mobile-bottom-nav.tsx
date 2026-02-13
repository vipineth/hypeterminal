import { ChartBarIcon, CurrencyCircleDollarIcon, ListIcon, TrendUpIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MobileTab = "market" | "trade" | "positions" | "account";

interface NavItem {
	id: MobileTab;
	label: string;
	icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "market", label: "Market", icon: <ChartBarIcon className="size-5" /> },
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

function getNavAriaLabel(label: string, badgeCount: number | undefined) {
	if (typeof badgeCount === "number" && badgeCount > 0) {
		return `${label}, ${badgeCount} pending`;
	}
	return label;
}

export function MobileBottomNav({ activeTab, onTabChange, badges, className }: Props) {
	return (
		<nav
			className={cn(
				"fixed inset-x-0 bottom-0 z-50 bg-surface-base/95 backdrop-blur-sm border-t border-border-200/60",
				"pb-[env(safe-area-inset-bottom)]",
				className,
			)}
			aria-label="Primary navigation"
		>
			<div className="grid grid-cols-4 items-stretch">
				{NAV_ITEMS.map((item) => {
					const isActive = activeTab === item.id;
					const badgeCount = badges?.[item.id];
					const showBadge = typeof badgeCount === "number" && badgeCount > 0;

					return (
						<Button
							key={item.id}
							variant="text"
							size="none"
							type="button"
							onClick={() => onTabChange(item.id)}
							className={cn(
								"relative flex flex-col items-center justify-center gap-0.5 rounded-none",
								"min-h-[60px] py-2 px-1",
								"transition-colors duration-150 ease-out",
								"active:bg-surface-analysis/50 active:scale-98",
								"hover:bg-transparent",
								isActive ? "text-primary-default" : "text-text-950 hover:text-text-950",
							)}
							aria-current={isActive ? "page" : undefined}
							aria-label={getNavAriaLabel(item.label, badgeCount)}
						>
							{isActive && (
								<span aria-hidden className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-primary-default" />
							)}
							<span className="relative">
								<span aria-hidden>{item.icon}</span>
								{showBadge && (
									<span
										className={cn(
											"absolute -top-1 -right-2 min-w-4 h-4 px-1",
											"flex items-center justify-center",
											"rounded-full text-3xs font-medium tabular-nums",
											"bg-primary-default text-white",
										)}
										aria-hidden
									>
										{badgeCount > 99 ? "99+" : badgeCount}
									</span>
								)}
							</span>
							<span className="text-3xs font-medium">{item.label}</span>
						</Button>
					);
				})}
			</div>
		</nav>
	);
}

export function MobileBottomNavSpacer({ className }: { className?: string }) {
	return <div className={cn("h-[calc(60px+env(safe-area-inset-bottom))]", "shrink-0", className)} aria-hidden="true" />;
}
