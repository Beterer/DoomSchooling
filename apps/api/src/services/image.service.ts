import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'uploads');

export class ImageService {
  async save(buffer: Buffer): Promise<string> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${randomUUID()}.png`;
    const filepath = join(UPLOADS_DIR, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${filename}`;
  }
}
