import fs from "node:fs";
import path from "node:path";
import { bundleJS } from "../utils/bundle-js.js";
import type { BuildContext, BuildResult } from "../types.js";

/**
 * Bundles the Figma plugin code, determines its path, and adds paths to the context.
 * Reads: context.figmaCodeEntryPoint, context.outputDir
 * Writes: context.stepOutput_bundledCodeRelativePath, context.stepOutput_absoluteCodeBundlePath
 * @param context - The build context.
 * @returns A BuildResult including the path to the emitted bundle file or an error.
 */
export async function bundleCodeStep(context: BuildContext): Promise<BuildResult> {
  const { figmaCodeEntryPoint, outputDir } = context;
  try {
    const outFile = path.join(outputDir, 'code.js');
    const result = await bundleJS(figmaCodeEntryPoint, outFile);
    const absoluteBundledPath = result.outputFile;

    if (!absoluteBundledPath) {
      const warningMessage = `Warning: Bundling process did not return an output path from ${figmaCodeEntryPoint}.`;
      console.warn(warningMessage);
      return {
        status: 'error',
        error: new Error(warningMessage),
        emittedFiles: [],
        warnings: [warningMessage]
      };
    }

    if (!(await fs.promises.stat(absoluteBundledPath).catch(() => null))) {
      const warningMessage = `Warning: Bundled code expected at ${absoluteBundledPath} but file not found.`;
      console.warn(warningMessage);
      return {
        status: 'error',
        error: new Error(warningMessage),
        emittedFiles: [],
        warnings: [warningMessage]
      };
    }

    const relativePath = path.relative(outputDir, absoluteBundledPath).replace(/\\/g, "/");
    const finalRelativePath = relativePath.startsWith('..') ? relativePath : `./${relativePath}`;

    // Update context with the output paths for subsequent steps
    context.stepOutput_bundledCodeRelativePath = finalRelativePath;
    context.stepOutput_absoluteCodeBundlePath = absoluteBundledPath;
    console.log(`Bundled code and added paths to context: ${finalRelativePath}`);

    return {
      status: 'success',
      emittedFiles: [absoluteBundledPath], // Report the emitted file
      warnings: [],
    };

  } catch (error: unknown) {
    const message = `Error bundling Figma code from ${figmaCodeEntryPoint}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(message, error);
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(message),
      emittedFiles: [],
      warnings: [],
    };
  }
} 