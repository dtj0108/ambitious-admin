'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components'
import { Smartphone, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

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
    <div className="w-full">
      {/* Logo */}
      <div className="text-center mb-4">
        <Image
          src="/logo.png"
          alt="Ambitious"
          width={240}
          height={80}
          className="mx-auto mb-2"
          priority
        />
        <h1 className="text-lg font-bold text-text">Two-Factor Authentication</h1>
        <p className="text-sm text-text-secondary">Enter your authenticator code</p>
      </div>

      {/* Verify Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl">
        {/* Admin Info */}
        {adminInfo && (
          <div className="text-center mb-3 pb-3 border-b border-border">
            <p className="text-sm text-text font-medium">{adminInfo.name || adminInfo.email}</p>
            <p className="text-xs text-text-secondary">{adminInfo.email}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/20 rounded-lg text-error text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Token Input */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Enter 6-digit code
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full py-2 bg-surface-alt border border-border rounded-lg text-text text-center text-lg tracking-[0.4em] font-mono placeholder:text-text-tertiary placeholder:tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              maxLength={6}
              required
              disabled={verifying}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full !py-2"
            disabled={verifying || token.length !== 6}
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        </form>
      </div>

      {/* Help Text */}
      <p className="text-center text-[10px] text-text-tertiary mt-3">
        Open your authenticator app for the code
      </p>
    </div>
  )
}

