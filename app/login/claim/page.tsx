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
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="Ambitious"
          width={360}
          height={120}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-2xl font-bold text-text">Claim Your Invite</h1>
        <p className="text-text-secondary mt-1">Enter your email to get started</p>
      </div>

      {/* Claim Form */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
        {/* Info Box */}
        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-6">
          <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            If you&apos;ve been invited as an administrator, enter your email address below to set up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Back Link */}
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 w-full py-2 text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-text-tertiary mt-6">
        Don&apos;t have an invite? Contact your administrator.
      </p>
    </div>
  )
}

