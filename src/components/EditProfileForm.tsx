import React, { useState, useRef } from 'react';
import { Save, X, Camera, Upload, Trash2, AlertCircle, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { updateProfile } from '../lib/profile';
import { uploadFile } from '../lib/storage';

interface EditProfileFormProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const SERVICES = [
  'Massage sensuel',
  'Domination soft',
  'Fétichisme',
  'Jeux de rôle',
  'Préliminaires',
  'Câlins',
  'Soirées libertines',
  'Accompagnement événements',
  'Week-end',
  'Dîner en ville'
];

const LANGUAGES = [
  'Français',
  'Anglais',
  'Espagnol',
  'Italien',
  'Allemand',
  'Portugais',
  'Russe',
  'Arabe',
  'Chinois',
  'Japonais'
];

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  userProfile,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState(userProfile);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    userProfile.prestations ? userProfile.prestations.split(' • ') : []
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    setUploadError(null);
    setIsSaving(true);

    try {
      // Validation du pseudo
      if (formData.username && formData.username.length < 3) {
        throw new Error("Le pseudo doit contenir au moins 3 caractères.");
      }

      let photoUrl = formData.photos[0];

      // Uploader la nouvelle photo vers Supabase Storage si elle existe
      if (photoFile) {
        console.log('[EditProfileForm] Uploading profile photo to Supabase...');
        const { url, error: uploadError } = await uploadFile(photoFile, 'profiles');

        if (uploadError || !url) {
          throw new Error(uploadError?.message || 'Erreur lors de l\'upload de la photo');
        }

        console.log('[EditProfileForm] Photo uploaded:', url);
        photoUrl = url;
      }

      // Préparer les données mises à jour
      const updatedProfile = {
        ...formData,
        prestations: selectedServices.join(' • '),
        photos: photoUrl ? [photoUrl, ...formData.photos.slice(1)] : formData.photos
      };

      console.log('[EditProfileForm] Updating profile with data:', updatedProfile);

      // Sauvegarder dans Supabase
      const { success, error } = await updateProfile(updatedProfile);

      if (!success) {
        throw new Error(error?.message || "Erreur lors de la sauvegarde");
      }

      // Appeler le callback onSave
      onSave(updatedProfile);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setUploadError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
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

    setPhotoFile(file);

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
    setPhotoFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Vérifier si l'utilisateur a une photo de profil ou utilise l'image par défaut
  const hasDefaultProfilePic = userProfile.photos[0].includes('unsplash');

  return (
    <div className="bg-dark-50 rounded-xl overflow-hidden">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-dark-50 border-b border-dark-200 px-4 py-3 sm:p-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-200">Modifier mon profil</h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-300 sm:px-4 sm:py-2"
          >
            <X className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:block">Annuler</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span className="hidden sm:block">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <form className="p-4 sm:p-6 space-y-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Photo de profil */}
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-4">Photo de profil</h4>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-100 border-2 border-dark-200 flex items-center justify-center">
                {previewImage || !hasDefaultProfilePic ? (
                  <img 
                    src={previewImage || userProfile.photos[0]} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-24 h-24 text-gray-500" />
                )}
              </div>
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-rose text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 w-full sm:w-auto">
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-100 text-gray-200 rounded-lg hover:bg-dark-200 transition-colors w-full sm:w-auto"
              >
                <Upload className="h-5 w-5" />
                {hasDefaultProfilePic ? "Ajouter une photo" : "Changer la photo"}
              </button>
              {(previewImage || !hasDefaultProfilePic) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-100 text-rose rounded-lg hover:bg-dark-200 transition-colors w-full sm:w-auto"
                >
                  <Trash2 className="h-5 w-5" />
                  Supprimer
                </button>
              )}
              <p className="text-xs text-gray-400 text-center sm:text-left">
                Formats acceptés: JPG, PNG, GIF, WebP (max 2MB)
              </p>
              {uploadError && (
                <div className="flex items-center gap-2 text-rose text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informations générales */}
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-4">Informations générales</h4>
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
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
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
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
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
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                minLength={3}
                maxLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">
                Entre 3 et 20 caractères
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ville
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="+33 6 XX XX XX XX"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              placeholder="Décrivez-vous en quelques mots..."
            />
          </div>
        </div>

        {/* Caractéristiques physiques */}
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-4">Caractéristiques physiques</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Genre
              </label>
              <select
                name="physicalInfo.sexe"
                value={formData.physicalInfo.sexe}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
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
                min="18"
                max="99"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type/Origine
              </label>
              <select
                name="physicalInfo.ethnique"
                value={formData.physicalInfo.ethnique}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="Caucasien">Caucasien</option>
                <option value="Métisse">Métisse</option>
                <option value="Noir">Noir</option>
                <option value="Asiatique">Asiatique</option>
                <option value="Latino">Latino</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nationalité
              </label>
              <input
                type="text"
                name="physicalInfo.nationalite"
                value={formData.physicalInfo.nationalite}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Taille (cm)
              </label>
              <input
                type="text"
                name="physicalInfo.taille"
                value={formData.physicalInfo.taille}
                onChange={handleInputChange}
                placeholder="175"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Poids (kg)
              </label>
              <input
                type="text"
                name="physicalInfo.poids"
                value={formData.physicalInfo.poids}
                onChange={handleInputChange}
                placeholder="65"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Couleur des yeux
              </label>
              <select
                name="physicalInfo.yeux"
                value={formData.physicalInfo.yeux}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="Bleus">Bleus</option>
                <option value="Verts">Verts</option>
                <option value="Marron">Marron</option>
                <option value="Noirs">Noirs</option>
                <option value="Noisette">Noisette</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mensurations
              </label>
              <input
                type="text"
                name="physicalInfo.mensurations"
                value={formData.physicalInfo.mensurations}
                onChange={handleInputChange}
                placeholder="90-60-90"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tour de poitrine
              </label>
              <input
                type="text"
                name="physicalInfo.tour_poitrine"
                value={formData.physicalInfo.tour_poitrine}
                onChange={handleInputChange}
                placeholder="90"
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bonnet
              </label>
              <select
                name="physicalInfo.bonnet"
                value={formData.physicalInfo.bonnet}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-4">Informations personnelles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Orientation
              </label>
              <select
                name="personalInfo.orientation"
                value={formData.personalInfo.orientation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="Hétérosexuel">Hétérosexuel</option>
                <option value="Homosexuel">Homosexuel</option>
                <option value="Bisexuel">Bisexuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fumeur
              </label>
              <select
                name="personalInfo.fumeur"
                value={formData.personalInfo.fumeur}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="Non">Non</option>
                <option value="Occasionnellement">Occasionnellement</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Langues parlées
              </label>
              <select
                multiple
                name="personalInfo.langues"
                value={formData.personalInfo.langues}
                onChange={(e) => {
                  const options = e.target.options;
                  const value = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) {
                      value.push(options[i].value);
                    }
                  }
                  setFormData(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      langues: value
                   }
                  }));
                }}
                className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                size={4}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs langues
              </p>
            </div>
          </div>
        </div>

        {/* Services proposés */}
        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-4">Services proposés</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICES.map(service => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedServices.includes(service)
                    ? 'bg-rose text-white'
                    : 'bg-dark-100 text-gray-400 hover:text-gray-200'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;