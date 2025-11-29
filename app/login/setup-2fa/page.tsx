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
      <div className="text-center mb-4">
        <Image
          src="/logo.png"
          alt="Ambitious"
          width={240}
          height={80}
          className="mx-auto mb-2"
          priority
        />
        <h1 className="text-lg font-bold text-text">Set Up 2FA</h1>
        <p className="text-sm text-text-secondary">Scan with your authenticator app</p>
      </div>

      {/* Setup Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/20 rounded-lg text-error text-xs mb-3">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* QR Code */}
        <div className="text-center mb-3">
          <div className="bg-white p-2 rounded-lg inline-block mb-2">
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="w-36 h-36" />
            )}
          </div>
          <p className="text-xs text-text-secondary">
            Scan with Google Authenticator or Authy
          </p>
        </div>

        {/* Manual Entry */}
        <div className="mb-3">
          <p className="text-[10px] text-text-tertiary text-center mb-1">
            Can&apos;t scan? Enter manually:
          </p>
          <div className="flex items-center gap-1 bg-surface-alt p-2 rounded-lg">
            <code className="flex-1 text-xs font-mono text-text break-all">{secret}</code>
            <button
              onClick={handleCopySecret}
              className="p-1.5 hover:bg-elevated rounded transition-colors"
              title="Copy secret"
            >
              {copied ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-3">
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
              'Complete Setup'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

