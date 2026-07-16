import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "smart-study-planner";
const DB_VERSION = 1;
const FILES_STORE = "files";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE);
        }
      }
    });
  }
  return dbPromise;
}

export async function putBlob(id: string, blob: Blob) {
  const db = await getDb();
  await db.put(FILES_STORE, blob, id);
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get(FILES_STORE, id);
}

export async function deleteBlob(id: string) {
  const db = await getDb();
  await db.delete(FILES_STORE, id);
}

export async function getAllBlobIds(): Promise<string[]> {
  const db = await getDb();
  const keys = await db.getAllKeys(FILES_STORE);
  return keys.map(String);
}
