"use client";

import { useState, useEffect } from "react";
import { subDays, subHours, format } from "date-fns";

export type DateRange = {
  from: Date;
  to: Date;
};

// Mock data structures
export type FlushCountData = { date: string; count: number };
export type VolumeData = { date: string; liters: number };
export type UvData = { name: string; value: number };
export type HourlyData = { hour: string; count: number };
export type UptimeData = { date: string; uptime: number };

export type AnalyticsData = {
  summary: {
    totalFlushes: number;
    totalWater: number;
    uvCompletion: number;
    avgFlushesPerDay: number;
    systemUptime: number;
  };
  charts: {
    flushCounts: FlushCountData[];
    waterVolume: VolumeData[];
    uvStats: UvData[];
    hourlyUsage: HourlyData[];
    uptimeStats: UptimeData[];
  };
};

export function useAnalytics(range: DateRange) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // MOCK DATA GENERATION
    // In a real app, this would fetch from /api/analytics/...
    // passing the range.from and range.to
    const timer = setTimeout(() => {
      try {
        const daysDiff = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Generate mock chart data based on days range
        const mockFlushCounts: FlushCountData[] = Array.from({ length: daysDiff }).map((_, i) => ({
          date: format(subDays(range.to, daysDiff - 1 - i), 'MMM dd'),
          count: Math.floor(Math.random() * 50) + 10
        }));

        const mockWaterVolume: VolumeData[] = mockFlushCounts.map((f) => ({
          date: f.date,
          liters: Number((f.count * 1.5 + Math.random() * 5).toFixed(1))
        }));

        const totalFlushes = mockFlushCounts.reduce((acc, curr) => acc + curr.count, 0);
        const totalWater = Number(mockWaterVolume.reduce((acc, curr) => acc + curr.liters, 0).toFixed(1));

        const mockUvStats: UvData[] = [
          { name: 'Completed', value: totalFlushes * 0.95 },
          { name: 'Failed', value: totalFlushes * 0.05 },
        ];

        const mockHourlyUsage: HourlyData[] = Array.from({ length: 24 }).map((_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          count: Math.floor(Math.random() * (i > 6 && i < 22 ? 20 : 5))
        }));

        const mockUptimeStats: UptimeData[] = mockFlushCounts.map((f) => ({
          date: f.date,
          uptime: Number((98 + Math.random() * 2).toFixed(2))
        }));

        setData({
          summary: {
            totalFlushes,
            totalWater,
            uvCompletion: 95.0, // Fixed % for simplicity
            avgFlushesPerDay: Math.floor(totalFlushes / daysDiff),
            systemUptime: 99.7
          },
          charts: {
            flushCounts: mockFlushCounts,
            waterVolume: mockWaterVolume,
            uvStats: mockUvStats,
            hourlyUsage: mockHourlyUsage,
            uptimeStats: mockUptimeStats
          }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [range.from.getTime(), range.to.getTime()]);

  return { data, loading, error };
}
