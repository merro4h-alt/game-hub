import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard login helper
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error in helper:", error);
    throw error;
  }
};


// Logout helper
export const logout = () => signOut(auth);

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
  try {
    // Only test if we are not in a production build or if we want to verify config
    console.log("Testing Firebase connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error) {
    console.warn("Firebase connection test notice (this may happen if domain is not authorized yet):", error);
  }
}
testConnection();
