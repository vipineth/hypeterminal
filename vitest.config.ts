import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		lingui(),
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		viteReact({
			babel: {
				plugins: ["@lingui/babel-plugin-lingui-macro", "babel-plugin-react-compiler"],
			},
		}),
	],
	test: {
		environment: "node",
		setupFiles: ["./src/lib/tests/setup.ts"],
	},
});
