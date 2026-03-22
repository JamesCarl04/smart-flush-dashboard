// app/api/alerts/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';
import { FieldValue } from 'firebase-admin/firestore';

interface CreateAlertBody {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  deviceId: string;
}

// GET /api/alerts?acknowledged=false
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const { searchParams } = new URL(request.url);
    const acknowledgedParam = searchParams.get('acknowledged');

    let query = adminDb.collection('alerts').orderBy('timestamp', 'desc') as FirebaseFirestore.Query;

    if (acknowledgedParam === 'false') {
      query = query.where('acknowledged', '==', false);
    } else if (acknowledgedParam === 'true') {
      query = query.where('acknowledged', '==', true);
    }

    const snap = await query.get();
    const alerts = snap.docs.map((d) => d.data());

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Alerts] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/alerts — create alert
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const body = (await request.json()) as Partial<CreateAlertBody>;
    const { type, message, severity, deviceId } = body;

    if (!type || !message || !severity || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'type, message, severity, and deviceId are required' },
        { status: 400 }
      );
    }

    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'severity must be low, medium, or high' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('alerts').doc();
    await docRef.set({
      id: docRef.id,
      type,
      message,
      severity,
      acknowledged: false,
      deviceId,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, data: { id: docRef.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Alerts] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
  }
}
