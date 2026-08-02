import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BulbBooking, BulbBookingEntry } from '@doomschooling/shared';
import { BulbBookingEntrySchema } from '@doomschooling/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local dev writes next to the source tree; production points BECURI_DATA_DIR at
// a Docker volume so answers survive a redeploy.
const DEFAULT_DATA_DIR = join(__dirname, '..', 'data');
const FILE_NAME = 'becuri.jsonl';

// One booking is well under 1 KB, so this caps the file at a few hundred of
// them. The page is public, and a full disk on the VPS would take Notice down
// with it.
const MAX_FILE_BYTES = 256 * 1024;

export class BookingStoreFullError extends Error {
  constructor() {
    super('The booking log is full');
    this.name = 'BookingStoreFullError';
  }
}

export class BecuriService {
  private readonly filePath: string;

  constructor(dataDir: string = process.env['BECURI_DATA_DIR'] ?? DEFAULT_DATA_DIR) {
    this.filePath = join(dataDir, FILE_NAME);
  }

  async save(booking: BulbBooking): Promise<BulbBookingEntry> {
    const entry: BulbBookingEntry = {
      ...booking,
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
    };

    if ((await this.fileSize()) >= MAX_FILE_BYTES) {
      throw new BookingStoreFullError();
    }

    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(entry)}\n`, 'utf8');

    return entry;
  }

  /** Newest first. Unreadable lines are skipped rather than failing the read. */
  async list(): Promise<BulbBookingEntry[]> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) return [];
      throw error;
    }

    const entries: BulbBookingEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(line);
      } catch {
        continue;
      }

      const parsed = BulbBookingEntrySchema.safeParse(parsedJson);
      if (parsed.success) entries.push(parsed.data);
    }

    return entries.reverse();
  }

  private async fileSize(): Promise<number> {
    try {
      const stats = await stat(this.filePath);
      return stats.size;
    } catch (error) {
      if (isMissingFile(error)) return 0;
      throw error;
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}
