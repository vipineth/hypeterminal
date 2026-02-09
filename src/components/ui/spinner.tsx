import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<SpinnerGapIcon
			role="status"
			aria-label={t`Loading`}
			className={cn("size-4 animate-spin will-change-transform", className)}
			{...props}
		/>
	);
}

export { Spinner };
