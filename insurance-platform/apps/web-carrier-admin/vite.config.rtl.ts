/**
 * RTL (Right-to-Left) Support Configuration
 * 
 * This configuration enables future support for RTL languages:
 * - Arabic (ar-SA, ar-EG)
 * - Hebrew (he-IL)
 * - Persian/Farsi (fa-IR)
 */

import { defineConfig } from 'vite';

export default defineConfig({
  // RTL-aware CSS configuration
  css: {
    postcss: {
      plugins: [
        require('postcss-import'),
        require('tailwindcss'),
        require('autoprefixer'),
        // Add postcss-rtl plugin for RTL transformations
        ...(process.env.ENABLE_RTL === 'true' ? [require('postcss-rtl')()] : []),
      ],
    },
  },

  // Environment variables for RTL builds
  build: {
    rollupOptions: {
      output: {
        // Generate separate RTL bundles
        manualChunks: (id: string) => {
          if (/node_modules\/(react|react-i18next)/.test(id)) {
            return 'rtl-support';
          }
        },
      },
    },
  },

  // Optimize bundling for RTL performance
  optimizeDeps: {
    include: ['i18next', 'react-i18next', '@babel/runtime'],
  },
});
