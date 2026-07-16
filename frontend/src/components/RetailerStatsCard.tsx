// frontend/src/components/StatsCard.tsx

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down';
}

export const StatsCard = ({ icon: Icon, label, value, subtext, trend }: StatsCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
      {/* Icon */}
      <div className="inline-block p-3 bg-primary-100 rounded-lg mb-4">
        <Icon size={24} className="text-primary-600" />
      </div>

      {/* Content */}
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>

      {/* Subtext */}
      {subtext && (
        <p className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
};