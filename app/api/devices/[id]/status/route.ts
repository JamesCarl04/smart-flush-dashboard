// app/api/devices/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/devices/:id/status
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);
    const { id } = await params;

    const doc = await adminDb.collection('devices').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      success: true,
      data: {
        status: data?.status ?? 'offline',
        lastSeen: data?.lastSeen ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Devices] GET/:id/status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 });
  }
}
