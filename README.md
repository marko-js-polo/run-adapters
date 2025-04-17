<h1 align="center">
  Marko Run Adapters
  <br><br>
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png">
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png"> 
    <img alt="Marko Polo Logo" src="https://raw.githubusercontent.com/marko-js-polo/run-adapters/66e854fb14b3b19e072e1eb1f62da40fb4db0dc8/assets/marko-polo.png" width="200">
  </picture>
</h1>

This repository hosts a collection of community-maintained adapters for the [Marko Run](https://github.com/marko-js/run) framework, designed to extend its capabilities for various build targets and environments.

This project is part of the **[Marko Polo](https://github.com/marko-js-polo)** initiative, a community effort to enhance the Marko ecosystem with useful tools, libraries, and integrations.


## Available Adapters

### `@marko-polo/run-adapter-single-file`

Build Figma plugins and browser extensions using [Marko Run](/marko-js/run) and [Marko 5/6](https://markojs.org). This adapter inlines all your assets, JS, and CSS into a single HTML file per route. **[Read More >>](./packages/adapter-single-file/README.md)**

**Installation:**

```sh
npm install @marko-polo/run-adapter-single-file --save-dev
```

**Usage (vite.config.js):**

```ts
import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import singleFileAdapter from "@marko-polo/run-adapter-single-file";

export default defineConfig({
  plugins: [
    marko({
      adapter: singleFileAdapter({
        // deleteInlinedFiles: true // Default
      }),
    }),
  ],
});
```

### `@marko-polo/run-adapter-figma`

Builds a [Marko Run](https://github.com/marko-js/run) application specifically for use as a Figma plugin UI. It handles inlining assets, bundling plugin code, and updating the `manifest.json`. **[Read More >>](./packages/adapter-figma/README.md)**

**Installation:**

```sh
npm install @marko-polo/run-adapter-figma @marko-polo/run-adapter-single-file --save-dev
```

**Usage (vite.config.js):**

```ts
import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import figmaAdapter from "@marko-polo/run-adapter-figma";

export default defineConfig({
  plugins: [
    marko({
      adapter: figmaAdapter({
        code: {
          entryPoint: 'src/plugin/main.ts' // Your Figma plugin code entry point
        },
        // manifest: 'manifest.json' // Optional: path to manifest
      }),
    }),
  ],
});
```

## Contributing

Contributions are welcome! For ideas, bug reports, or improvements related to the adapters in this repository, please feel free to [open an issue](https://github.com/marko-js-polo/run-adapters/issues) or submit a pull request.

If you have a broader idea for the Marko Polo initiative, or want to suggest a Marko-related project to be hosted or forked into the organization, please [start a discussion](https://github.com/orgs/marko-js-polo/discussions) in the main org. 

## Code of Conduct

Please adhere to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

This project is licensed under the [MIT License](./LICENSE). 