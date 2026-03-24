// lib/pdf-report.tsx
// Server-side PDF generation using @react-pdf/renderer
// Must be imported only in nodejs runtime routes (never Edge)
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export interface FlushEventRow {
  id: string;
  deviceId: string;
  waterVolume: number;
  duration: number;
  timestamp: string; // ISO string
}

export interface UVCycleRow {
  id: string;
  deviceId: string;
  duration: number;
  completed: boolean;
  timestamp: string; // ISO string
}

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica' },
  title: { fontSize: 20, marginBottom: 16 },
  period: { fontSize: 11, marginBottom: 16 },
  section: { marginBottom: 12 },
  heading: { fontSize: 14, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 200, fontSize: 11 },
  value: { fontSize: 11 },
  small: { fontSize: 10, color: 'grey' },
});

interface ReportProps {
  from: string;
  to: string;
  flushEvents: FlushEventRow[];
  uvCycles: UVCycleRow[];
}

function ReportDocument({ from, to, flushEvents, uvCycles }: ReportProps) {
  const totalWater = flushEvents.reduce((s, e) => s + (e.waterVolume ?? 0), 0);
  const uvCompleted = uvCycles.filter((c) => c.completed).length;
  const uvRate =
    uvCycles.length === 0 ? '100%' : `${Math.round((uvCompleted / uvCycles.length) * 100)}%`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Smart Flush System Report</Text>
        <Text style={styles.period}>Period: {from} to {to}</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Flushes:</Text>
            <Text style={styles.value}>{flushEvents.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Water Used:</Text>
            <Text style={styles.value}>{Math.round(totalWater * 100) / 100} L</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>UV Cycles:</Text>
            <Text style={styles.value}>{uvCycles.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>UV Completion Rate:</Text>
            <Text style={styles.value}>{uvRate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Flush Events ({flushEvents.length})</Text>
          {flushEvents.slice(0, 20).map((e) => (
            <View key={e.id} style={styles.row}>
              <Text style={styles.label}>{e.timestamp.slice(0, 16)}</Text>
              <Text style={styles.value}>{e.waterVolume} L — {e.duration}s</Text>
            </View>
          ))}
          {flushEvents.length > 20 && (
            <Text style={styles.small}>… and {flushEvents.length - 20} more</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

/**
 * Renders the report PDF and returns a Uint8Array buffer.
 * Call only from nodejs-runtime API routes.
 */
export async function generatePDFBuffer(
  from: string,
  to: string,
  flushEvents: FlushEventRow[],
  uvCycles: UVCycleRow[]
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <ReportDocument from={from} to={to} flushEvents={flushEvents} uvCycles={uvCycles} />
  );
  return new Uint8Array(buffer);
}
