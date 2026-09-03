// IndexedDB Manager for Guard Console Offline Operation
// Per AGENTS.md Rule #7: Offline-allowed check-in/out against cached 24h allowlist

const DB_NAME = "SocietyOS_GuardOffline";
const DB_VERSION = 2;

export interface CachedInvite {
  id: string;
  code: string;
  qrToken?: string;
  visitorName: string;
  visitorPhone?: string;
  unitNumber?: string;
  purpose?: string;
  validFrom: string;
  validTo: string;
  status: string;
  cachedAt: number;
}

export type OfflineActionType =
  | "VISITOR_CHECKIN"
  | "VISITOR_CHECKOUT"
  | "DELIVERY_LOG"
  | "HELP_CHECKIN"
  | "HELP_CHECKOUT";

export interface OfflineEntry {
  idempotencyKey: string;
  code?: string;
  inviteId?: string;
  entryId?: string;
  gateId?: string;
  entryType: "VISITOR" | "DELIVERY" | "HELP" | OfflineActionType;
  actionType?: OfflineActionType;
  payload?: any;
  timestamp: string;
  synced: boolean;
  failed?: boolean;
  failReason?: string;
  notes?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not available"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("cached_invites")) {
        const store = db.createObjectStore("cached_invites", { keyPath: "code" });
        store.createIndex("qrToken", "qrToken", { unique: false });
        store.createIndex("validTo", "validTo", { unique: false });
      }
      if (!db.objectStoreNames.contains("offline_entries_queue")) {
        const queueStore = db.createObjectStore("offline_entries_queue", { keyPath: "idempotencyKey" });
        queueStore.createIndex("synced", "synced", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheApprovedInvites(invites: CachedInvite[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("cached_invites", "readwrite");
    const store = tx.objectStore("cached_invites");
    for (const invite of invites) {
      store.put({ ...invite, cachedAt: Date.now() });
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OFFLINE DB] Failed to cache invites:", err);
  }
}

export async function findCachedInvite(query: string): Promise<CachedInvite | null> {
  try {
    const db = await openDB();
    const clean = query.trim().toUpperCase();
    const tx = db.transaction("cached_invites", "readonly");
    const store = tx.objectStore("cached_invites");

    return new Promise((resolve) => {
      const codeReq = store.get(clean);
      codeReq.onsuccess = () => {
        if (codeReq.result) {
          const inv = codeReq.result;
          // Verify 24-hour expiration against validTo
          if (new Date(inv.validTo).getTime() < Date.now()) {
            return resolve(null);
          }
          return resolve(inv);
        }

        // Try QR token index
        const qrIndex = store.index("qrToken");
        const qrReq = qrIndex.get(clean);
        qrReq.onsuccess = () => {
          if (qrReq.result) {
            const inv = qrReq.result;
            if (new Date(inv.validTo).getTime() < Date.now()) {
              return resolve(null);
            }
            return resolve(inv);
          }
          resolve(null);
        };
        qrReq.onerror = () => resolve(null);
      };
      codeReq.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function queueOfflineEntry(entry: Omit<OfflineEntry, "synced">): Promise<OfflineEntry> {
  const db = await openDB();
  const tx = db.transaction("offline_entries_queue", "readwrite");
  const store = tx.objectStore("offline_entries_queue");
  const record: OfflineEntry = { ...entry, synced: false, failed: false };

  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOfflineEntries(): Promise<OfflineEntry[]> {
  try {
    const db = await openDB();
    const tx = db.transaction("offline_entries_queue", "readonly");
    const store = tx.objectStore("offline_entries_queue");
    const index = store.index("synced");

    return new Promise((resolve, reject) => {
      const req = index.getAll(IDBKeyRange.only(false));
      req.onsuccess = () => {
        const results = (req.result || []) as OfflineEntry[];
        resolve(results.filter((r) => !r.failed));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function markEntrySynced(idempotencyKey: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("offline_entries_queue", "readwrite");
    const store = tx.objectStore("offline_entries_queue");
    const req = store.get(idempotencyKey);
    req.onsuccess = () => {
      if (req.result) {
        req.result.synced = true;
        store.put(req.result);
      }
    };
  } catch (err) {
    console.warn("[OFFLINE DB] Failed to mark synced:", err);
  }
}

export async function markEntryFailed(idempotencyKey: string, reason: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("offline_entries_queue", "readwrite");
    const store = tx.objectStore("offline_entries_queue");
    const req = store.get(idempotencyKey);
    req.onsuccess = () => {
      if (req.result) {
        req.result.failed = true;
        req.result.failReason = reason;
        store.put(req.result);
      }
    };
  } catch (err) {
    console.warn("[OFFLINE DB] Failed to mark failed:", err);
  }
}
