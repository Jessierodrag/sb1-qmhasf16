import { useState, useEffect, useCallback } from 'react';
import {
  getReceivedLikesCount
} from '../lib/notifications';
import { getPostReviewsCount } from '../lib/reviews';
import { getUserTotalViews } from '../lib/views';

export interface DashboardStats {
  profileViews: number;
  receivedLikes: number;
  receivedReviews: number;
}

export const useDashboardStats = (userId: string | null | undefined) => {
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    receivedLikes: 0,
    receivedReviews: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!userId) {
      setStats({
        profileViews: 0,
        receivedLikes: 0,
        receivedReviews: 0
      });
      setIsLoading(false);
      return;
    }

    try {

      const [likesResult, reviewsResult, viewsResult] = await Promise.all([
        getReceivedLikesCount(userId),
        getPostReviewsCount(userId),
        getUserTotalViews(userId)
      ]);

      setStats({
        profileViews: viewsResult.count,
        receivedLikes: likesResult.count,
        receivedReviews: reviewsResult.count
      });

        views: viewsResult.count,
        likes: likesResult.count,
        reviews: reviewsResult.count
      });
    } catch (err) {
      console.error('[useDashboardStats] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    refresh: loadStats
  };
};
