"use client";

import { useState, useEffect } from "react";

type SystemState = 'standby' | 'lid_open' | 'flushing' | 'uv_active';

export function useSystemState() {
  const [systemState, setSystemState] = useState<SystemState>('standby');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK DATA IMPLEMENTATION
    const timer = setTimeout(() => {
      setSystemState('standby');
      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return { systemState, loading };
}
