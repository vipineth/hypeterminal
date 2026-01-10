import { t } from "@lingui/core/macro";
import { Loader2Icon } from "lucide-react";

import clsx from "clsx";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<Loader2Icon role="status" aria-label={t`Loading`} className={clsx("size-4 animate-spin", className)} {...props} />
	);
}

export { Spinner };
