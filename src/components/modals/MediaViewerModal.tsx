import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

interface MediaViewerModalProps {
  media: string[];
  thumbnails?: string[];
  initialIndex?: number;
  onClose: () => void;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  media,
  thumbnails,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const currentMedia = media[currentIndex];
  const isVideo = isVideoUrl(currentMedia);

  const goToNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(err => {
      });
    }
  }, [currentIndex, isMuted, isVideo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, media.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black animate-fade-in flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-0">
        <div className="relative inline-flex max-w-full max-h-full">
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={currentMedia}
                className="max-w-full max-h-[100dvh] object-contain"
                playsInline
                autoPlay
                loop
                muted={isMuted}
                controls={false}
                webkit-playsinline="true"
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
              <button
                onClick={toggleMute}
                className="absolute top-2 left-2 p-2.5 sm:p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all touch-manipulation"
                aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6 sm:h-5 sm:w-5" />
                ) : (
                  <Volume2 className="h-6 w-6 sm:h-5 sm:w-5" />
                )}
              </button>
            </>
          ) : (
            <img
              src={currentMedia}
              alt={`Média ${currentIndex + 1}`}
              className="max-w-full max-h-[100dvh] object-contain"
            />
          )}

          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2.5 sm:p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all touch-manipulation"
            aria-label="Fermer"
          >
            <X className="h-6 w-6 sm:h-5 sm:w-5" />
          </button>

          {media.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 bg-black/60 text-white rounded-full transition-all touch-manipulation ${
                  currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
                }`}
                aria-label="Média précédent"
              >
                <ChevronLeft className="h-7 w-7 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === media.length - 1}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 bg-black/60 text-white rounded-full transition-all touch-manipulation ${
                  currentIndex === media.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80'
                }`}
                aria-label="Média suivant"
              >
                <ChevronRight className="h-7 w-7 sm:h-6 sm:w-6" />
              </button>

              <div className="absolute bottom-12 sm:bottom-12 left-1/2 -translate-x-1/2 text-white text-xs sm:text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full">
                {currentIndex + 1} / {media.length}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-5'
                        : 'bg-white/50 hover:bg-white/70 w-1.5'
                    }`}
                    aria-label={`Aller au média ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MediaViewerModal;
