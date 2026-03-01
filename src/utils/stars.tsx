import React from 'react';
import { Star } from 'lucide-react';

export const renderStars = (count: number | undefined) => {
  if (typeof count !== 'number' || count === 0) {
    return <span className="text-sm text-gray-400">Pas encore d'avis</span>;
  }
  
  return (
    <div className="flex items-center">
      <Star className="h-5 w-5 fill-[#FF1B51] text-[#FF1B51]" />
      <span className="ml-1 text-sm text-gray-400">{count.toFixed(1)}</span>
    </div>
  );
};

// Fonction pour afficher les étoiles complètes
export const renderFullStars = (rating: number) => {
  if (rating === 0) {
    return <span className="text-sm text-gray-400">Pas encore d'avis</span>;
  }
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {/* Étoiles pleines */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-[#FF1B51] text-[#FF1B51]" />
      ))}
      
      {/* Demi-étoile si nécessaire */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-4 w-4 text-[#FF1B51]" />
          <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
            <Star className="h-4 w-4 fill-[#FF1B51] text-[#FF1B51]" />
          </div>
        </div>
      )}
      
      {/* Étoiles vides */}
      {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-500" />
      ))}
    </div>
  );
};