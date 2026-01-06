export function CoinbaseIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
			<title>Coinbase Wallet</title>
			<rect width="40" height="40" rx="8" fill="#0052FF" />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20 32C26.6274 32 32 26.6274 32 20C32 13.3726 26.6274 8 20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32ZM17 16C16.4477 16 16 16.4477 16 17V23C16 23.5523 16.4477 24 17 24H23C23.5523 24 24 23.5523 24 23V17C24 16.4477 23.5523 16 23 16H17Z"
				fill="white"
			/>
		</svg>
	);
}
