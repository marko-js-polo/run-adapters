import * as cheerio from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { bundleJs } from './bundleJs.js';

const urlRegex = /https?:\/\/[^\s]+/gi;

/**
 * Resolves the absolute path for a potentially relative asset path (href/src).
 * Handles paths starting with '/' by treating them as relative to the `publicPath`.
 *
 * @param publicPath - The absolute path to the directory containing the static assets.
 * @param assetPath - The asset path string (e.g., from an href or src attribute).
 * @returns The resolved absolute path to the asset.
 */
function resolveAssetPath(publicPath: string, assetPath: string): string {
	let resolvedPath = assetPath;
	if (resolvedPath.startsWith('/')) {
		resolvedPath = resolvedPath.substring(1);
	}
	return path.join(publicPath, resolvedPath);
}

/**
 * Represents the result of the asset inlining process for a single HTML file.
 */
interface InlineResult {
	/** The modified HTML string with assets inlined. */
	html: string;
	/** An array of absolute paths to the files that were successfully inlined. */
	inlinedFiles: string[];
}

/**
 * Inlines external CSS, JS, and image assets referenced in an HTML document.
 * Processes `<link rel="stylesheet">`, `<script src="...">`, and `<img src="...">
 * elements, replacing external references with embedded content.
 *
 * @param html - The input HTML string.
 * @param publicPath - The absolute path to the directory containing the static assets (build output directory).
 * @returns A promise resolving to an {@link InlineResult} object containing the modified HTML
 *          and a list of successfully inlined asset file paths.
 */
export async function inlineAssets(html: string, publicPath: string): Promise<InlineResult> {
	const $ = cheerio.load(html);
	const allInlinedFiles = new Set<string>();

	const cssPromise = inlineCss($, publicPath);
	const imgPromise = inlineImg($, publicPath);
	const jsPromise = inlineJs($, publicPath);

	// Wait for all inlining operations to complete
	const results = await Promise.allSettled([cssPromise, imgPromise, jsPromise]);

	// Collect successfully inlined file paths from each type
	for (const result of results) {
		if (result.status === 'fulfilled' && result.value) {
			for (const filePath of result.value) {
				allInlinedFiles.add(filePath);
			}
		}
	}

	// Remove module preload links as they are unnecessary after inlining
	removeModulePreloadLinks($);

	return {
		html: $.html(),
		inlinedFiles: Array.from(allInlinedFiles)
	};
}

/**
 * Inlines external CSS stylesheets referenced via `<link rel="stylesheet">` tags.
 *
 * @param $ - The Cheerio API instance for the HTML document.
 * @param publicPath - The absolute path to the asset directory.
 * @returns A promise resolving to an array of absolute paths for successfully inlined CSS files.
 */
async function inlineCss($: cheerio.CheerioAPI, publicPath: string): Promise<string[]> {
	const promises: Promise<string | null>[] = [];
	for (const element of $('link[rel="stylesheet"][href$=".css"]')) {
		const link = $(element);
		const href = link.attr('href') || '';
		if (!urlRegex.test(href) && href) {
			const cssPath = resolveAssetPath(publicPath, href);
			const promise = fs.readFile(cssPath, { encoding: 'utf8' })
				.then(cssContent => {
					link.replaceWith(`<style>${cssContent}</style>`);
					return cssPath;
				})
				.catch(error => {
					console.warn(`Warning: Could not inline CSS from ${cssPath} (href: ${href}): ${error instanceof Error ? error.message : error}`);
					return null;
				});
			promises.push(promise);
		}
	}
	// Wait for all reads and filter out failures
	const results = await Promise.all(promises);
	return results.filter((p): p is string => p !== null);
}

/**
 * Inlines images referenced via `<img>` tags using Base64 data URIs.
 *
 * @param $ - The Cheerio API instance for the HTML document.
 * @param publicPath - The absolute path to the asset directory.
 * @returns A promise resolving to an array of absolute paths for successfully inlined image files.
 */
