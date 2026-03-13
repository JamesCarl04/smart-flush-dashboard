import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK from env vars for server-side API routes
// Handle already-initialized case to avoid re-initialization errors
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                // Ensure literal newlines from env are parsed correctly
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

const adminApp = admin.app();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminApp, adminDb, adminAuth };
