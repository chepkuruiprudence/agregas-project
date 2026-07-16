import {
  Zap,
  Shield,
  TrendingDown,
  Leaf,
  Star,
  MapPin,
  Check,
  ArrowRight,
  Users,
  Percent,
  ShoppingCart,
  Truck,
  Gift,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map string names to icon components
export const iconMap: Record<string, LucideIcon> = {
  Zap,
  Shield,
  TrendingDown,
  Leaf,
  Star,
  MapPin,
  Check,
  ArrowRight,
  Users,
  Percent,
  ShoppingCart,
  Truck,
  Gift,
};

/**
 * Get icon component by string name
 * @param name - Icon name as string
 * @returns Icon component
 */
export const getIcon = (name: string): LucideIcon => {
  const icon = iconMap[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found, using Zap as fallback`);
    return Zap;
  }
  return icon;
};