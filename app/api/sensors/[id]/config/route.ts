// app/api/sensors/[id]/config/route.ts
// PUT /api/sensors/:id/config — update sensor config in Firestore + push to ESP32 via MQTT
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';
import { publishConfigUpdate } from '@/lib/mqtt-publish';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ConfigBody {
  pumpDuration?: number;
  uvDuration?: number;
  threshold?: number;
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);
    const { id } = await params;

    const body = (await request.json()) as ConfigBody;
    const { pumpDuration, uvDuration, threshold } = body;

    if (
      pumpDuration === undefined &&
      uvDuration === undefined &&
      threshold === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'At least one config field is required (pumpDuration, uvDuration, threshold)' },
        { status: 400 }
      );
    }

    // Fetch existing device to merge config
    const docRef = adminDb.collection('devices').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }

    const existingConfig = (doc.data()?.config as Record<string, number>) ?? {};
    const mergedConfig = {
      pumpDuration: pumpDuration ?? (existingConfig.pumpDuration as number) ?? 5,
      uvDuration: uvDuration ?? (existingConfig.uvDuration as number) ?? 30,
      threshold: threshold ?? (existingConfig.threshold as number) ?? 30,
    };

    // Update Firestore
    await docRef.update({ config: mergedConfig });

    // Push config to ESP32 via MQTT
    await publishConfigUpdate(mergedConfig);

    return NextResponse.json({ success: true, data: { deviceId: id, config: mergedConfig } });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Sensors] config PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
