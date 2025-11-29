import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  iconColor?: string
  accentColor?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  accentColor = 'from-primary/10 to-primary/5',
  className,
}: StatsCardProps) {
  const trendConfig = {
    up: { 
      color: 'text-success', 
      bg: 'bg-success/10',
      icon: TrendingUp,
      prefix: '+' 
    },
    down: { 
      color: 'text-error', 
      bg: 'bg-error/10',
      icon: TrendingDown,
      prefix: '' 
    },
    neutral: { 
      color: 'text-text-tertiary', 
      bg: 'bg-elevated',
      icon: Minus,
      prefix: '' 
    },
  }

  const TrendIcon = change ? trendConfig[change.trend].icon : null

  return (
    <div
      className={cn(
        'group relative bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden',
        className
      )}
    >
      {/* Gradient accent */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 transition-opacity duration-300 group-hover:opacity-70',
        accentColor
      )} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold text-text tracking-tight">{value}</p>
          {change && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
              trendConfig[change.trend].bg,
              trendConfig[change.trend].color
            )}>
              {TrendIcon && <TrendIcon size={12} />}
              <span>{trendConfig[change.trend].prefix}{change.value}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'p-3 rounded-xl bg-gradient-to-br from-elevated to-surface border border-border/50 shadow-sm',
            iconColor
          )}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  )
}
