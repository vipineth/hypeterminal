import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface PackageJson {
	exports: Record<string, string>;
}

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = resolve(TEST_DIR, "../../../../../packages/hl-react");
const packageJson = JSON.parse(readFileSync(resolve(PACKAGE_DIR, "package.json"), "utf8")) as PackageJson;

describe("@hypeterminal/hl-react package exports", () => {
	it("points every subpath export at an existing source file", () => {
		for (const [subpath, target] of Object.entries(packageJson.exports)) {
			if (target.includes("*")) continue;
			expect(existsSync(resolve(PACKAGE_DIR, target)), `${subpath} -> ${target}`).toBe(true);
		}
	});

	it("exposes direct hook subpaths", () => {
		expect(packageJson.exports).toMatchObject({
			"./hooks/useApiStatus": "./src/hooks/useApiStatus.ts",
			"./hooks/useClients": "./src/hooks/useClients.ts",
			"./hooks/useExchange": "./src/hooks/useExchange.ts",
			"./hooks/useTradingGuard": "./src/hooks/useTradingGuard.ts",
			"./hooks/useTransport": "./src/hooks/useTransport.ts",
		});
	});
});
