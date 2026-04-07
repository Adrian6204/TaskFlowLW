import React, { createContext, useContext, useState, useEffect } from 'react';

interface PWAContextType {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<boolean>;
  sessionPromptHidden: boolean;
  setSessionPromptHidden: (hidden: boolean) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [sessionPromptHidden, setSessionPromptHiddenState] = useState(
    sessionStorage.getItem('pwa_prompt_session_hidden') === 'true'
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA: beforeinstallprompt event fired');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('PWA: App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check for display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const setSessionPromptHidden = (hidden: boolean) => {
    setSessionPromptHiddenState(hidden);
    sessionStorage.setItem('pwa_prompt_session_hidden', hidden ? 'true' : 'false');
  };

  const install = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: Install requested but no deferredPrompt available');
      return false;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setSessionPromptHidden(true);
      return true;
    }
    return false;
  };

  return (
    <PWAContext.Provider 
      value={{ 
        canInstall: !!deferredPrompt, 
        isInstalled, 
        install,
        sessionPromptHidden,
        setSessionPromptHidden
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWADirect = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
