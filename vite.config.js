import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': '{}',
    'global': 'window',
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'MyWidget',
      fileName: (format) => `my-widget.${format}.js`,
      formats: ['umd']
    },
    rollupOptions: {
      // Only mark React and ReactDOM as external
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        inlineDynamicImports: true
      }
    }
  }
})