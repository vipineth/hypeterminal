import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CheckIcon, MinusIcon, QuestionIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import { type ReactElement, useEffect } from "react";
import { toast } from "sonner";
import { ORDER_TOAST_SUCCESS_DURATION_MS } from "@/config/time";
import {
	type DismissPreview,
	useActiveHolds,
	usePendingRequests,
	useSettledRequestKeys,
	useSubmitPlan,
} from "@/hooks/trade/use-submit-plan";
import { cn } from "@/lib/cn";
import {
	describeHeldMarket,
	describeHoldDismissal,
	describeResend,
	type OrderOutcome,
	type OrderResult,
	type UnreadableSlot,
} from "@/lib/trade/extract-order-status";
import { getRequestKey, type Lookup } from "@/lib/trade/order-sender";
import type { PendingRequest, SlotHold } from "@/lib/trade/pending-requests";
import {
	type OrderQueueItem,
	requestResultToQueueUpdate,
	resultToQueueUpdate,
	useOrderQueue,
	useOrderQueueActions,
} from "@/stores/use-order-queue-store";

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
	confirmHold: (row: OrderQueueItem, confirm: boolean) => void;
	dismissHold: (rowId: string, held: SlotHold) => void;
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
	const isNeutral = order.status === "notSent" || order.status === "canceled";

	return (
		<div
			className={cn(
				"relative w-full flex gap-3 py-2.5 px-3 overflow-hidden font-sans",
				"bg-surface border border-stroke-weak/60 rounded-8",
				"shadow-overlay shadow-black/20 dark:shadow-black/50 ring-1",
				getRingColor(order.status),
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
					isNeutral && "bg-fill-weak border border-stroke-weak",
				)}
			>
				{order.status === "pending" && <SpinnerGapIcon className="size-4 animate-spin text-brand" />}
				{order.status === "success" && <CheckIcon className="size-4 text-success" />}
				{order.status === "failed" && <XIcon className="size-4 text-error" />}
				{(order.status === "unsettled" || order.status === "unknown") && (
					<QuestionIcon className="size-4 text-warning" />
				)}
				{isNeutral && <MinusIcon className="size-4 text-fg-muted" />}
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
				{order.error && <div className={cn("text-xs", getErrorColor(order.status))}>{order.error}</div>}
				{order.status === "unsettled" && order.requestKey && (
					<RequestActions
						requestKey={order.requestKey}
						resends={order.resends}
						confirm={order.confirmDismiss}
						canDismiss={order.canDismiss === true}
						canCancel={canCancel}
						actions={actions}
					/>
				)}
				{order.status === "notSent" && order.unreadable && (
					<UnreadableActions order={order} unreadable={order.unreadable} actions={actions} />
				)}
				{order.status === "unsettled" && order.held && (
					<HoldActions order={order} held={order.held} actions={actions} />
				)}
			</div>

			{isClosable(order.status) && order.status !== "success" && (
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
			<CountdownBar order={order} />
		</div>
	);
}

function getRingColor(status: OrderQueueItem["status"]): string {
	switch (status) {
		case "pending":
			return "ring-stroke-brand-strong/30";
		case "success":
			return "ring-stroke-success-strong/30";
		case "failed":
			return "ring-stroke-error-strong/30";
		case "unsettled":
		case "unknown":
			return "ring-stroke-warning-strong/30";
		case "notSent":
		case "canceled":
			return "ring-stroke-weak";
	}
}

function isClosable(status: OrderQueueItem["status"]): boolean {
	return status !== "pending" && status !== "unsettled";
}

function getErrorColor(status: OrderQueueItem["status"]): string {
	if (status === "failed") return "text-error";
	if (status === "notSent" || status === "canceled") return "text-fg-muted";
	return "text-warning";
}

function RequestActions({
	requestKey,
	resends,
	confirm,
	canDismiss,
	canCancel,
	actions,
}: {
	requestKey: string;
	resends: string | undefined;
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
		<div className="space-y-1 pt-1">
			{resends && <div className="text-xs text-fg-muted">{resends}</div>}
			<div className="flex items-center gap-1.5">
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

function HoldActions({ order, held, actions }: { order: OrderQueueItem; held: SlotHold; actions: RowActions }) {
	if (!order.confirmHold) {
		return (
			<div className="pt-1">
				<Button
					variant="outline"
					intent="neutral"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.confirmHold(order, true)}
				>
					{t`Dismiss hold`}
				</Button>
			</div>
		);
	}
	return (
		<div className="space-y-1 pt-1">
			<div className="text-xs text-fg">{describeHoldDismissal(held.hold)}</div>
			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					intent="error"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.dismissHold(order.id, held)}
				>
					{t`Yes, dismiss hold`}
				</Button>
				<Button
					variant="ghost"
					intent="neutral"
					size="xxs"
					className="rounded-xs"
					onClick={() => actions.confirmHold(order, false)}
				>
					{t`Keep it`}
				</Button>
			</div>
		</div>
	);
}

function notSentBecause(error: unknown): OrderResult {
	return { ok: false, status: "notSent", error: error instanceof Error ? error.message : String(error) };
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
		resends: describeResend(request),
		requestKey: getRequestKey(request),
		createdAt: request.signedAt,
	};
}

