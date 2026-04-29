import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ mode }) => {
  const plugins = [react(), tailwindcss()]

  // Vitest runs with `mode: 'test'`. Cloudflare plugin is only needed for deploy/preview.
  if (mode !== 'test') {
    plugins.push(cloudflare())
  }

  return {
    plugins,
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      // jsdom 28 + html-encoding-sniffer@6 pulls ESM-only @exodus/bytes and breaks Vitest workers on Node <20.19
      environment: 'happy-dom',
      maxWorkers: 4,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        exclude: ['node_modules', 'src/test'],
      },
    },
  }
})
