import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import MediaViewerModal from './modals/MediaViewerModal';

interface PhotoCarouselProps {
  photos: string[];
  thumbnails?: string[];
  className?: string;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos, thumbnails, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean[]>(photos.map(() => true));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchTime = useRef<number>(0);
  const velocity = useRef<number>(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const minSwipeDistance = 50;
  const snapThreshold = 0.3;

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsTransitioning(true);
    }
  }, [currentIndex, photos.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsTransitioning(true);
    }
  }, [currentIndex]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;

    // Vérifier si on est déjà en plein écran
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      // Essayer d'entrer en plein écran avec différentes APIs
      // iOS Safari nécessite webkitEnterFullscreen pour les vidéos
      if (currentVideo.webkitEnterFullscreen) {
        try {
          currentVideo.webkitEnterFullscreen();
        } catch (err) {
          console.error('Erreur webkitEnterFullscreen:', err);
        }
      }
      // API standard et préfixes pour autres navigateurs
      else if (currentVideo.requestFullscreen) {
        currentVideo.requestFullscreen().catch(err => {
          console.error('Erreur requestFullscreen:', err);
        });
      } else if (currentVideo.webkitRequestFullscreen) {
        currentVideo.webkitRequestFullscreen();
      }
    } else {
      // Sortir du plein écran
      // iOS Safari gère la sortie automatiquement avec webkitEnterFullscreen
      if (currentVideo.webkitExitFullscreen) {
        try {
          currentVideo.webkitExitFullscreen();
        } catch (err) {
          console.error('Erreur webkitExitFullscreen:', err);
        }
      }
      else if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('Erreur exitFullscreen:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [currentIndex]);

  const handleMediaClick = () => {
    if (!isDragging && Math.abs(dragOffset) < 5) {
      setShowMediaViewer(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    lastTouchTime.current = Date.now();
    velocity.current = 0;
    setIsDragging(true);
    setIsTransitioning(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // Détecter si le mouvement est plus horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      // Empêcher le scroll vertical quand on scroll horizontalement
      e.preventDefault();

      // Calculer la vélocité
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTouchTime.current;
      if (timeDiff > 0) {
        velocity.current = diffX / timeDiff;
      }
      lastTouchTime.current = currentTime;

      // Limiter le drag aux bords
      let newOffset = -diffX;
      if (currentIndex === 0 && newOffset > 0) {
        newOffset = newOffset * 0.3; // Résistance au bord gauche
      } else if (currentIndex === photos.length - 1 && newOffset < 0) {
        newOffset = newOffset * 0.3; // Résistance au bord droit
      }

      setDragOffset(newOffset);
    }
  };

  const onTouchEnd = () => {
    if (!touchStartX.current) return;

    setIsDragging(false);
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const swipeDistance = -dragOffset;
    const swipePercent = Math.abs(swipeDistance) / containerWidth;

    // Déterminer si on change de slide basé sur la distance ou la vélocité
    const shouldChangeSlide = swipePercent > snapThreshold || Math.abs(velocity.current) > 0.5;

    if (shouldChangeSlide) {
      if (swipeDistance > 0 && currentIndex < photos.length - 1) {
        goToNext();
      } else if (swipeDistance < 0 && currentIndex > 0) {
        goToPrevious();
      } else {
        setIsTransitioning(true);
      }
    } else {
      setIsTransitioning(true);
    }

    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    velocity.current = 0;
  };

  // Support pour le drag avec la souris (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    lastTouchTime.current = Date.now();
    velocity.current = 0;
    setIsDragging(true);
    setIsTransitioning(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStartX.current || !touchStartY.current) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // Détecter si le mouvement est plus horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      // Calculer la vélocité
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTouchTime.current;
      if (timeDiff > 0) {
        velocity.current = diffX / timeDiff;
      }
      lastTouchTime.current = currentTime;

      // Limiter le drag aux bords
      let newOffset = -diffX;
      if (currentIndex === 0 && newOffset > 0) {
        newOffset = newOffset * 0.3;
      } else if (currentIndex === photos.length - 1 && newOffset < 0) {
        newOffset = newOffset * 0.3;
      }

      setDragOffset(newOffset);
    }
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    onTouchEnd();
  };

  const onMouseLeave = () => {
    if (isDragging) {
      onTouchEnd();
    }
  };

  // Preload images
  useEffect(() => {
    photos.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoading(prev => {
          const newState = [...prev];
          newState[index] = false;
          return newState;
        });
      };
    });
  }, [photos]);

  // Reset transition after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Gérer la lecture/pause des vidéos selon l'index actif
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentIndex) {
        // Jouer la vidéo active
        video.play().catch(err => {
          console.log('Autoplay bloqué:', err);
        });
      } else {
        // Mettre en pause les autres vidéos
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // Synchroniser le muted state avec toutes les vidéos
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Écouter les changements d'état du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFullscreenNow);
    };

    // Ajouter tous les écouteurs d'événements pour la compatibilité cross-browser
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Pour iOS Safari avec webkitEnterFullscreen sur les vidéos
    videoRefs.current.forEach((video) => {
      if (video) {
        video.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
        video.addEventListener('webkitendfullscreen', handleFullscreenChange);
      }
    });

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      videoRefs.current.forEach((video) => {
        if (video) {
          video.removeEventListener('webkitbeginfullscreen', handleFullscreenChange);
          video.removeEventListener('webkitendfullscreen', handleFullscreenChange);
        }
      });
    };
  }, []);

  // Function to get optimized image URL
  const getOptimizedImageUrl = (url: string) => {
    if (url.includes('unsplash.com')) {
      const hasParams = url.includes('?');
      return `${url}${hasParams ? '&' : '?'}w=400&q=80&fm=webp`;
    }
    return url;
  };

  // Function to check if URL is a video
  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  if (!photos.length) return null;

  // Calculer la transformation pour le carousel
  const getTransform = () => {
    const baseTranslate = -currentIndex * 100;
    const dragTranslate = isDragging ? (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100 : 0;
    return `translateX(${baseTranslate + dragTranslate}%)`;
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <div
          ref={containerRef}
          className={`relative w-full pb-[100%] overflow-hidden touch-pan-y select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-pointer'
          }`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onClick={handleMediaClick}
          style={{ touchAction: 'pan-y' }}
        >
        {/* Conteneur des slides */}
        <div
          className="absolute inset-0 flex"
          style={{
            transform: getTransform(),
            transition: isTransitioning && !isDragging ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            willChange: 'transform'
          }}
        >
          {photos.map((photo, index) => {
            const distance = Math.abs(index - currentIndex);
            const isActive = index === currentIndex;
            const thumbnail = thumbnails?.[index];
            const shouldShowThumbnail = !isActive && thumbnail && isVideoUrl(photo);

            // Calculer l'opacité en fonction de la position et du drag
            let opacity = 1;
            if (isDragging) {
              const dragProgress = Math.abs(dragOffset) / (containerRef.current?.offsetWidth || 1);
              if (isActive) {
                opacity = Math.max(0.4, 1 - dragProgress * 0.6);
              } else if (distance === 1) {
                opacity = Math.min(1, 0.4 + dragProgress * 0.6);
              } else {
                opacity = 0.2;
              }
            } else {
              opacity = isActive ? 1 : (distance === 0 ? 1 : 0.2);
            }

            // Calculer le scale pour un effet de profondeur
            let scale = 1;
            if (isDragging) {
              const dragProgress = Math.abs(dragOffset) / (containerRef.current?.offsetWidth || 1);
              if (isActive) {
                scale = Math.max(0.95, 1 - dragProgress * 0.05);
              } else if (distance === 1) {
                scale = Math.min(1, 0.95 + dragProgress * 0.05);
              }
            }

            return (
              <div
                key={index}
                className="relative flex-shrink-0 w-full h-full"
                style={{
                  opacity: isTransitioning || isDragging ? opacity : (isActive ? 1 : 0),
                  transform: `scale(${scale})`,
                  transition: isTransitioning && !isDragging
                    ? 'opacity 300ms ease-out, transform 300ms ease-out'
                    : 'none'
                }}
              >
                {isLoading[index] && !shouldShowThumbnail && !isVideoUrl(photo) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-100">
                    <Loader className="h-8 w-8 text-gray-500 animate-spin" />
                  </div>
                )}
                {shouldShowThumbnail ? (
                  <img
                    src={getOptimizedImageUrl(thumbnail)}
                    alt={`Aperçu vidéo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                ) : isVideoUrl(photo) ? (
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={photo}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay={index === currentIndex}
                    loop
                    muted={isMuted}
                    preload="metadata"
                    controls={false}
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                ) : (
                  <img
                    src={getOptimizedImageUrl(photo)}
                    alt={`Photo ${index + 1}`}
                    className={`w-full h-full object-cover ${isLoading[index] ? 'opacity-0' : 'opacity-100'}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Boutons de contrôle vidéo - Visibles uniquement sur les vidéos */}
        {isVideoUrl(photos[currentIndex]) && (
          <div className="absolute top-4 right-4 flex gap-2 z-30 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleMute();
              }}
              className="bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all touch-manipulation"
              aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFullscreen();
              }}
              className="bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-all touch-manipulation"
              aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        )}

        {/* Navigation Arrows - Hidden on Mobile */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentIndex === 0}
              className={`hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                currentIndex === 0 ? 'cursor-not-allowed opacity-30' : ''
              }`}
              aria-label="Photo précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentIndex === photos.length - 1}
              className={`hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                currentIndex === photos.length - 1 ? 'cursor-not-allowed opacity-30' : ''
              }`}
              aria-label="Photo suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsTransitioning(true);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white w-3'
                    : 'bg-white/50'
                }`}
                aria-label={`Aller à la photo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {showMediaViewer && (
      <MediaViewerModal
        media={photos}
        thumbnails={thumbnails}
        initialIndex={currentIndex}
        onClose={() => setShowMediaViewer(false)}
      />
    )}
    </>
  );
};

export default PhotoCarousel;