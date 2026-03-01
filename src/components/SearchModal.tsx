import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, MapPin, ChevronRight, Filter, Tag, Star, User } from 'lucide-react';
import { Profile } from '../types';
import { regions, departmentCodes, cityArrondissements } from '../data/regions';
import { supabase } from '../lib/supabase';
import ProfileModal from './modals/ProfileModal';

// Catégories de prestations disponibles
const PRESTATIONS = [
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

interface SearchModalProps {
  onClose: () => void;
  onLocationSelect?: (location: string) => void;
  onFilterChange?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  location?: string;
  prestations?: string[];
  priceRange?: [number, number];
  rating?: number;
}

type SearchMode = 'location' | 'filters' | 'users';
type NavigationLevel = 'region' | 'department' | 'city' | 'arrondissement';

const SearchModal: React.FC<SearchModalProps> = ({ onClose, onLocationSelect, onFilterChange }) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrestations, setSelectedPrestations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('region');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [postLocations, setPostLocations] = useState<string[]>([]);

  // Recherche dynamique d'utilisateurs
  useEffect(() => {
    const searchUsers = async () => {
      if (searchMode !== 'users' || searchQuery.trim().length < 2) {
        setUserSearchResults([]);
        return;
      }

      setIsSearchingUsers(true);
      try {
        const searchLower = searchQuery.toLowerCase().trim();

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchLower}%,username.ilike.%${searchLower}%`)
          .eq('is_active', true)
          .limit(20);

        if (error) {
          console.error('Error searching users:', error);
          setUserSearchResults([]);
        } else if (data) {
          const mappedProfiles: Profile[] = data.map(p => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            username: p.username || p.name,
            location: p.location || '',
            description: p.description || '',
            interests: p.interests || [],
            photos: p.photos || [],
            physicalInfo: p.physical_info || {},
            personalInfo: p.personal_info || {},
            prestations: p.prestations || '',
            userType: p.user_type === 'professional' ? 'pro' : 'client',
            rating: 0,
            reviewCount: 0,
            price: 0,
            isOnline: false,
            lastSeen: new Date(),
            imageUrl: p.photos?.[0] || '',
            bio: p.description || '',
            email: '',
            avatar: p.photos?.[0] || '',
            premium: false,
            online: false,
            likes: 0,
            comments: 0,
            isLiked: false,
            reviews: [],
            createdAt: p.created_at || new Date().toISOString(),
            updatedAt: p.updated_at || new Date().toISOString()
          }));
          setUserSearchResults(mappedProfiles);
        }
      } catch (err) {
        console.error('Error in user search:', err);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  // Charger les posts actifs et les profils depuis Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingProfiles(true);

      // Charger les posts pour compter les annonces par ville
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('location')
        .eq('is_active', true);

      if (postsError) {
        console.error('Error loading posts:', postsError);
      } else if (postsData) {
        const locations = postsData.map(p => p.location).filter(Boolean);
        setPostLocations(locations);
      }

      // Charger les profils pour l'onglet Filtres
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      } else if (profilesData) {
        const mappedProfiles: Profile[] = profilesData.map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          username: p.username || p.name,
          location: p.location || '',
          description: p.description || '',
          interests: p.interests || [],
          photos: p.photos || [],
          physicalInfo: p.physical_info || {},
          personalInfo: p.personal_info || {},
          prestations: p.prestations || '',
          userType: p.user_type === 'professional' ? 'pro' : 'client',
          rating: 0,
          reviewCount: 0,
          price: 0,
          isOnline: false,
          lastSeen: new Date(),
          imageUrl: p.photos?.[0] || '',
          bio: p.description || '',
          email: '',
          avatar: p.photos?.[0] || '',
          premium: false,
          online: false,
          likes: 0,
          comments: 0,
          isLiked: false,
          reviews: [],
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || new Date().toISOString()
        }));
        setProfiles(mappedProfiles);
      }

      setIsLoadingProfiles(false);
    };

    loadData();
  }, []);

  // Compter les posts par ville et arrondissement
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    postLocations.forEach(location => {
      if (location) {
        // Compter pour la location exacte
        counts[location] = (counts[location] || 0) + 1;

        // Si c'est un arrondissement (ex: "Paris 5e"), compter aussi pour la ville de base ("Paris")
        const baseCity = location.split(' ')[0];
        if (location.includes(' ') && baseCity) {
          counts[baseCity] = (counts[baseCity] || 0) + 1;
        }
      }
    });
    return counts;
  }, [postLocations]);

  // Filtrer les profils en fonction des critères
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Filtrer par recherche textuelle
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = profile.name.toLowerCase().includes(searchLower);
        const matchesUsername = (profile.username || '').toLowerCase().includes(searchLower);
        const matchesDescription = profile.description.toLowerCase().includes(searchLower);
        const matchesLocation = profile.location.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesUsername && !matchesDescription && !matchesLocation) {
          return false;
        }
      }

      // Filtrer par prestations sélectionnées
      if (selectedPrestations.length > 0) {
        const profilePrestations = profile.prestations.split(' • ');
        const hasAllPrestations = selectedPrestations.every(p =>
          profilePrestations.includes(p)
        );
        if (!hasAllPrestations) return false;
      }

      // Filtrer par note minimale
      if (minRating > 0 && profile.rating < minRating) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedPrestations, minRating, profiles]);

  const handleCitySelect = (city: string, count: number) => {
    // Vérifier si cette ville a des arrondissements
    if (cityArrondissements[city]) {
      setSelectedCity(city);
      setCurrentLevel('arrondissement');
      setSearchQuery('');
      return;
    }

    if (count === 0) {
      // Ne rien faire si aucune annonce n'est disponible
      return;
    }
    if (onLocationSelect) {
      onLocationSelect(city);
    }
    onClose();
  };

  const handleArrondissementSelect = (arrondissement: string, count: number) => {
    if (count === 0) {
      // Ne rien faire si aucune annonce n'est disponible
      return;
    }
    if (onLocationSelect) {
      onLocationSelect(arrondissement);
    }
    onClose();
  };

  // Fonction pour obtenir toutes les villes
  const getAllCities = () => {
    const cities: string[] = [];
    Object.values(regions).forEach(departments => {
      Object.values(departments).forEach(departmentCities => {
        cities.push(...departmentCities);
      });
    });
    return cities;
  };

  // Filtrer les données en fonction de la recherche
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();

    // Si la recherche est vide, afficher le niveau actuel
    if (!query) {
      if (currentLevel === 'region') {
        return Object.keys(regions);
      }
      if (currentLevel === 'department' && selectedRegion && regions[selectedRegion]) {
        return Object.keys(regions[selectedRegion]);
      }
      if (currentLevel === 'city' && selectedRegion && selectedDepartment &&
          regions[selectedRegion]?.[selectedDepartment]) {
        return regions[selectedRegion][selectedDepartment];
      }
      if (currentLevel === 'arrondissement' && selectedCity && cityArrondissements[selectedCity]) {
        return cityArrondissements[selectedCity];
      }
      return [];
    }

    // Recherche globale dans toutes les villes si la recherche contient au moins 2 caractères
    if (query.length >= 2) {
      const allCities = getAllCities();
      const matchingCities = allCities.filter(city =>
        city.toLowerCase().includes(query)
      );

      if (matchingCities.length > 0) {
        return matchingCities;
      }
    }

    // Recherche par niveau si aucune ville ne correspond
    if (currentLevel === 'region') {
      return Object.keys(regions).filter(region =>
        region.toLowerCase().includes(query)
      );
    }

    if (currentLevel === 'department' && selectedRegion && regions[selectedRegion]) {
      return Object.keys(regions[selectedRegion]).filter(department =>
        department.toLowerCase().includes(query)
      );
    }

    if (currentLevel === 'city' && selectedRegion && selectedDepartment &&
        regions[selectedRegion]?.[selectedDepartment]) {
      return regions[selectedRegion][selectedDepartment].filter(city =>
        city.toLowerCase().includes(query)
      );
    }

    if (currentLevel === 'arrondissement' && selectedCity && cityArrondissements[selectedCity]) {
      return cityArrondissements[selectedCity].filter(arr =>
        arr.toLowerCase().includes(query)
      );
    }

    return [];
  }, [searchQuery, currentLevel, selectedRegion, selectedDepartment, selectedCity]);

  const handlePrestationToggle = (prestation: string) => {
    setSelectedPrestations(prev => 
      prev.includes(prestation)
        ? prev.filter(p => p !== prestation)
        : [...prev, prestation]
    );
  };

  const handleRegionClick = (region: string) => {
    if (regions[region]) {
      setSelectedRegion(region);
      setCurrentLevel('department');
      setSearchQuery('');
    }
  };

  const handleDepartmentClick = (department: string) => {
    if (selectedRegion && regions[selectedRegion]?.[department]) {
      setSelectedDepartment(department);
      const cities = regions[selectedRegion][department];

      // Si le département ne contient qu'une seule ville et qu'elle a des arrondissements,
      // passer directement au niveau arrondissement
      if (cities.length === 1 && cityArrondissements[cities[0]]) {
        setSelectedCity(cities[0]);
        setCurrentLevel('arrondissement');
      } else {
        setCurrentLevel('city');
      }
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    if (currentLevel === 'arrondissement') {
      // Si le département et la ville sont identiques (ex: Paris),
      // retourner au niveau département
      if (selectedDepartment === selectedCity) {
        setCurrentLevel('department');
        setSelectedCity(null);
      } else {
        setCurrentLevel('city');
        setSelectedCity(null);
      }
    } else if (currentLevel === 'city') {
      setCurrentLevel('department');
      setSelectedDepartment(null);
    } else if (currentLevel === 'department') {
      setCurrentLevel('region');
      setSelectedRegion(null);
    }
    setSearchQuery('');
  };

  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        prestations: selectedPrestations,
        priceRange,
        rating: minRating
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-dark z-50 flex flex-col" style={{ top: '64px', bottom: '60px' }}>
      <div className="w-full max-w-xl mx-auto px-4 py-3 flex-none">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          {searchMode === 'location' && currentLevel !== 'region' && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-dark-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder={
                searchMode === 'users'
                  ? 'Rechercher une personne...'
                  : searchMode === 'location'
                    ? `Rechercher ${
                        currentLevel === 'region' ? 'une région' :
                        currentLevel === 'department' ? 'un département' :
                        currentLevel === 'arrondissement' ? 'un arrondissement' :
                        'une ville'
                      }...`
                    : "Rechercher..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-100 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose border border-dark-200"
            />
          </div>
          {(searchMode === 'users' || searchMode === 'location' && currentLevel === 'region' || searchMode === 'filters') && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setSearchMode('users');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              searchMode === 'users'
                ? 'bg-rose text-white'
                : 'bg-dark-100 text-gray-400 hover:text-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline-block mr-1" />
            Personnes
          </button>
          <button
            onClick={() => {
              setSearchMode('location');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              searchMode === 'location'
                ? 'bg-rose text-white'
                : 'bg-dark-100 text-gray-400 hover:text-gray-300'
            }`}
          >
            <MapPin className="h-4 w-4 inline-block mr-1" />
            Ville
          </button>
          <button
            onClick={() => {
              setSearchMode('filters');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              searchMode === 'filters'
                ? 'bg-rose text-white'
                : 'bg-dark-100 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Filter className="h-4 w-4 inline-block mr-1" />
            Filtres
          </button>
        </div>

        {/* Navigation Path */}
        {searchMode === 'location' && (selectedRegion || selectedDepartment || selectedCity) && (
          <div className="flex items-center gap-2 text-sm mb-4">
            {selectedRegion && (
              <>
                <button
                  onClick={() => {
                    setCurrentLevel('region');
                    setSelectedRegion(null);
                    setSelectedDepartment(null);
                    setSelectedCity(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-rose transition-colors"
                >
                  {selectedRegion}
                </button>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </>
            )}
            {selectedDepartment && selectedDepartment !== selectedCity && (
              <>
                <button
                  onClick={() => {
                    setCurrentLevel('department');
                    setSelectedDepartment(null);
                    setSelectedCity(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-rose transition-colors"
                >
                  {selectedDepartment}
                </button>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </>
            )}
            {selectedCity && (
              <>
                <span className="text-gray-400">
                  {selectedCity}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto px-4">
          {searchMode === 'users' ? (
            <div className="space-y-3">
              {isSearchingUsers ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose"></div>
                  <p className="mt-2">Recherche en cours...</p>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="text-center py-12 text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Saisissez au moins 2 caractères pour rechercher</p>
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun résultat trouvé</p>
                  <p className="text-sm mt-2">Essayez avec un autre nom ou pseudo</p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-400 mb-2">
                    {userSearchResults.length} résultat{userSearchResults.length > 1 ? 's' : ''}
                  </div>
                  {userSearchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className="w-full flex items-center gap-3 p-3 bg-dark-100 hover:bg-dark-50 rounded-lg transition-colors border border-dark-200"
                    >
                      <img
                        src={profile.photos[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                        alt={profile.username || profile.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-200">
                          {profile.username || profile.name}
                        </h4>
                        {profile.username && profile.username !== profile.name && (
                          <p className="text-xs text-gray-500">{profile.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {profile.location && (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {profile.location}
                            </span>
                          )}
                          {profile.rating > 0 && (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <Star className="h-3 w-3 text-rose fill-rose" />
                              {profile.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : searchMode === 'filters' ? (
            <div className="space-y-6">
              {/* Prestations */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Prestations</h3>
                <div className="grid grid-cols-2 gap-2">
                  {PRESTATIONS.map(prestation => (
                    <button
                      key={prestation}
                      onClick={() => handlePrestationToggle(prestation)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedPrestations.includes(prestation)
                          ? 'bg-rose text-white'
                          : 'bg-dark-100 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <Tag className="h-4 w-4" />
                      {prestation}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note minimale */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Note minimale</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-gray-200 font-medium">{minRating} / 5</span>
                </div>
              </div>

              {/* Résultats */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">
                  {filteredProfiles.length} résultat{filteredProfiles.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-4">
                  {isLoadingProfiles ? (
                    <div className="text-center py-8 text-gray-400">
                      Chargement...
                    </div>
                  ) : filteredProfiles.map(profile => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-4 p-4 bg-dark-100 rounded-lg"
                    >
                      <img
                        src={profile.photos[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                        alt={profile.username || profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-200">{profile.username || profile.name}</h4>
                        {profile.username && profile.username !== profile.name && (
                          <p className="text-xs text-gray-500">{profile.name}</p>
                        )}
                        <p className="text-sm text-gray-400">{profile.location}</p>
                        {profile.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 text-rose fill-rose" />
                            <span className="text-sm text-gray-400">{profile.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton Appliquer */}
              <button
                onClick={applyFilters}
                className="w-full bg-rose text-white py-3 rounded-lg font-medium hover:bg-rose-600 transition-colors"
              >
                Appliquer les filtres
              </button>
            </div>
          ) : (
            <div className="divide-y divide-dark-200">
              {filteredData.map((item) => {
                let count = 0;
                let postalCode = '';

                if (currentLevel === 'region' && regions[item]) {
                  Object.keys(regions[item]).forEach(dept => {
                    regions[item][dept].forEach(city => {
                      count += cityCounts[city] || 0;
                    });
                  });
                } else if (currentLevel === 'department' && selectedRegion && regions[selectedRegion]?.[item]) {
                  postalCode = departmentCodes[item] || '';
                  regions[selectedRegion][item].forEach(city => {
                    count += cityCounts[city] || 0;
                  });
                } else if (currentLevel === 'city') {
                  if (selectedDepartment) {
                    postalCode = departmentCodes[selectedDepartment] || '';
                  }
                  count = cityCounts[item] || 0;
                } else if (currentLevel === 'arrondissement') {
                  if (selectedDepartment) {
                    postalCode = departmentCodes[selectedDepartment] || '';
                  }
                  count = cityCounts[item] || 0;
                }

                const showChevron = currentLevel === 'region' ||
                                    currentLevel === 'department' ||
                                    (currentLevel === 'city' && cityArrondissements[item]);
                const isDisabled = (currentLevel === 'city' || currentLevel === 'arrondissement') &&
                                   count === 0 &&
                                   !cityArrondissements[item];

                return (
                  <button
                    key={item}
                    onClick={() => {
                      if (currentLevel === 'region') handleRegionClick(item);
                      else if (currentLevel === 'department') handleDepartmentClick(item);
                      else if (currentLevel === 'arrondissement') handleArrondissementSelect(item, count);
                      else handleCitySelect(item, count);
                    }}
                    className={`w-full flex items-center justify-between py-3 px-4 transition-colors ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-dark-100'
                    }`}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200">{item}</span>
                        {postalCode && (
                          <span className="text-xs text-gray-500">({postalCode})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${count === 0 && !showChevron ? 'text-gray-600' : 'text-gray-500'}`}>
                        {count === 0 && !showChevron ? 'Aucune annonce' : `${count} annonce${count > 1 ? 's' : ''}`}
                      </span>
                      {showChevron && (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onContact={() => {
            setSelectedProfile(null);
            onClose();
          }}
          isAuthenticated={true}
        />
      )}
    </div>
  );
};

export default SearchModal;