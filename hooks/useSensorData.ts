"use client";

import { useState, useEffect } from "react";

export function useSensorData() {
  const [data, setData] = useState<{ ultrasonicDistance: number; waterFlowRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // MOCK DATA IMPLEMENTATION
    const timer = setTimeout(() => {
      setData({
        ultrasonicDistance: 45, // cm (>= 30 is STANDBY, < 30 is PERSON PRESENT)
        waterFlowRate: 2.5, // L/min
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { ...data, loading, error };
}
