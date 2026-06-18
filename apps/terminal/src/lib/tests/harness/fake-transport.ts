import type { ISubscription, ISubscriptionTransport } from "@nktkas/hyperliquid";

type Listener = (data: unknown) => void;

export type FakeSubscription = {
	listener: Listener;
	key: string;
	unsubscribed: boolean;
	failureController: AbortController;
	subscription: ISubscription;
};

export function createFakeTransport(): {
	transport: ISubscriptionTransport;
	subscriptions: FakeSubscription[];
	emit: (key: string, data: unknown) => void;
	failSubscription: (key: string) => void;
} {
	const subscriptions: FakeSubscription[] = [];

	const transport: ISubscriptionTransport = {
		async subscribe<T>(
			channel: string,
			payload: unknown,
			listener: (data: CustomEvent<T>) => void,
		): Promise<ISubscription> {
			const failureController = new AbortController();
			const key = JSON.stringify([channel, payload]);
			const entry: FakeSubscription = {
				listener: (data) => listener(new CustomEvent<T>(channel, { detail: data as T })),
				key,
				unsubscribed: false,
				failureController,
				subscription: {
					unsubscribe: async () => {
						entry.unsubscribed = true;
					},
					failureSignal: failureController.signal,
				},
			};
			subscriptions.push(entry);
			return entry.subscription;
		},
	};

	function emit(_key: string, data: unknown) {
		for (const sub of subscriptions) {
			if (!sub.unsubscribed) {
				sub.listener(data);
			}
		}
	}

	function failSubscription(key: string) {
		for (const sub of subscriptions) {
			if (!sub.unsubscribed) {
				sub.failureController.abort(new Error(`Fake failure: ${key}`));
			}
		}
	}

	return { transport, subscriptions, emit, failSubscription };
}
