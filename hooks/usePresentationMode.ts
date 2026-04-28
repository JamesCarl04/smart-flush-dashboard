'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'smartflush-presentation-mode';
const COOKIE_NAME = 'presentation-mode';

function readPresentationModeFromBrowser() {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  const demoParam = url.searchParams.get('demo');

  if (demoParam === '1') {
    sessionStorage.setItem(STORAGE_KEY, '1');
    return true;
  }

  if (demoParam === '0') {
    sessionStorage.removeItem(STORAGE_KEY);
    return false;
  }

  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function usePresentationMode() {
  const [presentationMode] = useState(readPresentationModeFromBrowser);

  useEffect(() => {
    if (presentationMode) {
      document.cookie = `${COOKIE_NAME}=1; path=/; max-age=86400; SameSite=Lax`;
      return;
    }

    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }, [presentationMode]);

  return presentationMode;
}
