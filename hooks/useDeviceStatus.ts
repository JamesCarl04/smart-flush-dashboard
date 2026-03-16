"use client";

import { useState, useEffect } from "react";

export function useDeviceStatus() {
  const [data, setData] = useState<{ status: 'online' | 'offline'; lastSeen: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK DATA IMPLEMENTATION
    const timer = setTimeout(() => {
      setData({
        status: 'online',
        lastSeen: Date.now() - 5000, // 5 seconds ago
      });
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return { ...data, loading };
}
