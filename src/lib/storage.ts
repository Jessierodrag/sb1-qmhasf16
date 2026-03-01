import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface StorageError {
  message: string;
}

/**
 * Télécharge un fichier dans le bucket Supabase
 */
export const uploadFile = async (
  file: File,
  bucket: string,
  folder?: string
): Promise<{ url: string | null; error: StorageError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');


    // Compresser l'image si c'est une image
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Construire le chemin du fichier
    const filePath = folder 
      ? `${folder}/${fileName}`
      : `${user.id}/${fileName}`;
    
    
    // Télécharger le fichier
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Erreur lors du téléchargement:', uploadError);
      throw uploadError;
    }
    
    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Upload file error:', error);
    return {
      url: null,
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors du téléchargement du fichier'
      }
    };
  }
};

/**
 * Extrait une frame d'une vidéo pour créer un thumbnail
 */
const extractVideoThumbnail = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // Chercher une frame à 1 seconde ou au début si la vidéo est plus courte
      const seekTime = Math.min(1, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Créer un canvas avec les dimensions de la vidéo
        const canvas = document.createElement('canvas');
        const maxWidth = 1920;
        const maxHeight = 1920;

        let width = video.videoWidth;
        let height = video.videoHeight;

        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner la frame vidéo sur le canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Convertir en blob JPEG
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error('Impossible de créer le thumbnail'));
              return;
            }

            // Créer un fichier à partir du blob
            const thumbnailFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              {
                type: 'image/jpeg',
                lastModified: Date.now()
              }
            );

            resolve(thumbnailFile);
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erreur lors du chargement de la vidéo'));
    };
  });
};

/**
 * Compresse une image avant de la télécharger
 */
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si le fichier est déjà petit, ne pas le compresser
    if (file.size <= 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculer les dimensions maximales (max 1920px)
        const maxWidth = 1920;
        const maxHeight = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        // Créer un canvas pour la compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image sur le canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec une qualité réduite
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            // Créer un nouveau fichier à partir du blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8 // Qualité de 80%
        );
      };
      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
  });
};

/**
 * Télécharge plusieurs fichiers dans le bucket Supabase
 */
export const uploadFiles = async (
  files: File[],
  bucket: string,
  folder?: string
): Promise<{ urls: string[]; error: StorageError | null }> => {
  try {
    
    const uploadPromises = files.map(file => uploadFile(file, bucket, folder));
    const results = await Promise.all(uploadPromises);
    
    // Vérifier s'il y a des erreurs
    const errors = results.filter(result => result.error !== null);
    if (errors.length > 0) {
      console.error('Erreurs lors du téléchargement des fichiers:', errors);
      throw new Error(errors[0].error?.message || "Une erreur est survenue lors du téléchargement des fichiers");
    }
    
    // Collecter les URLs
    const urls = results.map(result => result.url).filter(url => url !== null) as string[];
    
    
    return { urls, error: null };
  } catch (error) {
    console.error('Upload files error:', error);
    return {
      urls: [],
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors du téléchargement des fichiers'
      }
    };
  }
};

/**
 * Vérifie si un fichier est une vidéo
 */
const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Télécharge les photos d'un post dans le bucket Supabase
 */
export const uploadPostPhotos = async (
  files: File[],
  userId: string
): Promise<{ urls: string[]; thumbnails: string[]; error: string | null }> => {
  try {

    const urls: string[] = [];
    const thumbnails: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let thumbnailUrl: string | null = null;

      // Si c'est une vidéo, générer d'abord un thumbnail
      if (isVideoFile(file)) {
        try {
          const thumbnailFile = await extractVideoThumbnail(file);

          const { url: thumbUrl, error: thumbError } = await uploadFile(
            thumbnailFile,
            'posts',
            `${userId}/thumbnails`
          );

          if (thumbError || !thumbUrl) {
            console.error(`[uploadPostPhotos] Erreur upload thumbnail pour fichier ${i + 1}:`, thumbError);
          } else {
            thumbnailUrl = thumbUrl;
          }
        } catch (thumbError) {
          console.error(`[uploadPostPhotos] Exception lors de la génération du thumbnail pour fichier ${i + 1}:`, thumbError);
        }
      } else {
      }

      // Upload du fichier original
      const { url, error } = await uploadFile(file, 'posts', userId);

      if (error || !url) {
        console.error(`[uploadPostPhotos] Erreur upload fichier ${i + 1}:`, error);
        throw new Error(error?.message || 'Erreur lors du téléchargement du média');
      }

      urls.push(url);

      // IMPORTANT : toujours pousser quelque chose dans thumbnails pour garder la cohérence des indices
      const finalThumbnail = thumbnailUrl || url;
      thumbnails.push(finalThumbnail);
    }


    if (urls.length !== thumbnails.length) {
      console.error(`[uploadPostPhotos] ATTENTION: Incohérence! URLs: ${urls.length}, Thumbnails: ${thumbnails.length}`);
    }

    return { urls, thumbnails, error: null };
  } catch (error) {
    console.error('[uploadPostPhotos] Erreur globale:', error);
    return {
      urls: [],
      thumbnails: [],
      error: error instanceof Error ? error.message : 'Une erreur est survenue lors du téléchargement des médias'
    };
  }
};

/**
 * Supprime un fichier du bucket Supabase
 */
export const deleteFile = async (
  url: string,
  bucket: string
): Promise<{ success: boolean; error: StorageError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Extraire le chemin du fichier de l'URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      throw new Error(`Bucket ${bucket} not found in URL ${url}`);
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    
    // Supprimer le fichier
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
      throw deleteError;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression du fichier'
      }
    };
  }
};