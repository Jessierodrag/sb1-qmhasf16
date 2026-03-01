import React from 'react';
import { Sparkles, Crown, BadgeCheck } from 'lucide-react';
import { getSubscriptionPlan, type SubscriptionTier } from '../lib/subscriptions';

interface SubscriptionBadgeProps {
  tier?: SubscriptionTier | string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  tier,
  size = 'md',
  showName = false
}) => {
  if (!tier || tier === 'free') {
    return null;
  }

  const plan = getSubscriptionPlan(tier as SubscriptionTier);

  if (!plan) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSize = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7'
  };

  const BadgeIcon = plan.badge === 'sparkles' ? Sparkles
    : plan.badge === 'crown' ? Crown
    : BadgeCheck;

  const iconColor = plan.tier === 'basic' ? 'text-yellow-500'
    : plan.tier === 'premium' ? 'text-purple-500'
    : 'text-blue-500';

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]}`}
      title={`Membre ${plan.name}`}
    >
      <BadgeIcon className={`${iconSize[size]} ${iconColor}`} />
      {showName && <span className={`ml-1 ${iconColor}`}>{plan.name}</span>}
    </div>
  );
};

export default SubscriptionBadge;
