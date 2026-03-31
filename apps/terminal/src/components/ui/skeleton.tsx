import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="skeleton" className={cn("bg-bg-raised animate-pulse rounded-12", className)} {...props} />;
}

export { Skeleton };
