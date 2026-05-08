import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Завантажує фото в Firebase Storage і повертає URL
 */
export const uploadProductImage = async (file: File, pathPrefix: string = 'products'): Promise<string> => {
  try {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileRef = storageRef(storage, `${pathPrefix}/${filename}`);
    
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Помилка при завантаженні фото:', error);
    throw error;
  }
};

/**
 * Видаляє файл з Firebase Storage за його URL
 */
export const deleteImageByUrl = async (url: string): Promise<boolean> => {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return false;
  
  try {
    const fileRef = storageRef(storage, url);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Помилка при видаленні фото:', error);
    return false;
  }
};
export const uploadImage = uploadProductImage;
export const deleteImage = deleteImageByUrl;
