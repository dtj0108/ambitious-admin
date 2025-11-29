'use client'

import { Bell, Search, Moon, Sun, Command, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AdminInfo {
  id: string
  email: string
  name: string | null
}

export function Header() {
  const router = useRouter()
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }

    // Fetch admin session
    fetchSession()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      if (data.authenticated) {
        setAdmin(data.admin)
      }
    } catch {
      // Session check failed - middleware will handle redirect
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', newTheme)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Search users, posts, articles..."
              className="w-full h-11 pl-11 pr-20 bg-surface/50 border border-border/50 rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:bg-surface focus:shadow-lg focus:shadow-primary/5 transition-all duration-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 bg-elevated rounded-md border border-border/50">
              <Command size={12} className="text-text-tertiary" />
              <span className="text-[10px] text-text-tertiary font-medium">K</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl hover:bg-surface transition-all duration-200 text-text-secondary hover:text-text group"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="relative w-5 h-5">
              <Sun 
                size={20} 
                className={`absolute inset-0 transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'opacity-100 rotate-0' 
                    : 'opacity-0 rotate-90'
                }`} 
              />
              <Moon 
                size={20} 
                className={`absolute inset-0 transition-all duration-300 ${
                  theme === 'light' 
                    ? 'opacity-100 rotate-0' 
                    : 'opacity-0 -rotate-90'
                }`} 
              />
            </div>
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl hover:bg-surface transition-all duration-200 text-text-secondary hover:text-text"
            aria-label="View notifications"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-background" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-border/50 mx-2" />

          {/* Admin Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface transition-all duration-200 group"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary/25">
                  {admin ? getInitials(admin.name, admin.email) : 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text">{admin?.name || 'Admin'}</p>
                <p className="text-[10px] text-text-tertiary">{admin?.email || 'Loading...'}</p>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-text-tertiary transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl py-2 z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text">{admin?.name || 'Admin'}</p>
                  <p className="text-xs text-text-secondary">{admin?.email}</p>
                </div>
                
                <div className="py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-alt transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User size={16} />
                    Profile Settings
                  </button>
                  
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut size={16} />
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
