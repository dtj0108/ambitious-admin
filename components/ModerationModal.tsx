'use client'

import { useState } from 'react'
import { 
  X, 
  Heart, 
  MessageCircle, 
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  User,
  Flag,
  Shield,
  ShieldCheck,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  CheckCircle,
  Star,
} from 'lucide-react'
import { Button } from './Button'
import { PostTypeBadge } from './PostTypeBadge'
import { restorePost, hidePost, type FlaggedPost, type Report } from '@/lib/queries'

interface ModerationModalProps {
  post: FlaggedPost | null
  isOpen: boolean
  onClose: () => void
  onPostUpdated?: () => void
}

export function ModerationModal({ post, isOpen, onClose, onPostUpdated }: ModerationModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !post) return null

  const handleRestore = async () => {
    setLoading(true)
    const success = await restorePost(post.id)
    if (success) {
      onPostUpdated?.()
      onClose()
    }
    setLoading(false)
  }

  const handleHide = async () => {
    setLoading(true)
    const success = await hidePost(post.id)
    if (success) {
      onPostUpdated?.()
      onClose()
    }
    setLoading(false)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border z-50 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${post.is_visible ? 'bg-success/10' : 'bg-error/10'}`}>
              <Shield size={20} className={post.is_visible ? 'text-success' : 'text-error'} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Moderation Review</h2>
              <p className="text-xs text-text-tertiary">{post.report_count} report{post.report_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-elevated transition-colors text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              post.is_visible 
                ? 'bg-success/5 border-success/20 text-success' 
                : 'bg-error/5 border-error/20 text-error'
            }`}>
              {post.is_visible ? (
                <>
                  <Eye size={20} />
                  <div>
                    <p className="font-medium">Post is Visible</p>
                    <p className="text-sm opacity-80">This post is currently visible to all users</p>
                  </div>
                </>
              ) : (
                <>
                  <EyeOff size={20} />
                  <div>
                    <p className="font-medium">Post is Hidden</p>
                    <p className="text-sm opacity-80">This post has been hidden from all users</p>
                  </div>
                </>
              )}
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border/50">
              <div className="relative">
                {post.author_avatar_url ? (
                  <img 
                    src={post.author_avatar_url} 
                    alt={post.author_username}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold">
                    {post.author_username.charAt(0).toUpperCase()}
                  </div>
                )}
                {post.author_is_favorite && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-post-win rounded-full flex items-center justify-center">
                    <Star size={12} className="text-black" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text">@{post.author_username}</p>
                  {post.author_is_favorite && (
                    <span className="px-2 py-0.5 bg-post-win/10 text-post-win text-xs font-medium rounded-full flex items-center gap-1">
                      <ShieldCheck size={10} /> Trusted
                    </span>
                  )}
                </div>
                {post.author_full_name && (
                  <p className="text-sm text-text-secondary">{post.author_full_name}</p>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  <Calendar size={10} className="inline mr-1" />
                  Posted {formatDate(post.created_at)}
                </p>
              </div>
              {post.post_type && (
                <PostTypeBadge type={post.post_type as 'win' | 'dream' | 'ask' | 'hangout' | 'intro' | 'general'} />
              )}
            </div>

            {/* Post Content */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Post Content</h3>
              <div className="p-4 bg-surface rounded-xl border border-border/50">
                <p className="text-text whitespace-pre-wrap leading-relaxed">{post.content}</p>
              </div>

              {/* Media */}
              {post.image_url && (
                <div className="relative group">
                  <img 
                    src={post.image_url} 
                    alt="Post image"
                    className="w-full rounded-xl border border-border object-cover max-h-64"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
                    <ImageIcon size={12} /> Image
                  </div>
                </div>
              )}

              {post.video_url && (
                <div className="p-4 bg-surface rounded-xl border border-border/50 flex items-center gap-3">
                  <Video size={20} className="text-text-tertiary" />
                  <span className="text-sm text-text">Video attached</span>
                </div>
              )}
            </div>

            {/* Engagement Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                <Heart size={16} className="text-error mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{formatNumber(post.like_count)}</p>
                <p className="text-xs text-text-tertiary">Likes</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                <MessageCircle size={16} className="text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{formatNumber(post.comment_count)}</p>
                <p className="text-xs text-text-tertiary">Comments</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                <Flag size={16} className="text-error mx-auto mb-1" />
                <p className="text-lg font-bold text-error">{post.report_count}</p>
                <p className="text-xs text-text-tertiary">Reports</p>
              </div>
            </div>

            {/* Reports Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle size={14} className="text-error" />
                Reports ({post.reports.length})
              </h3>
              
              <div className="space-y-2">
                {post.reports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-4 bg-surface rounded-xl border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      {report.reporter_avatar_url ? (
                        <img 
                          src={report.reporter_avatar_url} 
                          alt={report.reporter_username}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-error/50 to-error flex items-center justify-center text-white text-sm font-semibold">
                          {report.reporter_username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-text">@{report.reporter_username}</p>
                          {report.reporter_is_favorite && (
                            <span className="px-2 py-0.5 bg-post-win/10 text-post-win text-xs font-medium rounded-full flex items-center gap-1">
                              <Star size={10} /> Trusted
                            </span>
                          )}
                          <span className="text-xs text-text-tertiary">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        {report.reason ? (
                          <p className="text-sm text-text mt-1">{report.reason}</p>
                        ) : (
                          <p className="text-sm text-text-tertiary italic mt-1">No reason provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="flex items-center gap-3">
            {post.is_visible ? (
              <Button
                variant="secondary"
                onClick={handleHide}
                disabled={loading}
                className="flex-1 !bg-error/10 !text-error !border-error/20 hover:!bg-error/20"
              >
                <EyeOff size={16} />
                Hide Post
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleRestore}
                disabled={loading}
                className="flex-1"
              >
                <CheckCircle size={16} />
                Restore Post
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Close
            </Button>
          </div>
          {post.author_is_favorite && (
            <p className="text-xs text-text-tertiary text-center mt-3">
              ⚠️ This author is a trusted user. Their posts are protected from auto-hide.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

