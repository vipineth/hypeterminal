import { CheckCircleIcon, InfoIcon, SpinnerGapIcon, WarningIcon, WarningOctagonIcon } from "@phosphor-icons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/stores/use-global-settings-store";

const Toaster = ({ ...props }: ToasterProps) => {
	const theme = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			position="bottom-right"
			duration={3000}
			icons={{
				success: <CheckCircleIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <WarningIcon className="size-4" />,
				error: <WarningOctagonIcon className="size-4" />,
				loading: <SpinnerGapIcon className="size-4 animate-spin" />,
			}}
			toastOptions={{
				className: "text-xs font-sans",
			}}
			style={
				{
					"--normal-bg": "var(--surface-execution)",
					"--normal-text": "var(--text-950)",
					"--normal-border": "var(--border-200)",
					"--border-radius": "var(--radius-xs)",
					"--success-bg": "var(--surface-execution)",
					"--success-text": "var(--market-up-600)",
					"--success-border": "var(--market-up-600)",
					"--error-bg": "var(--surface-execution)",
					"--error-text": "var(--market-down-600)",
					"--error-border": "var(--market-down-600)",
					"--width": "320px",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
