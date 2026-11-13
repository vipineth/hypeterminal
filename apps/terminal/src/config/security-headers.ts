import { type Env, getRpcOrigins } from "./rpc";

function createCspDirectives(env: Env): Record<string, string> {
	return {
		"default-src": "'self'",
		"base-uri": "'self'",
		"object-src": "'none'",
		"frame-ancestors": "'none'",
		"form-action": "'self'",
		"img-src": "'self' data: blob: https:",
		"font-src": "'self' data:",
		"style-src": "'self' blob: 'unsafe-inline'",
		"script-src": "'self' blob: 'unsafe-inline'",
		"connect-src": [
			"'self'",
			"https://app.hyperliquid.xyz",
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
			...getRpcOrigins(env),
			"https://li.quest",
			"https://gas.api.infura.io",
		].join(" "),
		"worker-src": "'self' blob:",
		"frame-src":
			"'self' blob: https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com",
		"manifest-src": "'self'",
	};
}

export function createSecurityHeaders(env: Env): Record<string, string> {
	const contentSecurityPolicy = Object.entries(createCspDirectives(env))
		.map(([directive, value]) => `${directive} ${value}`)
		.join("; ");

	return {
		"content-security-policy": contentSecurityPolicy,
		"permissions-policy": "camera=(self), microphone=(), geolocation=(), payment=()",
		"referrer-policy": "strict-origin-when-cross-origin",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
	};
}
