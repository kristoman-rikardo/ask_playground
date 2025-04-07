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
        // Konfigurer output filnavn
        entryFileNames: (chunkInfo) => {
          // Beholde distinkte filnavn for hver inngangs-fil
          if (chunkInfo.name === 'injectionScript') {
            return 'assets/injectionScript.js';
          }
          if (chunkInfo.name === 'chatWidget') {
            return 'assets/chatWidget.js';
          }
          return 'assets/[name]-[hash].js';
        },
        // Konfigurer chunk filnavn
        chunkFileNames: 'assets/[name]-[hash].js',
        // Konfigurer asset filnavn
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Minifiser ikke i utviklingsmodus
    minify: mode !== 'development',
  },
}));
