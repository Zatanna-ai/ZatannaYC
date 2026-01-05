'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import Link from 'next/link'

interface Founder {
  id: string
  name: string
  first_name: string
  last_name: string
  profile_picture_url: string | null
  linkedin_url: string | null
  current_role: string
  current_company: string | null
}

interface LocationFoundersModalProps {
  isOpen: boolean
  onClose: () => void
  locationName: string
}

export function LocationFoundersModal({ isOpen, onClose, locationName }: LocationFoundersModalProps) {
  const [founders, setFounders] = useState<Founder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && locationName) {
      fetchFounders()
    }
  }, [isOpen, locationName])

  async function fetchFounders() {
    setLoading(true)
    setError(null)
    try {
      const API_BASE_URL = 'https://sgapi.zatanna.ai'
      const encodedLocationName = encodeURIComponent(locationName)
      const response = await fetch(`${API_BASE_URL}/api/v1/yc-dashboard/locations/${encodedLocationName}/founders`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch founders')
      }

      const data = await response.json()
      if (data.success) {
        setFounders(data.data.founders || [])
      } else {
        throw new Error(data.error || 'Failed to fetch founders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load founders')
      console.error('Error fetching founders:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="archival-card max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-section font-serif">Founders in {locationName}</h2>
            <p className="text-body text-muted-foreground mt-1">
              {founders.length} {founders.length === 1 ? 'founder' : 'founders'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-error mb-4">{error}</p>
              <button
                onClick={fetchFounders}
                className="btn-outline"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && founders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {founders.map((founder) => (
                <Link
                  key={founder.id}
                  href={`/founders/${founder.id}`}
                  className="archival-card p-4 hover:border-success transition-colors flex items-center gap-4"
                >
                  {founder.profile_picture_url ? (
                    <img
                      src={founder.profile_picture_url}
                      alt={founder.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-cream-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl text-muted-foreground">
                        {founder.first_name[0]}{founder.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-medium truncate">{founder.name}</h3>
                    {founder.current_role && (
                      <p className="text-caption text-muted-foreground truncate">
                        {founder.current_role}
                        {founder.current_company && ` at ${founder.current_company}`}
                      </p>
                    )}
                  </div>
                  {founder.linkedin_url && (
                    <a
                      href={founder.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-info hover:text-info/80 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && founders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-body text-muted-foreground">No founders found for this location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

