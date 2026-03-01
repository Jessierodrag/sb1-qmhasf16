import React, { useState } from 'react';
import { X, GripVertical, Save, Trash2 } from 'lucide-react';

interface ReorderPhotosModalProps {
  photos: string[];
  onClose: () => void;
  onSave: (reorderedPhotos: string[]) => void;
}

const ReorderPhotosModal: React.FC<ReorderPhotosModalProps> = ({
  photos,
  onClose,
  onSave
}) => {
  const [orderedPhotos, setOrderedPhotos] = useState<string[]>([...photos]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [photosToDelete, setPhotosToDelete] = useState<Set<string>>(new Set());

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newPhotos = [...orderedPhotos];
    const draggedPhoto = newPhotos[draggedIndex];

    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedPhoto);

    setOrderedPhotos(newPhotos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeletePhoto = (photo: string) => {
    if (orderedPhotos.length <= 1) {
      alert('Vous devez garder au moins une photo dans votre publication.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      setOrderedPhotos(orderedPhotos.filter(p => p !== photo));
      setPhotosToDelete(new Set([...photosToDelete, photo]));
    }
  };

  const handleSave = async () => {
    if (orderedPhotos.length === 0) {
      alert('Vous devez garder au moins une photo dans votre publication.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(orderedPhotos);
      onClose();
    } catch (error) {
      console.error('Error saving photo order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-3 sm:p-4">
      <div className="bg-dark-50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-dark-200 flex flex-col">
        <div className="bg-dark-50 border-b border-dark-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Réorganiser les photos</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-gray-400 text-sm">
              Glissez-déposez les photos pour changer leur ordre. La première photo sera l'image de couverture.
            </p>
            {orderedPhotos.length > 0 && (
              <div className="shrink-0 text-sm text-gray-500">
                {orderedPhotos.length} photo{orderedPhotos.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {orderedPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-dark-100 p-4 rounded-full mb-4">
                <X className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-400 mb-2">Aucune photo restante</p>
              <p className="text-sm text-gray-500">
                Vous devez garder au moins une photo
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {orderedPhotos.map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all ${
                    draggedIndex === index
                      ? 'border-rose opacity-50 scale-95'
                      : 'border-dark-200 hover:border-rose/50'
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10 bg-dark/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-200">
                      #{index + 1}
                    </span>
                  </div>

                  {index === 0 && (
                    <div className="absolute top-2 right-2 z-10 bg-rose/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-xs font-medium text-white">
                        Couverture
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo);
                    }}
                    className="absolute bottom-2 right-2 z-10 p-2 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>

                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full aspect-square object-cover"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-dark-200 px-6 py-4">
          {photosToDelete.size > 0 && (
            <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-400">
                {photosToDelete.size} photo{photosToDelete.size > 1 ? 's' : ''} sera{photosToDelete.size > 1 ? 'nt' : ''} supprimée{photosToDelete.size > 1 ? 's' : ''} définitivement
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-dark-200 text-gray-200 rounded-lg font-medium hover:bg-dark-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || orderedPhotos.length === 0}
              className="flex-1 px-6 py-3 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderPhotosModal;
