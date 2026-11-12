import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import babel from '@rolldown/plugin-babel'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { lingui } from '@lingui/vite-plugin'
import { securityHeaders } from './src/config/security-headers.ts'

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
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ['@lifi/sdk', '@tanstack/react-table', '@tanstack/react-virtual'],
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
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
    lingui({ macroTransform: true }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ].filter(Boolean),
})

export default config
