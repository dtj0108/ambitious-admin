'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Heart, 
  MessageCircle, 
  Eye,
  MapPin,
  Calendar,
  User,
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Quote,
  Sparkles,
} from 'lucide-react'
import { Button } from './Button'
import { PostTypeBadge } from './PostTypeBadge'
import { getPostById, togglePostVisibility, type PostWithAuthor } from '@/lib/queries'

interface PostDetailModalProps {
  postId: string | null
  isOpen: boolean
  onClose: () => void
  onPostUpdated?: () => void
}

export function PostDetailModal({ postId, isOpen, onClose, onPostUpdated }: PostDetailModalProps) {
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  useEffect(() => {
    if (postId && isOpen) {
      fetchPost()
    }
  }, [postId, isOpen])

  const fetchPost = async () => {
    if (!postId) return
    setLoading(true)
    const postData = await getPostById(postId)
    setPost(postData)
    setLoading(false)
  }

  const handleToggleVisibility = async () => {
    if (!postId) return
    setTogglingVisibility(true)
    const newState = await togglePostVisibility(postId)
    if (newState !== null) {
      setPost(prev => prev ? { ...prev, is_visible: newState } : null)
      onPostUpdated?.()
    }
    setTogglingVisibility(false)
  }

  if (!isOpen) return null

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
            <h2 className="text-lg font-semibold text-text">Post Details</h2>
            {post && (
              <PostTypeBadge type={post.post_type || 'general'} />
            )}
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : post ? (
            <div className="p-6 space-y-6">
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
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">@{post.author_username}</p>
                    {post.is_viral && (
                      <span className="px-2 py-0.5 bg-post-win/10 text-post-win text-xs font-medium rounded-full flex items-center gap-1">
                        <Sparkles size={10} /> Viral
                      </span>
                    )}
                  </div>
                  {post.author_full_name && (
                    <p className="text-sm text-text-secondary">{post.author_full_name}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-1">
                    <Calendar size={10} className="inline mr-1" />
                    {formatDate(post.created_at)}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <User size={14} />
                  View Profile
                </Button>
              </div>

              {/* Visibility Status */}
              {post.is_visible === false && (
                <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                  <EyeOff size={16} />
                  <span>This post is currently hidden from users</span>
                </div>
              )}

              {/* Post Content */}
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-xl border border-border/50">
                  <p className="text-text whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {/* Media */}
                {post.image_url && (
                  <div className="relative group">
                    <img 
                      src={post.image_url} 
                      alt="Post image"
                      className="w-full rounded-xl border border-border object-cover max-h-96"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1">
                      <ImageIcon size={12} /> Image
                    </div>
                  </div>
                )}

                {post.video_url && (
                  <div className="relative p-4 bg-surface rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Video size={16} />
                      <span className="text-sm">Video attached</span>
                    </div>
                    <a 
                      href={post.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline flex items-center gap-1 mt-2"
                    >
                      Open video <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {/* Quoted Post */}
                {post.quoted_post_id && (
                  <div className="p-4 bg-elevated/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 text-text-tertiary text-sm mb-2">
                      <Quote size={14} />
                      Quote post
                    </div>
                    <p className="text-xs text-text-tertiary">Post ID: {post.quoted_post_id}</p>
                  </div>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-surface rounded-xl border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Heart size={18} className="text-error" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(post.like_count)}</p>
                  <p className="text-xs text-text-tertiary">Likes</p>
                </div>
                <div className="p-4 bg-surface rounded-xl border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MessageCircle size={18} className="text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(post.comment_count)}</p>
                  <p className="text-xs text-text-tertiary">Comments</p>
                </div>
                <div className="p-4 bg-surface rounded-xl border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Eye size={18} className="text-text-secondary" />
                  </div>
                  <p className="text-2xl font-bold text-text">{formatNumber(post.views_count)}</p>
                  <p className="text-xs text-text-tertiary">Views</p>
                </div>
              </div>

              {/* Location */}
              {post.location_name && (
                <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border/50">
                  <MapPin size={18} className="text-post-hangout" />
                  <div>
                    <p className="text-sm font-medium text-text">{post.location_name}</p>
                    <p className="text-xs text-text-tertiary">Location tagged</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-text-secondary">Post ID</span>
                  <span className="text-text font-mono text-xs">{post.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-text-secondary">Created</span>
                  <span className="text-text">{formatDate(post.created_at)}</span>
                </div>
                {post.updated_at && post.updated_at !== post.created_at && (
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-text-secondary">Updated</span>
                    <span className="text-text">{formatDate(post.updated_at)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-secondary">Visibility</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.is_visible !== false
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}>
                    {post.is_visible !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-text-tertiary">Post not found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {post && (
          <div className="p-4 border-t border-border bg-surface flex items-center gap-3">
            <Button
              variant={post.is_visible !== false ? 'secondary' : 'primary'}
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              className="flex-1"
            >
              {post.is_visible !== false ? (
                <>
                  <EyeOff size={16} />
                  Hide Post
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Show Post
                </>
              )}
            </Button>
            <Button variant="secondary" className="flex-1">
              <MessageCircle size={16} />
              View Comments
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

