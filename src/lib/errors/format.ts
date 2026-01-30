import { t } from "@lingui/core/macro";

const ERROR_PATTERNS = [
	{ pattern: /user rejected/i, message: () => t`Transaction was rejected` },
	{ pattern: /insufficient funds/i, message: () => t`Insufficient funds for gas` },
	{ pattern: /must deposit before performing actions/i, message: () => t`No balance on Hyperliquid. Deposit first.` },
] as const;

export function formatTransferError(error: Error | null): string {
	if (!error) return t`Unknown error`;

	const message = error.message;

	for (const { pattern, message: getMessage } of ERROR_PATTERNS) {
		if (pattern.test(message)) {
			return getMessage();
		}
	}

	const firstLine = message.split("\n")[0];
	return firstLine.length > 100 ? `${firstLine.slice(0, 100)}...` : firstLine;
}
