'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Flame, 
  Trophy, 
  FileText, 
  Star,
  StarOff,
  ExternalLink,
  Tag,
  Target,
  Lightbulb,
  HelpCircle,
  Bot,
  User,
} from 'lucide-react'
import { Button } from './Button'
import { getUserById, toggleUserFavorite, type UserProfile } from '@/lib/queries'

interface UserDetailModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated?: () => void
}

export function UserDetailModal({ userId, isOpen, onClose, onUserUpdated }: UserDetailModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  useEffect(() => {
    if (userId && isOpen) {
      fetchUser()
    }
  }, [userId, isOpen])

  const fetchUser = async () => {
    if (!userId) return
    setLoading(true)
    const userData = await getUserById(userId)
    setUser(userData)
    setLoading(false)
  }

  const handleToggleFavorite = async () => {
    if (!userId) return
    setTogglingFavorite(true)
    const newState = await toggleUserFavorite(userId)
    setUser(prev => prev ? { ...prev, is_favorite: newState } : null)
    setTogglingFavorite(false)
    onUserUpdated?.()
  }

  if (!isOpen) return null

  const formatEmail = (email: string | null) => {
    return email || '—'
  }

  const formatPhone = (phone: string | null) => {
    return phone || '—'
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isActive = (lastPostDate: string | null) => {
    if (!lastPostDate) return false
    const daysSincePost = Math.floor(
      (Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSincePost <= 7
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border z-50 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h2 className="text-lg font-semibold text-text">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-elevated transition-colors text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : user ? (
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username}
                      className="w-20 h-20 rounded-2xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.is_bot && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-text">@{user.username}</h3>
                    {user.is_favorite && (
                      <Star size={16} className="text-post-win fill-post-win" />
                    )}
                  </div>
                  {user.full_name && (
                    <p className="text-text-secondary">{user.full_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive(user.last_post_date)
                        ? 'bg-success/10 text-success'
                        : 'bg-text-tertiary/10 text-text-tertiary'
                    }`}>
                      {isActive(user.last_post_date) ? 'Active' : 'Inactive'}
                    </span>
                    {user.is_bot && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Bot
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="p-4 bg-surface rounded-xl border border-border/50">
                  <p className="text-sm text-text">{user.bio}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                  <p className="text-2xl font-bold text-text">{user.posts_count || 0}</p>
                  <p className="text-xs text-text-tertiary">Posts</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                  <p className="text-2xl font-bold text-post-win">{user.current_streak || 0}</p>
                  <p className="text-xs text-text-tertiary">Streak</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                  <p className="text-2xl font-bold text-text">{user.referral_count || 0}</p>
                  <p className="text-xs text-text-tertiary">Referrals</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Contact</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                    <Mail size={16} className="text-text-tertiary" />
                    <span className="text-sm text-text">{formatEmail(user.email)}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                    <Phone size={16} className="text-text-tertiary" />
                    <span className="text-sm text-text">{formatPhone(user.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                    <Calendar size={16} className="text-text-tertiary" />
                    <span className="text-sm text-text">Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              {(user.my_skills || user.my_ambition || user.help_with) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text uppercase tracking-wide">About</h4>
                  <div className="space-y-2">
                    {user.my_skills && (
                      <div className="p-3 bg-surface rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb size={14} className="text-post-win" />
                          <span className="text-xs font-medium text-text-secondary">My Skills</span>
                        </div>
                        <p className="text-sm text-text">{user.my_skills}</p>
                      </div>
                    )}
                    {user.my_ambition && (
                      <div className="p-3 bg-surface rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Target size={14} className="text-primary" />
                          <span className="text-xs font-medium text-text-secondary">My Ambition</span>
                        </div>
                        <p className="text-sm text-text">{user.my_ambition}</p>
                      </div>
                    )}
                    {user.help_with && (
                      <div className="p-3 bg-surface rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <HelpCircle size={14} className="text-post-ask" />
                          <span className="text-xs font-medium text-text-secondary">I Can Help With</span>
                        </div>
                        <p className="text-sm text-text">{user.help_with}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {user.tags && user.tags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-surface rounded-full text-xs font-medium text-text-secondary border border-border/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Streak Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                    <Flame size={16} className="text-post-win" />
                    <div>
                      <p className="text-lg font-bold text-text">{user.current_streak || 0}</p>
                      <p className="text-xs text-text-tertiary">Current</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                    <Trophy size={16} className="text-post-hangout" />
                    <div>
                      <p className="text-lg font-bold text-text">{user.longest_streak || 0}</p>
                      <p className="text-xs text-text-tertiary">Best</p>
                    </div>
                  </div>
                </div>
                {user.last_post_date && (
                  <p className="text-xs text-text-tertiary">
                    Last posted: {formatDate(user.last_post_date)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-text-tertiary">User not found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {user && (
          <div className="p-4 border-t border-border bg-surface flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleToggleFavorite}
              disabled={togglingFavorite}
              className="flex-1"
            >
              {user.is_favorite ? (
                <>
                  <StarOff size={16} />
                  Remove Favorite
                </>
              ) : (
                <>
                  <Star size={16} />
                  Add to Favorites
                </>
              )}
            </Button>
            <Button variant="secondary" className="flex-1">
              <FileText size={16} />
              View Posts
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

