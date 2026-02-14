import { createThirdwebClient } from "thirdweb";
import { darkTheme, lightTheme } from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { useTheme } from "@/stores/use-global-settings-store";

export const thirdwebClient = createThirdwebClient({
	clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

export const thirdwebWallets: Wallet[] = [
	inAppWallet({
		auth: {
			options: ["google", "discord", "telegram", "email", "x", "passkey"],
		},
	}),
	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet"),
	createWallet("me.rainbow"),
	createWallet("io.rabby"),
	createWallet("io.zerion.wallet"),
	createWallet("com.ledger"),
];

const FONT_FAMILY = "IBM Plex Sans Variable, ui-sans-serif, system-ui, sans-serif";

export const thirdwebDarkTheme = darkTheme({
	colors: {
		modalBg: "#20242A",
		borderColor: "#3D4450",
		separatorLine: "#3D4450",
		accentText: "#4F7DFF",
		primaryText: "#E6E9EE",
		secondaryText: "#B8BEC7",
		tertiaryBg: "#2A303A",
		secondaryButtonBg: "#2A303A",
		secondaryButtonHoverBg: "#343B45",
		secondaryButtonText: "#E6E9EE",
		primaryButtonBg: "#4F7DFF",
		primaryButtonText: "#FFFFFF",
		connectedButtonBg: "#2A303A",
		connectedButtonBgHover: "#343B45",
		skeletonBg: "#2A303A",
		selectedTextBg: "rgba(79, 125, 255, 0.15)",
		selectedTextColor: "#E6E9EE",
		modalOverlayBg: "rgba(0, 0, 0, 0.6)",
	},
	fontFamily: FONT_FAMILY,
});

export const thirdwebLightTheme = lightTheme({
	colors: {
		modalBg: "#FDFDFD",
		borderColor: "#E0E3E6",
		separatorLine: "#E0E3E6",
		accentText: "#2563EB",
		primaryText: "#232529",
		secondaryText: "#555C65",
		tertiaryBg: "#FFFFFF",
		secondaryButtonBg: "#FFFFFF",
		secondaryButtonHoverBg: "#ECEEEF",
		secondaryButtonText: "#232529",
		primaryButtonBg: "#2563EB",
		primaryButtonText: "#FFFFFF",
		connectedButtonBg: "#FFFFFF",
		connectedButtonBgHover: "#ECEEEF",
		skeletonBg: "#ECEEEF",
		selectedTextBg: "rgba(37, 99, 235, 0.15)",
		selectedTextColor: "#232529",
	},
	fontFamily: FONT_FAMILY,
});

export function useThirdwebTheme() {
	const theme = useTheme();
	return theme === "light" ? thirdwebLightTheme : thirdwebDarkTheme;
}
