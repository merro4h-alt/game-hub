import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, collection, getDocs, updateDoc, deleteDoc, setDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
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
  console.warn("Firebase initialization failed:", error);
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
 * Firestore Error Handling according to instructions
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  // Use warn instead of error to avoid triggering platform's autofix agent for handled user errors
  console.warn('Firestore Operation Handled Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
    console.warn("Login error in helper:", error);
    throw error;
  }
};

// Login with email/password helper
export const loginWithEmail = async (email: string, password: string) => {
  if (isMock) {
    throw new Error("Firebase is not correctly configured. Please check your setup.");
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.warn("Email login failed, checking if we should auto-register this admin:", error);
    
    const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || 'kmerro25@gmail.com,merro4h@gmail.com';
    const whitelistedEmails = adminEmailsEnv.split(',').map((e: string) => e.trim().toLowerCase());
    const isAdminEmail = whitelistedEmails.some(e => e === email.toLowerCase());
    
    // If it's a whitelisted admin and they get a credential/not-found/wrong-password error for first sign in, try auto-registering
    if (isAdminEmail && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
      try {
        console.log("Admin email not registered as password credential. Attempting to create user...");
        const createResult = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Successfully created admin email password account:", createResult.user.uid);
        return createResult.user;
      } catch (createError: any) {
        console.error("Auto-registration of admin failed:", createError);
        if (createError.code === 'auth/email-already-in-use') {
          // If the email is in use, it means a password account exists but they typed the wrong password
          throw error; // throw the original error
        }
        throw createError;
      }
    }
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
  if (!user) {
    console.log("checkIfAdmin: No user provided");
    return false;
  }
  
  console.log("checkIfAdmin: Checking status for", user.email, " (UID:", user.uid, ")");
  
  // Whitelist based on email - case insensitive comparison just in case
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || 'kmerro25@gmail.com,merro4h@gmail.com';
  const whitelistedEmails = adminEmailsEnv.split(',').map((e: string) => e.trim().toLowerCase());
  if (user.email) {
    const isWhitelisted = whitelistedEmails.some(e => e === user.email?.toLowerCase());
    console.log("checkIfAdmin: User email is", user.email, "Matched whitelist:", isWhitelisted);
    if (isWhitelisted) return true;
  }
  
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    const exists = adminDoc.exists();
    console.log("checkIfAdmin: Admin document exists:", exists);
    return exists;
  } catch (error) {
    console.warn("Error checking admin status from Firestore:", error);
    // If it's a permission error, it means we definitely aren't an admin 
    // according to rules (unless rules are broken)
    return false;
  }
};

// Connection test removed for stability
/*
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
*/
