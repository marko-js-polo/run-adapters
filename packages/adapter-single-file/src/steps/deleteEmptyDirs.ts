import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Recursively deletes empty directories within a given starting directory.
 *
 * @param directory - The absolute path to the directory to start cleaning from.
 */
export async function deleteEmptyDirs(directory: string): Promise<void> {
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      return;
    }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    console.warn(`Warning: Could not stat directory ${directory} for cleanup:`, error instanceof Error ? error.message : error);
    return;
  }

  let entries: string[] = [];
  try {
    entries = await fs.readdir(directory);
  } catch (error: unknown) {
    console.warn(`Warning: Could not read directory ${directory} for cleanup:`, error instanceof Error ? error.message : error);
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry);
      try {
        const entryStats = await fs.stat(fullPath);
        if (entryStats.isDirectory()) {
          await deleteEmptyDirs(fullPath);
        }
      } catch (error: unknown) {
        if (!(typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT')) {
           console.warn(`Warning: Could not stat entry ${fullPath} during cleanup:`, error instanceof Error ? error.message : error);
        }
      }
    })
  );

  try {
    const remainingEntries = await fs.readdir(directory);
    if (remainingEntries.length === 0) {
      await fs.rmdir(directory);
    }
  } catch (error: unknown) {
    if (!(typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT')) {
       console.warn(`Warning: Could not delete empty directory ${directory}:`, error instanceof Error ? error.message : error);
    }
  }
} 