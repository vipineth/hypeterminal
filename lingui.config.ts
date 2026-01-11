import { defineConfig } from "@lingui/cli"

export default defineConfig({
  catalogs: [
    {
      include: ["src"],
      path: "<rootDir>/src/locales/{locale}/messages",
    },
  ],
  // Top 6 most spoken languages globally
  locales: ["en", "zh", "hi", "es", "fr", "ar"],
  sourceLocale: "en",
  formatOptions: {
    lineNumbers: false,
  },
})