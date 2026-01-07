'use client'

import { useEffect, useState } from 'react'
import { YC_CASE_SESSION_ID, API_BASE_URL } from '@/lib/config'
import Link from 'next/link'
import Image from 'next/image'

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

interface EducationLevelFoundersModalProps {
  isOpen: boolean
  onClose: () => void
  levelName: string
}

export function EducationLevelFoundersModal({ isOpen, onClose, levelName }: EducationLevelFoundersModalProps) {
  const [founders, setFounders] = useState<Founder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && levelName) {
      fetchFounders()
    }
  }, [isOpen, levelName])

  const fetchFounders = async () => {
    setLoading(true)
    setError(null)

    try {
      const encodedLevelName = encodeURIComponent(levelName)
      const response = await fetch(
        `${API_BASE_URL}/api/v1/yc-dashboard/education-levels/${encodedLevelName}/founders?case_session_id=${YC_CASE_SESSION_ID}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch founders')
      }

      const data = await response.json()
      setFounders(data.data.founders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load founders')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="archival-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-section font-serif mb-2">Founders with {levelName}</h2>
            <p className="text-caption text-muted-foreground">
              {loading ? 'Loading...' : `${founders.length} founder${founders.length !== 1 ? 's' : ''}`}
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
              <div className="w-8 h-8 border-4 border-gray-cream-200 border-t-moss-green rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-body text-error">{error}</p>
            </div>
          )}

          {!loading && !error && founders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-body text-muted-foreground">
                No founders found with {levelName}
              </p>
            </div>
          )}

          {!loading && !error && founders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {founders.map((founder) => (
                <Link
                  key={founder.id}
                  href={`/founders/${founder.id}`}
                  className="archival-card p-4 hover:shadow-md transition-shadow block"
                >
                  <div className="flex gap-4">
                    {founder.profile_picture_url ? (
                      <Image
                        src={founder.profile_picture_url}
                        alt={founder.name}
                        width={60}
                        height={60}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-15 h-15 rounded-full bg-gray-cream-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-serif text-muted-foreground">
                          {founder.first_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-ui font-medium mb-1 truncate">{founder.name}</h3>
                      <p className="text-caption text-muted-foreground truncate">
                        {founder.current_role}
                      </p>
                      {founder.current_company && (
                        <p className="text-caption text-muted-foreground truncate">
                          {founder.current_company}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 text-center">
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
