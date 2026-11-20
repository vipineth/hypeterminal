import { type Config, hydrate, reconnect, watchConnectors } from "@wagmi/core";

const hydratedConfigs = new WeakSet<Config>();

function reconnectConnector(config: Config, connectorId: string) {
	const connectors = config.connectors.filter((connector) => connector.id === connectorId);
	if (connectors.length === 0) return false;
	void reconnect(config, { connectors });
	return true;
}

export async function hydrateAndReconnectRecent(config: Config) {
	if (hydratedConfigs.has(config)) return;
	hydratedConfigs.add(config);

	await hydrate(config, { reconnectOnMount: false }).onMount();

	const recentConnectorId = await config.storage?.getItem("recentConnectorId");
	if (!recentConnectorId) return;
	if (reconnectConnector(config, recentConnectorId)) return;

	const unwatch = watchConnectors(config, {
		onChange() {
			if (config.state.status !== "disconnected" || reconnectConnector(config, recentConnectorId)) unwatch();
		},
	});
}
