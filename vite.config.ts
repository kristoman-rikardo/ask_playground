import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Definer flere inngangspunkter for byggeprosessen
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        injectionScript: path.resolve(__dirname, 'src/injectionScript.ts'),
        chatWidget: path.resolve(__dirname, 'src/chatWidget.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'injectionScript') {
            return 'assets/injectionScript.js';
          }
          if (chunkInfo.name === 'chatWidget') {
            return 'assets/chatWidget.js';
          }
          if (chunkInfo.name === 'main') {
            return 'assets/main.js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'chatWidget.css') {
            return 'assets/chatWidget.css';
          }
          if (assetInfo.name === 'main.css') {
            return 'assets/main.css';
          }
          return 'assets/[name][extname]';
        }
      },
    },
    // Minifiser ikke i utviklingsmodus
    minify: mode !== 'development',
  },
}));
