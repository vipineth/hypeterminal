import { Check, Copy } from "lucide-react";
import { UI_TEXT } from "@/constants/app";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
	code: string;
	className?: string;
}

const SHOWCASE_TEXT = UI_TEXT.COMPONENT_SHOWCASE;

export function CodeBlock({ code, className }: CodeBlockProps) {
	const { copied, copy } = useCopyToClipboard(SHOWCASE_TEXT.COPY_RESET_MS);

	const handleCopy = () => {
		void copy(code);
	};

	return (
		<div className={cn("relative group", className)}>
			<pre className="bg-muted/50 border border-border/40 rounded-sm px-3 py-2 text-2xs font-mono overflow-x-auto">
				<code>{code}</code>
			</pre>
			<button
				type="button"
				onClick={handleCopy}
				className="absolute top-1.5 right-1.5 size-6 flex items-center justify-center rounded-sm bg-background/80 border border-border/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
				aria-label={SHOWCASE_TEXT.COPY_ARIA}
			>
				{copied ? (
					<Check className="size-3 text-terminal-green" />
				) : (
					<Copy className="size-3 text-muted-foreground" />
				)}
			</button>
		</div>
	);
}
