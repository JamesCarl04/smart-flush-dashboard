'use client';

import { useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'smartflush-presentation-mode';
const COOKIE_NAME = 'presentation-mode';

function readPresentationModeFromBrowser() {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  const demoParam = url.searchParams.get('demo');
  if (demoParam === '1') {
    return true;
  }

  if (demoParam === '0') {
    return false;
  }

  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

function subscribeToPresentationMode(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function usePresentationMode() {
  const presentationMode = useSyncExternalStore(
    subscribeToPresentationMode,
    readPresentationModeFromBrowser,
    () => false,
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demoParam = new URL(window.location.href).searchParams.get('demo');

      if (demoParam === '1') {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } else if (demoParam === '0') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    if (presentationMode) {
      document.cookie = `${COOKIE_NAME}=1; path=/; max-age=86400; SameSite=Lax`;
      return;
    }

    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }, [presentationMode]);

  return presentationMode;
}
