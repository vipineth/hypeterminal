export {
	Tabs,
	TabsContent,
	type TabsContentProps,
	TabsList,
	type TabsListProps,
	TabsTrigger,
	type TabsTriggerProps,
} from "@hypeterminal/ui";

export function TabsContentGroup({ children }: { children: React.ReactNode }) {
	return <div className="flex-1 min-h-0 overflow-auto">{children}</div>;
}
