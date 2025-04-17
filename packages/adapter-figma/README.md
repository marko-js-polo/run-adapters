<h1 align="center">
  <!-- Logo -->
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/marko-js/run/raw/main/assets/marko-run-darkmode.png">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/marko-js/run/raw/main/assets/marko-run.png">
    <img alt="Marko Run Logo" src="https://github.com/marko-js/run/raw/main/assets/marko-run.png" width="400">
  </picture>
  <br/>
  @marko-polo/run-adapter-figma
 <br/>
</h1>

<h3 align="center">Build Figma plugins using <a href="https://github.com/marko-js/run" target="_blank">Marko Run</a> and <a href="https://markojs.com/v6/docs/setup/" target="_blank">Marko 6</a></h3>

This adapter configures your [Marko Run](https://github.com/marko-js/run) project to build UI pages suitable for use within a Figma plugin. It simplifies the development workflow by:

1.  Using the [`@marko-polo/run-adapter-single-file`](../adapter-single-file) to inline all CSS, JavaScript, and image assets into self-contained HTML files.
2.  Bundling your main Figma plugin code (Node.js) using esbuild.
3.  Organizing the build output into a `.marko-run/figma-adapter/` directory.
4.  Automatically updating your `manifest.json` with the correct paths for the UI files and the main plugin code.

## Installation

~~~sh
npm install @marko-polo/run-adapter-figma @marko-polo/run-adapter-single-file --save-dev
# or
yarn add @marko-polo/run-adapter-figma @marko-polo/run-adapter-single-file -D
# or
pnpm add @marko-polo/run-adapter-figma @marko-polo/run-adapter-single-file -D
~~~

## Usage

In your `vite.config.js` or `vite.config.ts`, import and register the adapter with the `@marko/run` Vite plugin:

~~~ts
import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import figmaAdapter from "@marko-polo/run-adapter-figma";

export default defineConfig({
  plugins: [
    marko({
      adapter: figmaAdapter({
        // --- Required ---
        // Entry point for your main Figma plugin logic (Node.js environment)
        code: {
          entryPoint: 'src/plugin/main.ts' // Path relative to project root
        },

        // --- Optional ---
        // Path to your manifest.json relative to the project root
        manifest: 'manifest.json', // Default

        // --- Optional: Options passed to the underlying single-file adapter ---
        // See @marko-polo/run-adapter-single-file README for details
        // e.g., deleteInlinedFiles: false, // Keep original assets in dist/
        // e.g., cdn: 'https://my-cdn.com/' // For assets not to be inlined
      })
    })
  ]
});
~~~

## How it Works

The adapter streamlines the build process for Figma plugins:

1.  **Static Build & Inlining:** Leverages `@marko-polo/run-adapter-single-file` to generate static HTML files for each route and inline all local CSS, JavaScript (bundled via esbuild), and supported image assets (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`). External assets (via CDN or absolute URLs) are not inlined.
2.  **Code Bundling:** Takes the `code.entryPoint` file and bundles it (along with its dependencies) using esbuild, targeting Node.js, into a single file within the output directory.
3.  **File Organization:** Moves the inlined HTML files and the bundled code file into `.marko-run/figma-adapter/`.
4.  **Manifest Update:** Reads the specified `manifest.json` file, updates the `ui` field to point to the generated HTML files (using route names as keys), and updates the `main` field to point to the bundled code file.
5.  **Cleanup:** Removes the intermediate Vite build output directory (`dist/`) unless `deleteInlinedFiles` is set to `false` in the options passed to the underlying single-file adapter.

## Adapter Options

The `figmaAdapter` function accepts an options object:

*   **`code.entryPoint`**: `string` (**Required**)
    *   The path (relative to the project root) to the entry point file (JS/TS) for your main Figma plugin logic.
*   **`manifest?`**: `string` (Optional, Default: `'manifest.json'`)
    *   The path (relative to the project root) to your Figma plugin's `manifest.json`.
*   **Other Options**: Inherits all options from [`@marko-polo/run-adapter-single-file`](../adapter-single-file#options) (which itself inherits from `@marko/run-adapter-static`). Common options include:
    *   `deleteInlinedFiles`: `boolean` (default: `true`) - Control cleanup of original assets.
    *   `cdn`: `string` - URL prefix for assets to *exclude* from inlining.

## Contributing

This package follows the contribution guidelines and tooling setup of the Marko Run ecosystem. Refer to the main [Marko Run repository](https://github.com/marko-js/run) for more details on contributing.

### Tooling & Commands

This project uses standard tooling like ESLint, Prettier, TypeScript, and Vitest, often configured via [moonrepo presets](https://github.com/moonrepo/dev). Common commands (runnable via `npm run <command>` or `yarn <command>`) include:

*   `build`: Build the package for development.
*   `clean`: Remove build artifacts.
*   `pack`: Build the package for production/distribution.
*   `lint`: Check code style.
*   `format`: Format code.
*   `test`: Run unit tests.
*   `type`: Run TypeScript type checking.
*   `check`: Run lint, type check, and tests.
