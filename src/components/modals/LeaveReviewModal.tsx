import React, { useState } from 'react';
import { X, Star, Loader } from 'lucide-react';
import { createReview } from '../../lib/reviews';

interface LeaveReviewModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  userId,
  userName,
  onClose,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    if (!comment.trim()) {
      setError('Veuillez ajouter un commentaire');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await createReview(userId, rating, comment.trim());

      if (submitError) {
        setError(submitError);
      } else {
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
        onClose();
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la soumission de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dark-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up">
        <div className="bg-dark-100 border-b border-dark-200 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Laisser un avis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client: <span className="text-gray-100 font-semibold">{userName}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Note <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
              Commentaire <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce client..."
              className="w-full bg-dark-50 border border-dark-200 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors resize-none"
              rows={5}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Maximum 500 caractères</span>
              <span className="text-xs text-gray-500">{comment.length}/500</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-dark-200 text-gray-300 py-3 rounded-lg font-semibold hover:bg-dark-300 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-glow-rose disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                'Publier l\'avis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveReviewModal;
