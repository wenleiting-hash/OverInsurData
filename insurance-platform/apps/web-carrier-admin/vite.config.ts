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
      '@channel': path.resolve(import.meta.dirname, '../web-channel-admin/src'),
    },
  },
  server: {
    host: 'localhost',
    port: 3001, // 前端开发服务器端口
    strictPort: true, // 严格模式：如果端口被占用直接报错，不尝试下一个端口
    cors: true,
    warmup: {
      clientFiles: ['./src/**/*.tsx'],
    },
    // open: true, // 注释掉自动打开浏览器，避免多次启动
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Carrier Service API 端口
        changeOrigin: true,
      },
      // 上传文件的静态服务（产品合规文件 / 培训材料），与后端 useStaticAssets 前缀一致
      '/uploads': {
        target: 'http://localhost:8080',
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
        // Code splitting for better caching (Vite 8 requires function form)
        manualChunks(id) {
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-core';
          if (id.includes('react-router') || id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-core';
          if (id.includes('zustand')) return 'state-management';
          if (id.includes('recharts')) return 'charts';
        },
      },
    },
    // Performance metrics
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
});
