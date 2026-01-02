import { Loader2Icon } from "lucide-react";

import { UI_TEXT } from "@/constants/app";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<Loader2Icon
			role="status"
			aria-label={UI_TEXT.COMMON.LOADING}
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
