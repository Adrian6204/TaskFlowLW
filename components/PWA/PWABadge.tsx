import React, { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function PWABadge() {
  // check for updates every hour
  const period = 60 * 60 * 1000

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen to the browser's install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
      if (period <= 0) return
      if (r?.active?.state === 'activated') {
        setInterval(() => r.update(), period)
      } else if (r?.installing) {
        r.installing.addEventListener('statechange', (e: Event) => {
          const sw = e.target as ServiceWorker
          if (sw.state === 'activated') {
            setInterval(() => r.update(), period)
          }
        })
      }
    },
  })

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Only show the badge if there's an update, if it just got ready for offline, OR if it can be installed natively.
  const showBadge = offlineReady || needRefresh || deferredPrompt;

  return (
    <div className="PWABadge" role="alert" aria-labelledby="toast-message">
      {showBadge && (
        <div className="fixed bottom-6 right-6 z-[100] p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm animate-fade-in-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {needRefresh ? 'New update available' : deferredPrompt ? 'Install Mobile App' : 'App ready for offline'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400" id="toast-message">
                {needRefresh 
                  ? 'A new version of TaskFlow is available. Click reload to safely update your app.'
                  : deferredPrompt 
                    ? 'Install TaskFlow to your device for a native app experience and offline access.'
                    : 'TaskFlow has been downloaded and is ready for offline use.'}
              </p>
            </div>
            <div className="w-10 h-10 shrink-0 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {needRefresh ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : deferredPrompt ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                )}
              </svg>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => {
                close();
                setDeferredPrompt(null);
              }}
            >
              Dismiss
            </button>
            
            {deferredPrompt && !needRefresh && (
              <button
                className="px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                onClick={handleInstallApp}
              >
                Install App
              </button>
            )}

            {needRefresh && (
              <button
                className="px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                onClick={() => updateServiceWorker(true)}
              >
                Reload App
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PWABadge
