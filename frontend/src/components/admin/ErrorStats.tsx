import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { useErrorReporting } from '../../services/errorReporting';

interface ErrorStatsProps {
  className?: string;
}

const ErrorStats: React.FC<ErrorStatsProps> = ({ className = '' }) => {
  const { getErrorStats, clearErrors } = useErrorReporting();
  const [stats, setStats] = useState({
    totalErrors: 0,
    chunkErrors: 0,
    networkErrors: 0,
    runtimeErrors: 0,
    recoverableErrors: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats(getErrorStats());
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleClearErrors = () => {
    if (window.confirm('Are you sure you want to clear all stored error reports?')) {
      clearErrors();
      refreshStats();
    }
  };

  const statItems = [
    {
      label: 'Total Errors',
      value: stats.totalErrors,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      label: 'Chunk Errors',
      value: stats.chunkErrors,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      label: 'Network Errors',
      value: stats.networkErrors,
      icon: WifiOff,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Runtime Errors',
      value: stats.runtimeErrors,
      icon: AlertTriangle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Recoverable',
      value: stats.recoverableErrors,
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  return (
    <div className={`p-6 bg-theme-secondary rounded-xl border border-theme ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-theme-primary">Error Statistics</h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshStats}
            disabled={isRefreshing}
            className="p-2 text-theme-secondary hover:text-theme-primary transition-colors disabled:opacity-50"
            title="Refresh stats"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearErrors}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Clear all error reports"
          >
            Clear
          </button>
        </div>
      </div>

      {stats.totalErrors === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Wifi className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-theme-secondary">No errors recorded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`p-4 rounded-lg ${item.bgColor} border border-opacity-20`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </span>
                </div>
                <p className="text-sm text-theme-secondary">{item.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {stats.totalErrors > 0 && (
        <div className="mt-6 p-4 bg-theme-accent/10 rounded-lg border border-theme-accent/20">
          <h4 className="text-sm font-medium text-theme-primary mb-2">Error Recovery Rate</h4>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-theme-accent h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${stats.totalErrors > 0 ? (stats.recoverableErrors / stats.totalErrors) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-theme-primary">
              {stats.totalErrors > 0 
                ? Math.round((stats.recoverableErrors / stats.totalErrors) * 100)
                : 0}%
            </span>
          </div>
          <p className="text-xs text-theme-secondary mt-1">
            {stats.recoverableErrors} of {stats.totalErrors} errors are recoverable
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorStats;
