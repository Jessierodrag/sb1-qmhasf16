import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import { regions, departmentCodes, cityArrondissements } from '../data/regions';

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  className?: string;
}

type NavigationLevel = 'region' | 'department' | 'city' | 'arrondissement';

const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('region');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    setCurrentLevel('department');
    setSearchQuery('');
  };

  const handleDepartmentClick = (department: string) => {
    setSelectedDepartment(department);
    setCurrentLevel('city');
    setSearchQuery('');
  };

  const handleCitySelect = (city: string) => {
    // Vérifier si cette ville a des arrondissements
    if (cityArrondissements[city]) {
      setSelectedCity(city);
      setCurrentLevel('arrondissement');
      setSearchQuery('');
      return;
    }

    onChange(city);
    setIsOpen(false);
    resetNavigation();
  };

  const handleArrondissementSelect = (arrondissement: string) => {
    onChange(arrondissement);
    setIsOpen(false);
    resetNavigation();
  };

  const resetNavigation = () => {
    setCurrentLevel('region');
    setSelectedRegion(null);
    setSelectedDepartment(null);
    setSelectedCity(null);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (currentLevel === 'arrondissement') {
      setCurrentLevel('city');
      setSelectedCity(null);
    } else if (currentLevel === 'city') {
      setCurrentLevel('department');
      setSelectedDepartment(null);
    } else if (currentLevel === 'department') {
      setCurrentLevel('region');
      setSelectedRegion(null);
    }
    setSearchQuery('');
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();

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

    // Recherche globale dans toutes les villes et arrondissements
    if (query.length >= 2) {
      const results: string[] = [];

      // Rechercher dans les villes
      Object.values(regions).forEach(departments => {
        Object.values(departments).forEach(cities => {
          cities.forEach(city => {
            if (city.toLowerCase().includes(query)) {
              results.push(city);
            }
          });
        });
      });

      // Rechercher dans les arrondissements
      Object.entries(cityArrondissements).forEach(([city, arrondissements]) => {
        if (city.toLowerCase().includes(query)) {
          // Si la ville correspond, ajouter tous ses arrondissements
          arrondissements.forEach(arr => {
            if (!results.includes(arr)) {
              results.push(arr);
            }
          });
        } else {
          // Sinon, vérifier si des arrondissements correspondent
          arrondissements.forEach(arr => {
            if (arr.toLowerCase().includes(query) && !results.includes(arr)) {
              results.push(arr);
            }
          });
        }
      });

      if (results.length > 0) {
        return results;
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

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {value || 'Ajouter un lieu'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

{isOpen && createPortal(
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-3">
          <div className="bg-dark-50 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col border border-dark-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200">
              <h3 className="text-lg font-semibold text-gray-200">
                {currentLevel === 'region' && 'Sélectionner une région'}
                {currentLevel === 'department' && 'Sélectionner un département'}
                {currentLevel === 'city' && 'Sélectionner une ville'}
                {currentLevel === 'arrondissement' && 'Sélectionner un arrondissement'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  resetNavigation();
                }}
                className="p-2 hover:bg-dark-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Search bar */}
            <div className="p-4 border-b border-dark-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={`Rechercher ${
                    currentLevel === 'region' ? 'une région' :
                    currentLevel === 'department' ? 'un département' :
                    currentLevel === 'arrondissement' ? 'un arrondissement' :
                    'une ville'
                  }...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-dark-100 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose border border-dark-200"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-200 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Breadcrumb & Back button */}
              {currentLevel !== 'region' && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-rose hover:text-rose-600 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Retour
                  </button>

                  {(selectedRegion || selectedDepartment || selectedCity) && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {selectedRegion && (
                        <>
                          <span>{selectedRegion}</span>
                          {selectedDepartment && <ChevronRight className="h-3 w-3" />}
                        </>
                      )}
                      {selectedDepartment && (
                        <>
                          <span>{selectedDepartment}</span>
                          {selectedCity && <ChevronRight className="h-3 w-3" />}
                        </>
                      )}
                      {selectedCity && (
                        <span>{selectedCity}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto">
              {filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun résultat trouvé
                </div>
              ) : (
                <div className="divide-y divide-dark-200">
                  {filteredData.map((item) => {
                    let postalCode = '';

                    if (currentLevel === 'department') {
                      postalCode = departmentCodes[item] || '';
                    } else if (currentLevel === 'city' && selectedDepartment) {
                      postalCode = departmentCodes[selectedDepartment] || '';
                    } else if (currentLevel === 'arrondissement' && selectedDepartment) {
                      postalCode = departmentCodes[selectedDepartment] || '';
                    }

                    // Vérifier si c'est un arrondissement en mode recherche
                    const isArrondissement = Object.values(cityArrondissements)
                      .some(arrondissements => arrondissements.includes(item));

                    const showChevron = !isArrondissement && (
                      currentLevel === 'region' ||
                      currentLevel === 'department' ||
                      (currentLevel === 'city' && cityArrondissements[item]) ||
                      (searchQuery && searchQuery.length >= 2 && cityArrondissements[item])
                    );

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          // En mode recherche globale, détecter automatiquement le type
                          if (searchQuery && searchQuery.length >= 2) {
                            if (isArrondissement) {
                              handleArrondissementSelect(item);
                            } else {
                              handleCitySelect(item);
                            }
                          } else {
                            // Navigation normale par niveau
                            if (currentLevel === 'region') handleRegionClick(item);
                            else if (currentLevel === 'department') handleDepartmentClick(item);
                            else if (currentLevel === 'arrondissement') handleArrondissementSelect(item);
                            else handleCitySelect(item);
                          }
                        }}
                        className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-dark-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <div className="text-left">
                            <div className="text-gray-200 font-medium">{item}</div>
                            {postalCode && (
                              <div className="text-sm text-gray-500">{postalCode}</div>
                            )}
                          </div>
                        </div>
                        {showChevron && (
                          <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LocationSelector;
