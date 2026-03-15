// app/api/automation-rules/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-helpers';

interface RouteParams {
  params: { id: string };
}

interface UpdateRuleBody {
  name?: string;
  threshold?: number;
  action?: string;
  enabled?: boolean;
}

// PUT /api/automation-rules/:id — update (enable/disable, threshold, etc.)
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const body = (await request.json()) as UpdateRuleBody;
    const updates: UpdateRuleBody = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.threshold !== undefined) updates.threshold = body.threshold;
    if (body.action !== undefined) updates.action = body.action;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('automationRules').doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    await docRef.update(updates);
    const updated = await docRef.get();

    return NextResponse.json({ success: true, data: updated.data() });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[AutomationRules] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE /api/automation-rules/:id
export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);

    const docRef = adminDb.collection('automationRules').doc(params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[AutomationRules] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete rule' }, { status: 500 });
  }
}