function toHoldItem(held: SlotHold): OrderQueueItem {
	return {
		id: `hold:${held.slot}#${held.hold.nonce}`,
		...held.hold.label,
		status: "unsettled",
		error: describeHeldMarket(held.hold),
		held,
		createdAt: 0,
	};
}

function holdKeyOf(order: OrderQueueItem): string | undefined {
	return order.held && toHoldItem(order.held).id;
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

function unconfirmedKeyOf(order: OrderQueueItem): string[] {
	return order.status === "unsettled" && order.requestKey ? [order.requestKey] : [];
}

interface OrderToastCard {
	id: string;
	dismissible: boolean;
	card: ReactElement;
}

export function useOrderToastCards(): OrderToastCard[] {
	const allQueued = useOrderQueue();
	const pendingRequests = usePendingRequests();
	const activeHolds = useActiveHolds();
	const settledKeys = useSettledRequestKeys(allQueued.flatMap(unconfirmedKeyOf));
	const activeHoldKeys = new Set(activeHolds.map((held) => toHoldItem(held).id));
	const queued = allQueued.filter((order) => {
		if (order.status !== "unsettled") return true;
		if (order.requestKey && settledKeys.includes(order.requestKey)) return false;
		return !order.held || activeHoldKeys.has(toHoldItem(order.held).id);
	});
	const { addOrder, updateOrder, updateByRequestKey, removeOrder } = useOrderQueueActions();
	const { retryRequest, cancelRequest, previewDismiss, dismissRequest, dismissUnreadable, dismissHold, canCancel } =
		useSubmitPlan();

	const queuedKeys = new Set(queued.map((order) => order.requestKey));
	const leftOver = pendingRequests.filter((request) => !queuedKeys.has(getRequestKey(request))).map(toQueueItem);
	const queuedHolds = new Set(queued.map(holdKeyOf));
	const holdRows = activeHolds.map(toHoldItem).filter((row) => !queuedHolds.has(row.id));
	const orders = [
		...leftOver,
		...holdRows,
		...queued.filter((order) => order.held),
		...queued.filter((order) => !order.held),
	];

	function adopt(requestKey: string, status: OrderQueueItem["status"]) {
		const order = leftOver.find((item) => item.requestKey === requestKey);
		if (order) addOrder({ ...order, status });
	}

	async function runRequestAction(requestKey: string, act: () => Promise<OrderResult>) {
		adopt(requestKey, "pending");
		updateByRequestKey(requestKey, { status: "pending", confirmDismiss: undefined });
		updateByRequestKey(requestKey, requestResultToQueueUpdate(await act().catch(notSentBecause)));
	}

	async function handlePreviewDismiss(requestKey: string) {
		updateByRequestKey(requestKey, { status: "pending" });
		const preview = await previewDismiss(requestKey).catch(
			(error): DismissPreview => ({ kind: "result", result: notSentBecause(error) }),
		);
		updateByRequestKey(
			requestKey,
			preview.kind === "confirm"
				? { status: "unsettled", confirmDismiss: { text: preview.text, lookup: preview.lookup } }
				: requestResultToQueueUpdate(preview.result),
		);
	}

	async function handleDismissHold(rowId: string, held: SlotHold) {
		updateOrder(rowId, { status: "pending", confirmHold: undefined });
		updateOrder(rowId, resultToQueueUpdate(await dismissHold(held).catch(notSentBecause)));
	}

	async function handleDismissUnreadable(rowId: string, { slot, raw }: UnreadableSlot) {
		updateOrder(rowId, { status: "pending", confirmUnreadable: undefined });
		updateOrder(rowId, resultToQueueUpdate(await dismissUnreadable(slot, raw).catch(notSentBecause)));
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
		confirmHold(row, confirm) {
			if (holdRows.includes(row)) addOrder({ ...row, confirmHold: confirm || undefined });
			else updateOrder(row.id, { confirmHold: confirm || undefined });
		},
		dismissHold(rowId, held) {
			void handleDismissHold(rowId, held);
		},
	};

	function remove(id: string) {
		removeOrder(id);
		toast.dismiss(id);
	}

	return orders.map((order) => ({
		id: order.id,
		dismissible: isClosable(order.status),
		card: <OrderItem order={order} onRemove={() => remove(order.id)} actions={actions} canCancel={canCancel} />,
	}));
}

const shownToastIds = new Set<string>();

export function OrderToast() {
	const cards = useOrderToastCards();
	const { removeOrder } = useOrderQueueActions();

	useEffect(() => {
		for (const { id, dismissible, card } of cards) {
			toast.custom(() => card, {
				id,
				className: "w-(--width)",
				duration: Number.POSITIVE_INFINITY,
				dismissible,
				onDismiss: () => removeOrder(id),
			});
		}
		const live = new Set(cards.map((card) => card.id));
		for (const id of shownToastIds) {
			if (live.has(id)) continue;
			toast.dismiss(id);
			shownToastIds.delete(id);
		}
		for (const id of live) shownToastIds.add(id);
	});

	return null;
}
