import fs from "node:fs";
import path from "node:path";
import createSingleFileAdapter, {
  type BuildResult as SingleFileBuildResult,
  type SingleFileAdapter,
} from "@marko-polo/run-adapter-single-file";
import type {
  Adapter,
  Route,
} from "@marko/run/vite";
import type { ResolvedConfig } from "vite";
import type { FigmaAdapterOptions, BuildContext } from "./types.js";
import {
  bundleCodeStep,
  renamePublicToUiStep,
  runSingleFileAdapter,
  updateManifestStep,
} from "./steps/index.js";
import { logBuildRunToFile } from "./utils/index.js";

// Re-export BuildResult for consumers of this adapter
/**
 * Represents the outcome of the Figma adapter build process.
 * Re-exported from `@marko-polo/run-adapter-single-file`.
 */
export type { SingleFileBuildResult as BuildResult };

/**
 * Extends the base Marko Run Adapter type with Figma-specific methods.
 */
export interface FigmaAdapter extends Adapter {
  /**
   * Retrieves the result of the most recent Figma adapter build run.
   *
   * @returns The {@link BuildResult} object containing status, emitted files, errors,
   *          and warnings, or null if no build has been run yet.
   */
  getLastBuildResult(): SingleFileBuildResult | null;
}

/**
 * Creates a Marko Run adapter specifically designed for building Figma plugins.
 *
 * This adapter orchestrates the build process by first utilizing the
 * `@marko-polo/run-adapter-single-file` adapter to generate a static build
 * with all UI assets inlined into HTML files. It then performs Figma-specific
 * tasks:
 *  - Bundles the main plugin logic (e.g., `code.ts`).
 *  - Renames the output directory containing the UI from `public` (default
 *    from static adapter) to `ui`.
 *  - Generates a `manifest.json` file required by Figma, merging options
 *    provided to the adapter with necessary defaults and paths derived
 *    from the build process.
 *
 * @param options - Configuration options tailored for the Figma adapter.
 *                  Requires `code.entryPoint` to specify the main plugin code file.
 *                  Other options control aspects like the source manifest location
 *                  and passthrough options for the underlying single-file adapter.
 * @returns A Marko Run adapter instance configured for Figma plugin development.
 * @throws {Error} If the essential `code.entryPoint` option is missing.
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from "vite";
 * import marko from "@marko/run/vite";
 * import figmaAdapter from "@svallory/adapter-figma"; // Assuming package name
 *
 * export default defineConfig({
 *   plugins: [
 *     marko({
 *       adapter: figmaAdapter({
 *         code: { entryPoint: "./src/plugin/code.ts" }, // Required: Path to your Figma plugin's main code
 *         manifest: "./src/plugin/manifest.json", // Optional: Path to your source manifest
 *         // Options passed to the underlying single-file adapter:
 *         deleteInlinedFiles: true,
 *       }),
 *     }),
 *   ],
 * });
 * ```
 */
