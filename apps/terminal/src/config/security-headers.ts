export const cspDirectives: Record<string, string> = {
	"default-src": "'self'",
	"base-uri": "'self'",
	"object-src": "'none'",
	"frame-ancestors": "'none'",
	"form-action": "'self'",
	"img-src": "'self' data: blob: https:",
	"font-src": "'self' data:",
	"style-src": "'self' 'unsafe-inline'",
	"script-src": "'self' blob: 'unsafe-inline'",
	"connect-src": [
		"'self'",
		"https://api.hyperliquid.xyz",
		"https://api.hyperliquid-testnet.xyz",
		"wss://api.hyperliquid.xyz",
		"wss://api.hyperliquid-testnet.xyz",
		"https://relay.walletconnect.com",
		"wss://relay.walletconnect.com",
		"https://relay.walletconnect.org",
		"wss://relay.walletconnect.org",
		"https://api.web3modal.com",
		"https://api.web3modal.org",
		"https://pulse.walletconnect.org",
		"https://ethereum-rpc.publicnode.com",
		"https://li.quest",
		"https://gas.api.infura.io",
	].join(" "),
	"worker-src": "'self' blob:",
	"frame-src":
		"'self' https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com",
	"manifest-src": "'self'",
};

export const contentSecurityPolicy = Object.entries(cspDirectives)
	.map(([directive, value]) => `${directive} ${value}`)
	.join("; ");

export const securityHeaders: Record<string, string> = {
	"content-security-policy": contentSecurityPolicy,
	"permissions-policy": "camera=(self), microphone=(), geolocation=(), payment=()",
	"referrer-policy": "strict-origin-when-cross-origin",
	"x-content-type-options": "nosniff",
	"x-frame-options": "DENY",
};
