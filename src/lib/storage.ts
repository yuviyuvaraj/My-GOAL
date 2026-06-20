import { Goal, ProgressEntry, Note, Profile } from '../types';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'MyGoalsCapacitorDB';
const STORE_NAME = 'app_key_value_store';
const DB_VERSION = 1;

let sqliteInstance: any = null;
let sqliteDbConnection: any = null;

async function getNativeSQLiteDb() {
  if (sqliteDbConnection) return sqliteDbConnection;
  try {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
    if (!sqliteInstance) {
      sqliteInstance = new SQLiteConnection(CapacitorSQLite);
    }
    const isConn = await sqliteInstance.isConnection('mygoals_sqlite_db');
    if (isConn.result) {
      sqliteDbConnection = await sqliteInstance.retrieveConnection('mygoals_sqlite_db');
    } else {
      sqliteDbConnection = await sqliteInstance.createConnection('mygoals_sqlite_db', false, 'no-encryption', 1);
    }
    await sqliteDbConnection.open();
    await sqliteDbConnection.execute(`
      CREATE TABLE IF NOT EXISTS sql_kv_store (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return sqliteDbConnection;
  } catch (err) {
    console.warn('Native SQLite connection could not be established:', err);
    return null;
  }
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function getItemAsync<T>(key: string, defaultValue: T): Promise<T> {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    try {
      const db = await getNativeSQLiteDb();
      if (db) {
        const queryRes = await db.query("SELECT value FROM sql_kv_store WHERE key = ?;", [key]);
        if (queryRes.values && queryRes.values.length > 0) {
          const rowValue = queryRes.values[0].value;
          return JSON.parse(rowValue) as T;
        }
      }
    } catch (err) {
      console.warn(`Native SQLite read failed for key "${key}", falling back:`, err);
    }
  }

  if (typeof indexedDB === 'undefined') {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  try {
    const db = await getDB();
    return await new Promise<T>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result !== undefined ? result : defaultValue);
      };
      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (err) {
    console.warn('Failed to read from IndexedDB, trying localStorage fallback:', err);
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export async function setItemAsync<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('LocalStorage backup sync skipped:', error);
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    try {
      const db = await getNativeSQLiteDb();
      if (db) {
        const serialized = JSON.stringify(value);
        const queryRes = await db.query("SELECT key FROM sql_kv_store WHERE key = ?;", [key]);
        if (queryRes.values && queryRes.values.length > 0) {
          await db.run("UPDATE sql_kv_store SET value = ? WHERE key = ?;", [serialized, key]);
        } else {
          await db.run("INSERT INTO sql_kv_store (key, value) VALUES (?, ?);", [key, serialized]);
        }
        return;
      }
    } catch (err) {
      console.warn(`Native SQLite write failed for key "${key}", falling back:`, err);
    }
  }

  if (typeof indexedDB === 'undefined') {
    return;
  }

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB write failed:', err);
  }
}

export async function clearAllAsync(): Promise<void> {
  localStorage.clear();
  
  try {
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase(DB_NAME);
    }
  } catch (e) {
    console.warn('Could not delete IndexedDB database on reset:', e);
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    try {
      const db = await getNativeSQLiteDb();
      if (db) {
        await db.execute("DELETE FROM sql_kv_store;");
      }
    } catch (err) {
      console.warn('Native SQLite table clear failed:', err);
    }
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

// Default Starting Date is June 1st, 2026
const DEFAULT_APP_START_DATE = '2026-06-01';

export const DEFAULT_PROFILE: Profile = {
  name: 'Alex Rivera',
  age: 26,
  height: 178,
  weight: 72,
  appStartDate: DEFAULT_APP_START_DATE,
};

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g-water',
    name: 'Drink 3 Liters of Water',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    type: 'daily',
    targetLimit: 3,
    unit: 'Liters',
    reminders: ['08:00', '13:00', '18:00', '21:00'],
    createdAt: new Date('2026-06-01T07:00:00.000Z').toISOString(),
  },
  {
    id: 'g-read',
    name: 'Read 20 Pages of a Book',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    type: 'daily',
    targetLimit: 20,
    unit: 'Pages',
    reminders: ['20:30'],
    createdAt: new Date('2026-06-01T07:15:00.000Z').toISOString(),
  },
  {
    id: 'g-exercise',
    name: 'Exercise 45 Minutes',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    type: 'daily',
    targetLimit: 45,
    unit: 'Minutes',
    reminders: ['07:30', '17:30'],
    createdAt: new Date('2026-06-01T07:20:00.000Z').toISOString(),
  },
  {
    id: 'g-coding',
    name: 'Complete Mobile App UI Design',
    startDate: '2026-06-01',
    endDate: '2026-06-18',
    type: 'one-time',
    reminders: ['10:00'],
    completed: false,
    createdAt: new Date('2026-06-01T08:00:00.000Z').toISOString(),
  },
  {
    id: 'g-trip',
    name: 'Book Summer Vacation Tickets',
    startDate: '2026-06-01',
    endDate: '2026-06-25',
    type: 'one-time',
    reminders: ['12:00'],
    completed: true,
    completedAt: '2026-06-12',
    createdAt: new Date('2026-06-01T08:30:00.000Z').toISOString(),
  },
];

// Populate status helper
const createProgress = (goalId: string, date: string, value: number, target: number): ProgressEntry => {
  let status: 'not-done' | 'partially-done' | 'completed' = 'not-done';
  if (value >= target) {
    status = 'completed';
  } else if (value > 0) {
    status = 'partially-done';
  }
  return { goalId, date, value, status };
};

// Past history progress values mapping for index days
export const DEFAULT_PROGRESS: ProgressEntry[] = [
  // g-water: Target 3 Liters
  createProgress('g-water', '2026-06-01', 3, 3),
  createProgress('g-water', '2026-06-02', 3, 3),
  createProgress('g-water', '2026-06-03', 1, 3),
  createProgress('g-water', '2026-06-04', 3, 3),
  createProgress('g-water', '2026-06-05', 0, 3),
  createProgress('g-water', '2026-06-06', 3, 3),
  createProgress('g-water', '2026-06-07', 2, 3),
  createProgress('g-water', '2026-06-08', 3, 3),
  createProgress('g-water', '2026-06-09', 3, 3),
  createProgress('g-water', '2026-06-10', 1.5, 3),
  createProgress('g-water', '2026-06-11', 3, 3),
  createProgress('g-water', '2026-06-12', 3, 3),
  createProgress('g-water', '2026-06-13', 3, 3),
  createProgress('g-water', '2026-06-14', 2, 3),
  createProgress('g-water', '2026-06-15', 1, 3), // Today

  // g-read: Target 20 Pages
  createProgress('g-read', '2026-06-01', 20, 20),
  createProgress('g-read', '2026-06-02', 0, 20),
  createProgress('g-read', '2026-06-03', 25, 20),
  createProgress('g-read', '2026-06-04', 20, 20),
  createProgress('g-read', '2026-06-05', 10, 20),
  createProgress('g-read', '2026-06-06', 20, 20),
  createProgress('g-read', '2026-06-07', 20, 20),
  createProgress('g-read', '2026-06-08', 5, 20),
  createProgress('g-read', '2026-06-09', 20, 20),
  createProgress('g-read', '2026-06-10', 20, 20),
  createProgress('g-read', '2026-06-11', 0, 20),
  createProgress('g-read', '2026-06-12', 20, 20),
  createProgress('g-read', '2026-06-13', 22, 20),
  createProgress('g-read', '2026-06-14', 15, 20),
  createProgress('g-read', '2026-06-15', 5, 20), // Today

  // g-exercise: Target 45 Minutes
  createProgress('g-exercise', '2026-06-01', 45, 45),
  createProgress('g-exercise', '2026-06-02', 45, 45),
  createProgress('g-exercise', '2026-06-03', 30, 45),
  createProgress('g-exercise', '2026-06-04', 45, 45),
  createProgress('g-exercise', '2026-06-05', 45, 45),
  createProgress('g-exercise', '2026-06-06', 0, 45),
  createProgress('g-exercise', '2026-06-07', 0, 45),
  createProgress('g-exercise', '2026-06-08', 45, 45),
  createProgress('g-exercise', '2026-06-09', 50, 45),
  createProgress('g-exercise', '2026-06-10', 45, 45),
  createProgress('g-exercise', '2026-06-11', 45, 45),
  createProgress('g-exercise', '2026-06-12', 15, 45),
  createProgress('g-exercise', '2026-06-13', 45, 45),
  createProgress('g-exercise', '2026-06-14', 60, 45),
  createProgress('g-exercise', '2026-06-15', 0, 45), // Today
];

export const DEFAULT_NOTES: Note[] = [
  {
    id: 'n-welcome',
    title: '💡 Quick Tips for My Goals App',
    content: 'Welcome to your premium goals assistant!\n\nHere are some tips to get you started:\n- Tap any card under "Daily Goals" to open the detailed drawer containing interactive streak history, calendars, customizable target views, and interactive statistics.\n- To edit or delete any goal, perform a LONG PRESS on the goal card.\n- Customize your Profile to set your biometric values and app start dates.\n- Configure reminders on both Daily and One-time goals. Reminders trigger simulated Android notifications right over your layout, which you can snooze or mark as completed directly!',
    lastModified: new Date('2026-06-15T14:00:00.000Z').toISOString(),
  },
  {
    id: 'n-workout',
    title: '🏋️‍♂️ Fitness Progress Tracking',
    content: 'My workout target is 45 minutes of anaerobic high-intensity training.\n\nKey focuses:\n1. 10 minutes active stretching.\n2. 25 minutes heavy compounds (deadlifts/squats).\n3. 10 minutes progressive volume pull-ups and core.\n\nKeep increments at 2.5kg per week. Keep persistent hydration!',
    lastModified: new Date('2026-06-12T09:30:00.000Z').toISOString(),
  },
];
