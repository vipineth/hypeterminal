import { t } from "@lingui/core/macro";
import { SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<SpinnerGap role="status" aria-label={t`Loading`} className={cn("size-4 animate-spin", className)} {...props} />
	);
}

export { Spinner };
