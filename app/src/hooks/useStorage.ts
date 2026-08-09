import { useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage } from '@/lib/imageCompressor';

export interface UploadProgress {
  progress: number;
  url: string | null;
  error: string | null;
}

/**
 * Upload a file and get back its public download URL.
 * Supports a progress callback with 0-100% clamping.
 */
async function uploadFile(
  file: File | Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.min(100, Math.max(0, Math.round(pct))));
        }
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export function useStorage() {
  const uploadProfilePicture = useCallback(
    async (
      file: File,
      userId: string,
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      let blobToUpload: File | Blob = file;
      try {
        blobToUpload = await compressImage(file, 800, 800, 0.85);
      } catch (e) {
        console.warn('Profile picture compression failed', e);
      }
      const ext = file.name.split('.').pop() || 'jpg';
      return uploadFile(blobToUpload, `profiles/${userId}/avatar.${ext}`, onProgress);
    },
    []
  );

  const uploadListingImage = useCallback(
    async (
      file: File | Blob,
      listingId: string,
      index: number,
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      const ext = (file as File).name?.split('.').pop() || 'jpg';
      return uploadFile(
        file,
        `listings/${listingId}/image_${index}.${ext}`,
        onProgress
      );
    },
    []
  );

  /**
   * Upload multiple listing images in parallel, compressing large camera photos
   * and calculating exact average upload progress across all files (0-100%).
   */
  const uploadListingImages = useCallback(
    async (
      files: File[],
      listingId: string,
      onProgress?: (overall: number) => void
    ): Promise<string[]> => {
      if (!files || files.length === 0) return [];
      const fileProgresses = new Array(files.length).fill(0);

      const urls = await Promise.all(
        files.map(async (file, i) => {
          let blobToUpload: File | Blob = file;
          try {
            blobToUpload = await compressImage(file, 1200, 1200, 0.8);
          } catch (e) {
            console.warn('Listing image compression skipped/failed for file', i, e);
          }

          return uploadListingImage(blobToUpload, listingId, i, (singlePct) => {
            fileProgresses[i] = singlePct;
            const sum = fileProgresses.reduce((acc, p) => acc + p, 0);
            const overall = Math.round(sum / files.length);
            onProgress?.(Math.min(100, Math.max(0, overall)));
          });
        })
      );
      return urls;
    },
    [uploadListingImage]
  );

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    await deleteObject(ref(storage, path));
  }, []);

  const uploadGenericImage = useCallback(
    async (file: File, path: string, onProgress?: (pct: number) => void): Promise<string> => {
      return uploadFile(file, path, onProgress);
    },
    []
  );

  const uploadChatImage = useCallback(
    async (file: File, roomId: string, onProgress?: (pct: number) => void): Promise<string> => {
      let blobToUpload: File | Blob = file;
      try {
        blobToUpload = await compressImage(file, 1200, 1200, 0.8);
      } catch (e) {
        console.warn('Chat photo compression failed', e);
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      return uploadFile(blobToUpload, `chats/${roomId}/${filename}`, onProgress);
    },
    []
  );

  return {
    uploadProfilePicture,
    uploadListingImage,
    uploadListingImages,
    deleteFile,
    uploadGenericImage,
    uploadChatImage,
  };
}

