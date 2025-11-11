// Script to upload products from products.json to Firebase
// Run with: node scripts/upload-products.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Firebase configuration - make sure to set your environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Read products.json
const productsPath = path.join(__dirname, '..', 'public', 'products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

async function uploadProducts() {
  try {
    console.log('📦 Завантаження товарів у Firebase...');
    
    const productsRef = ref(database, 'products');
    
    // Upload products array to Firebase
    await set(productsRef, productsData.products);
    
    console.log('✅ Товари успішно завантажено!');
    console.log(`📊 Завантажено ${productsData.products.length} товарів`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка при завантаженні:', error);
    process.exit(1);
  }
}

uploadProducts();
