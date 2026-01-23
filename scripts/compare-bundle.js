#!/usr/bin/env node

import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

const ASSETS_DIR = ".output/public/assets";
const BASELINE_FILE = "perf-baseline.json";

function getChunkSizes() {
	const chunks = {};
	let totalSize = 0;
	let totalGzip = 0;

	try {
		const files = readdirSync(ASSETS_DIR);

		for (const file of files) {
			if (!file.endsWith(".js") && !file.endsWith(".css")) continue;

			const filePath = join(ASSETS_DIR, file);
			const content = readFileSync(filePath);
			const size = content.length;
			const gzip = gzipSync(content).length;

			totalSize += size;
			totalGzip += gzip;

			let chunkName = "other";
			if (file.startsWith("main-")) chunkName = "main";
			else if (file.startsWith("index-")) chunkName = "index";
			else if (file.startsWith("vendor-web3")) chunkName = "vendor-web3";
			else if (file.startsWith("vendor-radix")) chunkName = "vendor-radix";
			else if (file.startsWith("vendor-tanstack")) chunkName = "vendor-tanstack";
			else if (file.startsWith("vendor-charts")) chunkName = "vendor-charts";
			else if (file.startsWith("styles-")) chunkName = "styles";
			else if (file.startsWith("init-")) chunkName = "init-perf";
			else if (file.startsWith("messages-")) chunkName = "i18n-messages";

			if (!chunks[chunkName]) {
				chunks[chunkName] = { size: 0, gzip: 0, files: [] };
			}
			chunks[chunkName].size += size;
			chunks[chunkName].gzip += gzip;
			chunks[chunkName].files.push(file);
		}
	} catch (e) {
		console.error("Error reading assets:", e.message);
		console.error("Run 'pnpm build' first.");
		process.exit(1);
	}

	return { chunks, totalSize, totalGzip };
}

function formatSize(bytes) {
	return (bytes / 1024).toFixed(0) + "KB";
}

function formatDiff(current, baseline) {
	const diff = current - baseline;
	const percent = ((diff / baseline) * 100).toFixed(1);
	if (diff > 0) return `+${formatSize(diff)} (+${percent}%)`;
	if (diff < 0) return `${formatSize(diff)} (${percent}%)`;
	return "no change";
}

function compare() {
	const current = getChunkSizes();
	let baseline = null;

	try {
		baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
	} catch (e) {
		console.log("No baseline found. Showing current sizes only.\n");
	}

	console.log("=== BUNDLE SIZE COMPARISON ===\n");
	console.log(`Current build vs baseline (${baseline?.date || "N/A"})\n`);

	const chunkOrder = ["main", "index", "vendor-web3", "vendor-radix", "vendor-tanstack", "vendor-charts", "styles", "init-perf", "i18n-messages", "other"];

	for (const name of chunkOrder) {
		const curr = current.chunks[name];
		if (!curr) continue;

		const base = baseline?.client?.chunks?.[name];
		const currSize = formatSize(curr.size);
		const currGzip = formatSize(curr.gzip);

		if (base) {
			const sizeDiff = formatDiff(curr.size, base.size);
			const gzipDiff = formatDiff(curr.gzip, base.gzip);
			const emoji = curr.size < base.size ? "✅" : curr.size > base.size ? "⚠️" : "➖";
			console.log(`${emoji} ${name.padEnd(16)} ${currSize.padStart(7)} (gz: ${currGzip.padStart(5)})  ${sizeDiff}`);
		} else {
			console.log(`🆕 ${name.padEnd(16)} ${currSize.padStart(7)} (gz: ${currGzip.padStart(5)})`);
		}
	}

	console.log("\n" + "-".repeat(60));

	const totalCurrSize = formatSize(current.totalSize);
	const totalCurrGzip = formatSize(current.totalGzip);

	if (baseline) {
		const totalSizeDiff = formatDiff(current.totalSize, baseline.client.total.size);
		const totalGzipDiff = formatDiff(current.totalGzip, baseline.client.total.gzip);
		const emoji = current.totalSize < baseline.client.total.size ? "✅" : current.totalSize > baseline.client.total.size ? "⚠️" : "➖";
		console.log(`${emoji} ${"TOTAL".padEnd(16)} ${totalCurrSize.padStart(7)} (gz: ${totalCurrGzip.padStart(5)})  ${totalSizeDiff}`);
	} else {
		console.log(`   ${"TOTAL".padEnd(16)} ${totalCurrSize.padStart(7)} (gz: ${totalCurrGzip.padStart(5)})`);
	}

	console.log();
}

compare();
