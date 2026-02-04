import { CheckCircle, Info, SpinnerGap, Warning, WarningOctagon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CheckCircle className="size-4" />,
				info: <Info className="size-4" />,
				warning: <Warning className="size-4" />,
				error: <WarningOctagon className="size-4" />,
				loading: <SpinnerGap className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--surface)",
					"--normal-text": "var(--surface-fg)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
