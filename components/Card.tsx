import { cn } from '@/lib/utils'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  gradient?: boolean
  onClick?: () => void
}

export function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  gradient = false,
  onClick,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'relative bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden',
        paddingClasses[padding],
        hover && 'hover:shadow-lg hover:border-border hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
        gradient && 'bg-gradient-to-br from-card to-surface',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between pb-4 border-b border-border/50', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
  subtitle?: string
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
  return (
    <div>
      <h3 className={cn('text-base font-semibold text-text', className)}>
        {children}
      </h3>
      {subtitle && (
        <p className="text-sm text-text-tertiary mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('pt-4', className)}>{children}</div>
}
