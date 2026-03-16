"use client";

import { useState, useEffect } from "react";
import { subMinutes, subHours, subDays } from "date-fns";

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AlertEvent = {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: Date;
  acknowledged: boolean;
};

// Global mock state to allow updates across the app (like Acknowledge)
let mockAlertsDB: AlertEvent[] = [
  { id: '101', title: 'Water Leak Detected', description: 'Continuous flow detected for > 5 minutes. Immediate attention required.', severity: 'critical', timestamp: subMinutes(new Date(), 12), acknowledged: false },
  { id: '102', title: 'Offline Device', description: 'Controller lost connection to the network.', severity: 'high', timestamp: subHours(new Date(), 2), acknowledged: false },
  { id: '103', title: 'UV Lamp Degradation', description: 'UV lamp runtime approaching 1000 hours limit.', severity: 'medium', timestamp: subDays(new Date(), 1), acknowledged: true },
  { id: '104', title: 'Filter Maintenance', description: 'Usage counter exceeded 5000 flushes.', severity: 'low', timestamp: subDays(new Date(), 3), acknowledged: true },
  { id: '105', title: 'Power Surge Detected', description: 'Brief interruption in power supply detected.', severity: 'high', timestamp: subDays(new Date(), 5), acknowledged: true },
];

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    // Simulate latency
    setLoading(true);
    setTimeout(() => {
      setAlerts([...mockAlertsDB]);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const acknowledgeAlert = async (id: string | 'ALL') => {
    try {
      if (id === 'ALL') {
        mockAlertsDB = mockAlertsDB.map(a => ({ ...a, acknowledged: true }));
      } else {
        const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
        if (!res.ok) throw new Error();
        mockAlertsDB = mockAlertsDB.map(a => a.id === id ? { ...a, acknowledged: true } : a);
      }
      // Optimistic upate locally
      setAlerts([...mockAlertsDB]);
      return true;
    } catch {
      return false;
    }
  };

  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  return { alerts, unreadCount, loading, acknowledgeAlert, refresh: fetchAlerts };
}
