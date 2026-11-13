import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [lingui({ macroTransform: true })],
	test: {
		environment: "node",
		setupFiles: ["./vitest.setup.ts"],
		include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "../../scripts/hl-live/**/*.test.ts"],
	},
});
