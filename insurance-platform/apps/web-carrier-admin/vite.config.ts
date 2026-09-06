import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@views': path.resolve(import.meta.dirname, './src/views'),
      '@services': path.resolve(import.meta.dirname, './src/services'),
      '@stores': path.resolve(import.meta.dirname, './src/stores'),
      '@i18n': path.resolve(import.meta.dirname, './src/i18n'),
    },
  },
  server: {
    host: 'localhost',
    port: 3001, // 强制固定使用 3001 端口，禁止自动切换
    strictPort: true, // 严格模式：如果端口被占用直接报错，不尝试下一个端口
    cors: true,
    warmup: {
      clientFiles: ['./src/**/*.tsx'],
    },
    // open: true, // 注释掉自动打开浏览器，避免多次启动
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // ✅ Carrier Service API 端口
        changeOrigin: true,
      },
    },
  },
  // Production optimizations
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production
    minify: 'esbuild', // Use esbuild for faster builds
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          // Separate i18n resources
          'i18n-core': ['i18next', 'react-i18next'],
          // Separate React and routing
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          // Separate state management
          'state-management': ['zustand'],
          // Separate charting libraries
          'charts': ['recharts'],
        },
      },
    },
    // Performance metrics
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
});
