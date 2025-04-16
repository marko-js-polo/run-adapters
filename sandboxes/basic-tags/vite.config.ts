import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import singleFileAdapter from "@marko-polo/run-adapter-single-file";
import type { Adapter } from "@marko/run/vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  plugins: [
    marko({
      adapter: singleFileAdapter(),
    })
  ],
}); 