import { useEffect } from "react";
import { isPerpMarketKey, makePerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid";
import { useMeta } from "@/hooks/hyperliquid/use-meta";
import { useFavoriteMarketKeys, useMarketPrefsActions, useSelectedMarketKey } from "@/stores/use-market-prefs-store";

const LEGACY_FAVORITES_STORAGE_KEY = "favorites-storage-v0.2";

function readLegacyFavoriteAssetIds(): number[] | null {
	const raw = localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (typeof parsed !== "object" || parsed === null) return null;
		const state = (parsed as { state?: unknown }).state;
		if (typeof state !== "object" || state === null) return null;
		const favorites = (state as { favorites?: unknown }).favorites;
		if (!Array.isArray(favorites)) return null;
		if (!favorites.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
		return favorites;
	} catch {
		return null;
	}
}

export function useMarketPrefsMigrations() {
	const { data: meta } = useMeta();
	const favoriteMarketKeys = useFavoriteMarketKeys();
	const selectedMarketKey = useSelectedMarketKey();
	const { setFavoriteMarketKeys, setSelectedMarketKey } = useMarketPrefsActions();

	useEffect(() => {
		if (!meta) return;

		const legacy = readLegacyFavoriteAssetIds();
		if (!legacy || legacy.length === 0) return;

		const migrated = legacy
			.map((assetId) => meta.universe[assetId]?.name)
			.filter((coin): coin is string => typeof coin === "string" && coin.length > 0)
			.map((coin) => makePerpMarketKey(coin));

		if (migrated.length === 0) {
			localStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
			return;
		}

		const merged = Array.from(new Set([...favoriteMarketKeys, ...migrated]));
		setFavoriteMarketKeys(merged);
		localStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
	}, [meta, favoriteMarketKeys, setFavoriteMarketKeys]);

	useEffect(() => {
		if (!meta) return;

		const validCoins = new Set(meta.universe.filter((u) => u.isDelisted !== true).map((u) => u.name));

		function isValidMarketKey(marketKey: string): boolean {
			if (!isPerpMarketKey(marketKey)) return false;
			return validCoins.has(perpCoinFromMarketKey(marketKey));
		}

		if (!isValidMarketKey(selectedMarketKey)) {
			setSelectedMarketKey(makePerpMarketKey("BTC"));
		}

		const filteredFavorites = favoriteMarketKeys.filter(isValidMarketKey);
		if (filteredFavorites.length !== favoriteMarketKeys.length) {
			setFavoriteMarketKeys(filteredFavorites);
		}
	}, [meta, selectedMarketKey, favoriteMarketKeys, setSelectedMarketKey, setFavoriteMarketKeys]);
}
