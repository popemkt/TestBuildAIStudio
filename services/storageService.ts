import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseService';

/**
 * A service for handling file uploads and deletions in Firebase Cloud Storage.
 */
export const storageService = {
  /**
   * Uploads a base64 encoded image to a specified path in Firebase Storage.
   * @param base64DataUrl - The base64 data URL of the image to upload.
   * @param path - The destination path in storage (e.g., 'expenses/group123').
   * @returns A promise that resolves to the public download URL of the uploaded image.
   */
  uploadImage: async (base64DataUrl: string, path: string): Promise<string> => {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured.');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    await uploadString(storageRef, base64DataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  },

  /**
   * Deletes an image from Firebase Storage using its public download URL.
   * @param downloadUrl - The public URL of the image to delete.
   * @returns A promise that resolves when the image is deleted.
   */
  deleteImage: async (downloadUrl: string): Promise<void> => {
    if (!isFirebaseConfigured) return;
    try {
      const storageRef = ref(storage, downloadUrl);
      await deleteObject(storageRef);
    } catch (error: any) {
      // It's safe to ignore "object-not-found" errors, as it means the file is already gone.
      if (error.code !== 'storage/object-not-found') {
        console.error('Error deleting image from storage:', error);
      }
    }
  },
};
