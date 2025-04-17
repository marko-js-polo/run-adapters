import fs from "node:fs/promises";
import path from "node:path";
import type { BuildResult, BuildContext } from "../types.js";

/**
 * Renames the 'public' directory to 'ui' within the build output directory.
 * Logs a warning if 'public' does not exist (ENOENT error).
 * @param context - The build context containing outputDir.
 * @returns A BuildResult indicating success (potentially with a warning) or failure.
 */
export async function renamePublicToUiStep(context: BuildContext): Promise<BuildResult> {
  const { outputDir } = context;
  const publicDir = path.join(outputDir, 'public');
  const uiDir = path.join(outputDir, 'ui');

  try {
    // Attempt to rename the directory directly
    await fs.rename(publicDir, uiDir);
    console.log(`Renamed directory '${publicDir}' to '${uiDir}'.`);
    return { status: 'success', emittedFiles: [], warnings: [] };

  } catch (error: unknown) {
    // Check if the error is specifically ENOENT (directory not found)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const warningMessage = `Directory '${publicDir}' not found. Skipping rename to 'ui'.`;
      console.warn(warningMessage);
      // Return success with a warning, as this isn't a critical failure
      return { status: 'success', emittedFiles: [], warnings: [warningMessage] };
    }
    // For any other errors, log and return an error result to halt the build
    const message = `Error renaming directory '${publicDir}' to '${uiDir}': ${error instanceof Error ? error.message : String(error)}`;
    console.error(message, error);
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(message),
      emittedFiles: [],
      warnings: [], // Warnings are associated with success here
    };
  }
} 