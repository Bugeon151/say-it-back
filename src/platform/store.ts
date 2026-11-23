/** Everything is kept in this browser (IndexedDB). There is no account and no server. */
import type { AppData } from '../core/types';

const DB = 'say-it-back';
const KV = 'kv';
const AUDIO = 'audio';
const memory = new Map<string, unknown>();
let dbp: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((res) => {
    if (typeof indexedDB === 'undefined') return res(null);
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(KV);
      req.result.createObjectStore(AUDIO);
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(null);
  });
  return dbp;
}

async function op<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  const d = await db();
  if (!d) return undefined;
  return new Promise((res) => {
    const r = fn(d.transaction(store, mode).objectStore(store));
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => res(undefined);
  });
}

export async function loadData(): Promise<AppData | null> {
  const d = await db();
  if (!d) return (memory.get('data') as AppData) ?? null;
  return (await op<AppData>(KV, 'readonly', (s) => s.get('data'))) ?? null;
}

export async function saveData(data: AppData): Promise<void> {
  if (data.sample) return;
  const d = await db();
  if (!d) { memory.set('data', data); return; }
  await op(KV, 'readwrite', (s) => s.put(data, 'data'));
}

export async function clearAll(): Promise<void> {
  memory.clear();
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls.clear();
  const d = await db();
  if (!d) return;
  await op(KV, 'readwrite', (s) => s.clear());
  await op(AUDIO, 'readwrite', (s) => s.clear());
}

export async function putAudio(id: string, blob: Blob): Promise<void> {
  const d = await db();
  if (!d) { memory.set(`audio:${id}`, blob); return; }
  await op(AUDIO, 'readwrite', (s) => s.put(blob, id));
}

const urls = new Map<string, string>();
export async function audioUrl(id: string): Promise<string | null> {
  if (urls.has(id)) return urls.get(id)!;
  const d = await db();
  const blob = d ? await op<Blob>(AUDIO, 'readonly', (s) => s.get(id)) : (memory.get(`audio:${id}`) as Blob | undefined);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urls.set(id, u);
  return u;
}
