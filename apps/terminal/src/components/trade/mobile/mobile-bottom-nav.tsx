import { t } from "@lingui/core/macro";
import { MOBILE_BOTTOM_NAV_HEIGHT_PX } from "@/config/layout";
import { MOBILE_NAV_ITEMS, type MobileTab } from "@/config/nav";
import { cn } from "@/lib/cn";

const NAV_BADGE_MAX_COUNT = 99;

function getTabLabel(tab: MobileTab): string {
	switch (tab) {
		case "home":
			return t`Home`;
		case "markets":
			return t`Markets`;
		case "activity":
			return t`Activity`;
	}
}

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
				"fixed inset-x-0 bottom-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-stroke-weak/60",
				"pb-[env(safe-area-inset-bottom)]",
				className,
			)}
			aria-label={t`Primary navigation`}
		>
			<div className="flex items-stretch">
				{MOBILE_NAV_ITEMS.map((item) => {
					const isActive = activeTab === item.id;
					const badgeCount = badges?.[item.id];
					const showBadge = typeof badgeCount === "number" && badgeCount > 0;
					const Icon = item.icon;
					const label = getTabLabel(item.id);

					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onTabChange(item.id)}
							style={{ minHeight: `${MOBILE_BOTTOM_NAV_HEIGHT_PX}px` }}
							className={cn(
								"flex-1 flex flex-col items-center justify-center gap-0.5 rounded-none",
								"py-2 px-1",
								"transition-colors duration-150 ease-out",
								"active:bg-fill-press active:scale-95",
								isActive ? "text-brand" : "text-fg",
							)}
							aria-current={isActive ? "page" : undefined}
							aria-label={label}
						>
							<span className="relative">
								<Icon className="size-5" />
								{isActive && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brand" />}
								{showBadge && (
									<span
										className={cn(
											"absolute -top-1 -right-2 min-w-4 h-4 px-1",
											"flex items-center justify-center",
											"rounded-full text-xs font-medium tabular-nums",
											"bg-brand text-white",
										)}
									>
										{badgeCount > NAV_BADGE_MAX_COUNT ? `${NAV_BADGE_MAX_COUNT}+` : badgeCount}
									</span>
								)}
							</span>
							<span className="text-xs font-medium tracking-wide">{label}</span>
						</button>
					);
				})}
			</div>
		</nav>
	);
}

export function MobileBottomNavSpacer({ className }: { className?: string }) {
	return (
		<div
			style={{ height: `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom))` }}
			className={cn("shrink-0", className)}
			aria-hidden="true"
		/>
	);
}
