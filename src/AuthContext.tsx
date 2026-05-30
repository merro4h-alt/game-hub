import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useAlert } from './contexts/AlertContext';
import { auth, checkIfAdmin, loginWithGoogle, loginWithEmail as signInWithEmail, logout, onAuthStateListener } from './lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
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
          
          // If logged in via email/password, verify that they are an admin
          const isEmailProvider = currentUser.providerData?.some(p => p.providerId === 'password');
          if (isEmailProvider && !adminStatus) {
            console.warn("Non-admin user signed in using email provider, logging out...");
            if (isMounted) {
              setUser(null);
              setIsAdmin(false);
              setLoading(false);
            }
            await logout();
            showAlert(i18n.language === 'ar' 
              ? 'تسجيل الدخول بالبريد الإلكتروني مخصص للمشرفين فقط.' 
              : 'Email sign-in is restricted to administrators only.', 'error');
            return;
          }

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
    } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      showAlert(i18n.language === 'ar'
        ? 'بيانات الاعتماد غير صالحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.'
        : 'Invalid credentials. Please verify your email and password.');
    } else if (errorCode === 'auth/user-not-found') {
      showAlert(i18n.language === 'ar'
        ? 'البريد الإلكتروني المدخل غير مسجل.'
        : 'The entered email is not registered.');
    } else if (errorCode === 'auth/invalid-email') {
      showAlert(i18n.language === 'ar'
        ? 'البريد الإلكتروني غير صالح.'
        : 'Invalid email address.');
    } else if (errorCode === 'auth/too-many-requests') {
      showAlert(i18n.language === 'ar'
        ? 'تم حظر الوصول إلى هذا الحساب مؤقتًا بسبب كثرة محاولات تسجيل الدخول الفاشلة.'
        : 'Too many failed login attempts. Access to this account has been temporarily blocked.');
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

  const loginWithEmail = async (email: string, password: string) => {
    try {
      console.log("Initiating email login process for:", email);
      const loggedUser = await signInWithEmail(email, password);
      if (loggedUser) {
        console.log("Logged in with email, UID:", loggedUser.uid);
        const adminStatus = await checkIfAdmin(loggedUser);
        if (!adminStatus) {
          console.warn("Non-admin user tried to sign in using email provider inside loginWithEmail. Signing out...");
          await logout();
          showAlert(i18n.language === 'ar' 
            ? 'تسجيل الدخول بالبريد الإلكتروني مخصص للمشرفين فقط.' 
            : 'Email sign-in is restricted to administrators only.', 'error');
          throw new Error(i18n.language === 'ar' 
            ? 'هذا الحساب ليس له صلاحيات المسؤول.' 
            : 'This account does not have admin privileges.');
        }
      }
    } catch (error: any) {
      handleLoginError(error);
      throw error;
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
    <AuthContext.Provider value={{ user, isAdmin, loading, login, loginWithEmail, signout }}>
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
