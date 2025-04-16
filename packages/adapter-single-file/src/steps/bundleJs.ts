import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

// Simple in-memory cache for bundled results
/**
 * @internal Cache entry for storing bundled code and its associated input files.
 */
interface BundleCacheEntry {
	code: string;
	inputFiles: string[];
}
const bundleCache = new Map<string, BundleCacheEntry>();

/**
 * Represents the result of bundling a JavaScript file.
 */
export interface BundleResult {
	/** The bundled JavaScript code as an IIFE string. */
	code: string;
	/** An array of absolute paths to all input files included in the bundle. */
	inputFiles: string[];
}

/**
 * Bundles a JavaScript file using esbuild, handling imports and producing
 * an Immediately-Invoked Function Expression (IIFE) suitable for inlining.
 * Caches results based on file path and modification time.
 * Uses esbuild's metafile to determine all included input files.
 *
 * @param jsPath - The absolute path to the JavaScript entry point file.
 * @returns A promise resolving to a {@link BundleResult} object.
 * @throws If esbuild fails or the file cannot be read.
 */
export async function bundleJs(jsPath: string): Promise<BundleResult> {
	try {
		const stats = await fs.stat(jsPath);
		const cacheKey = `${jsPath}:${stats.mtimeMs}`;

		if (bundleCache.has(cacheKey)) {
			const cachedResult = bundleCache.get(cacheKey);
			if (cachedResult !== undefined) {
				return cachedResult;
			}
		}

		const result = await esbuild.build({
			entryPoints: [jsPath],
			platform: 'browser',
			format: 'iife',
			bundle: true,
			write: false,
			minify: true,
			metafile: true,
			// Consider adding sourcemap: 'inline' if debugging is needed
		});

		if (result.outputFiles && result.outputFiles.length > 0 && result.metafile) {
			const bundledCode = new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
			
			const inputFiles = Object.keys(result.metafile.inputs).map(relativePath => {
				const absolutePath = path.resolve(relativePath);
				return absolutePath;
			});

			const cacheEntry: BundleCacheEntry = { code: bundledCode, inputFiles };
			bundleCache.set(cacheKey, cacheEntry);
			return cacheEntry;
		}

		throw new Error('esbuild did not produce the expected output files or metafile.');
	} catch (err: unknown) {
		console.error(`Error bundling JS file ${jsPath}:`, err instanceof Error ? err.message : err);
		throw new Error(`Failed to bundle ${jsPath}`, { cause: err });
	}
}