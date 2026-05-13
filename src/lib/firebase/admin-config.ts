import 'server-only';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK using environment variables
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    // Only initialize if we have the necessary credentials
    // This prevents build errors during static generation when env vars might be missing
    if (serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      });
    } else {
      console.warn('Firebase Admin SDK missing credentials. Skipping initialization during build.');
    }
  } catch (error) {
    console.warn('Firebase Admin SDK initialization error (likely during build):', error);
  }
}

export default admin;

