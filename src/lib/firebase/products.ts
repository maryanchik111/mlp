import { ref, onValue, get, set, update } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { database, storage } from './config';
import { Product } from './types';
import { slugify } from './utils';

// Функція для отримання всіх товарів з Firebase
export const fetchAllProducts = async (callback: (products: Product[]) => void) => {
  try {
    const productsRef = ref(database, 'products');

    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (typeof data === 'object' && !Array.isArray(data)) {
          const products: Product[] = Object.values(data) as Product[];
          callback(products);
        } else if (Array.isArray(data)) {
          callback(data);
        } else {
          callback([]);
        }
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Помилка при завантаженні товарів:', error);
    callback([]);
  }
};

// Отримати один товар за id
export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    if (Array.isArray(data)) {
      const products = data as Product[];
      return products.find((p) => String(p.id) === String(id)) || null;
    }
    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => String(obj[k]?.id) === String(id));
    return key ? (obj[key] as Product) : null;
  } catch (error) {
    console.error('Помилка отримання товару:', error);
    return null;
  }
};

// Функція для оновлення товару
export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return false;

    const data = snapshot.val();

    if (Array.isArray(data)) {
      const products = data as Product[];
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) return false;
      const updated = { ...products[idx], ...updates } as Product;
      if (typeof updates.quantity === 'number') {
        updated.inStock = (updates.quantity ?? updated.quantity) > 0;
      }
      products[idx] = updated;
      await set(productsRef, products);
      return true;
    }

    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
    if (!key) return false;
    const productRef = ref(database, `products/${key}`);
    if (typeof updates.quantity === 'number') {
      updates = { ...updates, inStock: (updates.quantity ?? obj[key].quantity) > 0 };
    }
    await update(productRef, updates);
    return true;
  } catch (error) {
    console.error('Помилка при оновленні товару:', error);
    return false;
  }
};

// Функція для зменшення кількості товару
export const decreaseProductQuantity = async (productId: string, quantityToDecrease: number) => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return false;

    const data = snapshot.val();
    if (Array.isArray(data)) {
      const products = data as Product[];
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) return false;
      const product = products[idx];
      const newQuantity = Math.max(0, (product.quantity || 0) - quantityToDecrease);
      products[idx] = { ...product, quantity: newQuantity, inStock: newQuantity > 0 };
      await set(productsRef, products);
      return true;
    }

    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
    if (!key) return false;
    const product = obj[key];
    const newQuantity = Math.max(0, (product.quantity || 0) - quantityToDecrease);
    const productRef = ref(database, `products/${key}`);
    await update(productRef, { quantity: newQuantity, inStock: newQuantity > 0 });
    return true;
  } catch (error) {
    console.error('Помилка при зменшенні кількості товару:', error);
    return false;
  }
};

// Функція для додавання товару
export const addProduct = async (newProduct: Omit<Product, 'id' | 'inStock' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    const slugId = slugify(newProduct.name);
    const now = Date.now();

    const buildProduct = (id: string): Product => ({
      ...newProduct,
      id,
      inStock: (newProduct.quantity || 0) > 0,
      createdAt: now,
      updatedAt: now,
    });

    if (snapshot.exists()) {
      const data = snapshot.val();
      let list: Product[];
      if (Array.isArray(data)) {
        list = data as Product[];
      } else {
        list = Object.values(data as Record<string, Product>) as Product[];
      }

      let finalId = slugId;
      let counter = 1;
      while (list.some(p => p.id === finalId)) {
        finalId = `${slugId}-${counter}`;
        counter++;
      }

      const productToAdd = buildProduct(finalId);
      await set(productsRef, [...list, productToAdd]);
      return productToAdd;
    } else {
      const productToAdd = buildProduct(slugId);
      await set(productsRef, [productToAdd]);
      return productToAdd;
    }
  } catch (error) {
    console.error('Помилка при додаванні товару:', error);
    return null;
  }
};

// Функція для видалення товару
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) return false;
    const data = snapshot.val();

    let productToDelete: Product | null = null;

    if (Array.isArray(data)) {
      const products = data as Product[];
      productToDelete = products.find((p) => p.id === productId) || null;
      const updated = products.filter((p) => p.id !== productId);
      if (updated.length === products.length) return false;
      await set(productsRef, updated);
    } else {
      const obj: Record<string, Product> = data as any;
      const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
      if (!key) return false;
      productToDelete = obj[key];
      delete obj[key];
      const list: Product[] = Object.values(obj);
      await set(productsRef, list);
    }

    if (productToDelete && productToDelete.images && productToDelete.images.length > 0) {
      for (const imageUrl of productToDelete.images) {
        try {
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
          }
        } catch (err) {
          console.warn('Не вдалося видалити фото:', err);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Помилка при видаленні товару:', error);
    return false;
  }
};
