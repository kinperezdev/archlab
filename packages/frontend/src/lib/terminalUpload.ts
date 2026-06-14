/**
 * Terminal file-upload helpers.
 *
 * Files dropped onto or picked from the terminal are base64-uploaded to the
 * backend, which copies them into a temp working directory and returns the
 * absolute path so the shell can use it. Folders (and zip archives) resolve to a
 * folder path. Dropped directories are walked client-side via the entries API.
 */

import { PORTS } from '@archlab/shared';

const BASE = `http://127.0.0.1:${PORTS.backend}`;

export interface StagedFile {
  name: string;
  size: number;
  /** Absolute path on disk the shell can reference. */
  path: string;
  kind: 'file' | 'folder';
  isImage: boolean;
  /** Object URL for an inline image thumbnail (images only). */
  previewUrl?: string;
}

/** Read a File as raw base64 (without the data: prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Human-readable byte size (e.g. "1.4 MB"). */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

/** Single-quote a path for safe shell insertion. */
export function shellQuote(p: string): string {
  return `'${p.replace(/'/g, `'\\''`)}'`;
}

/** Upload one picked/dropped file. Zip archives come back as a folder path. */
export async function uploadFile(file: File): Promise<StagedFile> {
  const dataBase64 = await fileToBase64(file);
  const res = await fetch(`${BASE}/terminal/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, dataBase64 }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Upload failed.');
  const isImage = file.type.startsWith('image/') && data.kind === 'file';
  return {
    name: data.name,
    size: file.size,
    path: data.path,
    kind: data.kind,
    isImage,
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
}

/** Upload a whole dropped folder, reconstructing it under the temp directory. */
export async function uploadFolder(
  folderName: string,
  files: { relPath: string; file: File }[],
): Promise<StagedFile> {
  const payload = await Promise.all(
    files.map(async (f) => ({ relPath: f.relPath, dataBase64: await fileToBase64(f.file) })),
  );
  const res = await fetch(`${BASE}/terminal/upload-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderName, files: payload }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Folder upload failed.');
  return { name: data.name, size: data.size, path: data.path, kind: 'folder', isImage: false };
}

// ---- Dropped-directory walking (entries API) ------------------------------

interface FsReader {
  readEntries: (cb: (e: FsEntry[]) => void, err: (e: unknown) => void) => void;
}
type FsEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (cb: (f: File) => void, err: (e: unknown) => void) => void;
  createReader?: () => FsReader;
};

async function readAllEntries(reader: FsReader): Promise<FsEntry[]> {
  const out: FsEntry[] = [];
  const read = (): Promise<FsEntry[]> =>
    new Promise((resolve, reject) => reader.readEntries(resolve, reject));
  // The entries reader returns results in batches; loop until empty.
  for (;;) {
    const batch = await read();
    if (batch.length === 0) break;
    out.push(...batch);
  }
  return out;
}

async function walkEntry(
  entry: FsEntry,
  prefix: string,
  acc: { relPath: string; file: File }[],
): Promise<void> {
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => entry.file!(resolve, reject));
    acc.push({ relPath: `${prefix}${entry.name}`, file });
  } else if (entry.isDirectory && entry.createReader) {
    const entries = await readAllEntries(entry.createReader());
    for (const child of entries) {
      await walkEntry(child, `${prefix}${entry.name}/`, acc);
    }
  }
}

export interface DropContents {
  /** Plain files dropped (not inside a folder). */
  files: File[];
  /** A dropped directory, walked into individual files with relative paths. */
  folder?: { name: string; entries: { relPath: string; file: File }[] };
}

/** Pull files and any dropped directory out of a drop event's DataTransfer. */
export async function collectDrop(dt: DataTransfer): Promise<DropContents> {
  const items = dt.items;
  let dirEntry: FsEntry | null = null;
  if (items) {
    for (const item of Array.from(items)) {
      const getEntry = (item as DataTransferItem & {
        webkitGetAsEntry?: () => FsEntry | null;
      }).webkitGetAsEntry;
      const entry = getEntry ? getEntry.call(item) : null;
      if (entry?.isDirectory) {
        dirEntry = entry;
        break;
      }
    }
  }

  if (dirEntry) {
    const acc: { relPath: string; file: File }[] = [];
    await walkEntry(dirEntry, '', acc);
    // Strip the leading "<dir>/" so relPaths are relative to the folder root.
    const prefix = `${dirEntry.name}/`;
    const entries = acc.map((a) => ({
      relPath: a.relPath.startsWith(prefix) ? a.relPath.slice(prefix.length) : a.relPath,
      file: a.file,
    }));
    return { files: [], folder: { name: dirEntry.name, entries } };
  }

  return { files: Array.from(dt.files) };
}
