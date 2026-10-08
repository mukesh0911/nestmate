import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.resolve(__dirname, '../.auth/firebaseAuthTokens.json');

/**
 * Injects genuine Firebase Auth credentials directly into the browser's IndexedDB.
 * This guarantees Firebase Web Client SDK has an active currentUser with valid JWT token,
 * allowing live Firestore Security Rule validation on protected collections (chatRooms, messages, etc).
 */
export async function injectFirebaseAuth(page: Page, personaKey: string): Promise<void> {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(`Firebase Auth token bundle not found at ${TOKEN_FILE}. Run bootstrapFirebaseTestTokens.cjs first.`);
  }

  const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  const record = tokens[personaKey];
  if (!record) {
    throw new Error(`No Firebase Auth token record found for persona key: ${personaKey}`);
  }

  // 1. Pre-register via addInitScript for future navigations
  await page.addInitScript((rec) => {
    const req = indexedDB.open('firebaseLocalStorageDb', 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
        db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
      }
    };
    req.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction(['firebaseLocalStorage'], 'readwrite');
      const store = tx.objectStore('firebaseLocalStorage');
      store.put(rec);
    };
  }, record);

  // 2. Also ensure current origin has the record if already loaded
  await page.evaluate(async (rec) => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
        }
      };
      req.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(['firebaseLocalStorage'], 'readwrite');
        const store = tx.objectStore('firebaseLocalStorage');
        store.put(rec);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      req.onerror = () => resolve();
    });
  }, record).catch(() => {});
}
