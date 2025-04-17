import type { SingleFileAdapter, BuildResult as SingleFileBuildResult } from "@marko-polo/run-adapter-single-file";
import type { ResolvedConfig } from "vite";
import type { Route } from "@marko/run/vite";

/**
 * Executes the `buildEnd` hook of the underlying single-file adapter as part of the
 * Figma adapter build process.
 *
 * This step runs the underlying static build and asset inlining process.
 * It retrieves the build result (including emitted files and warnings)
 * or captures any errors that occur during the single-file build.
 *
 * @param singleFileAdapter - The instance of the single-file adapter.
 * @param config - The resolved Vite configuration.
 * @param routes - The Marko Run routes.
 * @param builtEntries - The built server entries.
 * @param sourceEntries - The source server entries.
 * @returns A promise resolving to the BuildResult from the single-file adapter execution,
 *          or a synthesized BuildResult with status 'error' if the step itself fails.
 */
export async function runSingleFileAdapter(
  singleFileAdapter: SingleFileAdapter,
  config: ResolvedConfig,
  routes: Route[],
  builtEntries: string[],
  sourceEntries: string[],
): Promise<SingleFileBuildResult> {
  if (!singleFileAdapter.buildEnd || !singleFileAdapter.getLastBuildResult) {
    const message = "Single-file adapter is missing required methods (buildEnd or getLastBuildResult).";
    console.warn(message);
    // Return a BuildResult indicating error
    return {
      status: "error",
      error: new Error(message),
      emittedFiles: [],
      warnings: [], // Return empty warnings on setup error
    };
  }

  try {
    // Run the single-file adapter build
    await singleFileAdapter.buildEnd(config, routes, builtEntries, sourceEntries);

    // Get the result from the single-file adapter
    const buildResult = singleFileAdapter.getLastBuildResult();

    if (!buildResult) {
       const message = "Single-file adapter's getLastBuildResult returned null.";
       console.warn(message);
       // Treat null result as an error for this step, as we can't proceed
       return {
         status: "error",
         error: new Error(message),
         emittedFiles: [],
         warnings: [message], // Include the warning about null result here too
       };
    }

    // Return the actual build result directly (could be success or error)
    if (buildResult.status !== "success") {
      console.error(
        "Single-file adapter build failed:",
        buildResult.error?.message || "Unknown error"
      );
    } else {
        // Log warnings from the single-file build only on success
        // (Errors were logged above, warnings might be irrelevant on failure)
        if (buildResult.warnings && buildResult.warnings.length > 0) {
            console.warn("Single-file adapter reported warnings:");
            for (const w of buildResult.warnings) {
            console.warn(`- ${w}`);
            }
        }
        console.log('Single-file adapter build completed successfully.');
    }
    return buildResult; // Return the result obtained from the adapter

  } catch (error: unknown) {
    const message = `Error during single-file adapter execution: ${error instanceof Error ? error.message : String(error)}`;
    console.error(message, error);
    // Return a BuildResult indicating error
    return {
      status: "error",
      error: error instanceof Error ? error : new Error(message),
      emittedFiles: [],
      warnings: [], // Return empty warnings on execution error
    };
  }
} 