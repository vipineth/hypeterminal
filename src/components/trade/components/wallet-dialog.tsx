import {
	AppleLogo as AppleLogoIcon,
	ArrowLeft as ArrowLeftIcon,
	ArrowRight as ArrowRightIcon,
	FacebookLogo as FacebookLogoIcon,
	Fingerprint as FingerprintIcon,
	GithubLogo as GithubLogoIcon,
	GoogleLogo as GoogleLogoIcon,
	SpinnerGap as SpinnerGapIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { arbitrum } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { hasStoredPasskey, preAuthenticate } from "thirdweb/wallets/in-app";
import { useConnect, useConnectors } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { thirdwebClient } from "@/config/thirdweb";
import { cn } from "@/lib/cn";
import { getWalletInfo, isInAppConnector, isMockConnector } from "@/lib/wallet-utils";

type View = "main" | "email-verify";
type LoadingKey = "google" | "apple" | "facebook" | "github" | "email" | "passkey" | string | null;

const SOCIAL_OPTIONS = [
	{ strategy: "google" as const, label: "Google", Icon: GoogleLogoIcon },
	{ strategy: "apple" as const, label: "Apple", Icon: AppleLogoIcon },
	{ strategy: "facebook" as const, label: "Facebook", Icon: FacebookLogoIcon },
	{ strategy: "github" as const, label: "GitHub", Icon: GithubLogoIcon },
];

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: Props) {
	const connectors = useConnectors();
	const { mutateAsync: connectAsync } = useConnect();

	const [view, setView] = useState<View>("main");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState<LoadingKey>(null);
	const [error, setError] = useState<string | null>(null);

	function resetState() {
		setView("main");
		setEmail("");
		setCode("");
		setLoading(null);
		setError(null);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) resetState();
		onOpenChange(nextOpen);
	}

	async function syncWagmi() {
		const inAppConnector = connectors.find(isInAppConnector);
		if (inAppConnector) {
			try {
				await connectAsync({ connector: inAppConnector });
			} catch {
				// thirdweb already connected, wagmi sync may fail silently
			}
		}
	}

	async function handleSocialLogin(strategy: "google" | "apple" | "facebook" | "github") {
		setLoading(strategy);
		setError(null);
		try {
			const wallet = inAppWallet();
			await wallet.connect({ client: thirdwebClient, chain: arbitrum, strategy });
			await syncWagmi();
			handleOpenChange(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Connection failed");
		} finally {
			setLoading(null);
		}
	}

	async function handleEmailSubmit() {
		if (!email.trim()) return;
		setLoading("email");
		setError(null);
		try {
			await preAuthenticate({ client: thirdwebClient, strategy: "email", email: email.trim() });
			setView("email-verify");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to send verification code");
		} finally {
			setLoading(null);
		}
	}

	async function handleEmailVerify() {
		if (code.length !== 6) return;
		setLoading("email-verify");
		setError(null);
		try {
			const wallet = inAppWallet();
			await wallet.connect({
				client: thirdwebClient,
				chain: arbitrum,
				strategy: "email",
				email: email.trim(),
				verificationCode: code,
			});
			await syncWagmi();
			handleOpenChange(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Verification failed");
		} finally {
			setLoading(null);
		}
	}

	async function handleResendCode() {
		setLoading("resend");
		setError(null);
		try {
			await preAuthenticate({ client: thirdwebClient, strategy: "email", email: email.trim() });
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to resend code");
		} finally {
			setLoading(null);
		}
	}

	async function handlePasskey() {
		setLoading("passkey");
		setError(null);
		try {
			const wallet = inAppWallet();
			const hasPasskey = await hasStoredPasskey(thirdwebClient);
			await wallet.connect({
				client: thirdwebClient,
				chain: arbitrum,
				strategy: "passkey",
				type: hasPasskey ? "sign-in" : "sign-up",
			});
			await syncWagmi();
			handleOpenChange(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Passkey authentication failed");
		} finally {
			setLoading(null);
		}
	}

	async function handleExternalWallet(connectorId: string) {
		const connector = connectors.find((c) => c.id === connectorId || c.name === connectorId);
		if (!connector) return;
		setLoading(connectorId);
		setError(null);
		try {
			await connectAsync({ connector });
			handleOpenChange(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Connection failed");
		} finally {
			setLoading(null);
		}
	}

	const externalConnectors = connectors.filter((c) => !isInAppConnector(c) && !isMockConnector(c));

	return (
		<ResponsiveModal open={open} onOpenChange={handleOpenChange}>
			<ResponsiveModalContent className="sm:max-w-sm gap-0 overflow-hidden p-0">
				{view === "main" ? (
					<MainView
						loading={loading}
						error={error}
						email={email}
						externalConnectors={externalConnectors}
						onEmailChange={setEmail}
						onSocialLogin={handleSocialLogin}
						onEmailSubmit={handleEmailSubmit}
						onPasskey={handlePasskey}
						onExternalWallet={handleExternalWallet}
					/>
				) : (
					<EmailVerifyView
						loading={loading}
						error={error}
						email={email}
						code={code}
						onCodeChange={setCode}
						onVerify={handleEmailVerify}
						onResend={handleResendCode}
						onBack={() => {
							setView("main");
							setCode("");
							setError(null);
						}}
					/>
				)}
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}

interface MainViewProps {
	loading: LoadingKey;
	error: string | null;
	email: string;
	externalConnectors: ReturnType<typeof useConnectors>;
	onEmailChange: (email: string) => void;
	onSocialLogin: (strategy: "google" | "apple" | "facebook" | "github") => void;
	onEmailSubmit: () => void;
	onPasskey: () => void;
	onExternalWallet: (connectorId: string) => void;
}

function MainView({
	loading,
	error,
	email,
	externalConnectors,
	onEmailChange,
	onSocialLogin,
	onEmailSubmit,
	onPasskey,
	onExternalWallet,
}: MainViewProps) {
	return (
		<div className="flex flex-col gap-4 p-5">
			<ResponsiveModalHeader className="p-0">
				<ResponsiveModalTitle className="text-base font-semibold text-text-950">Connect</ResponsiveModalTitle>
				<ResponsiveModalDescription className="text-xs text-text-500">
					Sign in to get started
				</ResponsiveModalDescription>
			</ResponsiveModalHeader>

			<div className="flex gap-2">
				{SOCIAL_OPTIONS.map(({ strategy, label, Icon }) => (
					<Button
						key={strategy}
						variant="outlined"
						tone="base"
						size="none"
						disabled={!!loading}
						className="flex-1 flex-col gap-1 p-2.5"
						onClick={() => onSocialLogin(strategy)}
					>
						{loading === strategy ? (
							<SpinnerGapIcon className="size-5 animate-spin text-text-500" />
						) : (
							<Icon className="size-5 text-text-600" weight="bold" />
						)}
						<span className="text-3xs text-text-600">{label}</span>
					</Button>
				))}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					onEmailSubmit();
				}}
				className="flex gap-2"
			>
				<Input
					type="email"
					placeholder="Enter your email"
					inputSize="lg"
					value={email}
					onChange={(e) => onEmailChange(e.target.value)}
					disabled={!!loading}
				/>
				<Button
					type="submit"
					variant="contained"
					tone="accent"
					size="icon"
					disabled={!email.trim() || !!loading}
					className="size-9 shrink-0"
				>
					{loading === "email" ? (
						<SpinnerGapIcon className="size-4 animate-spin" />
					) : (
						<ArrowRightIcon className="size-4" weight="bold" />
					)}
				</Button>
			</form>

			<Button
				variant="outlined"
				tone="base"
				size="lg"
				disabled={!!loading}
				className="justify-start gap-2 px-3"
				onClick={onPasskey}
			>
				{loading === "passkey" ? (
					<SpinnerGapIcon className="size-4 animate-spin text-text-500" />
				) : (
					<FingerprintIcon className="size-4 text-text-600" weight="bold" />
				)}
				<span>Passkey</span>
			</Button>

			{error && <p className="text-2xs text-error-700">{error}</p>}

			{externalConnectors.length > 0 && (
				<>
					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-border-200" />
						<span className="text-3xs font-medium text-text-400">OR</span>
						<div className="h-px flex-1 bg-border-200" />
					</div>

					<div className="flex flex-col gap-1.5">
						{externalConnectors.map((connector) => {
							const info = getWalletInfo(connector);
							const WalletIcon = info.icon;
							return (
								<Button
									key={connector.uid}
									variant="ghost"
									tone="base"
									size="lg"
									disabled={!!loading}
									className="justify-start gap-2.5 px-3"
									onClick={() => onExternalWallet(connector.id)}
								>
									{loading === connector.id ? (
										<SpinnerGapIcon className="size-5 animate-spin text-text-500" />
									) : (
										<WalletIcon className="size-5" />
									)}
									<span>{connector.name}</span>
								</Button>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}

interface EmailVerifyViewProps {
	loading: LoadingKey;
	error: string | null;
	email: string;
	code: string;
	onCodeChange: (code: string) => void;
	onVerify: () => void;
	onResend: () => void;
	onBack: () => void;
}

function EmailVerifyView({
	loading,
	error,
	email,
	code,
	onCodeChange,
	onVerify,
	onResend,
	onBack,
}: EmailVerifyViewProps) {
	return (
		<div className="flex flex-col gap-4 p-5">
			<ResponsiveModalHeader className="p-0">
				<div className="flex items-center gap-2">
					<Button variant="ghost" tone="base" size="icon" onClick={onBack} className="size-7">
						<ArrowLeftIcon className="size-4" weight="bold" />
					</Button>
					<div>
						<ResponsiveModalTitle className="text-base font-semibold text-text-950">
							Verify your email
						</ResponsiveModalTitle>
						<ResponsiveModalDescription className="text-xs text-text-500">
							Enter the code sent to {email}
						</ResponsiveModalDescription>
					</div>
				</div>
			</ResponsiveModalHeader>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					onVerify();
				}}
				className="flex flex-col gap-3"
			>
				<Input
					type="text"
					inputMode="numeric"
					placeholder="000000"
					inputSize="lg"
					maxLength={6}
					value={code}
					onChange={(e) => {
						const v = e.target.value.replace(/\D/g, "");
						onCodeChange(v);
					}}
					disabled={!!loading}
					autoFocus
					className="text-center tracking-[0.3em]"
				/>
				<Button type="submit" variant="contained" tone="accent" size="lg" disabled={code.length !== 6 || !!loading}>
					{loading === "email-verify" ? <SpinnerGapIcon className="size-4 animate-spin" /> : "Verify"}
				</Button>
			</form>

			{error && <p className="text-2xs text-error-700">{error}</p>}

			<button
				type="button"
				onClick={onResend}
				disabled={!!loading}
				className={cn("text-xs text-primary-default hover:text-primary-hover disabled:opacity-50", "self-center")}
			>
				{loading === "resend" ? "Sending..." : "Resend code"}
			</button>
		</div>
	);
}
