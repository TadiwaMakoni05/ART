import { openDB } from "idb";
import api from "./api";

const DB_NAME = "art_companion_db";
const STORE_NAME = "offline_logs";

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const saveOfflineLog = async (logData) => {
  const db = await initDB();
  await db.add(STORE_NAME, { ...logData, createdAt: new Date().toISOString() });
};

export const syncOfflineLogs = async () => {
  const db = await initDB();
  const logs = await db.getAll(STORE_NAME);

  if (logs.length === 0) return;

  try {
    // Prepare logs for backend (match backend expectation in SyncAdherenceView)
    // Backend expects: list of objects with medication, scheduled_time, status, actual_time
    const payload = {
      logs: logs.map((log) => ({
        medication: log.medication,
        scheduled_time: log.scheduled_time, // Ensure this matches backend format
        status: log.status,
        actual_time: log.actual_time,
      })),
    };

    await api.post("sync/", payload);

    // Clear indexedDB after successful sync
    await db.clear(STORE_NAME);
    console.log("Offline logs synced successfully");
    return true;
  } catch (error) {
    console.error("Sync failed", error);
    return false;
  }
};

// Auto-sync periodically or on online event
window.addEventListener("online", syncOfflineLogs);
setInterval(syncOfflineLogs, 60000); // Try every minute
