import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { lingui } from '@lingui/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

const isAnalyze = process.env.ANALYZE === 'true'

function createManualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (id.includes('@nktkas/hyperliquid')) return 'vendor-hyperliquid'
    if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-table') || id.includes('@tanstack/react-virtual')) return 'vendor-tanstack'
    if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
    if (id.includes('viem') || id.includes('wagmi') || id.includes('@wagmi')) return 'vendor-web3'
    if (id.includes('klinecharts')) return 'vendor-klinecharts'
    if (id.includes('@lifi/sdk') || id.includes('@lifi/types')) return 'vendor-lifi'
    if (id.includes('@lingui/core') || id.includes('@lingui/react')) return 'vendor-lingui'
  }
}

const config = defineConfig({
  server: {
    strictPort: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
  optimizeDeps: {
    include: ['@lifi/sdk', '@lifi/types'],
  },
  build: {
    sourcemap: isAnalyze,
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          output: {
            manualChunks: createManualChunks,
          },
        },
      },
    },
  },
  plugins: [
    nitro({
      compressPublicAssets: true,
      routeRules: {
        '/assets/**': {
          headers: { 'cache-control': 'public, max-age=31536000, immutable' },
        },
        '/charting_library/**': {
          headers: { 'cache-control': 'public, max-age=31536000, immutable' },
        },
      },
    }),
    lingui(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['@lingui/babel-plugin-lingui-macro', 'babel-plugin-react-compiler'],
      },
    }),
    isAnalyze &&
      (visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }) as PluginOption),
  ].filter(Boolean),
})

export default config
