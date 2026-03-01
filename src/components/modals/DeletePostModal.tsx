import React from 'react';
import { X, AlertTriangle, Loader } from 'lucide-react';

interface DeletePostModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({ 
  onClose, 
  onConfirm, 
  isDeleting,
  error
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="bg-dark-50 rounded-lg max-w-md w-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 text-rose flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-200 truncate">Supprimer la publication</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
              disabled={isDeleting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-300">
              Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
            </p>
            
            {error && (
              <div className="p-3 bg-rose/10 text-rose rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-dark-100 text-gray-300 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader className="h-4 w-4 animate-spin" />}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePostModal;