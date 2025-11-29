import { Trophy, Rocket, HelpCircle, Users, Hand, MessageCircle } from 'lucide-react'
import { postTypeConfig, type PostType } from '@/lib/utils'

const icons = {
  win: Trophy,
  dream: Rocket,
  ask: HelpCircle,
  hangout: Users,
  intro: Hand,
  general: MessageCircle,
} as const

interface PostTypeBadgeProps {
  type: PostType
  size?: 'sm' | 'md'
}

export function PostTypeBadge({ type, size = 'md' }: PostTypeBadgeProps) {
  const config = postTypeConfig[type]
  const Icon = icons[type]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  }

  const iconSizes = {
    sm: 10,
    md: 12,
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${sizeClasses[size]}`}
      style={{ 
        color: config.color, 
        backgroundColor: config.bg,
        boxShadow: `0 0 0 1px ${config.color}20`,
      }}
    >
      <Icon size={iconSizes[size]} />
      {config.label}
    </span>
  )
}
