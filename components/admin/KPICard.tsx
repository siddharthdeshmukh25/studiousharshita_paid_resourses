'use client';

import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export default function KPICard({ title, value, icon, trend, className = '' }: KPICardProps) {
  return (
    <div className={`
      admin-kpi-card border rounded-lg p-4 lg:p-5
      transition-all duration-200
      hover:border-[#60A5FA]/40
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-[-0.045em] text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-[#60A5FA]/10 text-[#60A5FA]">
          {icon}
        </div>
      </div>
    </div>
  );
}
