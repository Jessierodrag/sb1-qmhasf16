import React, { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { validateMediaUpload, removePhotosFromPost } from '../../lib/posts';
import { supabase } from '../../lib/supabase';
import LocationSelector from '../LocationSelector';

interface EditPostModalProps {
  onClose: () => void;
  onUpdate: (data: { caption: string; location: string; tags: string[]; newPhotos?: File[] }) => void;
  post: {
    id: string;
    caption: string;
    location: string;
    tags: string[];
    photos?: string[];
  };
}

const EditPostModal: React.FC<EditPostModalProps> = ({ onClose, onUpdate, post }) => {
  const [caption, setCaption] = useState(post.caption || '');
  const [location, setLocation] = useState(post.location || '');
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotosPreviews, setNewPhotosPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(post.photos || []);
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour ajouter des photos');
        return;
      }

      const validFiles = files.filter(file => {
        const isImage = file.type.match(/^image\/(jpeg|png|gif|webp)$/);
        const isVideo = file.type.match(/^video\/(mp4|quicktime|x-msvideo|x-matroska|webm)$/);

        if (!isImage && !isVideo) {
          setError('Format non supporté. Utilisez JPG, PNG, GIF, WebP pour les images ou MP4, MOV, AVI, MKV, WebM pour les vidéos.');
          return false;
        }

        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          setError(isVideo
            ? 'La taille de la vidéo ne doit pas dépasser 100MB'
            : 'La taille de l\'image ne doit pas dépasser 10MB'
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      const validation = await validateMediaUpload(user.id, validFiles);
      if (!validation.valid) {
        setError(validation.error || 'Limite de médias dépassée');
        return;
      }

      const reversedFiles = [...validFiles].reverse();
      setNewPhotos([...reversedFiles, ...newPhotos]);
      const urls = reversedFiles.map(file => URL.createObjectURL(file));
      setNewPhotosPreviews([...urls, ...newPhotosPreviews]);
    } catch (error) {
      console.error('Erreur lors de la sélection des fichiers:', error);
      setError('Une erreur est survenue lors de la sélection des fichiers');
    }
  };

  const handleRemoveNewPhoto = (index: number) => {
    const newPhotosArr = [...newPhotos];
    const newPreviewsArr = [...newPhotosPreviews];

    URL.revokeObjectURL(newPreviewsArr[index]);

    newPhotosArr.splice(index, 1);
    newPreviewsArr.splice(index, 1);

    setNewPhotos(newPhotosArr);
    setNewPhotosPreviews(newPreviewsArr);
  };

  const handleRemoveExistingPhoto = (photoUrl: string) => {
    setPhotosToRemove([...photosToRemove, photoUrl]);
    setExistingPhotos(existingPhotos.filter(p => p !== photoUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const remainingPhotosCount = existingPhotos.length + newPhotos.length;

    if (remainingPhotosCount === 0) {
      alert('Vous devez garder au moins une photo dans la publication');
      return;
    }

    if (!caption.trim() || !location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      if (photosToRemove.length > 0) {
        const { success, error: removeError } = await removePhotosFromPost(post.id, photosToRemove);
        if (!success) {
          throw new Error(removeError?.message || 'Erreur lors de la suppression des photos');
        }
      }

      await onUpdate({
        caption: caption.trim(),
        location,
        tags,
        newPhotos: newPhotos.length > 0 ? newPhotos : undefined
      });
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-dark-50 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-dark-200">
        <div className="sticky top-0 bg-dark-50 border-b border-dark-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Modifier la publication</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {existingPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photos actuelles ({existingPhotos.length})
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingPhotos.map((photo, index) => (
                  <div key={photo} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-rose/90 backdrop-blur-sm rounded px-2 py-0.5">
                        <span className="text-xs font-medium text-white">
                          Couverture
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(photo)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer cette photo"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ajouter des photos ou vidéos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-dark-200 bg-dark text-gray-400 hover:border-rose hover:text-rose transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              Ajouter des photos ou vidéos (en premier)
            </button>

            {error && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {newPhotosPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {newPhotosPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Nouvelle photo ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-rose/90 backdrop-blur-sm rounded px-2 py-0.5">
                        <span className="text-xs font-medium text-white">
                          Couverture
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Décrivez votre publication..."
              className="w-full px-4 py-3 rounded-lg border border-dark-200 bg-dark text-gray-200 placeholder-gray-500 focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose resize-none"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Localisation
            </label>
            <LocationSelector
              value={location}
              onChange={setLocation}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ajouter un tag..."
                className="flex-1 px-4 py-2 rounded-lg border border-dark-200 bg-dark text-gray-200 placeholder-gray-500 focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-dark-100 text-gray-200 rounded-lg hover:bg-dark-200 transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-dark-100 text-gray-200 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-dark-200 text-gray-200 rounded-lg font-medium hover:bg-dark-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
