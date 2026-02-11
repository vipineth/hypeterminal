import { CheckCircleIcon, InfoIcon, SpinnerGapIcon, WarningIcon, WarningOctagonIcon } from "@phosphor-icons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/stores/use-global-settings-store";

const Toaster = ({ ...props }: ToasterProps) => {
	const theme = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CheckCircleIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <WarningIcon className="size-4" />,
				error: <WarningOctagonIcon className="size-4" />,
				loading: <SpinnerGapIcon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--surface-execution)",
					"--normal-text": "var(--text-950)",
					"--normal-border": "var(--border-200)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
