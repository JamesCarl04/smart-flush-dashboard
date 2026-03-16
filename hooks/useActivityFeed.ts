"use client";

import { useState, useEffect } from "react";

export type ActivityEvent = {
  id: string;
  type: 'lidEvent' | 'flushEvent' | 'uvCycle';
  timestamp: Date;
  details: string;
};

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK DATA IMPLEMENTATION
    const timer = setTimeout(() => {
      setEvents([
        {
          id: '1',
          type: 'flushEvent',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
          details: 'Manual flush activated',
        },
        {
          id: '2',
          type: 'lidEvent',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
          details: 'Lid opened',
        },
        {
          id: '3',
          type: 'lidEvent',
          timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
          details: 'Lid closed',
        },
        {
          id: '4',
          type: 'uvCycle',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          details: 'UV cycle completed',
        }
      ]);
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return { events, loading };
}
