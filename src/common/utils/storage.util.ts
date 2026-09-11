import { existsSync } from 'fs';
import { stat, unlink } from 'fs/promises';

export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (!filePath) return;
    const path = filePath.trim();
    if (!path) throw new Error('[filePath] is empty string');
    if (!existsSync(filePath)) return;
    const stats = await stat(filePath);
    if (stats.isDirectory()) throw new Error('Can not delete directory: ' + filePath);
    await unlink(filePath);
  } catch (error: any) {
    console.error(`Error deleting file: ${error.message}`);
    throw error;
  }
}
