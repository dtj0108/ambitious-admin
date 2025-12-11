'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components'
import {
  Megaphone,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
} from 'lucide-react'

interface KeyEventsMetrics {
  impressionsToday: number
  impressionsWeek: number
  impressionsMonth: number
  impressionsTrend: 'up' | 'down' | 'neutral'
  trendPercentage: number
  previousWeekImpressions: number
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toLocaleString()
}

export default function AdInventoryPage() {
  const [impressions, setImpressions] = useState<KeyEventsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adPercentage, setAdPercentage] = useState(10)

  // Load saved percentage from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adInventoryPercentage')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 30) {
        setAdPercentage(parsed)
      }
    }
  }, [])

  // Save percentage to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adInventoryPercentage', adPercentage.toString())
  }, [adPercentage])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/ad-inventory')
      if (!res.ok) {
        throw new Error('Failed to fetch data')
      }
      const data = await res.json()
      setImpressions(data.metrics || null)
    } catch (err) {
      console.error('Failed to fetch impression data:', err)
      setError('Failed to load impression data. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate available ad slots
  const availableToday = impressions ? Math.floor(impressions.impressionsToday * (adPercentage / 100)) : 0
  const availableWeek = impressions ? Math.floor(impressions.impressionsWeek * (adPercentage / 100)) : 0
  const availableMonth = impressions ? Math.floor(impressions.impressionsMonth * (adPercentage / 100)) : 0

  // Calculate projections based on current data
  // Weekly projection: use today's data × 7, or if we have week data, extrapolate remaining days
  const daysInWeek = 7
  const daysInMonth = 30
  
  // Calculate average daily impressions from this week's data
  const avgDailyFromWeek = impressions ? impressions.impressionsWeek / 7 : 0
  const avgDailyFromMonth = impressions ? impressions.impressionsMonth / 30 : 0
  
  // Use the higher of today's actual or the average (more optimistic projection)
  const projectedDailyRate = impressions ? Math.max(impressions.impressionsToday, avgDailyFromWeek, avgDailyFromMonth) : 0
  
  // Projected totals
  const projectedWeekImpressions = Math.floor(projectedDailyRate * daysInWeek)
  const projectedMonthImpressions = Math.floor(projectedDailyRate * daysInMonth)
  
  // Projected available ad slots
  const projectedWeekAds = Math.floor(projectedWeekImpressions * (adPercentage / 100))
  const projectedMonthAds = Math.floor(projectedMonthImpressions * (adPercentage / 100))

  if (loading && !impressions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-post-win/20 to-post-win/5 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-post-win" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-text font-medium">Loading ad inventory</p>
            <p className="text-sm text-text-tertiary">Fetching impression data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !impressions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-error" />
          </div>
          <div>
            <p className="text-text font-medium mb-1">Something went wrong</p>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Megaphone size={28} className="text-post-win" />
            Ad Inventory
          </h1>
          <p className="text-text-secondary mt-1">
            Manage available advertising slots based on platform impressions.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border/50 text-text-secondary rounded-xl font-medium hover:bg-elevated hover:text-text transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Ad Fill Rate Control */}
      <Card gradient>
        <CardHeader>
          <CardTitle subtitle="Set the percentage of impressions available for ads">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-post-win" />
              Ad Fill Rate
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Percentage Display */}
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-elevated"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    className="text-post-win"
                    strokeDasharray={`${(adPercentage / 30) * 440} 440`}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-text">{adPercentage}%</span>
                  <span className="text-xs text-text-tertiary">of impressions</span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">0%</span>
                <span className="text-text-tertiary">30%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={adPercentage}
                onChange={(e) => setAdPercentage(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-elevated rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-post-win
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:border-4
                  [&::-webkit-slider-thumb]:border-card
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-post-win
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-4
                  [&::-moz-range-thumb]:border-card"
                style={{
                  background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(adPercentage / 30) * 100}%, #2A2A2A ${(adPercentage / 30) * 100}%, #2A2A2A 100%)`
                }}
              />
              <p className="text-center text-sm text-text-secondary">
                Drag to adjust the percentage of impressions allocated for advertising
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impression Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today */}
        <Card gradient>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/20">
                <Eye size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Today</p>
                <p className="text-2xl font-bold text-text">{formatNumber(impressions?.impressionsToday || 0)}</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-post-win/10 to-post-win/5 rounded-xl border border-post-win/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Available Ad Slots</span>
                <Megaphone size={16} className="text-post-win" />
              </div>
              <p className="text-3xl font-bold text-post-win">{formatNumber(availableToday)}</p>
              <div className="mt-2 h-2 bg-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-post-win rounded-full transition-all duration-500"
                  style={{ width: `${adPercentage / 30 * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card gradient>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <TrendingUp size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">This Week</p>
                <p className="text-2xl font-bold text-text">{formatNumber(impressions?.impressionsWeek || 0)}</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-post-win/10 to-post-win/5 rounded-xl border border-post-win/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Available Ad Slots</span>
                <Megaphone size={16} className="text-post-win" />
              </div>
              <p className="text-3xl font-bold text-post-win">{formatNumber(availableWeek)}</p>
              <div className="mt-2 h-2 bg-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-post-win rounded-full transition-all duration-500"
                  style={{ width: `${adPercentage / 30 * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card gradient>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-post-hangout/20 to-post-hangout/10 border border-post-hangout/20">
                <Calendar size={24} className="text-post-hangout" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">This Month</p>
                <p className="text-2xl font-bold text-text">{formatNumber(impressions?.impressionsMonth || 0)}</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-post-win/10 to-post-win/5 rounded-xl border border-post-win/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Available Ad Slots</span>
                <Megaphone size={16} className="text-post-win" />
              </div>
              <p className="text-3xl font-bold text-post-win">{formatNumber(availableMonth)}</p>
              <div className="mt-2 h-2 bg-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-post-win rounded-full transition-all duration-500"
                  style={{ width: `${adPercentage / 30 * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projections */}
      <Card gradient>
        <CardHeader>
          <CardTitle subtitle="Estimated ad inventory based on current performance">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Projections
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Rate */}
            <div className="p-4 bg-elevated/50 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-success" />
                </div>
                <span className="text-sm font-medium text-text-secondary">Daily Run Rate</span>
              </div>
              <p className="text-2xl font-bold text-text">{formatNumber(projectedDailyRate)}</p>
              <p className="text-xs text-text-tertiary mt-1">impressions/day</p>
            </div>

            {/* Projected Week */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar size={16} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">Week Projection</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Total Impressions</span>
                  <span className="text-sm font-medium text-text">{formatNumber(projectedWeekImpressions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Available Ad Slots</span>
                  <span className="text-lg font-bold text-primary">{formatNumber(projectedWeekAds)}</span>
                </div>
              </div>
            </div>

            {/* Projected Month */}
            <div className="p-4 bg-gradient-to-br from-post-win/10 to-post-win/5 rounded-xl border border-post-win/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-post-win/10 flex items-center justify-center">
                    <Megaphone size={16} className="text-post-win" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">Month Projection</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Total Impressions</span>
                  <span className="text-sm font-medium text-text">{formatNumber(projectedMonthImpressions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Available Ad Slots</span>
                  <span className="text-lg font-bold text-post-win">{formatNumber(projectedMonthAds)}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-tertiary text-center mt-4">
            Projections based on the highest of: today&apos;s impressions, 7-day average, or 30-day average
          </p>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-post-win/20 to-post-win/10 flex items-center justify-center">
                <Megaphone size={24} className="text-post-win" />
              </div>
              <div>
                <p className="text-lg font-semibold text-text">Monthly Ad Capacity</p>
                <p className="text-sm text-text-secondary">
                  At {adPercentage}% fill rate, you have <span className="font-bold text-post-win">{formatNumber(availableMonth)}</span> ad slots available this month
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-elevated/50 rounded-xl">
              <span className="text-sm text-text-tertiary">Fill Rate:</span>
              <span className="text-xl font-bold text-post-win">{adPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

