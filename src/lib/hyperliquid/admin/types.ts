import type { Address } from "viem";

export type AdminStatus = "disconnected" | "connecting" | "ready";

export interface AdminStatusResult {
	status: AdminStatus;
	isReady: boolean;
	isConnecting: boolean;
	address: Address | undefined;
}
