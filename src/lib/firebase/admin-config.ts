import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

export const adminDb = admin.database();
export const adminAuth = admin.auth();
export default admin;
