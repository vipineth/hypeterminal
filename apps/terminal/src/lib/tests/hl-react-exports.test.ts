import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type PackageJsonExportTarget =
	| string
	| null
	| PackageJsonExportTarget[]
	| { [condition: string]: PackageJsonExportTarget };

interface PackageJson {
	exports: Record<string, PackageJsonExportTarget>;
}

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = findWorkspaceRoot(TEST_DIR);
const PACKAGE_DIR = resolve(WORKSPACE_ROOT, "packages/hl-react");
const packageJson = JSON.parse(readFileSync(resolve(PACKAGE_DIR, "package.json"), "utf8")) as PackageJson;

function findWorkspaceRoot(startDir: string): string {
	let current = startDir;

	while (true) {
		if (existsSync(resolve(current, "pnpm-workspace.yaml"))) return current;

		const parent = dirname(current);
		if (parent === current) throw new Error("Could not locate pnpm-workspace.yaml");
		current = parent;
	}
}

function getExportTargetPaths(target: PackageJsonExportTarget): string[] {
	if (typeof target === "string") return [target];
	if (target === null) return [];
	if (Array.isArray(target)) return target.flatMap(getExportTargetPaths);

	return Object.values(target).flatMap(getExportTargetPaths);
}

describe("@hypeterminal/hl-react package exports", () => {
	it("points every subpath export at an existing source file", () => {
		for (const [subpath, target] of Object.entries(packageJson.exports)) {
			for (const targetPath of getExportTargetPaths(target)) {
				if (targetPath.includes("*")) continue;
				expect(existsSync(resolve(PACKAGE_DIR, targetPath)), `${subpath} -> ${targetPath}`).toBe(true);
			}
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
