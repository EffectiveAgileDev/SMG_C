import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const isProd = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  
  // Define aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  // Server configuration
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Build optimization
  build: {
    // Target modern browsers for better performance
    target: 'es2022',
    // Use Rollup to split code based on dynamic imports
    rollupOptions: {
      output: {
        // Configure chunking strategy for better caching and performance
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'lucide-react',
            'tailwind-merge'
          ]
        },
        // Use content hashing for asset invalidation
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minimize for production
    minify: isProd ? 'terser' : false,
    // Terser options
    terserOptions: {
      compress: {
        drop_console: isProd,
        drop_debugger: isProd
      }
    },
    // Enable source maps in development, disable in production
    sourcemap: !isProd,
    // Reduce build info output size
    reportCompressedSize: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  // Define environment variables that should be available
  // in the client code (use import.meta.env to access)
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
    'import.meta.env.APP_NAME': JSON.stringify('Promptly Social')
  }
})); 