'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components'
import { Lock, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [claimInfo, setClaimInfo] = useState<{
    adminId: string
    email: string
    name: string | null
  } | null>(null)

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingClaim')
    if (!pending) {
      router.push('/login/claim')
      return
    }
    setClaimInfo(JSON.parse(pending))
  }, [router])

  const passwordRequirements = [
    { test: password.length >= 8, label: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { test: /[a-z]/.test(password), label: 'One lowercase letter' },
    { test: /[0-9]/.test(password), label: 'One number' },
  ]

  const isPasswordValid = passwordRequirements.every(r => r.test)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!claimInfo) {
      setError('Session expired. Please start over.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: claimInfo.adminId,
          email: claimInfo.email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to set password')
        setLoading(false)
        return
      }

      // Clear claim info, set pending auth for 2FA setup
      sessionStorage.removeItem('pendingClaim')
      sessionStorage.setItem('pendingAuth', JSON.stringify({
        adminId: claimInfo.adminId,
        email: claimInfo.email,
        name: claimInfo.name,
      }))

      // Redirect to 2FA setup
      router.push('/login/setup-2fa')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!claimInfo) {
    return (
      <div className="w-full text-center">
        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        <p className="text-text-secondary mt-4">Loading...</p>
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
        <h1 className="text-lg font-bold text-text">Create Password</h1>
        <p className="text-sm text-text-secondary">Set up your admin account</p>
      </div>

      {/* Password Form */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl">
        {/* User Info */}
        <div className="text-center pb-2 mb-3 border-b border-border">
          <p className="text-sm text-text font-medium">{claimInfo.name || 'New Admin'}</p>
          <p className="text-xs text-text-secondary">{claimInfo.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/20 rounded-lg text-error text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-9 pr-10 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Requirements - inline grid */}
          <div className="grid grid-cols-2 gap-1">
            {passwordRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px]">
                <CheckCircle 
                  size={12} 
                  className={req.test ? 'text-success' : 'text-text-tertiary'} 
                />
                <span className={req.test ? 'text-success' : 'text-text-tertiary'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-error mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full !py-2"
            disabled={loading || !isPasswordValid || password !== confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Setting up...
              </>
            ) : (
              'Continue to 2FA'
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-text-tertiary mt-3">
        Next: Set up two-factor authentication
      </p>
    </div>
  )
}

