import fs from "node:fs";
import path from "node:path";
import type { Route } from "@marko/run/vite";
import type { ResolvedConfig } from "vite";

/**
 * Logs build information to the console and a JSON file.
 * @param config - The Vite resolved configuration.
 * @param routes - The Marko Run route definitions.
 * @param builtEntries - List of built entry file paths.
 * @param sourceEntries - List of source entry file paths.
 * @param markoRunDir - The directory to write the log file to.
 */
export async function logBuildRunToFile(
  config: ResolvedConfig,
  routes: Route[],
  builtEntries: string[],
  sourceEntries: string[],
  markoRunDir: string
): Promise<void> { // Return void, errors handled via throw
  try {
    await fs.promises.mkdir(markoRunDir, { recursive: true });
    const logFilePath = path.join(markoRunDir, 'build.log.json');
    await fs.promises.writeFile(
      logFilePath,
      JSON.stringify({ config, routes, builtEntries, sourceEntries }, null, 2),
      'utf8'
    );
    console.log(`Build log written to ${logFilePath}`);
  } catch (error) {
      console.warn(`Error writing build log: ${error instanceof Error ? error.message : String(error)}`, error);
  }
} 