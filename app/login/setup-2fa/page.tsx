'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components'
import { Smartphone, AlertCircle, Loader2, Copy, Check } from 'lucide-react'

export default function Setup2FAPage() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [adminInfo, setAdminInfo] = useState<{ adminId: string; email: string; name: string | null } | null>(null)

  useEffect(() => {
    // Get pending auth info
    const pending = sessionStorage.getItem('pendingAuth')
    if (!pending) {
      router.push('/login')
      return
    }

    const info = JSON.parse(pending)
    setAdminInfo(info)

    // Fetch QR code
    fetchQRCode(info)
  }, [router])

  const fetchQRCode = async (info: { adminId: string; email: string }) => {
    try {
      const response = await fetch('/api/auth/setup-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: info.adminId, email: info.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate QR code')
        setLoading(false)
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setLoading(false)
    } catch (err) {
      setError('Failed to generate QR code')
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          isSetup: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setVerifying(false)
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

  if (loading) {
    return (
      <div className="w-full text-center">
        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        <p className="text-text-secondary mt-4">Setting up two-factor authentication...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="Ambitious"
          width={360}
          height={120}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-2xl font-bold text-text">Set Up 2FA</h1>
        <p className="text-text-secondary mt-1">Scan the QR code with your authenticator app</p>
      </div>

      {/* Setup Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* QR Code */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-xl inline-block mb-4">
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            )}
          </div>
          <p className="text-sm text-text-secondary">
            Scan with Google Authenticator, Authy, or similar app
          </p>
        </div>

        {/* Manual Entry */}
        <div className="mb-6">
          <p className="text-xs text-text-tertiary text-center mb-2">
            Can&apos;t scan? Enter this code manually:
          </p>
          <div className="flex items-center gap-2 bg-surface-alt p-3 rounded-lg">
            <code className="flex-1 text-sm font-mono text-text break-all">{secret}</code>
            <button
              onClick={handleCopySecret}
              className="p-2 hover:bg-elevated rounded-lg transition-colors"
              title="Copy secret"
            >
              {copied ? (
                <Check size={16} className="text-success" />
              ) : (
                <Copy size={16} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-lg text-text text-center text-xl tracking-[0.5em] font-mono placeholder:text-text-tertiary placeholder:tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                maxLength={6}
                required
                disabled={verifying}
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1.5">
              Enter the 6-digit code from your authenticator app
            </p>
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
              'Verify & Complete Setup'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

