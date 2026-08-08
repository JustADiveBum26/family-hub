import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCo5EqGCkFd-U5O1JKxtoW5N5AEC2TzONQ",
  authDomain: "family-hub-49194.firebaseapp.com",
  projectId: "family-hub-49194",
  storageBucket: "family-hub-49194.firebasestorage.app",
  messagingSenderId: "1085739826349",
  appId: "1:1085739826349:web:1da0c504712cbb6f54da24"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const FAMILY_DOC = "family-hub-data";

// Saves that fail (offline, dropped connection, etc.) used to just vanish —
// console.error'd and never retried, silently losing whatever someone typed.
// Now a failed save is kept (last value wins per key) in a queue that's
// persisted to localStorage so it survives a reload/kiosk restart, and is
// retried on a timer and whenever the browser regains connectivity.
const QUEUE_KEY = "fp2:_pendingSaves";
let pendingQueue = {};
try { pendingQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "{}"); } catch(e) { pendingQueue = {}; }
const persistQueue = () => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(pendingQueue)); } catch(e) {} };

let listeners = [];
const notify = (status) => listeners.forEach(fn => fn(status));
const pendingCount = () => Object.keys(pendingQueue).length;

const rawSave = async (k, v) => {
  try {
    const ref = doc(db, "appdata", FAMILY_DOC);
    try {
      await updateDoc(ref, { [k]: JSON.stringify(v) });
    } catch(inner) {
      // Document doesn't exist yet on first-ever save — create it.
      await setDoc(ref, { [k]: JSON.stringify(v) }, { merge: true });
    }
    return true;
  } catch(e) { console.error("Firebase save error:", e); return false; }
};

let flushTimer = null;
const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    const keys = Object.keys(pendingQueue);
    if (keys.length === 0) { clearInterval(flushTimer); flushTimer = null; return; }
    for (const k of keys) {
      const ok = await rawSave(k, pendingQueue[k]);
      if (ok) { delete pendingQueue[k]; persistQueue(); }
    }
    notify(pendingCount() > 0 ? { state: "error", pending: pendingCount() } : { state: "saved", pending: 0 });
  }, 20000);
};
if (typeof window !== "undefined") {
  window.addEventListener("online", scheduleFlush);
}
if (pendingCount() > 0) scheduleFlush();

// Each key is written as its own top-level field via updateDoc, which is an
// atomic per-field operation in Firestore. This avoids the read-modify-write
// race that occurs when two saves happen close together and both read the
// same snapshot before either write lands (one save would silently revert
// the other's change). updateDoc only touches the field being set.
const store = {
  // Lets UI show a small "couldn't save" indicator instead of failing silently.
  subscribe: (fn) => { listeners.push(fn); return () => { listeners = listeners.filter(f => f !== fn); }; },
  save: async (k, v) => {
    const ok = await rawSave(k, v);
    if (ok) {
      delete pendingQueue[k]; persistQueue();
      notify({ state: "saved", pending: pendingCount() });
    } else {
      pendingQueue[k] = v; persistQueue();
      notify({ state: "error", pending: pendingCount() });
      scheduleFlush();
    }
  },
  load: async (k,fb) => {
    try {
      const ref = doc(db, "appdata", FAMILY_DOC);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()[k]) return JSON.parse(snap.data()[k]);
      return fb;
    } catch(e) { return fb; }
  },
  // Full export for backups: every fp2:* field, JSON-parsed into one object.
  dump: async () => {
    const ref = doc(db, "appdata", FAMILY_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    return Object.fromEntries(Object.entries(snap.data()).map(([k,v]) => {
      try { return [k, JSON.parse(v)]; } catch(e) { return [k, v]; }
    }));
  },
};

export { store, db, FAMILY_DOC };
