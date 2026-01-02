import { describe, expect, it, vi } from "vitest";

vi.mock("@nktkas/hyperliquid", () => {
	class HttpTransport {
		options: unknown;
		constructor(options: unknown) {
			this.options = options;
		}
	}
	class WebSocketTransport {
		options: unknown;
		constructor(options: unknown) {
			this.options = options;
		}
	}
	class InfoClient {
		transport: unknown;
		constructor({ transport }: { transport: unknown }) {
			this.transport = transport;
		}
	}
	class SubscriptionClient {
		transport: unknown;
		constructor({ transport }: { transport: unknown }) {
			this.transport = transport;
		}
	}

	return { HttpTransport, WebSocketTransport, InfoClient, SubscriptionClient };
});

const clients = await import("./clients");

describe("clients", () => {
	it("returns singleton transports", () => {
		const httpA = clients.getHttpTransport();
		const httpB = clients.getHttpTransport();
		expect(httpA).toBe(httpB);

		const wsA = clients.getWebSocketTransport();
		const wsB = clients.getWebSocketTransport();
		expect(wsA).toBe(wsB);
	});

	it("builds singleton clients from transports", () => {
		const info = clients.getInfoClient();
		const subscription = clients.getSubscriptionClient();

		expect(info).toBe(clients.getInfoClient());
		expect(subscription).toBe(clients.getSubscriptionClient());

		expect((info as { transport: unknown }).transport).toBe(clients.getHttpTransport());
		expect((subscription as { transport: unknown }).transport).toBe(clients.getWebSocketTransport());
	});
});
