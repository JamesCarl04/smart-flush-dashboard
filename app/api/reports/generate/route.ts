// app/api/reports/generate/route.ts
// POST /api/reports/generate — generates CSV, JSON, or PDF reports from Firestore data
// Forced to nodejs runtime because @react-pdf/renderer requires Node.js APIs
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { FlushEventRow, UVCycleRow } from '@/lib/pdf-report';

interface ReportBody {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  from: string;
  to: string;
  format: 'csv' | 'json' | 'pdf';
}

interface FlushEventDoc {
  id: string;
  deviceId: string;
  waterVolume: number;
  duration: number;
  timestamp: Timestamp;
}

interface UVCycleDoc {
  id: string;
  deviceId: string;
  duration: number;
  completed: boolean;
  timestamp: Timestamp;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchReportData(fromTs: Timestamp, toTs: Timestamp) {
  const [flushSnap, uvSnap] = await Promise.all([
    adminDb
      .collection('flushEvents')
      .where('timestamp', '>=', fromTs)
      .where('timestamp', '<=', toTs)
      .orderBy('timestamp', 'asc')
      .get(),
    adminDb
      .collection('uvCycles')
      .where('timestamp', '>=', fromTs)
      .where('timestamp', '<=', toTs)
      .orderBy('timestamp', 'asc')
      .get(),
  ]);

  const flushEvents = flushSnap.docs.map((d) => d.data() as FlushEventDoc);
  const uvCycles = uvSnap.docs.map((d) => d.data() as UVCycleDoc);

  return { flushEvents, uvCycles };
}

// ─── Format builders ──────────────────────────────────────────────────────────

function buildCSV(flushEvents: FlushEventDoc[], uvCycles: UVCycleDoc[]): string {
  const lines: string[] = [];

  lines.push('--- FLUSH EVENTS ---');
  lines.push('id,deviceId,waterVolume,duration,timestamp');
  for (const e of flushEvents) {
    lines.push(
      `${e.id},${e.deviceId},${e.waterVolume},${e.duration},${e.timestamp.toDate().toISOString()}`
    );
  }

  lines.push('');
  lines.push('--- UV CYCLES ---');
  lines.push('id,deviceId,duration,completed,timestamp');
  for (const c of uvCycles) {
    lines.push(
      `${c.id},${c.deviceId},${c.duration},${c.completed},${c.timestamp.toDate().toISOString()}`
    );
  }

  return lines.join('\n');
}

function buildJSON(flushEvents: FlushEventDoc[], uvCycles: UVCycleDoc[]) {
  const totalWater = flushEvents.reduce((s, e) => s + (e.waterVolume ?? 0), 0);
  const uvCompleted = uvCycles.filter((c) => c.completed).length;

  return {
    summary: {
      totalFlushes: flushEvents.length,
      totalWaterLiters: Math.round(totalWater * 100) / 100,
      uvCycles: uvCycles.length,
      uvCompletionRate:
        uvCycles.length === 0
          ? 100
          : Math.round((uvCompleted / uvCycles.length) * 10000) / 100,
    },
    flushEvents: flushEvents.map((e) => ({
      ...e,
      timestamp: e.timestamp.toDate().toISOString(),
    })),
    uvCycles: uvCycles.map((c) => ({
      ...c,
      timestamp: c.timestamp.toDate().toISOString(),
    })),
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse | Response> {
  try {
    const user = await verifyAuthToken(request);
    const body = (await request.json()) as Partial<ReportBody>;
    const { type, from, to, format } = body;

    if (!type || !from || !to || !format) {
      return NextResponse.json(
        { success: false, error: 'type, from, to, and format are required' },
        { status: 400 }
      );
    }

    const validFormats = ['csv', 'json', 'pdf'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: 'format must be csv, json, or pdf' },
        { status: 400 }
      );
    }

    const fromTs = Timestamp.fromDate(new Date(`${from}T00:00:00.000Z`));
    const toTs = Timestamp.fromDate(new Date(`${to}T23:59:59.999Z`));

    const { flushEvents, uvCycles } = await fetchReportData(fromTs, toTs);

    // Save report metadata
    const reportRef = adminDb.collection('reports').doc();
    await reportRef.set({
      id: reportRef.id,
      type,
      from,
      to,
      format,
      userId: user.uid,
      generatedAt: FieldValue.serverTimestamp(),
    });

    // Build and stream the file
    if (format === 'csv') {
      const csv = buildCSV(flushEvents, uvCycles);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="smart-flush-${from}-${to}.csv"`,
        },
      });
    }

    if (format === 'json') {
      const json = buildJSON(flushEvents, uvCycles);
      return new Response(JSON.stringify(json, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="smart-flush-${from}-${to}.json"`,
        },
      });
    }

    // PDF — delegate to shared tsx helper (no JSX in .ts files)
    const { generatePDFBuffer } = await import('@/lib/pdf-report');

    const flushRows: FlushEventRow[] = flushEvents.map((e) => ({
      id: e.id,
      deviceId: e.deviceId,
      waterVolume: e.waterVolume,
      duration: e.duration,
      timestamp: e.timestamp.toDate().toISOString(),
    }));

    const uvRows: UVCycleRow[] = uvCycles.map((c) => ({
      id: c.id,
      deviceId: c.deviceId,
      duration: c.duration,
      completed: c.completed,
      timestamp: c.timestamp.toDate().toISOString(),
    }));

    const pdfBuffer = await generatePDFBuffer(from, to, flushRows, uvRows);
    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="smart-flush-${from}-${to}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[Reports] generate error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
