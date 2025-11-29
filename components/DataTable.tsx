'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from './Button'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onFilter?: () => void
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  className?: string
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  onFilter,
  pagination,
  emptyMessage = 'No data found',
  emptyIcon,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('bg-card border border-border/50 rounded-2xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border/50 bg-surface/30">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-elevated/50 border border-border/50 rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:bg-surface transition-all"
          />
        </div>

        {/* Filter */}
        {onFilter && (
          <Button variant="secondary" size="sm" onClick={onFilter}>
            <Filter size={16} />
            Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-surface/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-4">
                      <div className="h-5 bg-elevated/50 rounded-lg skeleton animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon || (
                      <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center mb-2">
                        <MoreHorizontal size={24} className="text-text-tertiary" />
                      </div>
                    )}
                    <p className="text-text-secondary font-medium">{emptyMessage}</p>
                    <p className="text-sm text-text-tertiary">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((item, idx) => (
                <tr
                  key={item.id}
                  className="group hover:bg-elevated/30 transition-colors"
                  style={{ 
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn('px-4 py-4 text-sm text-text', column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as Record<string, unknown>)[column.key as string] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-surface/30">
          <p className="text-sm text-text-secondary">
            Page <span className="font-medium text-text">{pagination.page}</span> of{' '}
            <span className="font-medium text-text">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
