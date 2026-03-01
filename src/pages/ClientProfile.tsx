import React, { useState, useRef, useEffect } from 'react';
import { Save, Camera, Upload, Trash2, AlertCircle, Star, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';
import { updateProfile } from '../lib/profile';
import { getUserWrittenReviews, getUserWrittenProfileReviews, PostReview } from '../lib/reviews';
import { formatDistanceToNow } from '../utils/date';
import { Review } from '../types';

interface ClientProfileProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [myPostReviews, setMyPostReviews] = useState<PostReview[]>([]);
  const [myProfileReviews, setMyProfileReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMyReviews = async () => {
      if (userProfile.user_id) {
        setIsLoadingReviews(true);
        const [postReviewsResult, profileReviewsResult] = await Promise.all([
          getUserWrittenReviews(userProfile.user_id),
          getUserWrittenProfileReviews(userProfile.user_id)
        ]);
        setMyPostReviews(postReviewsResult.reviews);
        setMyProfileReviews(profileReviewsResult.reviews);
        setIsLoadingReviews(false);
      }
    };
    loadMyReviews();
  }, [userProfile.user_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');
    
    if (section === 'physicalInfo' || section === 'personalInfo') {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError(null);

    try {
      // Validation du pseudo
      if (formData.username && formData.username.length < 3) {
        throw new Error("Le pseudo doit contenir au moins 3 caractères.");
      }
      
      // Si une nouvelle image a été sélectionnée, mettre à jour les photos
      const updatedFormData = previewImage 
        ? { ...formData, photos: [previewImage, ...formData.photos.slice(1)] }
        : formData;
      
      // Sauvegarder dans Supabase
      const { success, error } = await updateProfile(updatedFormData);
      
      if (!success) {
        throw new Error(error?.message || "Erreur lors de la sauvegarde");
      }
      
      // Mettre à jour l'état local
      setUserProfile(updatedFormData);
      setIsEditing(false);
      setPreviewImage(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setUploadError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setUploadError('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return;
    }

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('La taille de l\'image ne doit pas dépasser 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setUploadError('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-dark-50 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-200">Mon Profil</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-rose font-medium hover:bg-rose/10 rounded-lg transition-colors"
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo de profil */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Photo de profil</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-100 border-2 border-dark-200">
                    <img 
                      src={previewImage || userProfile.photos[0]} 
                      alt="Photo de profil" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-rose text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {isEditing && (
                  <div className="flex flex-col gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/gif, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-100 text-gray-200 rounded-lg hover:bg-dark-200 transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      Changer la photo
                    </button>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-100 text-rose rounded-lg hover:bg-dark-200 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                        Supprimer
                      </button>
                    )}
                    <p className="text-xs text-gray-400">
                      Formats acceptés: JPG, PNG, GIF, WebP (max 2MB)
                    </p>
                    {uploadError && (
                      <div className="flex items-center gap-2 text-rose text-sm mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Informations de base */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Informations de base</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prénom <span className="text-xs text-gray-500">(non visible)</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nom <span className="text-xs text-gray-500">(non visible)</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Pseudo <span className="text-xs text-gray-500">(visible par tous)</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    minLength={3}
                    maxLength={20}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  />
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-500">
                      Entre 3 et 20 caractères
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Description</h3>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Sexe
                  </label>
                  <select
                    name="physicalInfo.sexe"
                    value={formData.physicalInfo.sexe}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Non-binaire">Non-binaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Âge
                  </label>
                  <input
                    type="number"
                    name="physicalInfo.age"
                    value={formData.physicalInfo.age}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    min="18"
                    max="99"
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Orientation
                  </label>
                  <select
                    name="personalInfo.orientation"
                    value={formData.personalInfo.orientation}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Hétérosexuel">Hétérosexuel</option>
                    <option value="Homosexuel">Homosexuel</option>
                    <option value="Bisexuel">Bisexuel</option>
                  </select>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    'Enregistrement...'
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Section Mes avis */}
      <div className="bg-dark-50 rounded-lg shadow-lg overflow-hidden mt-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-rose" />
            <h2 className="text-2xl font-bold text-gray-200">Mes avis</h2>
            <span className="text-sm text-gray-400">({myProfileReviews.length + myPostReviews.length})</span>
          </div>

          {isLoadingReviews ? (
            <div className="text-center py-8 text-gray-400">
              Chargement...
            </div>
          ) : myProfileReviews.length === 0 && myPostReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Vous n'avez pas encore posté d'avis</p>
              <p className="text-sm mt-1">Laissez un avis sur un profil ou une annonce pour qu'il apparaisse ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avis sur les profils */}
              {myProfileReviews.map((review) => (
                <div key={`profile-${review.id}`} className="bg-dark-100 rounded-lg p-4 border border-dark-200">
                  <div className="flex items-start gap-4">
                    {review.userPhoto && (
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-200">
                            Avis pour {review.userName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">
                              {formatDistanceToNow(review.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Avis sur les publications */}
              {myPostReviews.map((review) => {
                const post = review.posts as any;
                const reviewedProfile = post?.profiles;

                return (
                  <div key={`post-${review.id}`} className="bg-dark-100 rounded-lg p-4 border border-dark-200">
                    <div className="flex items-start gap-4">
                      {reviewedProfile?.photos?.[0] && (
                        <img
                          src={reviewedProfile.photos[0]}
                          alt={reviewedProfile.username || reviewedProfile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-200">
                              Avis pour l'annonce de {reviewedProfile?.username || reviewedProfile?.name || 'Utilisateur'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(review.created_at))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;