export default function figmaAdapter(options: FigmaAdapterOptions): FigmaAdapter {
  if (!options?.code?.entryPoint) {
    // Early exit with error if core option is missing
    throw new Error(
      "figmaAdapter requires the `code.entryPoint` option specifying the main plugin code file."
    );
  }

  // Separate Figma-specific options from those intended for the single-file adapter.
  const { code, manifest: manifestOption, ...singleFileOptions } = options;

  // Initialize the underlying single-file adapter.
  const singleFileAdapter = createSingleFileAdapter(singleFileOptions) as SingleFileAdapter;

  // --- State for the last build result of this Figma adapter ---
  let lastResult: SingleFileBuildResult | null = null;

  const adapter: FigmaAdapter = {
    ...singleFileAdapter, // Inherit hooks from the single-file adapter

    name: "figma-adapter", // Override adapter name

    /**
     * Executes the primary build logic for the Figma plugin adapter.
     *
     * This hook orchestrates the following steps sequentially:
     * 1. Log basic build information.
     * 2. Run the underlying single-file adapter build.
     * 3. If successful, rename the 'public' UI output directory to 'ui'.
     * 4. Bundle the main Figma plugin code (e.g., code.ts).
     * 5. Generate and write the final Figma manifest.json.
     *
     * The result of the entire process (including status, emitted files, warnings, errors)
     * is stored and can be retrieved using `getLastBuildResult()`.
     */
    async buildEnd(
      config: ResolvedConfig,
      routes: Route[],
      builtEntries: string[],
      sourceEntries: string[],
    ): Promise<void> {
      const markoRunDir = path.join(process.cwd(), '.marko-run');

      // --- STEP 1: Log build info ---
      logBuildRunToFile(config, routes, builtEntries, sourceEntries, markoRunDir);

      // Use const as it's reassigned carefully based on step results
      const aggregatedResult: SingleFileBuildResult = {
        status: "success",
        emittedFiles: [],
        warnings: [],
      };

      // --- STEP 2: Run the single-file adapter build step ---
      console.log("Starting single-file adapter build step...");
      const singleFileBuildResult = await runSingleFileAdapter(
        singleFileAdapter,
        config,
        routes,
        builtEntries,
        sourceEntries
      );

      // Aggregate results from single-file build
      aggregatedResult.warnings?.push(...(singleFileBuildResult.warnings || []));
      aggregatedResult.emittedFiles?.push(...(singleFileBuildResult.emittedFiles || []));

      if (singleFileBuildResult.status !== "success") {
        aggregatedResult.status = "error";
        aggregatedResult.error = singleFileBuildResult.error || new Error("Single-file build step failed with an unknown error.");
        console.error('Figma adapter build failed during single-file step.');
        lastResult = aggregatedResult;
        return; // Exit early
      }

      // --- STEP 2.5: Calculate Paths and Prepare Context ---
      // Calculate output directory (remove potential /public suffix)
      const outputDir = path.resolve(process.cwd(), config.build.outDir.replace(/\/public$/, '') || 'dist');
      const sourceManifestPath = manifestOption
        ? path.resolve(process.cwd(), manifestOption)
        : path.resolve(process.cwd(), "src", "manifest.json"); // Default source
      const outputManifestPath = path.resolve(outputDir, "manifest.json"); // Output manifest path
      const figmaCodeEntryPoint = path.resolve(process.cwd(), code.entryPoint); // Absolute code entry

      // Ensure output directory exists
      await fs.promises.mkdir(outputDir, { recursive: true });

      // Create a minimal context for steps that still need it
      const context: BuildContext = {
        outputDir,
        sourceManifestPath,
        outputManifestPath,
        figmaCodeEntryPoint,
        // Note: Other fields like config, routes etc. are not needed by the current steps
      };

      let stepResult: SingleFileBuildResult | null = null;
      let bundledCodeRelativePath: string | undefined = undefined;

      // --- STEP 3: Rename public -> ui ---
      try {
        stepResult = await renamePublicToUiStep(context);
        if (stepResult) {
          aggregatedResult.warnings?.push(...(stepResult.warnings || []));
          if (stepResult.status === 'error') throw stepResult.error || new Error("Rename step failed without specific error");
        } else {
          throw new Error("Rename step returned null result.");
        }
      } catch (error: unknown) {
          aggregatedResult.status = 'error';
          aggregatedResult.error = error instanceof Error ? error : new Error(String(error));
          console.error(`Figma adapter build failed during step: ${renamePublicToUiStep.name}.`);
          lastResult = aggregatedResult;
          return; // Exit early
      }

      // --- STEP 4: Bundle code.ts -> code.js ---
      try {
        stepResult = await bundleCodeStep(context);
        if (stepResult) {
          aggregatedResult.emittedFiles?.push(...(stepResult.emittedFiles || []));
          aggregatedResult.warnings?.push(...(stepResult.warnings || []));
          if (stepResult.status === 'error') throw stepResult.error || new Error("Bundle step failed without specific error");
        } else {
          throw new Error("Bundle step returned null result.");
        }

        // Retrieve the path added to context by the step
        bundledCodeRelativePath = context.stepOutput_bundledCodeRelativePath;
      } catch (error: unknown) {
          aggregatedResult.status = 'error';
          aggregatedResult.error = error instanceof Error ? error : new Error(String(error));
          console.error(`Figma adapter build failed during step: ${bundleCodeStep.name}.`);
          lastResult = aggregatedResult;
          return; // Exit early
      }

      // --- STEP 5: Generate and Write Manifest ---
      try {
        stepResult = await updateManifestStep(
          outputDir,
          sourceManifestPath,
          outputManifestPath,
          bundledCodeRelativePath // Pass the path obtained from bundleCodeStep context mutation
        );
        if (stepResult) {
          aggregatedResult.emittedFiles?.push(...(stepResult.emittedFiles || []));
          aggregatedResult.warnings?.push(...(stepResult.warnings || []));
          if (stepResult.status === 'error') throw stepResult.error || new Error("Update manifest step failed without specific error");
        } else {
          throw new Error("Update manifest step returned null result.");
        }
      } catch (error: unknown) {
          aggregatedResult.status = 'error';
          aggregatedResult.error = error instanceof Error ? error : new Error(String(error));
          console.error(`Figma adapter build failed during step: ${updateManifestStep.name}.`);
          lastResult = aggregatedResult;
          return; // Exit early
      }

      // --- Build Completion ---
      if (aggregatedResult.status === 'success') {
          console.log(`Figma plugin build completed successfully in ${outputDir}`);
      }

      // Always store the final aggregated result
      lastResult = aggregatedResult;
    },

    /**
     * Retrieves the result of the most recent Figma adapter build run.
     *
     * @returns The {@link BuildResult} object containing status, emitted files, errors,
     *          and warnings, or null if no build has been run yet.
     */
    getLastBuildResult(): SingleFileBuildResult | null {
      return lastResult;
    },
  };

  // Cast the adapter object to the extended FigmaAdapter type.
  return adapter;
}
