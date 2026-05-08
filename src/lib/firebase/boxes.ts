import { ref, onValue, get, set, update } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { database, storage } from './config';
import { BoxType, BoxItem, Product } from './types';
import { updateProduct, deleteProduct } from './products';
import { slugify } from './utils';

// BoxType CRUD
export function listenToBoxTypes(callback: (types: BoxType[]) => void): () => void {
  const boxTypesRef = ref(database, 'box_types');
  return onValue(boxTypesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const types: BoxType[] = Object.values(data) as BoxType[];
    types.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    callback(types);
  });
}

export async function fetchAllBoxTypes(): Promise<BoxType[]> {
  try {
    const snapshot = await get(ref(database, 'box_types'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    const types: BoxType[] = Object.values(data) as BoxType[];
    return types.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (e) {
    console.error('Помилка отримання типів боксів:', e);
    return [];
  }
}

export async function createBoxType(data: Omit<BoxType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const id = Date.now().toString();
    const boxTypeRef = ref(database, `box_types/${id}`);
    const now = Date.now();
    await set(boxTypeRef, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  } catch (e) {
    console.error('Помилка створення типу боксу:', e);
    return null;
  }
}

export async function updateBoxType(id: string, updates: Partial<Omit<BoxType, 'id' | 'createdAt'>>): Promise<boolean> {
  try {
    const boxTypeRef = ref(database, `box_types/${id}`);
    await update(boxTypeRef, { ...updates, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error('Помилка оновлення типу боксу:', e);
    return false;
  }
}

export async function deleteBoxType(id: string): Promise<boolean> {
  try {
    await set(ref(database, `box_types/${id}`), null);
    return true;
  } catch (e) {
    console.error('Помилка видалення типу боксу:', e);
    return false;
  }
}

// BoxItem CRUD
function cleanForFirebase<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function listenToBoxItems(callback: (items: BoxItem[]) => void): () => void {
  const boxItemsRef = ref(database, 'box_items');
  return onValue(boxItemsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const items: BoxItem[] = Object.values(data) as BoxItem[];
    items.sort((a, b) => b.createdAt - a.createdAt);
    callback(items);
  });
}

export async function fetchAllBoxItems(): Promise<BoxItem[]> {
  try {
    const snapshot = await get(ref(database, 'box_items'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    const items: BoxItem[] = Object.values(data) as BoxItem[];
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error('Помилка отримання товарів боксів:', e);
    return [];
  }
}

export async function createBoxItem(data: Omit<BoxItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const id = Date.now().toString();
    const boxItemRef = ref(database, `box_items/${id}`);
    const now = Date.now();
    await set(boxItemRef, cleanForFirebase({ ...data, id, createdAt: now, updatedAt: now }));
    return id;
  } catch (e) {
    console.error('Помилка створення товару для боксу:', e);
    return null;
  }
}

export async function updateBoxItem(id: string, updates: Partial<Omit<BoxItem, 'id' | 'createdAt'>>): Promise<boolean> {
  try {
    const boxItemRef = ref(database, `box_items/${id}`);
    await update(boxItemRef, cleanForFirebase({ ...updates, updatedAt: Date.now() }));
    return true;
  } catch (e) {
    console.error('Помилка оновлення товару боксу:', e);
    return false;
  }
}

export async function deleteBoxItem(id: string): Promise<boolean> {
  try {
    const snapshot = await get(ref(database, `box_items/${id}`));
    if (snapshot.exists()) {
      const item = snapshot.val() as BoxItem;
      const allImages = [item.image, ...(item.images || [])].filter(Boolean);
      for (const url of allImages) {
        if (url && url.includes('firebasestorage.googleapis.com')) {
          try {
            await deleteObject(storageRef(storage, url));
          } catch (err) {}
        }
      }
    }
    await set(ref(database, `box_items/${id}`), null);
    return true;
  } catch (e) {
    console.error('Помилка видалення товару боксу:', e);
    return false;
  }
}

export async function syncBoxItemToCatalog(boxItem: BoxItem): Promise<string | null> {
  try {
    const now = Date.now();
    const allImages = [boxItem.image, ...(boxItem.images || [])]
      .filter((url): url is string => !!url && url.startsWith('http'));

    const productData = {
      name: boxItem.name,
      category: boxItem.category,
      price: String(boxItem.price),
      image: allImages.length === 0 ? '🌍' : allImages[0],
      description: boxItem.description,
      images: allImages,
      isAbroad: true,
      boxItemId: boxItem.id,
      deliveryPrice: '200',
      deliveryDays: '14-21',
      discount: 0,
    };

    if (boxItem.catalogProductId) {
      const ok = await updateProduct(boxItem.catalogProductId, { ...productData, updatedAt: now });
      if (ok) return boxItem.catalogProductId;
      return null;
    } else {
      const productsRef = ref(database, 'products');
      const snapshot = await get(productsRef);
      const slugBase = slugify(boxItem.name) || `abroad-${boxItem.id}`;
      
      let list: Product[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        list = Array.isArray(data) ? data : Object.values(data);
      }

      let finalId = slugBase;
      let counter = 1;
      while (list.some(p => p.id === finalId)) {
        finalId = `${slugBase}-${counter++}`;
      }

      const newProduct: Product = {
        ...productData,
        id: finalId,
        inStock: true,
        quantity: 999,
        createdAt: now,
        updatedAt: now,
      };

      await set(productsRef, [...list, newProduct]);
      await update(ref(database, `box_items/${boxItem.id}`), { catalogProductId: finalId });
      return finalId;
    }
  } catch (e) {
    console.error('Помилка синхронізації BoxItem:', e);
    return null;
  }
}

/**
 * Видаляє пов'язаний товар із каталогу (коли знімається галочка «Додати до каталогу»).
 */
export async function removeBoxItemFromCatalog(
  catalogProductId: string
): Promise<boolean> {
  return deleteProduct(catalogProductId);
}
