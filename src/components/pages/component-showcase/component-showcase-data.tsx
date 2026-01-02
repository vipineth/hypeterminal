import { Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UI_TEXT } from "@/constants/app";
import { CodeBlock } from "./code-block";
import { ShowcaseRow } from "./showcase-row";

export type ShowcaseSectionDefinition = {
	id: string;
	title: string;
	render: () => React.ReactNode;
};

const SHOWCASE_TEXT = UI_TEXT.COMPONENT_SHOWCASE;
const BUTTON_TEXT = SHOWCASE_TEXT.BUTTON;
const INPUT_TEXT = SHOWCASE_TEXT.INPUT;
const BADGE_TEXT = SHOWCASE_TEXT.BADGE;
const CARD_TEXT = SHOWCASE_TEXT.CARD;
const TABS_TEXT = SHOWCASE_TEXT.TABS;
const SELECT_TEXT = SHOWCASE_TEXT.SELECT;
const TABLE_TEXT = SHOWCASE_TEXT.TABLE;
const TYPOGRAPHY_TEXT = SHOWCASE_TEXT.TYPOGRAPHY;

export const SHOWCASE_SECTIONS: ShowcaseSectionDefinition[] = [
	{
		id: "button",
		title: BUTTON_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<ShowcaseRow label={BUTTON_TEXT.ROWS.VARIANTS.LABEL} code={BUTTON_TEXT.ROWS.VARIANTS.CODE}>
					<Button variant="default" size="sm">
						{BUTTON_TEXT.LABELS.DEFAULT}
					</Button>
					<Button variant="secondary" size="sm">
						{BUTTON_TEXT.LABELS.SECONDARY}
					</Button>
					<Button variant="outline" size="sm">
						{BUTTON_TEXT.LABELS.OUTLINE}
					</Button>
					<Button variant="ghost" size="sm">
						{BUTTON_TEXT.LABELS.GHOST}
					</Button>
					<Button variant="destructive" size="sm">
						{BUTTON_TEXT.LABELS.DESTRUCTIVE}
					</Button>
				</ShowcaseRow>

				<ShowcaseRow label={BUTTON_TEXT.ROWS.TRADING.LABEL} code={BUTTON_TEXT.ROWS.TRADING.CODE}>
					<Button variant="long" size="sm">
						{BUTTON_TEXT.LABELS.LONG}
					</Button>
					<Button variant="short" size="sm">
						{BUTTON_TEXT.LABELS.SHORT}
					</Button>
					<Button variant="terminal" size="sm">
						{BUTTON_TEXT.LABELS.TERMINAL}
					</Button>
				</ShowcaseRow>

				<ShowcaseRow label={BUTTON_TEXT.ROWS.SIZES.LABEL} code={BUTTON_TEXT.ROWS.SIZES.CODE}>
					<Button size="lg">{BUTTON_TEXT.LABELS.LARGE}</Button>
					<Button size="default">{BUTTON_TEXT.LABELS.DEFAULT}</Button>
					<Button size="sm">{BUTTON_TEXT.LABELS.SMALL}</Button>
					<Button size="xs">{BUTTON_TEXT.LABELS.XS}</Button>
					<Button size="2xs">{BUTTON_TEXT.LABELS.TWO_XS}</Button>
				</ShowcaseRow>

				<ShowcaseRow label={BUTTON_TEXT.ROWS.ICON_SIZES.LABEL} code={BUTTON_TEXT.ROWS.ICON_SIZES.CODE}>
					<Button size="icon-lg" variant="outline">
						<Terminal />
					</Button>
					<Button size="icon" variant="outline">
						<Terminal />
					</Button>
					<Button size="icon-sm" variant="outline">
						<Terminal />
					</Button>
					<Button size="icon-xs" variant="outline">
						<Terminal />
					</Button>
					<Button size="icon-2xs" variant="outline">
						<Terminal />
					</Button>
				</ShowcaseRow>
			</>
		),
	},
	{
		id: "input",
		title: INPUT_TEXT.SECTION_TITLE,
		render: () => (
			<ShowcaseRow label={INPUT_TEXT.ROWS.SIZES.LABEL} code={INPUT_TEXT.ROWS.SIZES.CODE}>
				<Input inputSize="lg" placeholder={INPUT_TEXT.PLACEHOLDERS.LARGE} className="w-28" />
				<Input inputSize="default" placeholder={INPUT_TEXT.PLACEHOLDERS.DEFAULT} className="w-28" />
				<Input inputSize="sm" placeholder={INPUT_TEXT.PLACEHOLDERS.SMALL} className="w-28" />
			</ShowcaseRow>
		),
	},
	{
		id: "badge",
		title: BADGE_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<ShowcaseRow label={BADGE_TEXT.ROWS.VARIANTS.LABEL} code={BADGE_TEXT.ROWS.VARIANTS.CODE}>
					<Badge variant="default">{BADGE_TEXT.LABELS.DEFAULT}</Badge>
					<Badge variant="secondary">{BADGE_TEXT.LABELS.SECONDARY}</Badge>
					<Badge variant="outline">{BADGE_TEXT.LABELS.OUTLINE}</Badge>
					<Badge variant="destructive">{BADGE_TEXT.LABELS.DESTRUCTIVE}</Badge>
				</ShowcaseRow>

				<ShowcaseRow label={BADGE_TEXT.ROWS.TRADING.LABEL} code={BADGE_TEXT.ROWS.TRADING.CODE}>
					<Badge variant="long">{BADGE_TEXT.VALUES.POSITIVE_PCT}</Badge>
					<Badge variant="short">{BADGE_TEXT.VALUES.NEGATIVE_PCT}</Badge>
					<Badge variant="neutral">{BADGE_TEXT.VALUES.NEUTRAL_PCT}</Badge>
				</ShowcaseRow>

				<ShowcaseRow label={BADGE_TEXT.ROWS.SIZES.LABEL} code={BADGE_TEXT.ROWS.SIZES.CODE}>
					<Badge size="default">{BADGE_TEXT.LABELS.DEFAULT}</Badge>
					<Badge size="sm">{BADGE_TEXT.LABELS.SMALL}</Badge>
					<Badge size="xs">{BADGE_TEXT.LABELS.XS}</Badge>
				</ShowcaseRow>

				<ShowcaseRow label={BADGE_TEXT.ROWS.TRADING_SIZES.LABEL} code={BADGE_TEXT.ROWS.TRADING_SIZES.CODE}>
					<Badge variant="long" size="default">
						{BADGE_TEXT.LABELS.LONG}
					</Badge>
					<Badge variant="long" size="sm">
						{BADGE_TEXT.LABELS.LONG}
					</Badge>
					<Badge variant="long" size="xs">
						{BADGE_TEXT.LABELS.LONG_ABBR}
					</Badge>
					<Badge variant="short" size="default">
						{BADGE_TEXT.LABELS.SHORT}
					</Badge>
					<Badge variant="short" size="sm">
						{BADGE_TEXT.LABELS.SHORT}
					</Badge>
					<Badge variant="short" size="xs">
						{BADGE_TEXT.LABELS.SHORT_ABBR}
					</Badge>
				</ShowcaseRow>
			</>
		),
	},
	{
		id: "card",
		title: CARD_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<CodeBlock code={CARD_TEXT.CODE} className="mb-4" />
				<div className="grid grid-cols-2 gap-4">
					<Card>
						<CardHeader>
							<CardTitle>{CARD_TEXT.TITLE}</CardTitle>
							<CardDescription>{CARD_TEXT.DESCRIPTION}</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">{CARD_TEXT.CONTENT}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>{CARD_TEXT.POSITION_TITLE}</CardTitle>
							<CardDescription>{CARD_TEXT.POSITION_DESCRIPTION}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Badge variant="long">{CARD_TEXT.POSITION_LABEL}</Badge>
								<span className="text-xs tabular-nums">{CARD_TEXT.POSITION_DETAIL}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</>
		),
	},
	{
		id: "tabs",
		title: TABS_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<CodeBlock code={TABS_TEXT.CODE} className="mb-4" />
				<Tabs defaultValue="positions">
					<TabsList>
						<TabsTrigger value="positions">{TABS_TEXT.LABEL_POSITIONS}</TabsTrigger>
						<TabsTrigger value="orders">{TABS_TEXT.LABEL_ORDERS}</TabsTrigger>
						<TabsTrigger value="history">{TABS_TEXT.LABEL_HISTORY}</TabsTrigger>
					</TabsList>
					<TabsContent value="positions" className="p-3 border rounded-sm mt-2">
						<p className="text-xs text-muted-foreground">{TABS_TEXT.CONTENT_POSITIONS}</p>
					</TabsContent>
					<TabsContent value="orders" className="p-3 border rounded-sm mt-2">
						<p className="text-xs text-muted-foreground">{TABS_TEXT.CONTENT_ORDERS}</p>
					</TabsContent>
					<TabsContent value="history" className="p-3 border rounded-sm mt-2">
						<p className="text-xs text-muted-foreground">{TABS_TEXT.CONTENT_HISTORY}</p>
					</TabsContent>
				</Tabs>
			</>
		),
	},
	{
		id: "select",
		title: SELECT_TEXT.SECTION_TITLE,
		render: () => (
			<ShowcaseRow label={SELECT_TEXT.ROWS.SIZES.LABEL} code={SELECT_TEXT.ROWS.SIZES.CODE}>
				<Select defaultValue="eth">
					<SelectTrigger size="default">
						<SelectValue placeholder={SELECT_TEXT.PLACEHOLDERS.DEFAULT} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="btc">{SELECT_TEXT.OPTIONS.BTC}</SelectItem>
						<SelectItem value="eth">{SELECT_TEXT.OPTIONS.ETH}</SelectItem>
						<SelectItem value="sol">{SELECT_TEXT.OPTIONS.SOL}</SelectItem>
					</SelectContent>
				</Select>
				<Select defaultValue="eth">
					<SelectTrigger size="sm">
						<SelectValue placeholder={SELECT_TEXT.PLACEHOLDERS.SMALL} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="btc">{SELECT_TEXT.OPTIONS.BTC}</SelectItem>
						<SelectItem value="eth">{SELECT_TEXT.OPTIONS.ETH}</SelectItem>
						<SelectItem value="sol">{SELECT_TEXT.OPTIONS.SOL}</SelectItem>
					</SelectContent>
				</Select>
				<Select defaultValue="eth">
					<SelectTrigger size="xs">
						<SelectValue placeholder={SELECT_TEXT.PLACEHOLDERS.XS} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="btc">{SELECT_TEXT.OPTIONS.BTC}</SelectItem>
						<SelectItem value="eth">{SELECT_TEXT.OPTIONS.ETH}</SelectItem>
						<SelectItem value="sol">{SELECT_TEXT.OPTIONS.SOL}</SelectItem>
					</SelectContent>
				</Select>
			</ShowcaseRow>
		),
	},
	{
		id: "table",
		title: TABLE_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<CodeBlock code={TABLE_TEXT.CODE} className="mb-4" />
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{TABLE_TEXT.HEADERS.SYMBOL}</TableHead>
							<TableHead>{TABLE_TEXT.HEADERS.SIDE}</TableHead>
							<TableHead className="text-right">{TABLE_TEXT.HEADERS.SIZE}</TableHead>
							<TableHead className="text-right">{TABLE_TEXT.HEADERS.ENTRY}</TableHead>
							<TableHead className="text-right">{TABLE_TEXT.HEADERS.PNL}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">{TABLE_TEXT.ROWS.ETH.SYMBOL}</TableCell>
							<TableCell>
								<Badge variant="long" size="xs">
									{BADGE_TEXT.LABELS.LONG}
								</Badge>
							</TableCell>
							<TableCell className="text-right tabular-nums">{TABLE_TEXT.ROWS.ETH.SIZE}</TableCell>
							<TableCell className="text-right tabular-nums">{TABLE_TEXT.ROWS.ETH.ENTRY}</TableCell>
							<TableCell className="text-right tabular-nums text-terminal-green">{TABLE_TEXT.ROWS.ETH.PNL}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">{TABLE_TEXT.ROWS.BTC.SYMBOL}</TableCell>
							<TableCell>
								<Badge variant="short" size="xs">
									{BADGE_TEXT.LABELS.SHORT}
								</Badge>
							</TableCell>
							<TableCell className="text-right tabular-nums">{TABLE_TEXT.ROWS.BTC.SIZE}</TableCell>
							<TableCell className="text-right tabular-nums">{TABLE_TEXT.ROWS.BTC.ENTRY}</TableCell>
							<TableCell className="text-right tabular-nums text-terminal-red">{TABLE_TEXT.ROWS.BTC.PNL}</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</>
		),
	},
	{
		id: "typography",
		title: TYPOGRAPHY_TEXT.SECTION_TITLE,
		render: () => (
			<>
				<CodeBlock code={TYPOGRAPHY_TEXT.CODE} className="mb-4" />
				<div className="space-y-1">
					<p className="text-sm">{TYPOGRAPHY_TEXT.UI_LINES.TEXT_SM}</p>
					<p className="text-xs">{TYPOGRAPHY_TEXT.UI_LINES.TEXT_XS}</p>
					<p className="text-2xs">{TYPOGRAPHY_TEXT.UI_LINES.TEXT_2XS}</p>
					<p className="text-3xs">{TYPOGRAPHY_TEXT.UI_LINES.TEXT_3XS}</p>
					<p className="text-4xs">{TYPOGRAPHY_TEXT.UI_LINES.TEXT_4XS}</p>
				</div>
				<div className="flex gap-4 mt-4">
					<span className="text-terminal-green">{TYPOGRAPHY_TEXT.COLOR_TOKENS.GREEN}</span>
					<span className="text-terminal-red">{TYPOGRAPHY_TEXT.COLOR_TOKENS.RED}</span>
					<span className="text-terminal-cyan">{TYPOGRAPHY_TEXT.COLOR_TOKENS.CYAN}</span>
					<span className="text-terminal-amber">{TYPOGRAPHY_TEXT.COLOR_TOKENS.AMBER}</span>
					<span className="text-terminal-purple">{TYPOGRAPHY_TEXT.COLOR_TOKENS.PURPLE}</span>
				</div>
			</>
		),
	},
];
