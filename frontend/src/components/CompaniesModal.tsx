'use client'

import { useState, useEffect } from 'react'
import { getTopCompanies } from '@/lib/api/yc-batch'
import { LoadingSpinner } from './LoadingSpinner'

interface Company {
  id: string
  name: string
  founder_count: number
  percentage: number
}

interface CompaniesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompaniesModal({ isOpen, onClose }: CompaniesModalProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalFounders, setTotalFounders] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  async function fetchCompanies() {
    setLoading(true)
    setError(null)
    try {
      const data = await getTopCompanies(100)
      setCompanies(data.companies)
      setTotalFounders(data.total_founders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies')
      console.error('Error fetching companies:', err)
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
          <h2 className="text-section font-serif">Top Companies</h2>
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
                onClick={fetchCompanies}
                className="btn-outline"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && companies.length > 0 && (
            <div className="space-y-2">
              <p className="text-body text-muted-foreground mb-4">
                Companies where {totalFounders} founders have worked
              </p>
              {companies.map((company, idx) => (
                <div
                  key={company.id}
                  className="flex justify-between items-center py-3 px-4 rounded hover:bg-gray-cream-100 transition-colors border border-transparent hover:border-moss-green/30"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-ui font-serif text-muted-foreground w-8 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-body font-medium truncate flex-1">
                      {company.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-body font-semibold text-moss-green">
                        {company.founder_count} {company.founder_count === 1 ? 'founder' : 'founders'}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        {company.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && companies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-body text-muted-foreground">No companies found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

