import { Trans } from "@lingui/react/macro";
import { AlertCircle, ExternalLink, FlaskConical, HelpCircle, Loader2, Shield, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { type Connector, useConnect, useConnectors } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MOCK_WALLETS } from "@/config/wagmi";
import { cn } from "@/lib/cn";
import { getLastUsedWallet, getWalletInfo, isMockConnector, setLastUsedWallet } from "@/lib/wallet-utils";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: Props) {
	const connectors = useConnectors();
	const { connect, isPending, error } = useConnect();
	const [connectingId, setConnectingId] = useState<string | null>(null);
	const [showHelp, setShowHelp] = useState(false);
	const [lastUsedWallet] = useState(() => getLastUsedWallet());
	const [customAddress, setCustomAddress] = useState("");
	const [customAddressError, setCustomAddressError] = useState<string | null>(null);

	const { mockConnectors, regularConnectors } = useMemo(() => {
		const mock: Connector[] = [];
		const regular: Connector[] = [];

		for (const connector of connectors) {
			if (isMockConnector(connector)) {
				mock.push(connector);
			} else {
				regular.push(connector);
			}
		}

		return { mockConnectors: mock, regularConnectors: regular };
	}, [connectors]);

	const availableConnectors = useMemo(() => {
		const sortByPriority = (a: Connector, b: Connector) => {
			if (lastUsedWallet) {
				if (a.id === lastUsedWallet) return -1;
				if (b.id === lastUsedWallet) return 1;
			}
			const priorityA = getWalletInfo(a).priority ?? 50;
			const priorityB = getWalletInfo(b).priority ?? 50;
			return priorityA - priorityB;
		};

		const popular = regularConnectors.filter((c) => getWalletInfo(c).popular).sort(sortByPriority);
		const other = regularConnectors.filter((c) => !getWalletInfo(c).popular).sort(sortByPriority);
		return { popular, other, all: regularConnectors };
	}, [regularConnectors, lastUsedWallet]);

	const handleConnect = (connector: Connector) => {
		setConnectingId(connector.uid);
		setLastUsedWallet(connector.id);
		connect(
			{ connector },
			{
				onSettled: () => {
					setConnectingId(null);
					onOpenChange(false);
				},
			},
		);
	};

	const handleCustomAddressConnect = () => {
		const trimmed = customAddress.trim();
		if (!trimmed) {
			setCustomAddressError("Please enter an address");
			return;
		}
		if (!isAddress(trimmed)) {
			setCustomAddressError("Invalid Ethereum address");
			return;
		}
		setCustomAddressError(null);

		const mockWalletIndex = MOCK_WALLETS.findIndex((w) => w.address.toLowerCase() === trimmed.toLowerCase());

		if (mockWalletIndex !== -1 && mockConnectors[mockWalletIndex]) {
			handleConnect(mockConnectors[mockWalletIndex]);
		} else if (mockConnectors.length > 0) {
			handleConnect(mockConnectors[0]);
		} else {
			setCustomAddressError("No mock connector available");
		}
	};

	const hasConnectors = availableConnectors.all.length > 0 || mockConnectors.length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-hidden">
				<div className="p-6 pb-4 border-b border-border/50">
					<DialogHeader className="space-y-2">
						<DialogTitle className="flex items-center gap-2 text-lg">
							<Wallet className="size-5 text-info" />
							<Trans>Connect Wallet</Trans>
						</DialogTitle>
						<DialogDescription className="text-sm">
							<Trans>Connect your wallet to start trading on Hyperliquid</Trans>
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
					{availableConnectors.popular.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-fg uppercase tracking-wider px-1">
								<Trans>Popular</Trans>
							</p>
							<div className="space-y-2">
								{availableConnectors.popular.map((connector) => {
									const walletInfo = getWalletInfo(connector);
									const Icon = walletInfo.icon;
									const isConnecting = connectingId === connector.uid;

									return (
										<Button
											key={connector.uid}
											variant="ghost"
											size="none"
											onClick={() => handleConnect(connector)}
											disabled={isPending}
											className={cn(
												"w-full gap-3 p-3 rounded-lg border",
												"bg-bg hover:bg-accent/50 hover:border-info/30",
												"group focus:ring-2 focus:ring-info/50",
											)}
										>
											<div className="size-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
												<Icon className="size-full" />
											</div>
											<div className="flex-1 text-left min-w-0">
												<p className="font-medium text-sm group-hover:text-info transition-colors">
													{connector.name}
												</p>
												<p className="text-xs text-muted-fg truncate">{walletInfo.description}</p>
											</div>
											{isConnecting ? (
												<Loader2 className="size-4 animate-spin text-info flex-shrink-0" />
											) : (
												<div className="size-4 rounded-full border border-border group-hover:border-info/50 flex-shrink-0 transition-colors" />
											)}
										</Button>
									);
								})}
							</div>
						</div>
					)}

					{availableConnectors.other.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs font-medium text-muted-fg uppercase tracking-wider px-1">
								<Trans>Other Options</Trans>
							</p>
							<div className="space-y-2">
								{availableConnectors.other.map((connector) => {
									const walletInfo = getWalletInfo(connector);
									const Icon = walletInfo.icon;
									const isConnecting = connectingId === connector.uid;

									return (
										<Button
											key={connector.uid}
											variant="ghost"
											size="none"
											onClick={() => handleConnect(connector)}
											disabled={isPending}
											className={cn(
												"w-full gap-3 p-3 rounded-lg border",
												"bg-bg hover:bg-accent/50 hover:border-info/30",
												"group focus:ring-2 focus:ring-info/50",
											)}
										>
											<div className="size-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
												<Icon className="size-full" />
											</div>
											<div className="flex-1 text-left min-w-0">
												<p className="font-medium text-sm group-hover:text-info transition-colors">
													{connector.name}
												</p>
												<p className="text-xs text-muted-fg truncate">{walletInfo.description}</p>
											</div>
											{isConnecting ? (
												<Loader2 className="size-4 animate-spin text-info flex-shrink-0" />
											) : (
												<div className="size-4 rounded-full border border-border group-hover:border-info/50 flex-shrink-0 transition-colors" />
											)}
										</Button>
									);
								})}
							</div>
						</div>
					)}

					{mockConnectors.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs font-medium text-warning uppercase tracking-wider px-1">
								<Trans>Mock Wallet (Testing)</Trans>
							</p>
							<div className="space-y-2">
								{mockConnectors.map((connector, index) => {
									const config = MOCK_WALLETS[index];
									const isConnecting = connectingId === connector.uid;

									return (
										<Button
											key={connector.uid}
											variant="ghost"
											size="none"
											onClick={() => handleConnect(connector)}
											disabled={isPending}
											className={cn(
												"w-full gap-3 p-3 rounded-lg border border-warning/30",
												"bg-warning/5 hover:bg-warning/10 hover:border-warning/50",
												"group focus:ring-2 focus:ring-warning/50",
											)}
										>
											<div className="size-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm bg-warning/20 flex items-center justify-center">
												<FlaskConical className="size-5 text-warning" />
											</div>
											<div className="flex-1 text-left min-w-0">
												<p className="font-medium text-sm group-hover:text-warning transition-colors">
													{config?.name ?? connector.name}
												</p>
												<p className="text-xs text-muted-fg truncate font-mono">
													{config?.address ?? "Mock wallet"}
												</p>
											</div>
											{isConnecting ? (
												<Loader2 className="size-4 animate-spin text-warning flex-shrink-0" />
											) : (
												<div className="size-4 rounded-full border border-warning/50 flex-shrink-0 transition-colors" />
											)}
										</Button>
									);
								})}
							</div>
							<div className="pt-2 space-y-2">
								<div className="flex gap-2">
									<Input
										placeholder="0x..."
										value={customAddress}
										onChange={(e) => {
											setCustomAddress(e.target.value);
											setCustomAddressError(null);
										}}
										className="font-mono text-xs"
									/>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCustomAddressConnect}
										disabled={isPending}
										className="shrink-0"
									>
										<Trans>Connect</Trans>
									</Button>
								</div>
								{customAddressError && <p className="text-xs text-danger px-1">{customAddressError}</p>}
							</div>
						</div>
					)}

					{!hasConnectors && (
						<div className="py-8 text-center space-y-3">
							<div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
								<AlertCircle className="size-6 text-muted-fg" />
							</div>
							<div>
								<p className="text-sm font-medium">
									<Trans>No wallets found</Trans>
								</p>
								<p className="text-xs text-muted-fg mt-1">
									<Trans>Install a wallet extension to continue</Trans>
								</p>
							</div>
						</div>
					)}

					{error && (
						<div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
							<AlertCircle className="size-4 text-danger shrink-0 mt-0.5" />
							<p className="text-xs text-danger">{error.message}</p>
						</div>
					)}
				</div>

				<div className="border-t border-border/50 bg-muted/30">
					<Button
						variant="ghost"
						size="none"
						onClick={() => setShowHelp(!showHelp)}
						className="w-full justify-between p-4 text-sm text-muted-fg hover:text-fg hover:bg-transparent"
					>
						<span className="flex items-center gap-2">
							<HelpCircle className="size-4" />
							<Trans>New to wallets?</Trans>
						</span>
						<span className={cn("transition-transform", showHelp && "rotate-180")}>
							<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
								<path
									d="M2.5 4.5L6 8L9.5 4.5"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
					</Button>

					{showHelp && (
						<div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
							<div className="flex items-start gap-3 text-xs">
								<Shield className="size-4 text-positive flex-shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-fg">
										<Trans>Secure & Private</Trans>
									</p>
									<p className="text-muted-fg mt-0.5">
										<Trans>Only you control your funds. No email or password required.</Trans>
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 text-xs">
								<Wallet className="size-4 text-info flex-shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-fg">
										<Trans>What is a wallet?</Trans>
									</p>
									<p className="text-muted-fg mt-0.5">
										<Trans>A crypto wallet lets you store and manage your digital assets securely.</Trans>
									</p>
								</div>
							</div>
							<Button variant="outline" size="sm" className="w-full mt-2" asChild>
								<a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer">
									<Trans>Learn more</Trans>
									<ExternalLink className="size-3 ml-1.5" />
								</a>
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
