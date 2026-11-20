import { useConfig, useDisconnect } from "wagmi";

export function useDisconnectWallet() {
	const config = useConfig();
	return useDisconnect({
		mutation: {
			async onSuccess() {
				if (config.state.status === "disconnected") await config.storage?.removeItem("recentConnectorId");
			},
		},
	});
}
