// @vitest-environment jsdom

import { act, createElement, Fragment, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const USER_ADDRESS = "0x1111111111111111111111111111111111111111";
const AGENT_ADDRESS = "0x2222222222222222222222222222222222222222";
const AGENT_PRIVATE_KEY = `0x${"ab".repeat(32)}`;
const AGENT_NAME = "hype-mobile-1779365227000";
const AGENT_VALID_UNTIL_MS = 1_779_365_227_000;
const EXPIRES_AT_MS = 1_779_364_827_000;
const PAIRING_CODE = "ABCD-1234-EF56-7890";
const PHONE_LINK = "https://app.hypeterminal.test/mobile-agent-sync#ht-mobile-sync=encoded-envelope";

const testState = vi.hoisted(() => ({
	address: "0x1111111111111111111111111111111111111111" as string | undefined,
	approveAgent: vi.fn(),
	clearAgent: vi.fn(),
	createMobileAgentSyncUrl: vi.fn(),
	qrToDataUrl: vi.fn(),
	writeClipboard: vi.fn(),
}));

function renderChildren(children: ReactNode) {
	return createElement(Fragment, null, children);
}

function Icon({ className }: { className?: string }) {
	return createElement("span", { className, "aria-hidden": true });
}

vi.mock("@lingui/react/macro", () => ({
	Trans: ({ children }: { children: ReactNode }) => renderChildren(children),
}));

vi.mock("@lingui/core/macro", () => ({
	t: (strings: TemplateStringsArray | string, ...values: unknown[]) => {
		if (typeof strings === "string") return strings;
		return strings.reduce((message, part, index) => `${message}${part}${values[index] ?? ""}`, "");
	},
}));

vi.mock("@phosphor-icons/react", () => ({
	CheckIcon: Icon,
	CopyIcon: Icon,
	DeviceMobileIcon: Icon,
	KeyIcon: Icon,
	QrCodeIcon: Icon,
	ShieldCheckIcon: Icon,
	SpinnerGapIcon: Icon,
	WarningCircleIcon: Icon,
}));

vi.mock("@hypeterminal/ui", () => ({
	AdaptiveModal: ({
		children,
		onOpenChange,
		open,
	}: {
		children: ReactNode;
		onOpenChange: (open: boolean) => void;
		open: boolean;
	}) =>
		open
			? createElement(
					"div",
					{ role: "dialog" },
					createElement("button", { onClick: () => onOpenChange(false), type: "button" }, "Close modal"),
					children,
				)
			: null,
	Button: ({
		children,
		disabled,
		onClick,
		type,
	}: {
		children: ReactNode;
		disabled?: boolean;
		onClick?: () => void;
		type?: "button" | "submit" | "reset";
	}) => createElement("button", { disabled, onClick, type: type ?? "button" }, children),
	ModalContent: ({ children }: { children: ReactNode }) => renderChildren(children),
	ModalDescription: ({ children }: { children: ReactNode }) => createElement("p", null, children),
	ModalFooter: ({ children }: { children: ReactNode }) => createElement("footer", null, children),
	ModalHeader: ({ children }: { children: ReactNode }) => createElement("header", null, children),
	ModalTitle: ({ children }: { children: ReactNode }) => createElement("h2", null, children),
}));

vi.mock("@hypeterminal/hl-react/signing/mobile-agent", () => ({
	createMobileAgentApproval: () => ({
		agentName: AGENT_NAME,
		agentValidUntilMs: AGENT_VALID_UNTIL_MS,
		privateKey: AGENT_PRIVATE_KEY,
		publicKey: AGENT_ADDRESS,
	}),
	createMobileAgentRevocationApproval: () => ({
		agentName: AGENT_NAME,
		agentValidUntilMs: AGENT_VALID_UNTIL_MS,
		publicKey: AGENT_ADDRESS,
	}),
	isStoredMobileAgent: () => false,
}));

vi.mock("@/lib/hyperliquid", () => ({
	useAgentWalletActions: () => ({ clearAgent: testState.clearAgent }),
	useAgentWalletStorage: () => null,
	useExchange: () => ({ mutateAsync: testState.approveAgent }),
	useHyperliquid: () => ({ env: "Mainnet" }),
}));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: testState.address }),
}));

vi.mock("@/lib/mobile-sync/sync-core", () => ({
	createMobileAgentSyncUrl: testState.createMobileAgentSyncUrl,
}));

