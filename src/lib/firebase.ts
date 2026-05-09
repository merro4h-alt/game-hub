import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any;
let db: any;
let auth: any;
let isMock = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  isMock = true;
  // Provide mock objects to prevent cascading crashes
  db = { 
    type: 'mock',
    collection: () => ({}), 
    doc: () => ({}),
  };
  auth = {
    type: 'mock',
    app: { options: {} }
  };
}

export { db, auth };

/**
 * Custom auth listener that handles both real and mock auth objects
 */
export const onAuthStateListener = (
  callback: (user: User | null) => void,
  errorCallback?: (error: any) => void
) => {
  if (isMock) {
    console.warn("Using mock auth listener");
    const timeout = setTimeout(() => callback(null), 100);
    return () => clearTimeout(timeout);
  }
  return onAuthStateChanged(auth, callback, errorCallback);
};

export const googleProvider = new GoogleAuthProvider();

// Standard login helper
export const loginWithGoogle = async () => {
  if (isMock) {
    throw new Error("Firebase is not correctly configured. Please check your setup.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error in helper:", error);
    throw error;
  }
};


// Logout helper
export const logout = () => {
  if (isMock) return Promise.resolve();
  return signOut(auth);
};

// Check if user is admin
export const checkIfAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  // Whitelist based on email
  if (user.email === 'kmerro25@gmail.com') return true;
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Connection test as per instructions - made safer to not block app load
async function testConnection() {
  if (isMock) return;
  try {
    console.log("Testing Firebase connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error) {
    console.warn("Firebase connection test notice (this may happen if environment is not fully ready):", error);
  }
}
testConnection();
