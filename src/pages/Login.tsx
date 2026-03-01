import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { UserType, UserProfile } from '../types';
import { signIn, signUp, resetPassword } from '../lib/auth';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
  setCurrentView: (view: 'home' | 'profile' | 'messages' | 'wallet') => void;
  setUserType: (type: UserType) => void;
  setUserProfile: (profile: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({
  setIsAuthenticated,
  setCurrentView,
  setUserType,
  setUserProfile
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    age: '',
    phone: '',
    accountType: 'individual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!formData.email) {
          throw new Error('Veuillez saisir votre adresse email');
        }

        const result = await resetPassword(formData.email);

        if (result.error) {
          throw new Error(result.error.message);
        }

        setSuccessMessage('Un email de réinitialisation a été envoyé à votre adresse email.');
        setFormData(prev => ({ ...prev, email: '' }));
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccessMessage(null);
        }, 3000);
        return;
      }

      if (!isLoginMode && (!formData.age || parseInt(formData.age) < 18)) {
        throw new Error("Vous devez avoir au moins 18 ans pour vous inscrire.");
      }

      // Validation du pseudo
      if (!isLoginMode && formData.username.length < 3) {
        throw new Error("Le pseudo doit contenir au moins 3 caractères.");
      }

      let result;
      if (isLoginMode) {
        result = await signIn({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await signUp({
          email: formData.email,
          password: formData.password,
          name: formData.username || `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          userType: isPro ? 'pro' : 'client',
          phone: formData.phone
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.user) {
        throw new Error('Aucune donnée utilisateur retournée');
      }

      setUserProfile(result.user);
      setUserType(result.user.userType);
      setIsAuthenticated(true);
      setCurrentView(isLoginMode ? 'home' : 'profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLogin = () => {
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark px-4">
      <div className="w-full max-w-md mx-auto mt-6">
        <button
          onClick={handleSkipLogin}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Accéder au site sans connexion</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-rose mb-8">
            Fire Roses
          </h1>

          <div className="bg-dark-50 p-1 rounded-lg shadow-lg mb-6 grid grid-cols-2 gap-1">
            <button
              onClick={() => setIsPro(false)}
              className={`py-2.5 rounded-md text-sm font-medium transition-colors ${
                !isPro ? 'bg-rose text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setIsPro(true)}
              className={`py-2.5 rounded-md text-sm font-medium transition-colors ${
                isPro ? 'bg-rose text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Pro
            </button>
          </div>

          <div className="bg-dark-50 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-200">
                {isForgotPassword ? 'Réinitialiser le mot de passe' : (isLoginMode ? 'Connexion' : 'Inscription')} {!isForgotPassword && (isPro ? 'Pro' : 'Client')}
              </h2>
              {!isForgotPassword && (
                <button
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-rose text-sm hover:underline"
                >
                  {isLoginMode ? "S'inscrire" : "Se connecter"}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose/10 text-rose rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isForgotPassword ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Entrez votre adresse email pour recevoir un lien de réinitialisation.
                  </p>
                </div>
              ) : !isLoginMode && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Prénom <span className="text-xs text-gray-500">(non visible)</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Nom <span className="text-xs text-gray-500">(non visible)</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Pseudo <span className="text-xs text-gray-500">(visible par tous)</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                      placeholder="Votre pseudo public"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Entre 3 et 20 caractères
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Âge
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="18"
                      max="99"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                      placeholder="Votre âge"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Vous devez avoir au moins 18 ans pour vous inscrire
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                      placeholder="+33 6 XX XX XX XX"
                      required={isPro}
                    />
                  </div>
                </>
              )}

              {!isForgotPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent pr-10"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {!isLoginMode && (
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum 6 caractères
                    </p>
                  )}
                  {isLoginMode && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                        }}
                        className="text-sm text-rose hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isPro && !isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type de compte
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                    required
                  >
                    <option value="individual">Compte individuel</option>
                    <option value="multiple">Compte multiple (agence)</option>
                  </select>
                  {formData.accountType === 'multiple' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Le compte multiple permet de gérer plusieurs profils
                    </p>
                  )}
                </div>
              )}

              {!isForgotPassword && (
                <div className="text-sm text-gray-500">
                  En {isLoginMode ? 'vous connectant' : 'vous inscrivant'}, vous acceptez nos conditions d'utilisation.
                </div>
              )}

              <div className="flex gap-3">
                {isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="flex-1 border border-dark-200 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-100 transition-colors"
                  >
                    Retour
                  </button>
                )}
                <button
                  type="submit"
                  className={`${isForgotPassword ? 'flex-1' : 'w-full'} bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : isForgotPassword ? 'Envoyer le lien' : (isLoginMode ? 'Se connecter' : "S'inscrire")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;