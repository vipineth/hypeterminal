// @vitest-environment jsdom

import {
	act,
	type ComponentPropsWithoutRef,
	type ComponentType,
	createElement,
	Fragment,
	forwardRef,
	type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOBILE_SYNC_DRAFT_STORAGE_KEY, saveMobileSyncDraft } from "../mobile-sync/draft-storage";
import {
	createMobileAgentSyncUrl,
	MOBILE_SYNC_CLOCK_SKEW_MS,
	MOBILE_SYNC_PAYLOAD_TTL_MS,
	MOBILE_SYNC_ROUTE_PATH,
} from "../mobile-sync/sync-core";

const NOW_MS = 1_779_364_227_000;
const USER_ADDRESS = "0x1111111111111111111111111111111111111111" as const;
const OTHER_USER_ADDRESS = "0x2222222222222222222222222222222222222222" as const;
const AGENT_PRIVATE_KEY = `0x${"ab".repeat(32)}` as const;

const testState = vi.hoisted(() => ({
	address: undefined as string | undefined,
	extraAgents: [] as Array<{ address: string; name: string; validUntil: number }>,
	setAgent: vi.fn(),
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
	CheckCircleIcon: Icon,
	CopyIcon: Icon,
	DeviceMobileIcon: Icon,
	KeyIcon: Icon,
	SpinnerGapIcon: Icon,
	WalletIcon: Icon,
	WarningCircleIcon: Icon,
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => options,
}));

vi.mock("@hypeterminal/ui", () => ({
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
	TextInput: forwardRef<
		HTMLInputElement,
		ComponentPropsWithoutRef<"input"> & {
			iconLeft?: ReactNode;
			iconRight?: ReactNode;
			label?: ReactNode;
		}
	>(function MockTextInput({ iconLeft: _iconLeft, iconRight: _iconRight, label, onChange, value, ...props }, ref) {
		return createElement(
			"label",
			null,
			label,
			createElement("input", {
				...props,
				ref,
				onChange,
				value: value ?? "",
			}),
		);
	}),
}));

vi.mock("@/components/trade/components/wallet-modal", () => ({
	WalletModal: ({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean }) =>
		open
			? createElement(
					"div",
					null,
					"Wallet modal",
					createElement("button", { onClick: () => onOpenChange(false), type: "button" }, "Close wallet"),
				)
			: null,
}));

vi.mock("wagmi", () => ({
	useConnection: () => ({
		address: testState.address,
	}),
}));

vi.mock("@/lib/hyperliquid", () => ({
	useAgentWalletActions: () => ({ setAgent: testState.setAgent }),
	useHyperliquid: () => ({
		env: "Mainnet",
		info: {
			extraAgents: vi.fn(async () => testState.extraAgents),
		},
	}),
}));

async function flushAsyncWork(times = 1) {
	for (let i = 0; i < times; i += 1) {
		await act(async () => {
			await new Promise((resolve) => window.setTimeout(resolve, 0));
		});
	}
}

async function waitForCondition(assertion: () => void, attempts = 120) {
	let lastError: unknown;
	for (let i = 0; i < attempts; i += 1) {
		try {
			assertion();
			return;
		} catch (error) {
			lastError = error;
			await flushAsyncWork();
		}
	}

	throw lastError;
}

async function enterPairingCode(container: HTMLElement, pairingCode: string) {
	const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
	if (!pairingInput) throw new Error("missing pairing input");

	act(() => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(pairingInput, pairingCode);
		pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
	});
	await flushAsyncWork();
	return pairingInput;
}

function setClipboardReadText(readText?: () => Promise<string>) {
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: readText ? { readText } : undefined,
	});
}

async function createSyncFixture({
	agentPrivateKey = AGENT_PRIVATE_KEY,
	appOrigin = window.location.origin,
	env = "Mainnet",
	nowMs = NOW_MS,
	userAddress = USER_ADDRESS,
}: {
	agentPrivateKey?: `0x${string}`;
	appOrigin?: string;
	env?: "Mainnet" | "Testnet";
	nowMs?: number;
	userAddress?: `0x${string}`;
} = {}) {
	return createMobileAgentSyncUrl({
		appOrigin,
		env,
		userAddress,
		agentPrivateKey,
		nowMs,
	});
}

