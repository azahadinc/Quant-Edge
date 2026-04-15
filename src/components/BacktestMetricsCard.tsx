'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react';

interface BacktestMetrics {
  // Performance Metrics
  pnl?: number | string;
  pnlPercent?: number | string;
  winRate?: number | string;
  sharpeRatio?: number | string;
  sortinoRatio?: number | string;
  calmarRatio?: number | string;
  omegaRatio?: number | string;
  
  // Risk Metrics
  maxDrawdown?: number | string;
  largestWinningTrade?: number | string;
  largestLosingTrade?: number | string;
  expectancy?: number | string;
  
  // Trade Metrics
  totalTrades?: number | string;
  winningTrades?: number | string;
  losingTrades?: number | string;
  startingBalance?: number | string;
  finishingBalance?: number | string;
  
  // Additional
  profitFactor?: number | string;
  totalReturn?: number | string;
}

interface BacktestMetricsCardProps {
  metrics: BacktestMetrics;
  strategyName?: string;
  isLoading?: boolean;
}

const BacktestMetricsCard: React.FC<BacktestMetricsCardProps> = ({
  metrics,
  strategyName = 'Backtest Results',
  isLoading = false
}) => {
  const formatValue = (value: number | string | undefined, format: 'currency' | 'percent' | 'number' = 'number') => {
    if (value === undefined || value === null) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    
    switch (format) {
      case 'currency':
        return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${(num * 100).toFixed(2)}%`;
      case 'number':
      default:
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const getPnLColor = (value: number | string | undefined) => {
    if (value === undefined || value === null) return 'text-gray-600';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{strategyName}</CardTitle>
            {isLoading && (
              <Badge variant="outline" className="animate-pulse">Running...</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* PNL */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">PNL</p>
              <div className={`text-xl font-bold ${getPnLColor(metrics.pnl)}`}>
                {formatValue(metrics.pnl, 'currency')}
              </div>
              <p className="text-xs text-gray-500">
                {metrics.pnlPercent && `${formatValue(metrics.pnlPercent, 'percent')}`}
              </p>
            </div>

            {/* Win Rate */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</p>
              <p className="text-xl font-bold text-blue-600">
                {formatValue(metrics.winRate, 'percent')}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Max Drawdown</p>
              <p className="text-xl font-bold text-orange-600">
                {formatValue(metrics.maxDrawdown, 'percent')}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Factor</p>
              <p className="text-xl font-bold text-purple-600">
                {formatValue(metrics.profitFactor)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.sharpeRatio !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sharpe Ratio</p>
                <p className="text-lg font-semibold">{formatValue(metrics.sharpeRatio)}</p>
              </div>
            )}
            {metrics.sortinoRatio !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sortino Ratio</p>
                <p className="text-lg font-semibold">{formatValue(metrics.sortinoRatio)}</p>
              </div>
            )}
            {metrics.calmarRatio !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Calmar Ratio</p>
                <p className="text-lg font-semibold">{formatValue(metrics.calmarRatio)}</p>
              </div>
            )}
            {metrics.omegaRatio !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Omega Ratio</p>
                <p className="text-lg font-semibold">{formatValue(metrics.omegaRatio)}</p>
              </div>
            )}
            {metrics.expectancy !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expectancy</p>
                <p className="text-lg font-semibold">{formatValue(metrics.expectancy, 'currency')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            <CardTitle className="text-base">Risk Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.maxDrawdown !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max Drawdown</p>
                <p className={`text-lg font-semibold ${getPnLColor(metrics.maxDrawdown)}`}>
                  {formatValue(metrics.maxDrawdown, 'percent')}
                </p>
              </div>
            )}
            {metrics.largestWinningTrade !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Largest Win</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatValue(metrics.largestWinningTrade, 'currency')}
                </p>
              </div>
            )}
            {metrics.largestLosingTrade !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Largest Loss</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatValue(metrics.largestLosingTrade, 'currency')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <CardTitle className="text-base">Trade Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.totalTrades !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Trades</p>
                <p className="text-lg font-semibold">{formatValue(metrics.totalTrades)}</p>
              </div>
            )}
            {metrics.winningTrades !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Winning Trades</p>
                <p className="text-lg font-semibold text-green-600">{formatValue(metrics.winningTrades)}</p>
              </div>
            )}
            {metrics.losingTrades !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Losing Trades</p>
                <p className="text-lg font-semibold text-red-600">{formatValue(metrics.losingTrades)}</p>
              </div>
            )}
            {metrics.startingBalance !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Starting Balance</p>
                <p className="text-lg font-semibold">{formatValue(metrics.startingBalance, 'currency')}</p>
              </div>
            )}
            {metrics.finishingBalance !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Finishing Balance</p>
                <p className={`text-lg font-semibold ${getPnLColor(
                  (metrics.finishingBalance as number) - (metrics.startingBalance as number)
                )}`}>
                  {formatValue(metrics.finishingBalance, 'currency')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestMetricsCard;
