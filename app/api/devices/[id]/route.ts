// app/api/devices/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';

interface RouteParams {
  params: { id: string };
}

interface UpdateDeviceBody {
  name?: string;
  description?: string;
  config?: Record<string, string | number | boolean>;
}

// GET /api/devices/:id
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const doc = await adminDb.collection('devices').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Devices] GET/:id error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch device' }, { status: 500 });
  }
}

// PUT /api/devices/:id — update name, description, or config
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const body = (await request.json()) as UpdateDeviceBody;
    const updates: UpdateDeviceBody = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.config !== undefined) updates.config = body.config;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('devices').doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    await docRef.update(updates);
    const updated = await docRef.get();

    return NextResponse.json({ success: true, data: updated.data() });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Devices] PUT/:id error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update device' }, { status: 500 });
  }
}

// DELETE /api/devices/:id
export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const docRef = adminDb.collection('devices').doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Devices] DELETE/:id error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete device' }, { status: 500 });
  }
}
