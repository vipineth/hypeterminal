import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CheckIcon, LightningIcon, QuestionIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/config/time";
import { usePendingRequests, useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { cn } from "@/lib/cn";
import type { OrderOutcome, OrderResult, UnreadableSlot } from "@/lib/trade/extract-order-status";
import { getRequestKey, type Lookup } from "@/lib/trade/order-sender";
import type { PendingRequest } from "@/lib/trade/pending-requests";
import {
	type OrderQueueItem,
	requestResultToQueueUpdate,
	resultToQueueUpdate,
	useOrderQueue,
	useOrderQueueActions,
} from "@/stores/use-order-queue-store";

const ORDER_TOAST_WIDTH = "w-80";
const ORDER_TOAST_LIST_MAX_HEIGHT = "max-h-72";

function useAutoRemove(order: OrderQueueItem, onRemove: () => void) {
	useEffect(() => {
		if (order.status !== "success" || !order.completedAt) return;

		const elapsed = Date.now() - order.completedAt;
		const remaining = ORDER_TOAST_SUCCESS_DURATION_MS - elapsed;

		if (remaining <= 0) {
			onRemove();
			return;
		}

		const timer = setTimeout(onRemove, remaining);
		return () => clearTimeout(timer);
	}, [order.status, order.completedAt, onRemove]);
}

function getOrderTypeLabel(orderType: OrderQueueItem["orderType"]): string | null {
	switch (orderType) {
		case "trigger":
			return "Trigger";
		case "scale":
			return "Scale";
		case "twap":
			return "TWAP";
		default:
			return null;
	}
}

function getOutcomeLabel(outcome: OrderOutcome): string {
	switch (outcome) {
		case "filled":
			return t`Filled`;
		case "partiallyFilled":
			return t`Partly filled`;
		case "resting":
			return t`Placed`;
		case "triggerSet":
			return t`Set`;
		case "twapStarted":
			return t`Running`;
	}
}

interface RowActions {
	retry: (requestKey: string) => void;
	cancel: (requestKey: string) => void;
	previewDismiss: (requestKey: string) => void;
	keep: (requestKey: string) => void;
	dismiss: (requestKey: string, lookup: Lookup) => void;
	confirmUnreadable: (rowId: string, confirm: boolean) => void;
	dismissUnreadable: (rowId: string, unreadable: UnreadableSlot) => void;
}

interface Props {
	order: OrderQueueItem;
	onRemove: () => void;
	actions: RowActions;
	canCancel: boolean;
}

function OrderItem({ order, onRemove, actions, canCancel }: Props) {
	useAutoRemove(order, onRemove);

	const sideColor = order.side === "buy" ? "text-success" : "text-error";
	const sideBg = order.side === "buy" ? "bg-success-soft" : "bg-error-soft";
	const orderTypeLabel = getOrderTypeLabel(order.orderType);
	const hasTpSl = order.tpPrice || order.slPrice;

	return (
		<div
			className={cn(
				"flex gap-3 py-2.5 px-3 transition-[opacity,transform] duration-300",
				order.status === "pending" && "animate-pulse",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center size-7 rounded-8 shrink-0",
					order.status === "pending" && "bg-brand-soft border border-stroke-brand-strong/30",
					order.status === "success" && "bg-success-soft border border-stroke-success-strong/30",
					order.status === "failed" && "bg-error-soft border border-stroke-error-strong/30",
					(order.status === "unsettled" || order.status === "unknown") &&
						"bg-warning-soft border border-stroke-warning-strong/30",
				)}
			>
				{order.status === "pending" && <SpinnerGapIcon className="size-4 animate-spin text-brand" />}
				{order.status === "success" && <CheckIcon className="size-4 text-success" />}
				{order.status === "failed" && <XIcon className="size-4 text-error" />}
				{(order.status === "unsettled" || order.status === "unknown") && (
					<QuestionIcon className="size-4 text-warning" />
				)}
			</div>

			<div className="flex-1 min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					{orderTypeLabel && (
						<span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-surface text-fg-muted">
							{orderTypeLabel}
						</span>
					)}
					<span className={cn("px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide", sideBg, sideColor)}>
						{order.side}
					</span>
					<span className="text-xs font-medium text-fg">{order.market || t`Unconfirmed order`}</span>
					{order.status === "success" && order.outcome && (
						<span className={cn("text-xs font-medium", order.outcome === "filled" ? "text-success" : "text-fg-muted")}>
							{getOutcomeLabel(order.outcome)}
						</span>
					)}
				</div>
				<div className="text-xs text-fg-muted flex items-center gap-2 flex-wrap">
					<span>
						{t`Size`}: <span className="text-fg font-medium">{order.size}</span>
					</span>
					{order.price && (
						<span>
							@ <span className="text-fg font-medium">{order.price}</span>
						</span>
					)}
				</div>
				{hasTpSl && (
					<div className="text-xs text-fg-muted flex items-center gap-2">
						{order.tpPrice && (
							<span>
								TP: <span className="text-success font-medium">{order.tpPrice}</span>
							</span>
						)}
						{order.slPrice && (
							<span>
								SL: <span className="text-error font-medium">{order.slPrice}</span>
							</span>
						)}
					</div>
				)}
				{order.status === "success" && order.detail && <div className="text-xs text-fg-muted">{order.detail}</div>}
				{order.error && (
					<div className={cn("text-xs", order.status === "failed" ? "text-error" : "text-warning")}>{order.error}</div>
				)}
				{order.status === "unsettled" && order.requestKey && (
					<RequestActions
						requestKey={order.requestKey}
						confirm={order.confirmDismiss}
						canDismiss={order.canDismiss === true}
						canCancel={canCancel}
						actions={actions}
					/>
				)}
				{order.status === "failed" && order.unreadable && (
					<UnreadableActions order={order} unreadable={order.unreadable} actions={actions} />
				)}
			</div>

			{(order.status === "failed" || order.status === "unknown") && (
				<Button
					variant="ghost"
					intent="neutral"
					onClick={onRemove}
					className="p-1.5 rounded-8 text-fg-muted hover:text-fg hover:bg-fill-hover transition-colors shrink-0 self-start"
					aria-label={t`Dismiss`}
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}

function RequestActions({
	requestKey,
	confirm,
	canDismiss,
	canCancel,
	actions,
}: {
	requestKey: string;
	confirm: OrderQueueItem["confirmDismiss"];
	canDismiss: boolean;
	canCancel: boolean;
	actions: RowActions;
}) {
	if (confirm) {
		return (
			<div className="space-y-1 pt-1">
				<div className="text-xs text-fg">{confirm.text}</div>
				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						intent="error"
						size="xxs"
						className="rounded-xs"
						onClick={() => actions.dismiss(requestKey, confirm.lookup)}
					>
						{t`Yes, dismiss it`}
					</Button>
					<Button
						variant="ghost"
						intent="neutral"
						size="xxs"
						className="rounded-xs"
						onClick={() => actions.keep(requestKey)}
					>
						{t`Keep it`}
					</Button>
				</div>
			</div>
		);
	}
	return (
		<div className="flex items-center gap-1.5 pt-1">
			<Button
				variant="outline"
				intent="neutral"
				size="xxs"
				className="rounded-xs"
				onClick={() => actions.retry(requestKey)}
			>
				{t`Retry`}
			</Button>
			<Button
				variant="ghost"
				intent="error"
				size="xxs"
				className="rounded-xs"
				disabled={!canCancel}
				onClick={() => actions.cancel(requestKey)}
			>
				{t`Cancel`}
			</Button>
			{canDismiss && (
				<Button
					variant="ghost"
					intent="neutral"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.previewDismiss(requestKey)}
				>
					{t`Dismiss`}
				</Button>
			)}
			{!canCancel && <span className="text-xs text-fg-muted">{t`Connect your trading wallet to cancel it.`}</span>}
		</div>
	);
}

function UnreadableActions({
	order,
	unreadable,
	actions,
}: {
	order: OrderQueueItem;
	unreadable: UnreadableSlot;
	actions: RowActions;
}) {
	if (!order.confirmUnreadable) {
		return (
			<div className="pt-1">
				<Button
					variant="outline"
					intent="neutral"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.confirmUnreadable(order.id, true)}
				>
					{t`Dismiss pending order`}
				</Button>
			</div>
		);
	}
	return (
		<div className="space-y-1 pt-1">
			<div className="text-xs text-fg">
				{t`It may still execute. Dismiss it? Your next order on this market will be sent as a new one.`}
			</div>
			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					intent="error"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.dismissUnreadable(order.id, unreadable)}
				>
					{t`Yes, dismiss it`}
				</Button>
				<Button
					variant="ghost"
					intent="neutral"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.confirmUnreadable(order.id, false)}
				>
					{t`Keep it`}
				</Button>
			</div>
		</div>
	);
}

