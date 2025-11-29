'use client'

import { PageHeader, Button, Card, CardContent, StatsCard, EmptyState } from '@/components'
import { useState, useEffect } from 'react'
import { 
  Plus, Edit2, Trash2, ExternalLink, Sparkles, Eye, EyeOff,
  X, Check, AlertTriangle, Link as LinkIcon, Type, Hash, Image
} from 'lucide-react'
import {
  getSpotlightStats,
  getSpotlights,
  createSpotlight,
  updateSpotlight,
  deleteSpotlight,
  toggleSpotlightActive,
  updateSpotlightOrder,
  type SpotlightStats,
  type Spotlight,
  type SpotlightFormData,
} from '@/lib/queries'

export default function SpotlightPage() {
  const [stats, setStats] = useState<SpotlightStats | null>(null)
  const [spotlights, setSpotlights] = useState<Spotlight[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSpotlight, setEditingSpotlight] = useState<Spotlight | null>(null)
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    spotlight: Spotlight
  } | null>(null)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    const [statsData, spotlightsData] = await Promise.all([
      getSpotlightStats(),
      getSpotlights(),
    ])
    setStats(statsData)
    setSpotlights(spotlightsData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle create
  const handleCreate = () => {
    setEditingSpotlight(null)
    setFormModalOpen(true)
  }

  // Handle edit
  const handleEdit = (spotlight: Spotlight) => {
    setEditingSpotlight(spotlight)
    setFormModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async (formData: SpotlightFormData) => {
    if (editingSpotlight) {
      const success = await updateSpotlight(editingSpotlight.id, formData)
      if (success) {
        setFormModalOpen(false)
        setEditingSpotlight(null)
        fetchData()
      }
    } else {
      const result = await createSpotlight(formData)
      if (result) {
        setFormModalOpen(false)
        fetchData()
      }
    }
  }

  // Handle delete
  const handleDelete = (spotlight: Spotlight) => {
    setConfirmDialog({ open: true, spotlight })
  }

  const confirmDelete = async () => {
    if (confirmDialog?.spotlight) {
      const success = await deleteSpotlight(confirmDialog.spotlight.id)
      if (success) {
        setConfirmDialog(null)
        fetchData()
      }
    }
  }

  // Handle toggle active
  const handleToggleActive = async (spotlight: Spotlight) => {
    const success = await toggleSpotlightActive(spotlight.id)
    if (success) {
      fetchData()
    }
  }

  // Handle order change
  const handleOrderChange = async (spotlight: Spotlight, newOrder: number) => {
    const success = await updateSpotlightOrder(spotlight.id, newOrder)
    if (success) {
      fetchData()
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Premium Spotlight"
        description="Manage sponsors and ad placements"
        actions={
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={16} />
            Add Sponsor
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Sponsors"
          value={stats?.total || 0}
          icon={Sparkles}
        />
        <StatsCard
          title="Active"
          value={stats?.active || 0}
          icon={Eye}
          iconColor="text-success"
        />
        <StatsCard
          title="Inactive"
          value={stats?.inactive || 0}
          icon={EyeOff}
          iconColor="text-text-tertiary"
        />
      </div>

      {/* Spotlight List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading spotlights...</p>
          </CardContent>
        </Card>
      ) : spotlights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No spotlights yet"
          description="Create your first sponsor spotlight"
          action={{
            label: 'Add Sponsor',
            onClick: handleCreate
          }}
        />
      ) : (
        <div className="space-y-4">
          {spotlights.map((spotlight) => (
            <SpotlightCard
              key={spotlight.id}
              spotlight={spotlight}
              onEdit={() => handleEdit(spotlight)}
              onDelete={() => handleDelete(spotlight)}
              onToggleActive={() => handleToggleActive(spotlight)}
              onOrderChange={(newOrder) => handleOrderChange(spotlight, newOrder)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {formModalOpen && (
        <SpotlightFormModal
          spotlight={editingSpotlight}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setFormModalOpen(false)
            setEditingSpotlight(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDialog?.open && (
        <ConfirmDeleteDialog
          spotlightName={confirmDialog.spotlight.name}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

// Spotlight Card Component
function SpotlightCard({
  spotlight,
  onEdit,
  onDelete,
  onToggleActive,
  onOrderChange,
}: {
  spotlight: Spotlight
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  onOrderChange: (order: number) => void
}) {
  const [orderInput, setOrderInput] = useState(spotlight.display_order.toString())

  const handleOrderBlur = () => {
    const newOrder = parseInt(orderInput)
    if (!isNaN(newOrder) && newOrder !== spotlight.display_order) {
      onOrderChange(newOrder)
    } else {
      setOrderInput(spotlight.display_order.toString())
    }
  }

  return (
    <Card className={`transition-opacity ${!spotlight.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="pt-0">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-alt flex items-center justify-center shrink-0">
            {spotlight.logo_url ? (
              <img 
                src={spotlight.logo_url} 
                alt={spotlight.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Sparkles size={24} className="text-text-tertiary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-text text-lg">{spotlight.name}</h3>
                <p className="text-text-secondary text-sm mt-0.5">{spotlight.tagline}</p>
              </div>
              
              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                  spotlight.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-text-tertiary/10 text-text-tertiary'
                }`}
              >
                {spotlight.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Link and CTA */}
            <div className="flex items-center gap-4 mt-3">
              <a
                href={spotlight.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline text-sm"
              >
                <ExternalLink size={14} />
                {spotlight.link.replace('https://', '').slice(0, 30)}...
              </a>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {spotlight.cta_text}
              </span>
            </div>

            {/* Order and Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              {/* Display Order */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Order:</span>
                <input
                  type="number"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  onBlur={handleOrderBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleOrderBlur()}
                  className="w-16 px-2 py-1 bg-surface-alt border border-border rounded text-text text-sm text-center"
                  min={1}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleActive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    spotlight.is_active
                      ? 'bg-text-tertiary/10 text-text-tertiary hover:bg-text-tertiary/20'
                      : 'bg-success/10 text-success hover:bg-success/20'
                  }`}
                >
                  {spotlight.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  {spotlight.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-elevated rounded-lg transition-colors text-text-secondary hover:text-text"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 hover:bg-error/10 rounded-lg transition-colors text-text-secondary hover:text-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Form Modal Component
function SpotlightFormModal({
  spotlight,
  onSubmit,
  onClose,
}: {
  spotlight: Spotlight | null
  onSubmit: (data: SpotlightFormData) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<SpotlightFormData>({
    name: spotlight?.name || '',
    logo_url: spotlight?.logo_url || '',
    tagline: spotlight?.tagline || '',
    link: spotlight?.link || '',
    cta_text: spotlight?.cta_text || '',
    display_order: spotlight?.display_order || 1,
    is_active: spotlight?.is_active ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.logo_url.trim()) newErrors.logo_url = 'Logo URL is required'
    if (!formData.tagline.trim()) newErrors.tagline = 'Tagline is required'
    if (!formData.link.trim()) newErrors.link = 'Link is required'
    if (!formData.cta_text.trim()) newErrors.cta_text = 'CTA text is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface rounded-xl border border-border shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold text-text">
            {spotlight ? 'Edit Spotlight' : 'Add New Spotlight'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Type size={14} className="text-text-tertiary" />
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-alt border rounded-lg text-text ${
                errors.name ? 'border-error' : 'border-border'
              }`}
              placeholder="Sponsor name"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Logo URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Image size={14} className="text-text-tertiary" />
              Logo URL *
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-alt border rounded-lg text-text ${
                errors.logo_url ? 'border-error' : 'border-border'
              }`}
              placeholder="https://example.com/logo.png"
            />
            {errors.logo_url && <p className="text-error text-xs mt-1">{errors.logo_url}</p>}
            {formData.logo_url && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-surface border border-border">
                <img 
                  src={formData.logo_url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Tagline */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Type size={14} className="text-text-tertiary" />
              Tagline *
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-alt border rounded-lg text-text ${
                errors.tagline ? 'border-error' : 'border-border'
              }`}
              placeholder="Short description"
            />
            {errors.tagline && <p className="text-error text-xs mt-1">{errors.tagline}</p>}
          </div>

          {/* Link */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <LinkIcon size={14} className="text-text-tertiary" />
              Link URL *
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-alt border rounded-lg text-text ${
                errors.link ? 'border-error' : 'border-border'
              }`}
              placeholder="https://example.com"
            />
            {errors.link && <p className="text-error text-xs mt-1">{errors.link}</p>}
          </div>

          {/* CTA Text */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Type size={14} className="text-text-tertiary" />
              CTA Text *
            </label>
            <input
              type="text"
              value={formData.cta_text}
              onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
              className={`w-full px-3 py-2 bg-surface-alt border rounded-lg text-text ${
                errors.cta_text ? 'border-error' : 'border-border'
              }`}
              placeholder="Learn More"
            />
            {errors.cta_text && <p className="text-error text-xs mt-1">{errors.cta_text}</p>}
          </div>

          {/* Display Order */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-1">
              <Hash size={14} className="text-text-tertiary" />
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-text"
              min={1}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-surface-alt rounded-lg">
            <div className="flex items-center gap-2">
              {formData.is_active ? (
                <Eye size={16} className="text-success" />
              ) : (
                <EyeOff size={16} className="text-text-tertiary" />
              )}
              <span className="text-sm text-text">Active</span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.is_active ? 'bg-success' : 'bg-text-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              <Check size={16} />
              {spotlight ? 'Save Changes' : 'Create Spotlight'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Confirm Delete Dialog
function ConfirmDeleteDialog({
  spotlightName,
  onConfirm,
  onCancel,
}: {
  spotlightName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-surface rounded-xl border border-border shadow-2xl animate-in zoom-in-95">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-error" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text text-center mb-2">Delete Spotlight</h3>

          {/* Spotlight Name */}
          <p className="text-center text-text-secondary mb-2">
            <span className="font-medium text-text">&ldquo;{spotlightName}&rdquo;</span>
          </p>

          {/* Message */}
          <p className="text-sm text-text-secondary text-center mb-6">
            Are you sure you want to permanently delete this spotlight? This action cannot be undone.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium bg-error hover:bg-error/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
