import 'server-only';
import admin from 'firebase-admin';

export function getAdminDb() {
  if (!admin.apps.length) {
    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (rawPrivateKey && rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) {
      rawPrivateKey = rawPrivateKey.slice(1, -1);
    }

    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: rawPrivateKey?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
      throw new Error('Firebase Admin SDK missing credentials.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    });
  }

  return admin.database();
}

