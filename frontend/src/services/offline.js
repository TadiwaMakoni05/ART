import { openDB } from "idb";
import api from "./api";

const DB_NAME = "art_companion_db";
const STORES = {
  LOGS: "offline_logs",
  MESSAGES: "offline_messages",
};

export const initDB = async () => {
  return openDB(DB_NAME, 2, {
    // Bump version
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        db.createObjectStore(STORES.LOGS, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        db.createObjectStore(STORES.MESSAGES, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const saveOfflineItem = async (storeName, data) => {
  try {
    const db = await initDB();
    await db.add(storeName, { ...data, createdAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error(`Failed to save to ${storeName}`, err);
    return false;
  }
};

// Deprecated wrapper for backward compatibility if needed, or just replace usage
export const saveOfflineLog = async (logData) => {
  return saveOfflineItem(STORES.LOGS, logData);
};

export const saveOfflineMessage = async (msgData) => {
  return saveOfflineItem(STORES.MESSAGES, msgData);
};

export const syncOfflineData = async () => {
  if (!navigator.onLine) return; // Don't try if offline

  const db = await initDB();
  const logs = await db.getAll(STORES.LOGS);
  const messages = await db.getAll(STORES.MESSAGES);

  if (logs.length === 0 && messages.length === 0) return;

  try {
    const payload = {
      logs: logs.map((log) => ({
        medication: log.medication,
        scheduled_time: log.scheduled_time,
        status: log.status,
        actual_time: log.actual_time,
      })),
      messages: messages.map((msg) => ({
        receiver_id: msg.receiver_id,
        message: msg.message,
        timestamp: msg.createdAt, // Backend might ignore this and use server time, but good to send
      })),
    };

    await api.post("sync/", payload);

    // Clear indexedDB after successful sync
    const tx = db.transaction([STORES.LOGS, STORES.MESSAGES], "readwrite");
    await Promise.all([
      tx.objectStore(STORES.LOGS).clear(),
      tx.objectStore(STORES.MESSAGES).clear(),
      tx.done,
    ]);

    console.log("Offline data synced successfully");
    return true;
  } catch (error) {
    console.error("Sync failed", error);
    return false;
  }
};

// Auto-sync periodically or on online event
window.addEventListener("online", syncOfflineData);
setInterval(syncOfflineData, 60000); // Try every minute
