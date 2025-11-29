'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Heart, 
  MessageSquare, 
  Calendar,
  CornerDownRight,
  FileText,
  Trash2,
  User,
  Reply,
} from 'lucide-react'
import { Button } from './Button'
import { 
  getCommentById, 
  getCommentReplies, 
  deleteComment, 
  type CommentWithContext 
} from '@/lib/queries'

interface CommentDetailModalProps {
  commentId: string | null
  isOpen: boolean
  onClose: () => void
  onCommentDeleted?: () => void
}

export function CommentDetailModal({ commentId, isOpen, onClose, onCommentDeleted }: CommentDetailModalProps) {
  const [comment, setComment] = useState<CommentWithContext | null>(null)
  const [replies, setReplies] = useState<CommentWithContext[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (commentId && isOpen) {
      fetchComment()
    }
  }, [commentId, isOpen])

  const fetchComment = async () => {
    if (!commentId) return
    setLoading(true)
    
    const [commentData, repliesData] = await Promise.all([
      getCommentById(commentId),
      getCommentReplies(commentId),
    ])
    
    setComment(commentData)
    setReplies(repliesData)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!commentId) return
    setDeleting(true)
    const success = await deleteComment(commentId)
    if (success) {
      onCommentDeleted?.()
      onClose()
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-background border-l border-border z-50 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Comment Details</h2>
              {comment?.parent_id && (
                <p className="text-xs text-text-tertiary">Reply to another comment</p>
              )}
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comment ? (
            <div className="p-6 space-y-6">
              {/* Author Info */}
              <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border/50">
                <div className="relative">
                  {comment.author_avatar_url ? (
                    <img 
                      src={comment.author_avatar_url} 
                      alt={comment.author_username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-bold">
                      {comment.author_username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text">@{comment.author_username}</p>
                  {comment.author_full_name && (
                    <p className="text-sm text-text-secondary">{comment.author_full_name}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-1">
                    <Calendar size={10} className="inline mr-1" />
                    {formatDate(comment.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-text-secondary">
                  <Heart size={16} className="text-error" />
                  <span className="text-sm font-medium">{comment.like_count}</span>
                </div>
              </div>

              {/* Parent Comment (if reply) */}
              {comment.parent_id && comment.parent_content && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                    <Reply size={12} /> Replying to
                  </p>
                  <div className="p-3 bg-elevated/50 rounded-lg border border-border/30 border-l-2 border-l-text-tertiary">
                    <p className="text-xs text-text-tertiary mb-1">@{comment.parent_author_username}</p>
                    <p className="text-sm text-text-secondary">{comment.parent_content}</p>
                  </div>
                </div>
              )}

              {/* Comment Content */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Comment</p>
                <div className="p-4 bg-surface rounded-xl border border-border/50">
                  <p className="text-text whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>

              {/* Parent Post */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                  <FileText size={12} /> On Post
                </p>
                <div className="p-4 bg-elevated/30 rounded-xl border border-border/30">
                  <p className="text-xs text-text-tertiary mb-1">@{comment.post_author_username}</p>
                  <p className="text-sm text-text line-clamp-3">{comment.post_content}</p>
                </div>
              </div>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                    <CornerDownRight size={12} /> Replies ({replies.length})
                  </p>
                  <div className="space-y-2">
                    {replies.map((reply) => (
                      <div 
                        key={reply.id}
                        className="p-3 bg-surface rounded-lg border border-border/50 ml-4"
                      >
                        <div className="flex items-start gap-3">
                          {reply.author_avatar_url ? (
                            <img 
                              src={reply.author_avatar_url} 
                              alt={reply.author_username}
                              className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-white text-xs font-semibold">
                              {reply.author_username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-text">@{reply.author_username}</p>
                              <div className="flex items-center gap-1 text-text-tertiary text-xs">
                                <Heart size={10} className="text-error" />
                                {reply.like_count}
                              </div>
                            </div>
                            <p className="text-sm text-text-secondary mt-1">{reply.content}</p>
                            <p className="text-xs text-text-tertiary mt-1">{formatDate(reply.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                  <Heart size={16} className="text-error mx-auto mb-1" />
                  <p className="text-lg font-bold text-text">{comment.like_count}</p>
                  <p className="text-xs text-text-tertiary">Likes</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border/50 text-center">
                  <MessageSquare size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-text">{comment.reply_count}</p>
                  <p className="text-xs text-text-tertiary">Replies</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-text-tertiary">Comment not found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {comment && (
          <div className="p-4 border-t border-border bg-surface">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary text-center">
                  Are you sure you want to delete this comment?
                  {replies.length > 0 && (
                    <span className="text-error"> This will also delete {replies.length} replies.</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 !bg-error/10 !text-error !border-error/20 hover:!bg-error/20"
                  >
                    <Trash2 size={16} />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 !text-error hover:!bg-error/10"
                >
                  <Trash2 size={16} />
                  Delete Comment
                </Button>
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

