import React, { useState, useRef, useEffect } from 'react';
import { Ban, Trash2, User } from 'lucide-react';
import { Conversation } from '../lib/conversations';

interface ConversationItemProps {
  conversation: Conversation;
  onConversationClick: (conversation: Conversation) => void;
  onDelete: (conversationId: string, event: React.MouseEvent) => void;
  onBlock: (userId: string, userName: string, event: React.MouseEvent) => void;
  onViewProfile?: (userId: string, event: React.MouseEvent) => void;
  formatTime: (timestamp: string | null) => string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onConversationClick,
  onDelete,
  onBlock,
  onViewProfile,
  formatTime
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxSwipe = onViewProfile ? 232 : 160;

  // Reset le swipe si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setTranslateX(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - translateX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;

    // Limiter le swipe entre 0 et maxSwipe (seulement vers la gauche)
    const newTranslateX = Math.max(0, Math.min(maxSwipe, diff));
    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Si le swipe est supérieur à 50% de la distance max, on l'ouvre complètement
    // Sinon on le referme
    if (translateX > maxSwipe * 0.4) {
      setTranslateX(maxSwipe);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ne pas activer le swipe si on clique sur les boutons d'action
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    setIsDragging(true);
    setStartX(e.clientX - translateX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const diff = startX - currentX;

    const newTranslateX = Math.max(0, Math.min(maxSwipe, diff));
    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > maxSwipe * 0.4) {
      setTranslateX(maxSwipe);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleClick = () => {
    // Si le swipe est ouvert, on le ferme au lieu d'ouvrir la conversation
    if (translateX > 0) {
      setTranslateX(0);
      return;
    }
    onConversationClick(conversation);
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: 'delete' | 'block' | 'profile'
  ) => {
    e.stopPropagation();

    if (action === 'delete') {
      onDelete(conversation.id, e);
    } else if (action === 'block') {
      onBlock(
        conversation.otherUser?.id || '',
        conversation.otherUser?.username || conversation.otherUser?.name || '',
        e
      );
    } else if (action === 'profile' && onViewProfile && conversation.otherUser?.user_id) {
      onViewProfile(conversation.otherUser.user_id, e);
    }

    setTranslateX(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      onMouseLeave={handleMouseLeave}
    >
      {/* Boutons d'action (arrière-plan) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-3">
        {onViewProfile && (
          <button
            onClick={(e) => handleActionClick(e, 'profile')}
            className="action-button flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            title="Voir le profil"
          >
            <User className="h-5 w-5 text-white" />
          </button>
        )}
        <button
          onClick={(e) => handleActionClick(e, 'block')}
          className="action-button flex items-center justify-center w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          title="Bloquer"
        >
          <Ban className="h-5 w-5 text-white" />
        </button>
        <button
          onClick={(e) => handleActionClick(e, 'delete')}
          className="action-button flex items-center justify-center w-14 h-14 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Contenu de la conversation (premier plan) */}
      <div
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="bg-dark-50 border border-dark-200 cursor-pointer select-none"
      >
        <button
          onClick={handleClick}
          className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-dark-100 transition-colors text-left"
        >
          <div className="relative flex-shrink-0">
            <img
              src={
                conversation.otherUser?.photos[0] ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
              }
              alt={conversation.otherUser?.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
            />
            {conversation.unread_count > 0 && (
              <div className="absolute -top-1 -right-1 bg-rose text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium">
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3
                className={`font-medium truncate ${
                  conversation.unread_count > 0 ? 'text-gray-100' : 'text-gray-200'
                }`}
              >
                {conversation.otherUser?.username || conversation.otherUser?.name}
              </h3>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTime(conversation.last_message_at)}
              </span>
            </div>
            <p
              className={`text-sm truncate ${
                conversation.unread_count > 0
                  ? 'text-gray-300 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {conversation.last_message || 'Aucun message'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ConversationItem;
