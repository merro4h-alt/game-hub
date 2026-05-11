import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/ui/CustomAlert';

interface AlertContextType {
  showAlert: (message: string, type?: 'error' | 'success' | 'info') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info'
  });

  const showAlert = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setAlertConfig({
      isOpen: true,
      message,
      type
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
