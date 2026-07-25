import { useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadProgress {
  progress: number;
  url: string | null;
  error: string | null;
}

/**
 * Upload a file and get back its public download URL.
 * Supports a progress callback.
 */
async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
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
      const ext = file.name.split('.').pop() || 'jpg';
      return uploadFile(file, `profiles/${userId}/avatar.${ext}`, onProgress);
    },
    []
  );

  const uploadListingImage = useCallback(
    async (
      file: File,
      listingId: string,
      index: number,
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      const ext = file.name.split('.').pop() || 'jpg';
      return uploadFile(
        file,
        `listings/${listingId}/image_${index}.${ext}`,
        onProgress
      );
    },
    []
  );

  /**
   * Upload multiple listing images in parallel and return all URLs.
   */
  const uploadListingImages = useCallback(
    async (
      files: File[],
      listingId: string,
      onProgress?: (overall: number) => void
    ): Promise<string[]> => {
      let completed = 0;
      const urls = await Promise.all(
        files.map((file, i) =>
          uploadListingImage(file, listingId, i, () => {
            completed++;
            onProgress?.(Math.round((completed / files.length) * 100));
          })
        )
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
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      return uploadFile(file, `chats/${roomId}/${filename}`, onProgress);
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
