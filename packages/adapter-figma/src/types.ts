import type { SingleFileAdapterOptions, BuildResult as SingleFileBuildResult } from '@marko-polo/run-adapter-single-file';

// Re-export BuildResult for internal use
// export type { BuildResult } from '@marko-polo/run-adapter-single-file'; // Removed duplicate export

/**
 * Represents the outcome of a build step or the entire adapter build process.
 * Re-exported from `@marko-polo/run-adapter-single-file`.
 */
export type { SingleFileBuildResult as BuildResult };

/**
 * Options specific to bundling the Figma plugin code.
 */
export interface FigmaCodeOptions {
	/**
	 * The entry point for the Figma plugin's main thread code.
	 * Required.
	 */
	entryPoint: string;
}

/**
 * Basic structure for Figma manifest.json
 * @todo Use a more specific type if possible, or zod schema validation
 */
export interface Manifest {
	name: string;
	id: string;
	api: string;
	main?: string;
	ui?: Record<string, string>;
	[key: string]: unknown;
}

/**
 * Configuration options for the Figma adapter.
 * Extends options from the underlying single-file adapter.
 */
export interface FigmaAdapterOptions extends SingleFileAdapterOptions {
	/**
	 * Options related to the Figma plugin's main code bundling.
	 */
	code: FigmaCodeOptions;

	/**
	 * Path to the source `manifest.json` file relative to the project root.
	 * If not provided, defaults to `src/manifest.json`.
	 * The adapter will read this file and generate an updated version in the build output directory.
	 */
	manifest?: string;

	// Inherits options from SingleFileAdapterOptions (e.g., deleteInlinedFiles)
}

/**
 * Build context shared between Figma adapter build steps.
 * Steps can read configuration and add their specific output fields
 * (prefixed with `stepOutput_`) but should generally avoid modifying other fields
 * to maintain clarity of data flow.
 */
export interface BuildContext {
  // --- Initial Config & State ---
  outputDir: string;             // Base output directory (e.g., dist/)
  sourceManifestPath: string;    // Path to source manifest.json
  outputManifestPath: string;    // Path for final manifest.json
  figmaCodeEntryPoint: string; // Path to code.ts/js

  // --- Mutable state added by specific steps ---
  // Steps add their outputs here. They should only write to their designated field(s).
  stepOutput_bundledCodeRelativePath?: string; // Added by bundleCodeStep
  stepOutput_absoluteCodeBundlePath?: string;  // Added by bundleCodeStep
  stepOutput_htmlFiles?: string[];             // Added by listHtmlFilesStep
  stepOutput_finalManifest?: Manifest;         // Added by generateFigmaManifestStep
}

/**
 * Represents a single step in the Figma adapter build process.
 * Each step receives the build context, performs an action,
 * potentially adds data to the context's output fields,
 * and returns a {@link BuildResult}.
 */
export type BuildStepFn = (context: BuildContext) => Promise<SingleFileBuildResult>;