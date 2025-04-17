import fs from "node:fs";
import path from "node:path";
import type { Manifest, BuildResult } from "../types.js";
import { findHtmlFiles } from "../utils/find-html-files.js";

/**
 * Generates the final Figma manifest object based on source manifest and build outputs.
 * This is a pure function (except for reading the source manifest).
 *
 * @param sourceManifestPath - Absolute path to the source manifest.json.
 * @param outputDir - Absolute path to the build output directory.
 * @param htmlFiles - Array of absolute paths to the generated HTML files in the 'ui' directory.
 * @param bundledCodeRelativePath - Relative path to the bundled main code (or undefined).
 * @returns The final manifest object and any warnings encountered.
 */
async function _generateManifest(
  sourceManifestPath: string,
  outputDir: string,
  htmlFiles: string[],
  bundledCodeRelativePath: string | undefined
): Promise<{ manifest: Manifest, warnings: string[] }> {
  let finalManifest: Manifest = {
    name: "My Figma Plugin",
    id: "default-id",
    api: "1.0.0",
    main: undefined,
    ui: {},
  };
  const warnings: string[] = [];

  // Read source manifest if it exists
  if (await fs.promises.stat(sourceManifestPath).catch(() => null)) {
    try {
      const manifestContent = await fs.promises.readFile(sourceManifestPath, "utf-8");
      const sourceManifestData = JSON.parse(manifestContent) as Manifest;
      finalManifest = { ...sourceManifestData };
    } catch (error) {
      const msg = `Warning: Error reading source manifest ${sourceManifestPath}. Using defaults. Error: ${error instanceof Error ? error.message : String(error)}`;
      console.warn(msg);
      warnings.push(msg);
    }
  } else {
    const msg = `Warning: Source manifest not found at ${sourceManifestPath}. Using defaults.`;
    console.warn(msg);
    warnings.push(msg);
  }

  // Generate UI section
  finalManifest.ui = htmlFiles.reduce<Record<string, string>>((ui, file) => {
    const relativeToOutDir = path.relative(outputDir, file).replace(/\\/g, "/");
    let key = relativeToOutDir;
    if (key.startsWith('ui/')) key = key.substring(3);
    if (key.endsWith("/index.html")) key = key.substring(0, key.length - "/index.html".length) || "index";
    else if (key.endsWith(".html")) key = key.substring(0, key.length - ".html".length);
    ui[key] = relativeToOutDir.startsWith('..') ? relativeToOutDir : `./${relativeToOutDir}`;
    return ui;
  }, {});

  // Set main code path
  if (bundledCodeRelativePath) {
    finalManifest.main = bundledCodeRelativePath;
  } else if (!finalManifest.main) {
    const msg = `Warning: Bundled code path not provided. 'main' property in manifest not set.`;
    console.warn(msg);
    warnings.push(msg);
    finalManifest.main = undefined;
  }

  return { manifest: finalManifest, warnings };
}

/**
 * Writes the Figma manifest object to a file.
 * Has side effects: writes to the filesystem.
 *
 * @param manifest - The manifest object to write.
 * @param outputManifestPath - Absolute path where the manifest file should be written.
 * @throws If writing the file fails.
 */
async function _writeManifest(manifest: Manifest, outputManifestPath: string): Promise<void> {
  try {
    await fs.promises.writeFile(
      outputManifestPath,
      JSON.stringify(manifest, null, 2),
    );
    console.log(`Created manifest file: ${outputManifestPath}`);
  } catch (error) {
    console.error(`Error writing manifest file to ${outputManifestPath}:`, error);
    // Re-throw to signal failure
    throw error;
  }
}

/**
 * Build step to generate and write the final Figma manifest.json.
 * It finds HTML files, generates the manifest content based on inputs and the
 * source manifest, and then writes the result to the output directory.
 *
 * @param outputDir - Absolute path to the build output directory.
 * @param sourceManifestPath - Absolute path to the source manifest.json.
 * @param outputManifestPath - Absolute path where the final manifest.json should be written.
 * @param bundledCodeRelativePath - Relative path to the bundled main code (or undefined).
 * @returns A BuildResult indicating success or failure, including the manifest path as an emitted file.
 */
export async function updateManifestStep(
  outputDir: string,
  sourceManifestPath: string,
  outputManifestPath: string,
  bundledCodeRelativePath: string | undefined
): Promise<BuildResult> {
  let allWarnings: string[] = [];

  try {
    // 1. Find HTML files
    const uiDir = path.join(outputDir, 'ui');
    const htmlFiles = await findHtmlFiles(uiDir); // Can throw
    if (htmlFiles.length > 0) console.log(`Found ${htmlFiles.length} HTML file(s) for manifest UI.`);

    // 2. Generate Manifest Object
    const { manifest, warnings: generateWarnings } = await _generateManifest(
      sourceManifestPath,
      outputDir,
      htmlFiles,
      bundledCodeRelativePath
    ); // Can throw if reading source manifest fails unexpectedly
    allWarnings = allWarnings.concat(generateWarnings);

    // 3. Write Manifest File
    await _writeManifest(manifest, outputManifestPath); // Can throw

    // Success!
    return { status: 'success', emittedFiles: [outputManifestPath], warnings: allWarnings };

  } catch (error: unknown) {
    // Catch errors from findHtmlFiles, _generateManifest, or _writeManifest
    const message = `Error during manifest update step: ${error instanceof Error ? error.message : String(error)}`;
    // Specific errors were likely logged by the helpers
    console.error('Manifest update step failed.'); 
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(message),
      emittedFiles: [],
      warnings: allWarnings, // Include any warnings gathered before the error
    };
  }
} 