import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    bgColor?: string;
}

const StatsCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    bgColor = 'bg-white'
}) => {
    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className={`${bgColor} p-6 rounded-lg shadow`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                    )}
                    {trendValue && (
                        <p className={`mt-2 text-sm ${getTrendColor()}`}>
                            {trend === 'up' && '↑ '}
                            {trend === 'down' && '↓ '}
                            {trendValue}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
