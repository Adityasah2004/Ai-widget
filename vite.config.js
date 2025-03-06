import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Adjust the entry file based on your project structure
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx', // Change to your main file if different
      name: 'MyWidget', // This is the global variable name for your widget
      fileName: 'my-widget', // The output file will be `my-widget.umd.js`
      formats: ['umd'] // UMD is broadly compatible with script tags
    },
    rollupOptions: {
      // Mark external dependencies if needed to reduce bundle size,
      // e.g. if you expect the host page to provide React
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
