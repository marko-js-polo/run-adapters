// vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    includeSource: ['**/*.ts'],
  },
  define: {
    'import.meta.vitest': 'undefined',
    'import.meta.root': `"${__dirname}"`
  },
  root: "src",
  build: {
    
    // Entry file for your project
    // rollupOptions: {
    //   input: path,
    // },
    lib: {
      entry: "steps/inlineAssets.ts",
      // name: `index-bundle-code${fileName}`,
      // fileName: () => `${getLastSubstringUntilSlash(fileName)}`,
      formats: ["es"],
    },
    // Specify output directory (optional)
    outDir: "dist",
  },
})