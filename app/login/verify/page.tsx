'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'
import { Zap, Smartphone, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [adminInfo, setAdminInfo] = useState<{ adminId: string; email: string; name: string | null } | null>(null)

  useEffect(() => {
    // Get pending auth info
    const pending = sessionStorage.getItem('pendingAuth')
    if (!pending) {
      router.push('/login')
      return
    }

    setAdminInfo(JSON.parse(pending))
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminInfo) return

    setError('')
    setVerifying(true)

    try {
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminInfo.adminId,
          email: adminInfo.email,
          token,
          isSetup: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setVerifying(false)
        setToken('')
        return
      }

      // Clear pending auth and redirect to dashboard
      sessionStorage.removeItem('pendingAuth')
      router.push('/')
    } catch (err) {
      setError('Verification failed')
      setVerifying(false)
    }
  }

  const handleBack = () => {
    sessionStorage.removeItem('pendingAuth')
    router.push('/login')
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text">Two-Factor Authentication</h1>
        <p className="text-text-secondary mt-1">
          Enter the code from your authenticator app
        </p>
      </div>

      {/* Verify Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
        {/* Admin Info */}
        {adminInfo && (
          <div className="text-center mb-6 pb-6 border-b border-border">
            <p className="text-text font-medium">{adminInfo.name || adminInfo.email}</p>
            <p className="text-sm text-text-secondary">{adminInfo.email}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Token Input */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Verification Code
            </label>
            <div className="relative">
              <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full pl-10 pr-4 py-3 bg-surface-alt border border-border rounded-lg text-text text-center text-2xl tracking-[0.5em] font-mono placeholder:text-text-tertiary placeholder:tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                maxLength={6}
                required
                disabled={verifying}
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={verifying || token.length !== 6}
          >
            {verifying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full flex items-center justify-center gap-2 py-2 text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </button>
        </form>
      </div>

      {/* Help Text */}
      <p className="text-center text-xs text-text-tertiary mt-6">
        Open your authenticator app to get the 6-digit code
      </p>
    </div>
  )
}

