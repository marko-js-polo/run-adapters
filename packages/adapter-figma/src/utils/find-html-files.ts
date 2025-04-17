import { promises as fs, type Dirent } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Recursively finds all HTML files within a given directory.
 *
 * @param dir The absolute path to the directory to scan.
 * @returns A Promise that resolves to an array of absolute paths to the found HTML files.
 * @throws If reading the directory fails for reasons other than it not existing.
 */
export async function findHtmlFiles(dir: string): Promise<string[]> {
  const htmlFiles: string[] = [];

  async function recurse(currentPath: string): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (err) {
      // If the directory doesn't exist (e.g., no UI files were built), return empty array
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
        console.warn(`Directory not found during HTML file search: ${currentPath}`);
        return; // Successfully handled case, return normally
      }
      // For other errors, log and re-throw
      console.error(`Error reading directory ${currentPath} during HTML file search:`, err);
      throw err; 
    }

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await recurse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        htmlFiles.push(resolve(fullPath)); // Ensure absolute path
      }
    }
  }

  await recurse(dir);
  return htmlFiles;
} 