describe("MobileAgentSyncRoute", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
		testState.address = undefined;
		testState.extraAgents = [];
		testState.setAgent.mockReset();
		vi.spyOn(Date, "now").mockReturnValue(NOW_MS);
		window.sessionStorage.clear();
		window.history.replaceState(null, "", MOBILE_SYNC_ROUTE_PATH);
	});

	afterEach(() => {
		act(() => root.unmount());
		container.remove();
		window.sessionStorage.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
		Reflect.deleteProperty(navigator, "clipboard");
	});

	it("keeps phone-link paste available while setup controls are disabled before a link is loaded", async () => {
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).not.toContain("Phone link loaded");
		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		const usePhoneLinkButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use phone link"),
		);
		const pasteCodeButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Paste code"),
		);
		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);

		expect(phoneLinkInput).not.toBeNull();
		expect(usePhoneLinkButton?.disabled).toBe(true);
		expect(pairingInput).not.toBeNull();
		expect(pairingInput?.disabled).toBe(true);
		expect(pasteCodeButton?.disabled).toBe(true);
		expect(importButton?.disabled).toBe(true);
	});

	it("loads a phone-access hash, cleans the URL, persists the envelope, and enables code input without a wallet", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(window.location.hash).toBe("");
		expect(window.sessionStorage.getItem("hypeterminal.mobile-sync.import-draft.v1")).not.toBeNull();
		expect(container.textContent).toContain("Phone link loaded");
		expect(container.textContent).toContain("No wallet connected");

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(pairingInput).not.toBeNull();
		expect(pairingInput?.disabled).toBe(false);

		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);
		expect(importButton?.disabled).toBe(true);
	});

	it("uses mobile-friendly input attributes and text labels for the required setup steps", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const showLinkInputButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use a different phone link"),
		);
		act(() => {
			showLinkInputButton?.click();
		});
		await flushAsyncWork();

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(phoneLinkInput).not.toBeNull();
		expect(phoneLinkInput?.type).toBe("url");
		expect(phoneLinkInput?.inputMode).toBe("url");
		expect(phoneLinkInput?.getAttribute("autocapitalize")).toBe("none");
		expect(phoneLinkInput?.getAttribute("autocorrect")).toBe("off");
		expect(pairingInput).not.toBeNull();
		expect(pairingInput?.disabled).toBe(false);
		expect(pairingInput?.autocomplete).toBe("one-time-code");
		expect(pairingInput?.inputMode).toBe("text");
		expect(pairingInput?.maxLength).toBe(19);
		expect(pairingInput?.getAttribute("autocapitalize")).toBe("characters");
		expect(pairingInput?.getAttribute("autocorrect")).toBe("off");
		expect(pairingInput?.getAttribute("pattern")).toContain("0-9A-Fa-f");
		expect(container.textContent).toContain("Owner wallet");
		expect(container.textContent).toContain("Connect to verify");
		expect(container.textContent).toContain("Pairing code");
		expect(container.textContent).toContain("Enter the desktop code");
	});

	it("loads a same-route phone-access hash after the empty route is already open", async () => {
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).not.toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).not.toBeNull();

		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		act(() => {
			window.history.pushState(null, "", `${url.pathname}${url.hash}`);
			window.dispatchEvent(new Event("hashchange"));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(window.location.hash).toBe("");
		expect(container.textContent).toContain("Phone link loaded");
		expect(container.textContent).not.toContain("Recovered after reload");
		expect(pairingInput?.disabled).toBe(false);
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toContain(sync.syncId);
	});

	it("clears the loaded phone link when a same-route replacement hash is invalid", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Phone link loaded");

		act(() => {
			window.history.pushState(null, "", `${MOBILE_SYNC_ROUTE_PATH}#ht-mobile-sync=not-a-valid-envelope`);
			window.dispatchEvent(new Event("hashchange"));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(window.location.hash).toBe("");
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toBeNull();
		expect(container.textContent).toContain("This is not a valid HypeTerminal mobile link.");
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(pairingInput?.disabled).toBe(true);
	});

	it("recovers a saved phone link after reload without persisting the pairing code", async () => {
		const sync = await createSyncFixture();
		saveMobileSyncDraft(sync.envelope, {
			storage: window.sessionStorage,
			nowMs: NOW_MS,
		});
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Recovered after reload");
		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(pairingInput?.value).toBe("");
		expect(pairingInput?.disabled).toBe(false);
	});

	it("clears an expired stored phone link and leaves manual paste available", async () => {
		const sync = await createSyncFixture();
		saveMobileSyncDraft(sync.envelope, {
			storage: window.sessionStorage,
			nowMs: NOW_MS,
		});
		vi.spyOn(Date, "now").mockReturnValue(NOW_MS + MOBILE_SYNC_PAYLOAD_TTL_MS + MOBILE_SYNC_CLOCK_SKEW_MS + 1);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(window.sessionStorage.getItem("hypeterminal.mobile-sync.import-draft.v1")).toBeNull();
		expect(container.textContent).toContain("This mobile link expired.");
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).not.toBeNull();
	});

	it("clears an invalid stored phone link and leaves manual paste available", async () => {
		window.sessionStorage.setItem(MOBILE_SYNC_DRAFT_STORAGE_KEY, JSON.stringify({ v: 1, encodedEnvelope: "bad" }));
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toBeNull();
		expect(container.textContent).toContain("Saved phone link was invalid. Paste the link again.");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).not.toBeNull();
	});

	it("loads a manually pasted phone link when no QR link is present", async () => {
		const sync = await createSyncFixture();
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		expect(phoneLinkInput).not.toBeNull();
		act(() => {
			if (phoneLinkInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(phoneLinkInput, sync.url);
				phoneLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		act(() => {
			phoneLinkInput?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(container.textContent).toContain("Phone link loaded");
		expect(container.textContent).toContain(sync.syncId.slice(0, 8));
		expect(pairingInput?.disabled).toBe(false);
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toContain(sync.syncId);
	});

	it("expires a loaded phone link while the page remains open", async () => {
		const sync = await createSyncFixture({
			nowMs: NOW_MS - MOBILE_SYNC_PAYLOAD_TTL_MS + 50,
		});
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Phone link loaded");

		await act(async () => {
			await new Promise((resolve) => window.setTimeout(resolve, 80));
		});

		expect(window.sessionStorage.getItem("hypeterminal.mobile-sync.import-draft.v1")).toBeNull();
		expect(container.textContent).toContain("This mobile link expired.");
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).not.toBeNull();
	});

	it("lets a manually pasted phone link replace an already loaded link", async () => {
		const firstSync = await createSyncFixture();
		const secondSync = await createSyncFixture({
			agentPrivateKey: `0x${"cd".repeat(32)}`,
		});
		const firstUrl = new URL(firstSync.url);
		window.history.replaceState(null, "", `${firstUrl.pathname}${firstUrl.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).toContain(firstSync.syncId.slice(0, 8));

		const replaceButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use a different phone link"),
		);
		expect(replaceButton).toBeDefined();
		act(() => {
			replaceButton?.click();
		});
		await flushAsyncWork();

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		expect(phoneLinkInput).not.toBeNull();
		act(() => {
			if (phoneLinkInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(phoneLinkInput, secondSync.url);
				phoneLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		const usePhoneLinkButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use phone link"),
		);
		act(() => {
			usePhoneLinkButton?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(container.textContent).not.toContain(firstSync.syncId.slice(0, 8));
		expect(container.textContent).toContain(secondSync.syncId.slice(0, 8));
		expect(pairingInput?.value).toBe("");
		expect(window.sessionStorage.getItem("hypeterminal.mobile-sync.import-draft.v1")).toContain(secondSync.syncId);
	});

	it("keeps the loaded link and code when manual replacement is cancelled", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd-1234-ef56-7890",
				);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		const replaceButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use a different phone link"),
		);
		act(() => {
			replaceButton?.click();
		});
		await flushAsyncWork();

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		act(() => {
			if (phoneLinkInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					phoneLinkInput,
					"https://app.hypeterminal.test/mobile-agent-sync#ht-mobile-sync=not-submitted",
				);
				phoneLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		const cancelButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Cancel"),
		);
		act(() => {
			cancelButton?.click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain(sync.syncId.slice(0, 8));
		expect(container.textContent).toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).toBeNull();
		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toContain(sync.syncId);
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).not.toContain("ABCD-1234-EF56-7890");
	});

	it("clears an existing loaded link when manual replacement is invalid", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		expect(container.textContent).toContain(sync.syncId.slice(0, 8));
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toContain(sync.syncId);

		const replaceButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Use a different phone link"),
		);
		act(() => {
			replaceButton?.click();
		});
		await flushAsyncWork();

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		act(() => {
			if (phoneLinkInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					phoneLinkInput,
					"https://app.hypeterminal.test/mobile-agent-sync#ht-mobile-sync=not-a-valid-envelope",
				);
				phoneLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		act(() => {
			phoneLinkInput?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toBeNull();
		expect(container.textContent).toContain("This is not a valid HypeTerminal mobile link.");
		expect(container.textContent).not.toContain(sync.syncId.slice(0, 8));
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(pairingInput?.disabled).toBe(true);
		expect(phoneLinkInput?.value).toContain("not-a-valid-envelope");
	});

	it("clears the loaded phone link and pairing-code draft after explicit reset", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd-1234-ef56-7890",
				);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toContain(sync.syncId);
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).not.toContain("ABCD-1234-EF56-7890");
		const resetButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Reset"),
		);
		act(() => {
			resetButton?.click();
		});
		await flushAsyncWork();

		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).toBeNull();
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="Paste link from desktop"]')).not.toBeNull();
		expect(pairingInput?.disabled).toBe(true);
		expect(pairingInput?.value).toBe("");
	});

	it("pastes a complete pairing code from the clipboard without storing the code", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		setClipboardReadText(vi.fn(async () => "abcd 1234 ef56 7890"));
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pasteButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Paste code"),
		);
		act(() => {
			pasteButton?.click();
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		const storedDraft = window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY);
		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");
		expect(storedDraft).toContain(sync.syncId);
		expect(storedDraft).not.toContain("ABCD-1234-EF56-7890");
		expect(container.textContent).not.toContain("Clipboard does not contain a pairing code.");
	});

	it("keeps the loaded phone link and typed code while opening and closing the wallet modal", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd-1234-ef56-7890",
				);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		const connectWalletButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Connect wallet"),
		);
		act(() => {
			connectWalletButton?.click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Wallet modal");
		expect(container.textContent).toContain("Phone link loaded");
		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");

		const closeWalletButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Close wallet"),
		);
		act(() => {
			closeWalletButton?.click();
		});
		await flushAsyncWork();

		expect(container.textContent).not.toContain("Wallet modal");
		expect(container.textContent).toContain("Phone link loaded");
		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");
	});

	it("normalizes typed codes, ignores non-hex characters, and requires all 16 characters before import", async () => {
		testState.address = USER_ADDRESS;
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);
		expect(importButton?.disabled).toBe(true);

		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd 1234 ef56 789 zzzz",
				);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		expect(pairingInput?.value).toBe("ABCD-1234-EF56-789");
		expect(importButton?.disabled).toBe(true);

		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd 1234 ef56 7890 zzzz",
				);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");
		expect(importButton?.disabled).toBe(false);
	});

	it("keeps the caret near middle edits while normalizing the pairing code", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(pairingInput).not.toBeNull();
		act(() => {
			if (pairingInput) {
				pairingInput.focus();
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"abcd1234ef567890",
				);
				pairingInput.setSelectionRange(16, 16);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();
		expect(pairingInput?.value).toBe("ABCD-1234-EF56-7890");

		act(() => {
			if (pairingInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
					pairingInput,
					"ABCD-12f34-EF56-7890",
				);
				pairingInput.setSelectionRange(8, 8);
				pairingInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();

		expect(pairingInput?.value).toBe("ABCD-12F3-4EF5-6789");
		expect(pairingInput?.selectionStart).toBe(8);
		expect(pairingInput?.selectionEnd).toBe(8);
	});

	it("does not paste unavailable, blocked, or incomplete clipboard content", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		setClipboardReadText(undefined);
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pasteButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Paste code"),
		);
		act(() => {
			pasteButton?.click();
		});
		await flushAsyncWork();

		const pairingInput = container.querySelector('input[placeholder="0000-0000-0000-0000"]') as HTMLInputElement | null;
		expect(container.textContent).toContain("Clipboard paste is not available.");
		expect(pairingInput?.value).toBe("");

		setClipboardReadText(vi.fn(async () => Promise.reject(new Error("denied"))));
		act(() => {
			pasteButton?.click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Clipboard paste was blocked.");
		expect(pairingInput?.value).toBe("");

		setClipboardReadText(vi.fn(async () => "not a full code"));
		act(() => {
			pasteButton?.click();
		});
		await flushAsyncWork();

		expect(container.textContent).toContain("Clipboard does not contain a pairing code.");
		expect(pairingInput?.value).toBe("");
	});

	it("uses alert semantics and focuses invalid link and pairing-code errors", async () => {
		const sync = await createSyncFixture();
		const url = new URL(sync.url);
		window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
		setClipboardReadText(vi.fn(async () => "not a full code"));
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		act(() => {
			window.history.pushState(null, "", `${MOBILE_SYNC_ROUTE_PATH}#ht-mobile-sync=not-a-valid-envelope`);
			window.dispatchEvent(new Event("hashchange"));
		});
		await flushAsyncWork();

		let alerts = [...container.querySelectorAll('[role="alert"]')];
		const invalidLinkAlert = alerts.find((alert) =>
			alert.textContent?.includes("This is not a valid HypeTerminal mobile link."),
		);
		expect(invalidLinkAlert).toBeDefined();
		expect(document.activeElement).toBe(invalidLinkAlert);

		const phoneLinkInput = container.querySelector(
			'input[placeholder="Paste link from desktop"]',
		) as HTMLInputElement | null;
		act(() => {
			if (phoneLinkInput) {
				Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(phoneLinkInput, sync.url);
				phoneLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
			}
		});
		await flushAsyncWork();
		act(() => {
			phoneLinkInput?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork();

		const pasteButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Paste code"),
		);
		act(() => {
			pasteButton?.click();
		});
		await flushAsyncWork();

		alerts = [...container.querySelectorAll('[role="alert"]')];
		const clipboardAlert = alerts.find((alert) =>
			alert.textContent?.includes("Clipboard does not contain a pairing code."),
		);
		expect(clipboardAlert).toBeDefined();
		expect(document.activeElement).toBe(clipboardAlert);
	});

	it("shows a clear error for a wrong pairing code", async () => {
		testState.address = USER_ADDRESS;
		const sync = await createSyncFixture();
		testState.extraAgents = [
			{
				address: sync.agentAddress,
				name: sync.agentName,
				validUntil: sync.agentValidUntilMs,
			},
		];
		saveMobileSyncDraft(sync.envelope, {
			storage: window.sessionStorage,
			nowMs: NOW_MS,
		});
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();
		await enterPairingCode(container, "0000-0000-0000-0000");

		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);
		expect(importButton?.disabled).toBe(false);

		act(() => {
			importButton?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork(80);

		expect(testState.setAgent).not.toHaveBeenCalled();
		expect(container.textContent).toContain("Pairing code does not match this link.");
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).not.toBeNull();
	});

	it.each([
		{
			name: "wrong connected wallet",
			address: OTHER_USER_ADDRESS,
			syncOptions: {},
			extraAgents: [],
			expectedMessage: "Connect the same wallet used on desktop.",
		},
		{
			name: "wrong environment",
			address: USER_ADDRESS,
			syncOptions: { env: "Testnet" as const },
			extraAgents: [],
			expectedMessage: "This link was created for a different network.",
		},
		{
			name: "wrong origin",
			address: USER_ADDRESS,
			syncOptions: { appOrigin: "https://desktop.hypeterminal.test" },
			extraAgents: [],
			expectedMessage: "This link was created for a different site.",
		},
		{
			name: "unapproved mobile agent",
			address: USER_ADDRESS,
			syncOptions: {},
			extraAgents: [],
			expectedMessage: "This phone link is not approved on Hyperliquid.",
		},
	])("shows a clear import error for $name", async ({ address, expectedMessage, extraAgents, syncOptions }) => {
		testState.address = address;
		const sync = await createSyncFixture(syncOptions);
		testState.extraAgents = extraAgents;
		saveMobileSyncDraft(sync.envelope, {
			storage: window.sessionStorage,
			nowMs: NOW_MS,
		});
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();
		await enterPairingCode(container, sync.pairingCode);

		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);
		expect(importButton?.disabled).toBe(false);

		act(() => {
			importButton?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});
		await flushAsyncWork(80);

		expect(testState.setAgent).not.toHaveBeenCalled();
		expect(container.textContent).toContain(expectedMessage);
		expect(window.sessionStorage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY)).not.toBeNull();
	});

	it("clears the temporary loaded-link and pairing-code state after a successful import", async () => {
		testState.address = USER_ADDRESS;
		const sync = await createSyncFixture();
		testState.extraAgents = [
			{
				address: sync.agentAddress,
				name: sync.agentName,
				validUntil: sync.agentValidUntilMs,
			},
		];
		saveMobileSyncDraft(sync.envelope, {
			storage: window.sessionStorage,
			nowMs: NOW_MS,
		});
		const { Route } = await import("@/routes/mobile-agent-sync");
		const MobileAgentSyncRoute = (Route as unknown as { component: ComponentType }).component;

		act(() => {
			root.render(createElement(MobileAgentSyncRoute));
		});
		await flushAsyncWork();

		const pairingInput = await enterPairingCode(container, sync.pairingCode);
		expect(pairingInput?.value).toBe(sync.pairingCode);

		const importButton = [...container.querySelectorAll("button")].find((button) =>
			button.textContent?.includes("Import phone access"),
		);
		expect(importButton?.disabled).toBe(false);

		act(() => {
			importButton?.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});

		await waitForCondition(() => expect(testState.setAgent).toHaveBeenCalled());
		expect(window.sessionStorage.getItem("hypeterminal.mobile-sync.import-draft.v1")).toBeNull();
		expect(container.textContent).toContain("Phone access ready");
		expect(container.textContent).not.toContain("Phone link loaded");
		expect(container.querySelector('input[placeholder="0000-0000-0000-0000"]')).toBeNull();
	});
});
