import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'uploads');

export class ImageService {
  private readonly baseUrl: string;

  constructor() {
    const port = process.env['PORT'] ?? '3000';
    const host = process.env['HOST'] === '0.0.0.0' ? 'localhost' : (process.env['HOST'] ?? 'localhost');
    this.baseUrl = `http://${host}:${port}`;
  }

  async save(buffer: Buffer): Promise<string> {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${randomUUID()}.png`;
    const filepath = join(UPLOADS_DIR, filename);
    await writeFile(filepath, buffer);
    return `${this.baseUrl}/uploads/${filename}`;
  }
}
