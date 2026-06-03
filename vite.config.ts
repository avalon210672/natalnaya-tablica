import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const host = process.env.TAURI_DEV_HOST
const isTauriBuild = !!process.env.TAURI_ENV_PLATFORM
const isStandalone = process.env.STANDALONE === '1'
const useWebStubs = !isTauriBuild || isStandalone

/** Tauri WebView на macOS новее safari13; плагины fs используют destructuring. */
function tauriBuildTarget(): string {
  if (process.env.TAURI_PLATFORM === 'windows') return 'chrome105'
  return 'safari16'
}

export default defineConfig({
  base: isStandalone ? './' : '/',
  plugins: [react(), tailwindcss(), ...(isStandalone ? [viteSingleFile()] : [])],
  clearScreen: false,
  resolve: {
    alias: useWebStubs
      ? {
          '@tauri-apps/plugin-dialog': path.resolve(
            __dirname,
            'src/lib/platform/stubs/dialog.ts',
          ),
          '@tauri-apps/plugin-fs': path.resolve(__dirname, 'src/lib/platform/stubs/fs.ts'),
        }
      : {},
  },
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: isTauriBuild ? tauriBuildTarget() : 'esnext',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
