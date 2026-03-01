import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Tag, ChevronDown, Loader } from 'lucide-react';
import { createPost, validateMediaUpload } from '../../lib/posts';
import { supabase } from '../../lib/supabase';
import LocationSelector from '../LocationSelector';

interface NewPostModalProps {
  onClose: () => void;
  onPost: (post: {
    photos: string[];
    location: string;
    tags: string[];
    caption: string;
  }) => void;
}

const AVAILABLE_TAGS = [
  'Massage',
  'Tantrique',
  'Relaxation',
  'Bien-être',
  'Domination',
  'Fétichisme',
  'GFE',
  'Naturiste',
  'Accompagnement',
  'Soirée',
  'Week-end',
  'Dîner'
];

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onPost }) => {
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour publier');
        setIsUploading(false);
        return;
      }

      // Vérifier les fichiers
      const validFiles = files.filter(file => {
        // Vérifier le type de fichier (images et vidéos)
        const isImage = file.type.match(/^image\/(jpeg|png|gif|webp)$/);
        const isVideo = file.type.match(/^video\/(mp4|quicktime|x-msvideo|x-matroska|webm)$/);

        if (!isImage && !isVideo) {
          setError('Format non supporté. Utilisez JPG, PNG, GIF, WebP pour les images ou MP4, MOV, AVI, MKV, WebM pour les vidéos.');
          return false;
        }

        // Vérifier la taille du fichier
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB pour vidéos, 10MB pour images
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
        setIsUploading(false);
        return;
      }

      const validation = await validateMediaUpload(user.id, validFiles);
      if (!validation.valid) {
        setError(validation.error || 'Limite de médias dépassée');
        setIsUploading(false);
        return;
      }

      const reversedFiles = [...validFiles].reverse();
      setSelectedFiles(reversedFiles);

      const urls = reversedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setStep('edit');
    } catch (error) {
      console.error('Erreur lors de la sélection des fichiers:', error);
      setError('Une erreur est survenue lors de la sélection des fichiers');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    if (isPublishing || selectedFiles.length === 0) return;
    
    setIsPublishing(true);
    setError(null);

    try {
      console.log('Création de la publication...');
      console.log('Fichiers sélectionnés:', selectedFiles.map(f => f.name));
      
      const { post, error } = await createPost({
        caption,
        location,
        tags: selectedTags,
        photos: selectedFiles
      });

      if (error) {
        console.error('Erreur retournée par createPost:', error);
        throw new Error(error.message);
      }

      if (!post) {
        throw new Error('Aucune publication n\'a été créée');
      }

      console.log('Publication créée avec succès:', post);
      
      onPost({
        photos: post.photos,
        location: post.location,
        tags: post.tags,
        caption: post.caption
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Nettoyer les URLs de prévisualisation lors du démontage du composant
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Bloquer le scroll de l'arrière-plan
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[115]">
      <div className="bg-dark-50 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-dark-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">
              {step === 'select' ? 'Créer une publication' : 'Éditer la publication'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
        {step === 'select' ? (
          <div className="p-4">
            <div 
              className="border-2 border-dashed border-dark-200 rounded-lg p-8 text-center cursor-pointer hover:border-rose transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">
                Faites glisser des photos et des vidéos ici
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <Loader className="h-6 w-6 text-rose animate-spin mr-2" />
                  <p className="text-sm text-gray-500">
                    Chargement en cours...
                  </p>
                </div>
              )}
              {error && (
                <p className="mt-4 text-sm text-rose">
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Preview */}
            <div className="w-full md:w-1/2 p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-dark-100">
                {previewUrls.length > 0 && selectedFiles.length > 0 && (
                  selectedFiles[0].type.startsWith('video/') ? (
                    <video
                      src={previewUrls[0]}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  ) : (
                    <img
                      src={previewUrls[0]}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  )
                )}
              </div>
              {previewUrls.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0"
                    >
                      {selectedFiles[index].type.startsWith('video/') ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Form */}
            <div className="w-full md:w-1/2 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                  rows={4}
                  placeholder="Écrivez une description..."
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Localisation
                </label>
                <LocationSelector
                  value={location}
                  onChange={setLocation}
                />
              </div>

              {/* Tags */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags
                </label>
                <button
                  onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {selectedTags.length > 0 
                        ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} sélectionné${selectedTags.length > 1 ? 's' : ''}`
                        : 'Ajouter des tags'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showTagsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-dark-50 border border-dark-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-100 transition-colors flex items-center justify-between ${
                          selectedTags.includes(tag) ? 'text-rose' : 'text-gray-200'
                        }`}
                      >
                        {tag }
                        {selectedTags.includes(tag) && (
                          <span className="text-rose">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-rose/10 text-rose rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose/10 text-rose rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="p-4 border-t border-dark-200 flex justify-end gap-4 flex-shrink-0">
          {step === 'edit' && (
            <button
              onClick={() => {
                setStep('select');
                setSelectedFiles([]);
                setPreviewUrls(prev => {
                  prev.forEach(url => URL.revokeObjectURL(url));
                  return [];
                });
                setCaption('');
                setLocation('');
                setSelectedTags([]);
                setError(null);
              }}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
              disabled={isPublishing}
            >
              Retour
            </button>
          )}
          <button
            onClick={step === 'edit' ? handlePost : () => fileInputRef.current?.click()}
            disabled={(step === 'edit' && (selectedFiles.length === 0 || isPublishing)) || isUploading}
            className="px-4 py-2 bg-rose text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing && <Loader className="h-4 w-4 animate-spin" />}
            {step === 'edit' 
              ? (isPublishing ? 'Publication...' : 'Publier')
              : 'Sélectionner des photos'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewPostModal;