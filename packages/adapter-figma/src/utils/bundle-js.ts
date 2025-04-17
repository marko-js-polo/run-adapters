import esbuild, { type BuildResult } from 'esbuild';

/**
 * Represents the result of bundling the Figma code, including the output file path.
 */
export interface BundleFigmaCodeResult extends BuildResult {
  /** The absolute path to the main bundled output file. */
  outputFile: string;
}

/**
 * Bundles the given JS/TS file for Node.js execution using esbuild.
 *
 * Suitable for bundling the main thread code of a Figma plugin.
 * It minifies the code and writes the output to a specified directory as `code.js`.
 *
 * @param entryPoint The absolute path to the entry point file.
 * @param outputFile The absolute path to the directory where `code.js` should be written.
 * @returns A Promise resolving to a {@link BundleFigmaCodeResult} object.
 */
export async function bundleJS(entryPoint: string, outputFile: string): Promise<BundleFigmaCodeResult> {
  console.log('Bundling plugin code from', entryPoint, 'to', outputFile);

  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      outfile: outputFile,
      platform: 'node', // Target platform is Node.js for Figma main thread
      format: 'iife',   // Use IIFE to keep code self-contained
      bundle: true,
      minify: true,
      metafile: true,   // Needed to determine output path reliably
      write: true,
    });
    return { ...result, outputFile: outputFile };
  } catch (err) {
    console.error(`Error bundling plugin code from ${entryPoint}:`, err);
    throw err;
  }
}