vi.mock("qrcode", () => ({
	toDataURL: testState.qrToDataUrl,
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

async function flushAsyncWork(times = 4) {
	for (let i = 0; i < times; i += 1) {
		await act(async () => {
			await new Promise((resolve) => window.setTimeout(resolve, 0));
		});
	}
}

function getButton(container: HTMLElement, text: string) {
	const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(text));
	if (!button) throw new Error(`Button not found: ${text}`);
	return button;
}

describe("MobileAgentSyncModal", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
		testState.address = USER_ADDRESS;
		testState.approveAgent.mockReset();
		testState.approveAgent.mockResolvedValue(undefined);
		testState.clearAgent.mockReset();
		testState.createMobileAgentSyncUrl.mockReset();
		testState.createMobileAgentSyncUrl.mockResolvedValue({
			agentAddress: AGENT_ADDRESS,
			agentName: AGENT_NAME,
			agentValidUntilMs: AGENT_VALID_UNTIL_MS,
			expiresAtMs: EXPIRES_AT_MS,
			pairingCode: PAIRING_CODE,
			syncId: "sync-id",
			url: PHONE_LINK,
		});
		testState.qrToDataUrl.mockReset();
		testState.qrToDataUrl.mockResolvedValue("data:image/png;base64,phone-link-qr");
		testState.writeClipboard.mockReset();
		testState.writeClipboard.mockResolvedValue(undefined);
		vi.spyOn(Date, "now").mockReturnValue(1_779_364_227_000);
		Object.defineProperty(window, "location", {
			configurable: true,
			value: new URL("https://app.hypeterminal.test/trade"),
		});
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText: testState.writeClipboard },
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		act(() => root.unmount());
		container.remove();
		vi.clearAllMocks();
		vi.restoreAllMocks();
		Reflect.deleteProperty(navigator, "clipboard");
	});

	it("creates a phone link after wallet approval and shows the pairing code, expiry, and copy actions", async () => {
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange: vi.fn() }));
		});

		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		expect(testState.approveAgent).toHaveBeenCalledWith({
			agentAddress: AGENT_ADDRESS,
			agentName: AGENT_NAME,
		});
		expect(testState.createMobileAgentSyncUrl).toHaveBeenCalledWith({
			agentName: AGENT_NAME,
			agentPrivateKey: AGENT_PRIVATE_KEY,
			agentValidUntilMs: AGENT_VALID_UNTIL_MS,
			appOrigin: "https://app.hypeterminal.test",
			env: "Mainnet",
			nowMs: 1_779_364_227_000,
			userAddress: USER_ADDRESS,
		});
		expect(container.textContent).toContain("Phone link ready");
		expect(container.textContent).toContain(PAIRING_CODE);
		expect(container.textContent).toContain("Phone link expires");
		expect(container.textContent).toContain("Trading key approved until");
		expect(getButton(container, "Copy code")).toBeDefined();
		expect(getButton(container, "Copy phone link")).toBeDefined();
		expect(getButton(container, "Show QR")).toBeDefined();
	});

	it("copies the pairing code and the full phone link from the ready state", async () => {
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange: vi.fn() }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		act(() => {
			getButton(container, "Copy code").click();
		});
		await flushAsyncWork();

		expect(testState.writeClipboard).toHaveBeenCalledWith(PAIRING_CODE);
		expect(container.textContent).toContain("Copied");

		act(() => {
			getButton(container, "Copy phone link").click();
		});
		await flushAsyncWork();

		expect(testState.writeClipboard).toHaveBeenCalledWith(PHONE_LINK);
		expect(PHONE_LINK).toContain("#ht-mobile-sync=");
	});

	it("renders a scannable QR for the full fragment phone link", async () => {
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange: vi.fn() }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		act(() => {
			getButton(container, "Show QR").click();
		});
		await flushAsyncWork(10);

		expect(testState.qrToDataUrl).toHaveBeenCalledWith(
			PHONE_LINK,
			expect.objectContaining({
				color: {
					dark: "#111827",
					light: "#FFFFFF",
				},
				errorCorrectionLevel: "M",
				margin: 1,
				width: 224,
			}),
		);
		expect(PHONE_LINK).toContain("#ht-mobile-sync=");
		expect(container.querySelector('img[alt="Phone link QR"]')?.getAttribute("src")).toBe(
			"data:image/png;base64,phone-link-qr",
		);
		expect(container.textContent).toContain("QR visible");
	});

	it("transitions to expired state after the link TTL elapses", async () => {
		vi.spyOn(Date, "now").mockReturnValue(EXPIRES_AT_MS - 50);
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange: vi.fn() }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Phone link ready");
		expect(container.textContent).toContain(PAIRING_CODE);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 150));
		});

		expect(container.textContent).toContain("Phone link expired");
		expect(container.textContent).toContain("Trading key still approved until");
		expect(container.textContent).not.toContain(PAIRING_CODE);
		expect(container.textContent).not.toContain("Copy phone link");
	}, 10_000);

	it("keeps the reset action available after link expiry", async () => {
		vi.spyOn(Date, "now").mockReturnValue(EXPIRES_AT_MS - 50);
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange: vi.fn() }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 150));
		});

		expect(container.textContent).toContain("Phone link expired");
		expect(getButton(container, "Reset")).toBeDefined();
	}, 10_000);

	it("clears expiry timer when the modal closes before link expires", async () => {
		const onOpenChange = vi.fn();
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Phone link ready");

		act(() => {
			getButton(container, "Close modal").click();
		});
		await flushAsyncWork();

		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(container.textContent).not.toContain("Phone link expired");
		expect(container.textContent).not.toContain("Phone link ready");
	});

	it("clears ready link and QR state when the modal closes", async () => {
		const onOpenChange = vi.fn();
		const { MobileAgentSyncModal } = await import("@/components/trade/components/mobile-agent-sync-modal");

		act(() => {
			root.render(createElement(MobileAgentSyncModal, { open: true, onOpenChange }));
		});
		act(() => {
			getButton(container, "Create phone link").click();
		});
		await flushAsyncWork();
		act(() => {
			getButton(container, "Show QR").click();
		});
		await flushAsyncWork(10);

		expect(container.textContent).toContain("Phone link ready");
		expect(container.textContent).toContain(PAIRING_CODE);
		expect(container.querySelector('img[alt="Phone link QR"]')).not.toBeNull();

		act(() => {
			getButton(container, "Close modal").click();
		});
		await flushAsyncWork();

		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(container.textContent).not.toContain("Phone link ready");
		expect(container.textContent).not.toContain(PAIRING_CODE);
		expect(container.querySelector('img[alt="Phone link QR"]')).toBeNull();
		expect(container.textContent).toContain("Create phone access");
	});
});
