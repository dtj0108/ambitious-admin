'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button, Card, CardHeader, CardTitle, CardContent } from '@/components'
import { 
  Settings, 
  Users, 
  Plus, 
  X, 
  Trash2, 
  Mail, 
  User, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string | null
  totp_enabled: boolean
  created_at: string
  last_login: string | null
  invited_at: string | null
  invited_by: string | null
  inviter_name: string | null
  inviter_email: string | null
  has_password: boolean
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)

  useEffect(() => {
    fetchAdmins()
    fetchCurrentAdmin()
  }, [])

  const fetchCurrentAdmin = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      if (data.authenticated) {
        setCurrentAdminId(data.admin.id)
      }
    } catch (error) {
      console.error('Failed to fetch current admin:', error)
    }
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/list')
      const data = await response.json()
      if (data.success) {
        setAdmins(data.admins)
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setAdmins(admins.filter(a => a.id !== id))
        setShowDeleteConfirm(null)
      } else {
        alert(data.error || 'Failed to delete admin')
      }
    } catch (error) {
      console.error('Failed to delete admin:', error)
      alert('Failed to delete admin')
    }
  }

  const getAdminStatus = (admin: AdminUser) => {
    if (!admin.has_password) {
      return { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10', icon: Clock }
    }
    if (admin.totp_enabled) {
      return { label: 'Active', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle }
    }
    return { label: 'Setup Incomplete', color: 'text-warning', bg: 'bg-warning/10', icon: AlertCircle }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage administrators and system settings"
      />

      {/* Admin Management */}
      <Card>
        <CardHeader
          action={
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              <Plus size={16} />
              Invite Admin
            </Button>
          }
        >
          <CardTitle subtitle={`${admins.length} administrators`}>
            <div className="flex items-center gap-2">
              <Users size={18} />
              Administrators
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              No administrators found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Admin</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Invited By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Last Login</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {admins.map((admin) => {
                    const status = getAdminStatus(admin)
                    const StatusIcon = status.icon
                    const isCurrentUser = admin.id === currentAdminId
                    
                    return (
                      <tr key={admin.id} className="hover:bg-surface-alt/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                              {admin.name?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-text">{admin.name || 'Unnamed'}</p>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">You</span>
                                )}
                              </div>
                              <p className="text-sm text-text-secondary">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {admin.inviter_name || admin.inviter_email ? (
                            <p className="text-sm text-text">{admin.inviter_name || admin.inviter_email}</p>
                          ) : (
                            <p className="text-sm text-text-tertiary">—</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-text-secondary">{formatDate(admin.last_login)}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {showDeleteConfirm === admin.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-text-secondary mr-2">Delete?</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteAdmin(admin.id)}
                              >
                                Confirm
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(admin.id)}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? 'You cannot delete yourself' : 'Delete admin'}
                            >
                              <Trash2 size={16} className={isCurrentUser ? 'text-text-tertiary' : 'text-error'} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle subtitle="Authentication security settings">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              Security
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-surface-alt rounded-xl">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <h4 className="font-medium text-text">Two-Factor Authentication</h4>
                <p className="text-sm text-text-secondary mt-1">
                  All administrators are required to set up 2FA using an authenticator app (Google Authenticator, Authy, etc.) during account creation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-surface-alt rounded-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock size={20} className="text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-text">Session Duration</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Admin sessions expire after 8 hours of inactivity. You&apos;ll need to log in again with your password and 2FA code.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteAdminModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            fetchAdmins()
          }}
        />
      )}
    </div>
  )
}

// Invite Admin Modal
function InviteAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to invite admin')
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err) {
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text">Invite Administrator</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email *</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Name (optional)</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div className="p-3 bg-surface-alt rounded-lg">
            <p className="text-xs text-text-secondary">
              The invited admin will need to visit the login page, click &quot;I&apos;m New&quot;, and enter their email to set up their password and 2FA.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Inviting...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
