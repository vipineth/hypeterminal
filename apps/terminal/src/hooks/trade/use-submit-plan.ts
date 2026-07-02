import { t } from "@lingui/core/macro";
import type { OrderPlan } from "@/domain/trade/order-intent";
import { useExchange } from "@/lib/hyperliquid";
import { interpretOrderStatuses, type OrderResult } from "@/lib/trade/extract-order-status";

export type SubmitPlanInput = Pick<OrderPlan, "orders" | "grouping"> & { errors?: string[] };

interface UseSubmitPlanResult {
	submitPlan: (plan: SubmitPlanInput) => Promise<OrderResult>;
	isSubmitting: boolean;
}

export function useSubmitPlan(): UseSubmitPlanResult {
	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchange("order");

	async function submitPlan(plan: SubmitPlanInput): Promise<OrderResult> {
		if (plan.errors && plan.errors.length > 0) {
			return { ok: false, error: plan.errors.join("; ") };
		}
		try {
			const result = await placeOrder({ orders: plan.orders, grouping: plan.grouping });
			return interpretOrderStatuses(result.response?.data?.statuses ?? []);
		} catch (error) {
			return { ok: false, error: error instanceof Error ? error.message : t`Order failed` };
		}
	}

	return { submitPlan, isSubmitting };
}
