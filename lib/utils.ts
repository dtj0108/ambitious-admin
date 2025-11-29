import { type ClassValue, clsx } from 'clsx'

// Utility for conditionally joining class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format number with K/M suffix
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return then.toLocaleDateString()
}

// Truncate text with ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Post type labels and colors
export const postTypeConfig = {
  win: { label: 'Win', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
  dream: { label: 'Dream', color: '#4A9EFF', bg: 'rgba(74, 158, 255, 0.1)' },
  ask: { label: 'Ask', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' },
  hangout: { label: 'Hangout', color: '#5856D6', bg: 'rgba(88, 86, 214, 0.1)' },
  intro: { label: 'Intro', color: '#4A9EFF', bg: 'rgba(74, 158, 255, 0.1)' },
  general: { label: 'Post', color: '#909090', bg: 'rgba(144, 144, 144, 0.1)' },
} as const

export type PostType = keyof typeof postTypeConfig

