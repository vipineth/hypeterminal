import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderToast } from "@/components/trade/tradebox/order-toast";
import type { PendingRequest } from "@/lib/trade/pending-requests";
import type { OrderQueueItem } from "@/stores/use-order-queue-store";

const view = vi.hoisted(() => ({
	queued: [] as OrderQueueItem[],
	pending: [] as PendingRequest[],
	buttons: [] as { label: string; onClick?: () => void }[],
}));
const actions = vi.hoisted(() => ({
	addOrder: vi.fn(),
	removeOrder: vi.fn(),
	retryRequest: vi.fn(async () => ({ ok: true })),
	cancelRequest: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@hypeterminal/ui", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/ui")>()),
	Button: ({
		children,
		onClick,
		"aria-label": ariaLabel,
	}: {
		children?: ReactNode;
		onClick?: () => void;
		"aria-label"?: string;
	}) => {
		view.buttons.push({ label: ariaLabel ?? String(children), onClick });
		return null;
	},
}));

vi.mock("@/stores/use-order-queue-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-order-queue-store")>()),
	useOrderQueue: () => view.queued,
	useOrderQueueActions: () => ({ addOrder: actions.addOrder, removeOrder: actions.removeOrder }),
}));

vi.mock("@/hooks/trade/use-submit-plan", () => ({
	usePendingRequests: () => view.pending,
	useSubmitPlan: () => ({ retryRequest: actions.retryRequest, cancelRequest: actions.cancelRequest }),
}));

const UNCONFIRMED_ROW: OrderQueueItem = {
	id: "order-1",
	market: "SOL",
	side: "buy",
	size: "4",
	status: "unsettled",
	error: "Not confirmed: Request timed out after 10000 ms. Retry or cancel it.",
	requestKey: "testnet:0x0000000000000000000000000000000000000001:5#1794596065043",
	createdAt: 0,
};

const LEFT_FROM_BEFORE_RELOAD: PendingRequest = {
	slot: "testnet:0x0000000000000000000000000000000000000001:4",
	kind: "order",
	user: "0x0000000000000000000000000000000000000001",
	signer: "0x0000000000000000000000000000000000000002",
	asset: 4,
	body: "{}",
	nonce: 1794596070000,
	expiresAfter: 1794596100000,
	cloids: [],
	legs: [{ role: "order", price: "1160" }],
	twap: null,
	label: { market: "ETH", side: "buy", size: "0.0104" },
	createdAt: 0,
};

function buttonsNamed(label: string) {
	return view.buttons.filter((button) => button.label === label);
}

describe("order toast", () => {
	beforeEach(() => {
		view.queued = [UNCONFIRMED_ROW];
		view.pending = [LEFT_FROM_BEFORE_RELOAD];
		view.buttons = [];
		vi.clearAllMocks();
	});

	it("offers Retry and Cancel on an unconfirmed order and on one left from before a reload", () => {
		const html = renderToString(<OrderToast />).replaceAll("<!-- -->", "");
		expect(buttonsNamed("Retry")).toHaveLength(2);
		expect(buttonsNamed("Cancel")).toHaveLength(2);
		expect(html).toContain("2 unconfirmed");
		expect(html).toContain("ETH");
		expect(html).toContain("Not confirmed: Request timed out after 10000 ms. Retry or cancel it.");
	});

	it("retries an unconfirmed order by its request key", () => {
		renderToString(<OrderToast />);
		buttonsNamed("Retry")[1].onClick?.();
		expect(actions.retryRequest).toHaveBeenCalledWith(UNCONFIRMED_ROW.requestKey);
		expect(actions.addOrder).not.toHaveBeenCalled();
	});

	it("adds a row for a request left from before a reload before it cancels it", () => {
		renderToString(<OrderToast />);
		buttonsNamed("Cancel")[0].onClick?.();
		expect(actions.addOrder).toHaveBeenCalledWith(
			expect.objectContaining({
				market: "ETH",
				status: "pending",
				requestKey: `${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`,
			}),
		);
		expect(actions.cancelRequest).toHaveBeenCalledWith(
			`${LEFT_FROM_BEFORE_RELOAD.slot}#${LEFT_FROM_BEFORE_RELOAD.nonce}`,
		);
	});

	it("leaves a request out of the leftover rows once a queued row already shows it", () => {
		view.pending = [
			{
				...LEFT_FROM_BEFORE_RELOAD,
				slot: "testnet:0x0000000000000000000000000000000000000001:5",
				nonce: 1794596065043,
			},
		];
		renderToString(<OrderToast />);
		expect(buttonsNamed("Retry")).toHaveLength(1);
	});
});
