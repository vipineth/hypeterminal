import { Skeleton } from "@/components/ui/skeleton";

function SkeletonHeader() {
	return (
		<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
			<div className="flex items-center gap-2">
				<Skeleton className="size-6 rounded-full" />
				<div className="space-y-1">
					<Skeleton className="h-3.5 w-14" />
					<Skeleton className="h-2.5 w-8" />
				</div>
			</div>
			<Skeleton className="h-4 w-14" />
		</div>
	);
}

function SkeletonMetricCell() {
	return (
		<div className="px-3 py-2 bg-bg-sunken/50">
			<Skeleton className="h-2.5 w-8 mb-1.5" />
			<Skeleton className="h-3.5 w-14" />
		</div>
	);
}

function SkeletonFooter() {
	return (
		<div className="flex items-center justify-between px-3 py-2.5">
			<Skeleton className="h-2.5 w-20" />
			<Skeleton className="h-9 w-16 rounded-8" />
		</div>
	);
}

function PositionCardSkeleton() {
	return (
		<div className="rounded-8 border border-stroke-weak/30 bg-bg-sunken/50 animate-pulse">
			<SkeletonHeader />
			<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
			</div>
			<div className="flex items-center gap-2 px-3 py-2.5">
				<Skeleton className="h-9 w-14 rounded-8" />
				<Skeleton className="h-9 w-20 rounded-8" />
				<div className="flex-1" />
				<Skeleton className="h-9 w-16 rounded-8" />
			</div>
		</div>
	);
}

function StandardCardSkeleton() {
	return (
		<div className="rounded-8 border border-stroke-weak/30 bg-bg-sunken/50 animate-pulse">
			<SkeletonHeader />
			<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
			</div>
			<SkeletonFooter />
		</div>
	);
}

function BalanceCardSkeleton() {
	return (
		<div className="rounded-8 border border-stroke-weak/30 bg-bg-sunken/50 animate-pulse">
			<SkeletonHeader />
			<div className="grid grid-cols-2 gap-px bg-stroke-weak/20">
				<SkeletonMetricCell />
				<SkeletonMetricCell />
			</div>
		</div>
	);
}

function CompactCardSkeleton() {
	return (
		<div className="rounded-8 border border-stroke-weak/30 bg-bg-sunken/50 animate-pulse">
			<SkeletonHeader />
			<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
				<SkeletonMetricCell />
				<SkeletonMetricCell />
				<SkeletonMetricCell />
			</div>
		</div>
	);
}

export function PositionsTabSkeleton() {
	return (
		<div className="flex-1 px-3 py-2 space-y-2">
			<PositionCardSkeleton />
			<PositionCardSkeleton />
			<PositionCardSkeleton />
		</div>
	);
}

export function OrdersTabSkeleton() {
	return (
		<div className="flex-1 px-3 py-2 space-y-2">
			<StandardCardSkeleton />
			<StandardCardSkeleton />
			<StandardCardSkeleton />
		</div>
	);
}

export function BalancesTabSkeleton() {
	return (
		<div className="flex-1 px-3 py-2 space-y-2">
			<BalanceCardSkeleton />
			<BalanceCardSkeleton />
			<BalanceCardSkeleton />
			<BalanceCardSkeleton />
		</div>
	);
}

export function HistoryTabSkeleton() {
	return (
		<div className="flex-1 px-3 py-2 space-y-2">
			<StandardCardSkeleton />
			<StandardCardSkeleton />
			<StandardCardSkeleton />
			<StandardCardSkeleton />
		</div>
	);
}

export function FundingTabSkeleton() {
	return (
		<div className="flex-1 px-3 py-2 space-y-2">
			<CompactCardSkeleton />
			<CompactCardSkeleton />
			<CompactCardSkeleton />
			<CompactCardSkeleton />
		</div>
	);
}
