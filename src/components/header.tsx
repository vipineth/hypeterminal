import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";

const navigationLinks = [
	{ active: true, href: "#", label: "Home" },
	{ href: "#", label: "Features" },
	{ href: "#", label: "Pricing" },
	{ href: "#", label: "About" },
];

export function Header() {
	return (
		<header className="border-b px-4 py-2">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button className="group size-8 md:hidden" size="icon" variant="ghost">
								<span className="sr-only">Toggle menu</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" className="w-36 p-1 md:hidden">
							<NavigationMenu className="max-w-none *:w-full">
								<NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
									{navigationLinks.map((link, _index) => (
										<NavigationMenuItem className="w-full" key={link.href}>
											<NavigationMenuLink active={link.active} className="py-1.5" href={link.href}>
												{link.label}
											</NavigationMenuLink>
										</NavigationMenuItem>
									))}
								</NavigationMenuList>
							</NavigationMenu>
						</PopoverContent>
					</Popover>
					<div className="flex items-center gap-6">
						<Link className="text-primary hover:text-primary/90" to="/">
							HypeTerminal
						</Link>
						<NavigationMenu className="max-md:hidden">
							<NavigationMenuList className="gap-2">
								{navigationLinks.map((link, _index) => (
									<NavigationMenuItem key={link.href}>
										<NavigationMenuLink
											active={link.active}
											className="py-1.5 font-medium text-muted-foreground hover:text-primary"
											href={link.href}
										>
											{link.label}
										</NavigationMenuLink>
									</NavigationMenuItem>
								))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						Connect Wallet
					</Button>
					<Separator orientation="vertical" />

					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
