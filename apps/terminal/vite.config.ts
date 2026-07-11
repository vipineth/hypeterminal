import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { lingui } from '@lingui/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'
import { securityHeaders } from './src/config/security-headers'

const isAnalyze = process.env.ANALYZE === 'true'

function createManualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
    if (id.includes('@base-ui')) return 'vendor-base-ui'
    if (id.includes('@phosphor-icons/react')) return 'vendor-icons'
    if (id.includes('@radix-ui')) return 'vendor-radix'
    if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router-core') || id.includes('@tanstack/history')) return 'vendor-router'
    if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-table') || id.includes('@tanstack/react-virtual')) return 'vendor-tanstack'
    if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
    if (id.includes('viem') || id.includes('wagmi') || id.includes('@wagmi')) return 'vendor-web3'
    if (id.includes('klinecharts')) return 'vendor-klinecharts'
  }
}

const config = defineConfig({
  server: {
    strictPort: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query', 'wagmi'],
  },
  optimizeDeps: {
    include: ['@lifi/sdk', '@tanstack/react-table', '@tanstack/react-virtual'],
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
        '/**': {
          headers: securityHeaders,
        },
        '/assets/**': {
          headers: { ...securityHeaders, 'cache-control': 'public, max-age=31536000, immutable' },
        },
        '/charting_library/**': {
          headers: { ...securityHeaders, 'cache-control': 'public, max-age=31536000, immutable' },
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
