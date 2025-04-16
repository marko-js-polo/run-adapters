<h1 align="center">
  <!-- Logo -->
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/marko-js/run/raw/main/assets/marko-run-darkmode.png">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/marko-js/run/raw/main/assets/marko-run.png">
    <img alt="Marko Run Logo" src="https://github.com/marko-js/run/raw/main/assets/marko-run.png" width="400">
  </picture>
  <br/>
  @marko-polo/run-adapter-single-file
	<br/>
</h1>

Builds a [@marko/run](https://github.com/marko-js/run) app as a static site with all assets (CSS, JS, images) inlined into the HTML files.

This adapter extends the functionality of [@marko/run-adapter-static](https://github.com/marko-js/run/tree/main/packages/adapter-static), first performing a standard static build and then processing the output to create self-contained HTML files.

## Installation

~~~sh
npm install @marko-polo/run-adapter-single-file
~~~

## Usage

In your application's Vite config file (e.g., `vite.config.js`), import and register this adapter with the `@marko/run` Vite plugin:

~~~ts
import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import singleFileAdapter from "@marko-polo/run-adapter-single-file";

export default defineConfig({
  plugins: [
    marko({
      adapter: singleFileAdapter({
        // Options are passed to the underlying static adapter
        // e.g., cdn: 'https://my-cdn.com/'

        // Option specific to this adapter:
        deleteInlinedFiles: true, // Default is true
      }),
    }),
  ],
});
~~~

## Purpose and Use Cases

This adapter is specifically designed for scenarios where you need a completely self-contained HTML file, with no external file dependencies. This is often required for:

*   **Embedded Web UIs:** Applications like Figma Plugins or other tools that host web content within a native shell.
*   **Browser Extensions:** Creating extension pages or content scripts that need to be packaged without external assets.
*   **Client-Only Distribution:** Situations where deploying multiple files is difficult or undesirable, and a single HTML artifact is preferred (e.g., offline usage, specific deployment constraints).

**For general static website hosting, the standard [`@marko/run-adapter-static`](https://github.com/marko-js/run/tree/main/packages/adapter-static) is typically the better choice.** The standard static adapter allows browsers to cache assets independently, leading to faster load times on subsequent visits.

### Limitations & Considerations

Using this single-file approach comes with trade-offs:

*   **Supported Images:** Only specific image types (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`) are supported for inlining.
*   **External Assets:** Assets hosted on external domains or CDNs specified via absolute URLs (e.g., `https://some-cdn.com/image.jpg`) will **not** be inlined.
*   **No Asset Caching:** Browsers cannot cache inlined assets individually. Any change to CSS, JS, or images requires the entire HTML file to be re-downloaded.

## How it Works

After the standard static build process finishes, this adapter scans the generated HTML files in the output directory and performs the following inlining steps:

### CSS Inlining

*   Finds all `<link rel="stylesheet" href="...*.css">` tags.
*   Reads the content of the linked CSS file.
*   Replaces the `<link>` tag with an inline `<style>` tag containing the CSS content.
*   Skips external URLs (http/https).

### JavaScript Inlining

*   Finds all `<script src="...*.js">` tags.
*   Uses **esbuild** to bundle the referenced JavaScript file and all its local dependencies into an Immediately-Invoked Function Expression (IIFE).
*   Replaces the `<script src="...">` tag with an inline `<script>` tag containing the bundled IIFE code. Existing attributes on the original script tag (like `type`, `defer`, etc., but not `src`) are preserved.
*   Removes `<link rel="modulepreload">` tags, as they are unnecessary after bundling and inlining.
*   Skips external URLs (http/https).

### Image Inlining

*   Finds all `<img src="...">` tags.
*   Reads the image file content.
*   Determines the image's MIME type based on its extension.
*   Converts the image content to a Base64 data URI.
*   Replaces the `src` attribute value with the `data:` URI.
*   **Supported Image Types:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`.
*   Skips external URLs (http/https) and existing data URIs (`data:...`).

## Options

This adapter accepts all options supported by `@marko/run-adapter-static` and passes them through.

See the [Static Adapter Options](https://github.com/marko-js/run/tree/main/packages/adapter-static#options).

In addition, it supports the following option:

*   **`deleteInlinedFiles`**: `boolean` (default: `true`)
    *   If `true`, the original asset files (CSS, JS, images) and their corresponding source map files (`.map`) will be deleted after they have been successfully inlined into the HTML files.
    *   Also cleans up any empty directories that result from deleting the assets.
    *   Set to `false` to keep the original asset files alongside the modified HTML files.