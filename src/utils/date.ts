export const formatMessageTime = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatNotificationTime = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else if (hours < 24) {
    return `Il y a ${hours}h`;
  } else {
    return dateObj.toLocaleDateString('fr-FR');
  }
};

export const formatDistanceToNow = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'À l\'instant';
  } else if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else if (hours < 24) {
    return `Il y a ${hours}h`;
  } else if (days < 7) {
    return `Il y a ${days}j`;
  } else {
    return dateObj.toLocaleDateString('fr-FR');
  }
};

export const formatRelativeTime = formatDistanceToNow;