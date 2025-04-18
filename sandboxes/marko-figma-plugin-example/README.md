<h1 align="center">
  <!-- Logo -->
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png">
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png"> 
    <img alt="Marko Polo Logo" src="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png" width="400">
  </picture>
  <br/>
  Marko Figma Plugin Example
  <br/>
</h1>

This sandbox demonstrates how to build a simple Figma plugin using [Marko 6](https://markojs.com/v6/docs/setup/), [Marko Run](https://github.com/marko-js/run), [Tailwind CSS](https://tailwindcss.com/), and the [`@marko-polo/run-adapter-figma`](../../packages/adapter-figma/).

The example plugin provides a UI that allows the user to specify a number and then creates that many orange rectangles in the current Figma page. It also includes an "About" page.

## Tech Stack

*   **UI Framework:** [Marko 6](https://markojs.com/v6/docs/setup/)
*   **Build & Routing:** [Marko Run](https://github.com/marko-js/run)
*   **Build Adapter:** [`@marko-polo/run-adapter-figma`](../../packages/adapter-figma/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

## Project Structure

```
.
├── src/
│   ├── code/             # Figma Plugin Code (Node.js sandbox)
│   │   ├── handlers/     # Message handlers (e.g., create shapes, navigate)
│   │   └── main.ts       # Main plugin entry point, message listener
│   ├── ui/               # Marko Run UI Code (Browser environment)
│   │   ├── routes/       # Marko Run routes (become HTML pages)
│   │   │   ├── _index/   # Main UI route
│   │   │   │   └── +page.marko
│   │   │   ├── about/    # About UI route
│   │   │   │   └── +page.marko
│   │   │   ├── +layout.marko # Root layout for UI pages
│   │   │   └── favicon.png
│   │   ├── tags/         # Shared Marko components (if any)
│   │   └── utils/        # UI utility functions (e.g., sendMessage)
│   └── manifest.json     # Figma plugin manifest (managed by adapter)
├── public/               # Static assets (e.g., images, CSS themes)
│   └── css/
│       ├── figma-dark.css
│       └── figma-light.css
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration using Marko Run & Figma adapter
└── package.json
```

## How it Works

### Build Process

1.  **Vite Configuration (`vite.config.ts`):**
    *   Integrates the `@marko/run/vite` plugin.
    *   Specifies the UI routes directory (`src/ui/routes`).
    *   Uses the `@marko-polo/run-adapter-figma` adapter.
        *   The adapter is configured with the entry point for the plugin's main code (`src/code/main.ts`).
    *   Integrates Tailwind CSS via PostCSS (`tailwindcss/postcss`).

2.  **Figma Adapter (`@marko-polo/run-adapter-figma`):**
    *   Internally uses `@marko-polo/run-adapter-single-file` to build each Marko Run route (`_index/+page.marko`, `about/+page.marko`) into a self-contained HTML file with all CSS (including Tailwind styles) and JavaScript inlined.
    *   Bundles the plugin's main code (`src/code/main.ts` and its dependencies) using esbuild.
    *   Copies the generated HTML files and the bundled code into a `.marko-run/figma-adapter/` directory (relative to the project root).
    *   Updates `src/manifest.json`:
        *   Sets the `main` field to the path of the bundled code.
        *   Sets the `ui` field, mapping route names (`index`, `about`) to their corresponding HTML file paths within the build output directory.

### Plugin Functionality

1.  **Initialization (`src/code/main.ts`):**
    *   When the plugin starts, Figma executes the bundled code specified in `manifest.json`'s `main` field.
    *   `main.ts` calls `handleRouteIndex()` which uses `figma.showUI(__uiFiles__.index, ...)` to display the main UI. The `__uiFiles__` global is injected by the adapter and contains the paths to the generated HTML files.

2.  **UI Interaction (`src/ui/routes/_index/+page.marko`):**
    *   The user interacts with the UI rendered from `_index/+page.marko`.
    *   Clicking "Create" calls `sendMessage('cmd:create-shapes', { count })`.
    *   Clicking "Cancel" calls `sendMessage('cmd:close')`.
    *   Clicking "About" calls `sendMessage('route:about')`.

3.  **Communication (`src/ui/utils/send-message.ts` & `src/code/main.ts`):**
    *   The `sendMessage` utility in the UI uses `parent.postMessage({ pluginMessage: { type, data } }, '*')` to send messages from the UI iframe (browser context) to the main plugin code (Node.js context).
    *   The `figma.ui.onmessage` listener in `src/code/main.ts` receives these messages.
    *   It looks up the appropriate handler function based on the message `type` in the `handlers` map (`src/code/handlers/index.ts`).

4.  **Handlers (`src/code/handlers/`):**
    *   `handleCreateShapes`: Creates the specified number of rectangles on the Figma canvas.
    *   `handleClose`: Closes the plugin using `figma.closePlugin()`.
    *   `handleRouteAbout`: Shows the "About" UI using `figma.showUI(__uiFiles__.about, ...)`.
    *   `handleRouteIndex`: Shows the main UI using `figma.showUI(__uiFiles__.index, ...)`.

### Routing

*   **Initial Route:** The plugin initially loads the UI defined by the `_index` route because `handleRouteIndex` is called in `main.ts`.
*   **UI Navigation:** Navigation between the main UI (`_index`) and the "About" page (`about`) is handled manually:
    1.  A click event in the UI sends a specific message (e.g., `route:about`).
    2.  The main plugin code receives the message.
    3.  The corresponding handler (`handleRouteAbout` or `handleRouteIndex`) is called.
    4.  The handler uses `figma.showUI()` with the correct path from `__uiFiles__` to load and display the HTML file corresponding to the target route.

### Styling with Tailwind CSS

*   Tailwind is configured in `tailwind.config.js`.
*   It's integrated into the Vite build process via PostCSS in `vite.config.ts`.
*   Marko components (`.marko` files) use Tailwind utility classes directly in the HTML structure (e.g., `<div class="flex flex-col ...">`).
*   The root layout (`+layout.marko`) imports Tailwind's base styles and components using `@import "tailwindcss";` within a `<style>` tag.
*   The layout also imports Figma's theme CSS variables (`figma-light.css`, `figma-dark.css`) to allow the UI to adapt to Figma's light/dark mode, both within the plugin and when previewing in a browser. These variables are then used by Tailwind utilities (e.g., `bg-[var(--figma-color-bg)]`).

## Running the Example

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Build the Plugin:**
    ```bash
    npm run build
    # or
    yarn build
    # or
    pnpm build
    ```
    This runs Vite with the Figma adapter, generating the necessary files in `.marko-run/figma-adapter/` and updating `src/manifest.json`.

3.  **Add to Figma:**
    *   Open the Figma desktop app.
    *   Go to `Plugins` -> `Development` -> `Import plugin from manifest...`
    *   Navigate to the `sandboxes/marko-figma-plugin-example/src` directory in your local project and select the `manifest.json` file.

4.  **Run in Figma:**
    *   Open a Figma file.
    *   Go to `Plugins` -> `Development` -> `marko-figma-plugin-example`.
    *   The plugin UI should appear.

5.  **Preview in Browser (Optional):**
    ```bash
    npm run preview
    # or
    yarn preview
    # or
    pnpm preview
    ```
    This starts a local Vite server using `vite.preview.config.ts` to preview the UI pages in your browser. Note that Figma API calls (`parent.postMessage`) will not work in the browser preview. The preview uses the CSS files in `public/css` to simulate Figma's theme colors.
