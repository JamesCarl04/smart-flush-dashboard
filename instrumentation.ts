// instrumentation.ts (Next.js 14 server instrumentation hook)
// This file runs once when the Next.js server starts.
// It boots the MQTT singleton so it is alive for the lifetime of the process.
export async function register(): Promise<void> {
  // Only boot MQTT on the Node.js runtime, not in the Edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getMqttClient } = await import('@/lib/mqtt-client');
    getMqttClient();
    console.log('[Instrumentation] MQTT client initialised');
  }
}
