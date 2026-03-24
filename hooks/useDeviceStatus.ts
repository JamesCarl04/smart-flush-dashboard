"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useDeviceStatus(deviceId = "toilet-01") {
  const { user } = useAuth();
  const [data, setData] = useState<{ status: 'online' | 'offline'; lastSeen: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`/api/devices/${deviceId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        // Device doesn't exist in Firestore yet — show offline
        setData({ status: 'offline', lastSeen: 0 });
        return;
      }

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const json = await res.json();
      if (json.success && json.data) {
        setData({
          status: json.data.status,
          lastSeen: json.data.lastSeen?._seconds ? json.data.lastSeen._seconds * 1000 : Date.now(),
        });
      }
    } catch (err) {
      console.error("[useDeviceStatus] error:", err);
      setData({ status: 'offline', lastSeen: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, deviceId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { ...data, loading };
}
