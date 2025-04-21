import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
   define: {
      'process.env': {},
   },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/chatWidget.ts'),
      name: 'ChatWidget',
      formats: ['iife'],
      fileName: () => `chatWidget.js`,
    },
    rollupOptions: {
      output: {
        entryFileNames: 'chatWidget.js',
        assetFileNames: 'chatWidget.css',
        exports: 'named',
      },
    },
    outDir: 'dist/widget',
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
   cors: true,
},
});
