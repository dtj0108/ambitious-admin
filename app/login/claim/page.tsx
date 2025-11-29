'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components'
import { Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ClaimInvitePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No invite found')
        setLoading(false)
        return
      }

      // Store admin info for password setup
      sessionStorage.setItem('pendingClaim', JSON.stringify({
        adminId: data.adminId,
        email: data.email,
        name: data.name,
      }))

      // Redirect to set password
      router.push('/login/set-password')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
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
        <h1 className="text-lg font-bold text-text">Claim Your Invite</h1>
        <p className="text-sm text-text-secondary">Enter your email to get started</p>
      </div>

      {/* Claim Form */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl">
        {/* Info Box */}
        <div className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg mb-4">
          <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary">
            Enter your invited email address to set up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-error/10 border border-error/20 rounded-lg text-error text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full !py-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Back Link */}
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-1 w-full py-1.5 text-xs text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-text-tertiary mt-3">
        No invite? Contact your administrator.
      </p>
    </div>
  )
}

