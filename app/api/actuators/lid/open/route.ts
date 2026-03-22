// app/api/actuators/lid/open/route.ts
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-helpers';
import { publishLidCommand } from '@/lib/mqtt-publish';

// POST /api/actuators/lid/open
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await verifyAuthToken(request);
    await publishLidCommand('OPEN');
    return NextResponse.json({ success: true, data: { command: 'OPEN' } });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, error);
    console.error('[Actuators] lid/open error:', error);
    return NextResponse.json({ success: false, error: 'Failed to publish lid OPEN command' }, { status: 500 });
  }
}
