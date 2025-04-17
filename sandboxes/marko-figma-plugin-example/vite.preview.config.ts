import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import adapter from "@marko-polo/run-adapter-single-file";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "./dist-preview",
  },
  plugins: [
    marko({
      routesDir: "./src/ui/routes",
      adapter: adapter(),
    }),
    tailwindcss(),
  ],
}); 