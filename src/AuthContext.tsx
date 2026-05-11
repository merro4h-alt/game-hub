import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useAlert } from './contexts/AlertContext';
import { auth, checkIfAdmin, loginWithGoogle, logout, onAuthStateListener } from './lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { showAlert } = useAlert();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log("AuthProvider mounted, subcribing to auth changes...");
    
    const unsubscribe = onAuthStateListener(async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email || 'Logged out');
      if (!isMounted) return;
      
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const adminStatus = await checkIfAdmin(currentUser);
          console.log("Admin status for", currentUser.email, ":", adminStatus);
          if (isMounted) setIsAdmin(adminStatus);
        } catch (error) {
          console.warn("Auth check failed", error);
          if (isMounted) setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
      console.log("Auth loading finished.");
    }, (error) => {
      console.warn("Auth status change error:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);


  const handleLoginError = (error: any) => {
    console.warn("Auth process error:", error);
    const projectId = (auth.app.options as any).projectId;
    const currentDomain = window.location.hostname;
    
    // Provide a clearer message to the user
    const errorPrefix = i18n.language === 'ar' ? 'فشل تسجيل الدخول: ' : 'Login failed: ';
    const errorCode = error.code || 'unknown';
    
    if (errorCode === 'auth/popup-closed-by-user') {
      showAlert(i18n.language === 'ar' 
        ? 'تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية. يرجى المحاولة مرة أخرى.' 
        : 'Login popup was closed before completion. Please try again.');
    } else if (errorCode === 'auth/unauthorized-domain') {
      showAlert(i18n.language === 'ar'
        ? `هذا النطاق (${currentDomain}) غير مصرح به في Firebase.\n\nيرجى فتح رابط مشروعك في Firebase Console وإضافة هذا النطاق:\nhttps://console.firebase.google.com/project/${projectId}/authentication/settings`
        : `This domain (${currentDomain}) is not authorized in Firebase.\n\nPlease open your project in Firebase Console and add this domain:\nhttps://console.firebase.google.com/project/${projectId}/authentication/settings`);
    } else if (errorCode === 'auth/network-request-failed') {
      showAlert(i18n.language === 'ar' ? 'خطأ في الاتصال بالإنترنت.' : 'Network error. Check your connection.');
    } else {
      showAlert(`${errorPrefix}${error.message || errorCode}`);
    }
  };

  const login = async () => {
    try {
      console.log("Initiating login process...");
      const user = await loginWithGoogle();
      if (user) {
        // If login is successful but we need to initialize admin for the first time
        // This is a helper for the property owner
        console.log("Logged in user UID:", user.uid);
      }
    } catch (error: any) {
      handleLoginError(error);
    }
  };

  const signout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
