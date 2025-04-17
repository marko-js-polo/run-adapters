import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import figmaAdapter from "@marko-polo/run-adapter-figma";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
      ]
    }
  },
  plugins: [
    marko({
      routesDir: "./src/ui/routes",
      adapter: figmaAdapter({
        code: {
          entryPoint: "./src/code/main.ts",
        },
      }),
    }),
  ],
}); 