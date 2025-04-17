import fs from "node:fs/promises";
import path from "node:path";
import createStaticAdapter, { type Options as StaticAdapterOptions } from "@marko/run-adapter-static";
import type { Adapter, Route } from "@marko/run/vite";

import { listHtmlFiles } from "./steps/listHtmlFiles.js";
import { inlineAssets } from "./steps/inlineAssets.js";
import { deleteEmptyDirs } from "./steps/deleteEmptyDirs.js";

// The following was necessary because the type of ResolvedConfig is not re-exported from @marko/run/vite
// Importing it directly from vite did not work for some reason.
type buildEnd = Required<ReturnType<typeof createStaticAdapter>>["buildEnd"];
type ResolvedConfig = Parameters<buildEnd>[0];

/**
 * Options for the single-file adapter.
 * Extends the base static adapter options.
 * @see {@link https://github.com/marko-js/run/tree/main/packages/adapter-static#options|Static Adapter Options}
 */
export interface SingleFileAdapterOptions extends StaticAdapterOptions {
	/**
	 * Whether to delete the original asset files (CSS, JS, images)
	 * after they have been successfully inlined into the HTML files.
	 * Defaults to `false`.
	 */
	deleteInlinedFiles?: boolean;
}

/**
 * Creates a Marko Run adapter that builds a static site with all assets (CSS, JS, images)
 * inlined directly into the HTML files.
 *
 * This adapter first runs the standard `@marko/run-adapter-static` build process,
 * then modifies the generated HTML files to embed external resources.
 * Optionally, it can clean up the original asset files and empty directories.
 *
 * @param options - Configuration options for the adapter.
 * @returns A Marko Run adapter instance configured for single-file output.
 * @example
 * ```ts
 * // vite.config.js
 * import { defineConfig } from "vite";
 * import marko from "@marko/run/vite";
 * import singleFile from "@svallory/adapter-single-file"; // Assuming package name
 *
 * export default defineConfig({
 *   plugins: [
 *     marko({
 *       adapter: singleFile({
 *         // Options inherited from static adapter (e.g., cdn)
 *         deleteInlinedFiles: true // Option specific to this adapter
 *       }),
 *     }),
 *   ],
 * });
 * ```
 */
export default function createSingleFileAdapter(options: SingleFileAdapterOptions = {}): Adapter {
	// Pass options to the underlying static adapter
	const staticAdapter = createStaticAdapter(options);
	const { deleteInlinedFiles = true } = options;

	const adapter: Adapter = {
		// --- Delegated Hooks --- 
		...staticAdapter,

		// overrides
		name: "single-file-adapter",

		// --- Overridden Hook --- 
		async buildEnd(config: ResolvedConfig, routes: Route[], builtEntries: string[], sourceEntries: string[]): Promise<void> {
			// Use config safely, assuming it's ResolvedConfig structure
			const resolvedConfig = config as ResolvedConfig; // Assert here for local use
			const outputDir = path.resolve(process.cwd(), resolvedConfig.build.outDir);

			// 1. Run the standard static adapter build first
			await staticAdapter.buildEnd?.(
				config,
				routes,
				builtEntries,
				sourceEntries
			);

			// 2. Find all generated HTML files in the output directory
			let htmlFiles: string[];
			try {
				htmlFiles = await listHtmlFiles(outputDir);
			} catch (error: unknown) {
				console.error(`Error listing HTML files in ${outputDir}:`, error instanceof Error ? error.message : error);
				return;
			}

			if (htmlFiles.length === 0) {
				console.warn(`Warning: No HTML files found in ${outputDir}. Skipping asset inlining.`);
				return;
			}

			// 3. Inline assets into each HTML file and collect paths of inlined assets
			console.log(`Inlining assets for ${htmlFiles.length} HTML file(s) in ${outputDir}...`);
			const allInlinedFiles = new Set<string>();
			const inlinePromises = htmlFiles.map(async (htmlPath) => {
				try {
					await fs.access(htmlPath);
					const htmlContent = await fs.readFile(htmlPath, "utf-8");
					const { html: updatedHtml, inlinedFiles } = await inlineAssets(htmlContent, outputDir);
					await fs.writeFile(htmlPath, updatedHtml);

					for (const file of inlinedFiles) {
						allInlinedFiles.add(file);
					}
				} catch (error: unknown) {
					if (typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT') {
						// File might have been removed by cleanup in parallel, ignore.
					} else {
						console.error(`Error inlining assets in ${htmlPath}:`, error instanceof Error ? error.message : error);
					}
				}
			});

			await Promise.allSettled(inlinePromises);
			console.log("Asset inlining complete.");

			// 4. Delete inlined files if the option is enabled
			if (deleteInlinedFiles && allInlinedFiles.size > 0) {				
				const deletePromises = Array.from(allInlinedFiles).flatMap((filePath) => {
					const promises: Promise<void>[] = [];
					promises.push((async () => {
						try {
							await fs.unlink(filePath);
						} catch (error: unknown) {
							console.warn(`Warning: Could not delete inlined file ${filePath}:`, error instanceof Error ? error.message : error);
						}
					})());

					if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
						const mapPath = `${filePath}.map`;
						promises.push((async () => {
							try {
								await fs.unlink(mapPath);
							} catch (error: unknown) {
								if (!(typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT')) {
									console.warn(`Warning: Could not delete source map file ${mapPath}:`, error instanceof Error ? error.message : error);
								}
							}
						})());
					}
					return promises;
				});
				await Promise.allSettled(deletePromises);
				console.log("Inlined asset deletion complete.");

				console.log(`Cleaning up empty directories in ${outputDir}...`);
				await deleteEmptyDirs(outputDir);
				console.log("Empty directory cleanup complete.");
			}
		},
	};

	return adapter;
} 