async function inlineImg($: cheerio.CheerioAPI, publicPath: string): Promise<string[]> {
	const promises: Promise<string | null>[] = [];
	for (const element of $('img')) {
		const img = $(element);
		const src = img.attr('src') || '';
		if (!src.startsWith('data:') && !urlRegex.test(src) && src) {
			const imgPath = resolveAssetPath(publicPath, src);
			const promise = fs.readFile(imgPath)
				.then(imgContent => {
					const mimeType = getMimeTypeFromPath(imgPath);
					if (mimeType) {
						const dataUri = `data:${mimeType};base64,${imgContent.toString('base64')}`;
						img.attr('src', dataUri);
						return imgPath;
					}
					console.warn(`Warning: Could not determine MIME type for image ${imgPath}. Skipping inline.`);
					return null;
				})
				.catch(error => {
					console.warn(`Warning: Could not inline image from ${imgPath} (src: ${src}): ${error instanceof Error ? error.message : error}`);
					return null;
				});
			promises.push(promise);
		}
	}
	// Wait for all reads and filter out failures
	const results = await Promise.all(promises);
	return results.filter((p): p is string => p !== null);
}

/**
 * Inlines external JavaScript files referenced via `<script src="...">` tags.
 * Uses esbuild via `bundleJs` to handle imports and dependencies.
 *
 * @param $ - The Cheerio API instance for the HTML document.
 * @param publicPath - The absolute path to the asset directory.
 * @returns A promise resolving to an array of absolute paths for all files
 *          (entry points and dependencies) successfully included in the inlined bundles.
 */
async function inlineJs($: cheerio.CheerioAPI, publicPath: string): Promise<string[]> {
	const promises: Promise<string[] | null>[] = [];
	for (const element of $('script[src$=".js"]')) {
		const script = $(element);
		const src = script.attr('src') || '';
		if (!urlRegex.test(src) && src) {
			const jsPath = resolveAssetPath(publicPath, src);
			const promise = bundleJs(jsPath)
				.then(({ code: jsContent, inputFiles }) => {
					const attributes = Object.entries(script.attr() || {})
						.filter(([key]) => key !== 'src')
						.map(([key, value]) => `${key}="${value}"`)
						.join(' ');
					const scriptTag = `<script${attributes ? ` ${attributes}` : ''}>${jsContent}</script>`;
					script.replaceWith(scriptTag);
					return inputFiles;
				})
				.catch(error => {
					console.warn(`Warning: Failed to bundle and inline JS from ${jsPath} (src: ${src}). Error: ${error instanceof Error ? error.message : error}`);
					return null;
				});
			promises.push(promise);
		}
	}
	// Wait for all bundles, flatten the lists of input files, and filter out failures
	const results = await Promise.all(promises);
	return results.flat().filter((p): p is string => p !== null);
}

/**
 * Removes `<link rel="modulepreload">` tags from the document head.
 * These are typically used for optimization when scripts are loaded externally,
 * but become unnecessary when scripts are inlined.
 *
 * @param $ - The Cheerio API instance for the HTML document.
 */
function removeModulePreloadLinks($: cheerio.CheerioAPI): void {
	$('link[rel="modulepreload"][href$=".js"]').remove();
}

/**
 * Determines the MIME type of a file based on its extension.
 *
 * @param filePath - The path to the file.
 * @returns The corresponding MIME type string (e.g., 'image/png', 'image/jpeg')
 *          or `undefined` if the extension is not recognized.
 */
function getMimeTypeFromPath(filePath: string): string | undefined {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case '.png': return 'image/png';
		case '.jpg':
		case '.jpeg': return 'image/jpeg';
		case '.gif': return 'image/gif';
		case '.svg': return 'image/svg+xml';
		case '.webp': return 'image/webp';
		// Add other common image types if needed
		default: return undefined;
	}
} 