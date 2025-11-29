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
      <div className="text-center mb-4">
        <Image
          src="/logo.png"
          alt="Ambitious"
          width={240}
          height={80}
          className="mx-auto mb-2"
          priority
        />
        <p className="text-sm text-text-secondary">Admin Portal</p>
      </div>

      {/* Login Form */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                disabled={loading}
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* New Admin CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          <Link 
            href="/login/claim" 
            className="group flex items-center justify-center gap-2 w-full py-2 px-3 bg-primary/5 border border-primary/20 rounded-lg text-primary text-sm font-medium hover:bg-primary/10 transition-all"
          >
            <UserPlus size={16} />
            New? Set Up My Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-text-tertiary mt-3">
        Protected by two-factor authentication
      </p>
    </div>
  )
}
