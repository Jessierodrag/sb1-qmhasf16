import React from 'react';
import { X } from 'lucide-react';

interface LoginPromptModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="bg-dark-50 rounded-lg max-w-md w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-200">Connexion requise</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Vous devez être connecté pour contacter ce profil
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-dark-100 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onLogin}
            className="flex-1 bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
