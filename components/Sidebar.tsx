'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Mail,
  Bell,
  Heart,
  Newspaper,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Posts', href: '/posts', icon: FileText },
  { name: 'Comments', href: '/comments', icon: MessageSquare },
  { name: 'Moderation', href: '/moderation', icon: Shield },
]

const engagementNavigation = [
  { name: 'Messages', href: '/messages', icon: Mail },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Meet', href: '/meet', icon: Heart },
]

const contentNavigation = [
  { name: 'Articles', href: '/articles', icon: Newspaper },
  { name: 'Spotlight', href: '/spotlight', icon: Sparkles },
]

const systemNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

function NavSection({ 
  title, 
  items, 
  collapsed, 
  pathname 
}: { 
  title: string
  items: typeof mainNavigation
  collapsed: boolean
  pathname: string 
}) {
  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary shadow-sm'
                  : 'text-text-secondary hover:bg-elevated hover:text-text'
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                isActive 
                  ? 'bg-primary/20' 
                  : 'bg-transparent group-hover:bg-elevated'
              )}>
                <Icon size={18} className="shrink-0" />
              </div>
              {!collapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-surface to-background border-r border-border/50 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-text">
              Ambitious
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto">
            <Zap size={18} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-text-tertiary hover:text-text"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full p-3 flex justify-center text-text-tertiary hover:text-text transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex flex-col p-3 overflow-y-auto h-[calc(100vh-8rem)]">
        <NavSection title="Overview" items={mainNavigation} collapsed={collapsed} pathname={pathname} />
        <NavSection title="Engagement" items={engagementNavigation} collapsed={collapsed} pathname={pathname} />
        <NavSection title="Content" items={contentNavigation} collapsed={collapsed} pathname={pathname} />
        
        <div className="flex-1" />
        
        <NavSection title="System" items={systemNavigation} collapsed={collapsed} pathname={pathname} />
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text truncate">System Online</p>
              <p className="text-[10px] text-text-tertiary">All services operational</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
