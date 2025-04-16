import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import staticAdapter from "@marko/run-adapter-static";

export default defineConfig({
  build: {
    outDir: "dist-single-file",
  },
  plugins: [
    marko({
      adapter: staticAdapter(),
    })
  ],
}); 