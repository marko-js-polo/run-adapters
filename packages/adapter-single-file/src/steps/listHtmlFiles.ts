import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively finds all HTML files within a given directory.
 *
 * @param dir - The absolute path to the directory to search.
 * @returns A promise that resolves to an array of absolute paths to the found HTML files.
 */
export async function listHtmlFiles(dir: string): Promise<string[]> {
  const htmlFiles: string[] = [];

  async function recurse(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await recurse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        htmlFiles.push(path.resolve(fullPath));
      }
    }
  }

  await recurse(dir);
  return htmlFiles;
} 