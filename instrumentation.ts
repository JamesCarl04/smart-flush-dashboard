export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Lazy load MQTT client singleton to start background subscribing processes
        // as soon as the Next.js server boots up.
        await import('./lib/mqtt-client');
        console.log('Next.js Instrumentation: MQTT Singleton Initialized');
    }
}
