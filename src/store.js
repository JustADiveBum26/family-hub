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

// Each key is written as its own top-level field via updateDoc, which is an
// atomic per-field operation in Firestore. This avoids the read-modify-write
// race that occurs when two saves happen close together and both read the
// same snapshot before either write lands (one save would silently revert
// the other's change). updateDoc only touches the field being set.
const store = {
  save: async (k,v) => {
    try {
      const ref = doc(db, "appdata", FAMILY_DOC);
      try {
        await updateDoc(ref, { [k]: JSON.stringify(v) });
      } catch(inner) {
        // Document doesn't exist yet on first-ever save — create it.
        await setDoc(ref, { [k]: JSON.stringify(v) }, { merge: true });
      }
    } catch(e) { console.error("Firebase save error:", e); }
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
