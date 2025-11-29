'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components'
import { Mail, Lock, AlertCircle, Loader2, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Store admin info for next steps
      sessionStorage.setItem('pendingAuth', JSON.stringify({
        adminId: data.adminId,
        email: data.email,
        name: data.name,
      }))

      if (data.requiresSetup) {
        // Redirect to 2FA setup
        router.push('/login/setup-2fa')
      } else if (data.requiresTotp) {
        // Redirect to 2FA verification
        router.push('/login/verify')
      }
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
        <h1 className="text-2xl font-bold text-text">Admin Portal</h1>
        <p className="text-text-secondary mt-1">Sign in to continue</p>
      </div>

      {/* Login Form */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
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
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* New Admin CTA */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-text-secondary mb-3">
            Got an invite from your team?
          </p>
          <Link 
            href="/login/claim" 
            className="group flex items-center justify-center gap-3 w-full py-3 px-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl text-primary font-medium hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 transition-all duration-200"
          >
            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <UserPlus size={18} />
            </div>
            Set Up My Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-text-tertiary mt-6">
        Protected by two-factor authentication
      </p>
    </div>
  )
}
