// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // Firebase Auth is session-less on the server side when using ID tokens.
  // Client-side signOut() handles token invalidation.
  // This endpoint clears any session cookies if they are set.
  const response = NextResponse.json({ success: true });

  // Clear session cookie if used
  response.cookies.delete('session');

  return response;
}
