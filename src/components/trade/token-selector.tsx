import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TokenSelector() {
	const id = useId();
	return (
		<div className="*:not-first:mt-2">
			<Label htmlFor={id}>Options with portrait</Label>
			<Select defaultValue="1">
				<SelectTrigger
					className="h-auto ps-2 text-left [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0"
					id={id}
				>
					<SelectValue placeholder="Choose a plan" />
				</SelectTrigger>
				<SelectContent className="[&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
					<SelectItem value="1">
						<span className="flex items-center gap-2">
							<img
								alt="Jenny Hamilton"
								className="rounded-full"
								height={40}
								src="/origin/avatar-40-01.jpg"
								width={40}
							/>
							<span>
								<span className="block font-medium">Jenny Hamilton</span>
								<span className="mt-0.5 block text-muted-foreground text-xs">@jennycodes</span>
							</span>
						</span>
					</SelectItem>
					<SelectItem value="2">
						<span className="flex items-center gap-2">
							<img alt="Paul Smith" className="rounded-full" height={40} src="/origin/avatar-40-02.jpg" width={40} />
							<span>
								<span className="block font-medium">Paul Smith</span>
								<span className="mt-0.5 block text-muted-foreground text-xs">@paulsmith</span>
							</span>
						</span>
					</SelectItem>
					<SelectItem value="3">
						<span className="flex items-center gap-2">
							<img alt="Luna Wyen" className="rounded-full" height={40} src="/origin/avatar-40-03.jpg" width={40} />
							<span>
								<span className="block font-medium">Luna Wyen</span>
								<span className="mt-0.5 block text-muted-foreground text-xs">@wyen.luna</span>
							</span>
						</span>
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