async function outcomeOf(act: () => Promise<OrderResult>): Promise<OrderResult> {
	try {
		return await act();
	} catch (error) {
		return { ok: false, status: "notSent", error: error instanceof Error ? error.message : String(error) };
	}
}

function toQueueItem(request: PendingRequest): OrderQueueItem {
	return {
		id: getRequestKey(request),
		market: request.label.market,
		side: request.label.side,
		size: request.label.size,
		orderType: request.kind === "twap" ? "twap" : undefined,
		status: "unsettled",
		error: t`Not confirmed. Retry or cancel it.`,
		requestKey: getRequestKey(request),
		createdAt: request.signedAt,
	};
}

function CountdownBar({ order }: { order: OrderQueueItem }) {
	if (order.status !== "success") return null;

	return (
		<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-success-soft overflow-hidden">
			<div
				className="h-full bg-success/60 animate-countdown"
				style={{ animationDuration: `${ORDER_TOAST_SUCCESS_DURATION_MS}ms` }}
			/>
		</div>
	);
}

export function OrderToast() {
	const queued = useOrderQueue();
	const pendingRequests = usePendingRequests();
	const { addOrder, updateOrder, updateByRequestKey, removeOrder } = useOrderQueueActions();
	const { retryRequest, cancelRequest, previewDismiss, dismissRequest, dismissUnreadable, canCancel } = useSubmitPlan();

	const queuedKeys = new Set(queued.map((order) => order.requestKey));
	const leftOver = pendingRequests.filter((request) => !queuedKeys.has(getRequestKey(request))).map(toQueueItem);
	const orders = [...leftOver, ...queued];
	if (orders.length === 0) return null;

	function adopt(requestKey: string, status: OrderQueueItem["status"]) {
		const order = leftOver.find((item) => item.requestKey === requestKey);
		if (order) addOrder({ ...order, status });
	}

	async function runRequestAction(requestKey: string, act: () => Promise<OrderResult>) {
		adopt(requestKey, "pending");
		updateByRequestKey(requestKey, { status: "pending", confirmDismiss: undefined });
		updateByRequestKey(requestKey, requestResultToQueueUpdate(await outcomeOf(act)));
	}

	async function handlePreviewDismiss(requestKey: string) {
		updateByRequestKey(requestKey, { status: "pending" });
		try {
			const preview = await previewDismiss(requestKey);
			updateByRequestKey(
				requestKey,
				preview.kind === "confirm"
					? { status: "unsettled", confirmDismiss: { text: preview.text, lookup: preview.lookup } }
					: requestResultToQueueUpdate(preview.result),
			);
		} catch (error) {
			updateByRequestKey(requestKey, requestResultToQueueUpdate(await outcomeOf(() => Promise.reject(error))));
		}
	}

	async function handleDismissUnreadable(rowId: string, unreadable: UnreadableSlot) {
		updateOrder(rowId, { status: "pending", confirmUnreadable: undefined });
		updateOrder(rowId, resultToQueueUpdate(await outcomeOf(() => dismissUnreadable(unreadable.slot, unreadable.raw))));
	}

	const actions: RowActions = {
		retry(requestKey) {
			void runRequestAction(requestKey, () => retryRequest(requestKey));
		},
		cancel(requestKey) {
			void runRequestAction(requestKey, () => cancelRequest(requestKey));
		},
		previewDismiss(requestKey) {
			void handlePreviewDismiss(requestKey);
		},
		keep(requestKey) {
			updateByRequestKey(requestKey, { confirmDismiss: undefined });
		},
		dismiss(requestKey, lookup) {
			void runRequestAction(requestKey, () => dismissRequest(requestKey, lookup));
		},
		confirmUnreadable(rowId, confirm) {
			updateOrder(rowId, { confirmUnreadable: confirm || undefined });
		},
		dismissUnreadable(rowId, unreadable) {
			void handleDismissUnreadable(rowId, unreadable);
		},
	};

	const pendingCount = orders.filter((o) => o.status === "pending").length;
	const successCount = orders.filter((o) => o.status === "success").length;
	const failedCount = orders.filter((o) => o.status === "failed").length;
	const unsettledCount = orders.filter((o) => o.status === "unsettled" || o.status === "unknown").length;

	return (
		<div
			className={cn(
				ORDER_TOAST_WIDTH,
				"fixed bottom-6 right-6 z-50",
				"bg-surface/95 backdrop-blur-sm",
				"border border-stroke-weak/60 rounded-8 overflow-hidden",
				"shadow-overlay shadow-black/20 dark:shadow-black/50",
				"font-sans",

				pendingCount > 0 && "ring-1 ring-stroke-brand-strong/30",
				failedCount > 0 && pendingCount === 0 && "ring-1 ring-stroke-error-strong/30",
				unsettledCount > 0 && pendingCount === 0 && failedCount === 0 && "ring-1 ring-stroke-warning-strong/30",
				successCount > 0 &&
					pendingCount === 0 &&
					failedCount === 0 &&
					unsettledCount === 0 &&
					"ring-1 ring-stroke-success-strong/30",
			)}
		>
			<div className="px-3 py-2 border-b border-stroke-weak/40 bg-surface flex items-center justify-between">
				<div className="flex items-center gap-2">
					<LightningIcon className="size-4 text-brand" />
					<span className="text-xs font-semibold uppercase tracking-wider text-fg">{t`Order Queue`}</span>
				</div>
				<div className="flex items-center gap-1.5">
					{pendingCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-xs font-medium bg-brand-soft text-brand border border-stroke-brand-strong/30">
							{pendingCount} {t`pending`}
						</span>
					)}
					{unsettledCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-xs font-medium bg-warning-soft text-warning border border-stroke-warning-strong/30">
							{unsettledCount} {t`unconfirmed`}
						</span>
					)}
					{failedCount > 0 && (
						<span className="px-1.5 py-0.5 rounded text-xs font-medium bg-error-soft text-error border border-stroke-error-strong/30">
							{failedCount} {t`failed`}
						</span>
					)}
				</div>
			</div>

			<div className={cn("divide-y divide-stroke-weak/30 overflow-y-auto", ORDER_TOAST_LIST_MAX_HEIGHT)}>
				{orders.map((order) => (
					<div key={order.id} className="relative">
						<OrderItem order={order} onRemove={() => removeOrder(order.id)} actions={actions} canCancel={canCancel} />
						<CountdownBar order={order} />
					</div>
				))}
			</div>
		</div>
	);
}
