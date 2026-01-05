'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

interface MatchingEntity {
  entity_type: string
  entity_value: string
  similarity: number
}

interface Datapoint {
  id: string
  url: string
  title: string | null
  snippet: string | null
}

interface SearchResult {
  person_id: string
  name: string
  linkedin_url: string | null
  profile_picture_url: string | null
  matched_occupation: string
  occupation_score: number
  criteria_score: number
  combined_score: number
  matching_entities: MatchingEntity[]
  subject_datapoints: Datapoint[]
  criteria_datapoints: Datapoint[]
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setHasSearched(true)

    try {
      // Default to localhost:3000 if not configured
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

      const response = await fetch(`${API_BASE_URL}/api/v1/discover-yc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
        },
        body: JSON.stringify({
          query: searchQuery,
          num_results: 20,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Search failed: ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If parsing fails, use the status text
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Handle different response structures
      const founders = data.data?.top_founders || data.top_founders || data.founders || []
      
      // Transform matching_entities if they're strings to match the interface
      const transformedResults = founders.map((founder: any) => ({
        ...founder,
        matching_entities: Array.isArray(founder.matching_entities)
          ? founder.matching_entities.map((entity: any) => 
              typeof entity === 'string' 
                ? { entity_type: 'keyword', entity_value: entity, similarity: 1.0 }
                : entity
            )
          : [],
        subject_datapoints: founder.subject_datapoints || [],
        criteria_datapoints: founder.criteria_datapoints || [],
        linkedin_url: founder.linkedin_url || null,
        profile_picture_url: founder.profile_picture_url || null,
      }))
      
      setResults(transformedResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setResults([]) // Don't use mock results - show error instead
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const generateMockResults = (searchQuery: string): SearchResult[] => {
    // Simple mock results based on query keywords
    const queryLower = searchQuery.toLowerCase()
    const mockResults: SearchResult[] = []

    // Match based on keywords
    if (queryLower.includes('sushi') || queryLower.includes('eating')) {
      mockResults.push({
        person_id: '1',
        name: 'Alex Chen',
        linkedin_url: null,
        profile_picture_url: 'https://i.pravatar.cc/150?img=1',
        matched_occupation: 'CTO',
        occupation_score: 0.85,
        criteria_score: 0.85,
        combined_score: 0.85,
        matching_entities: [
          { entity_type: 'interest', entity_value: 'sushi', similarity: 0.9 },
          { entity_type: 'interest', entity_value: 'food', similarity: 0.8 }
        ],
        subject_datapoints: [],
        criteria_datapoints: [],
      })
    }

    if (queryLower.includes('hardware') || queryLower.includes('consumer')) {
      mockResults.push({
        person_id: '2',
        name: 'Sarah Johnson',
        linkedin_url: null,
        profile_picture_url: 'https://i.pravatar.cc/150?img=5',
        matched_occupation: 'CEO',
        occupation_score: 0.90,
        criteria_score: 0.90,
        combined_score: 0.90,
        matching_entities: [
          { entity_type: 'interest', entity_value: 'consumer hardware', similarity: 0.95 },
          { entity_type: 'interest', entity_value: 'hardware', similarity: 0.85 }
        ],
        subject_datapoints: [],
        criteria_datapoints: [],
      })
    }

    if (queryLower.includes('stanford') || queryLower.includes('cto')) {
      mockResults.push({
        person_id: '1',
        name: 'Alex Chen',
        linkedin_url: null,
        profile_picture_url: 'https://i.pravatar.cc/150?img=1',
        matched_occupation: 'CTO',
        occupation_score: 0.88,
        criteria_score: 0.88,
        combined_score: 0.88,
        matching_entities: [
          { entity_type: 'university', entity_value: 'Stanford University', similarity: 0.92 },
          { entity_type: 'occupation', entity_value: 'CTO', similarity: 0.85 }
        ],
        subject_datapoints: [],
        criteria_datapoints: [],
      })
    }

    if (queryLower.includes('robotics')) {
      mockResults.push({
        person_id: '1',
        name: 'Alex Chen',
        linkedin_url: null,
        profile_picture_url: 'https://i.pravatar.cc/150?img=1',
        matched_occupation: 'CTO',
        occupation_score: 0.92,
        criteria_score: 0.92,
        combined_score: 0.92,
        matching_entities: [
          { entity_type: 'interest', entity_value: 'robotics', similarity: 0.95 }
        ],
        subject_datapoints: [],
        criteria_datapoints: [],
      })
    }

    // Add some generic results if no specific matches
    if (mockResults.length === 0) {
      for (let i = 1; i <= 5; i++) {
        mockResults.push({
          person_id: `${i}`,
          name: `Founder ${i}`,
          linkedin_url: null,
          profile_picture_url: `https://i.pravatar.cc/150?img=${i + 10}`,
          matched_occupation: 'CEO',
          occupation_score: 0.75 + Math.random() * 0.2,
          criteria_score: 0.75 + Math.random() * 0.2,
          combined_score: 0.75 + Math.random() * 0.2,
          matching_entities: [
            { entity_type: 'general', entity_value: searchQuery, similarity: 0.7 }
          ],
          subject_datapoints: [],
          criteria_datapoints: [],
        })
      }
    }

    return mockResults
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className="min-h-screen hero-texture">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto py-6">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-section font-serif hover:text-moss-green transition-colors">
              Zatanna
            </Link>
            <div className="flex gap-4">
              <Link href="/" className="btn-outline">
                Home
              </Link>
              <Link href="/founders" className="btn-outline">
                Browse Founders
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Search Section */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-hero font-serif mb-4">Search Founders</h1>
            <p className="text-body text-muted-foreground">
              Use natural language to find founders by interests, education, location, role, and more
            </p>
          </div>

          <div className="archival-card p-6 mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: 'founders that like eating sushi' or 'CTOs from Stanford'..."
                className="flex-1 px-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-moss-green text-body"
                disabled={isSearching}
              />
              <button
                type="submit"
                className="btn-primary px-8"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Results */}
          {isSearching && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-gray-cream-200 border-t-moss-green rounded-full animate-spin mx-auto mb-4" />
              <p className="text-body text-muted-foreground">Searching...</p>
            </div>
          )}

          {error && (
            <div className="archival-card p-6 mb-8 border-error-border border-2">
              <p className="text-body text-error">{error}</p>
              <p className="text-caption text-muted-foreground mt-2">
                Please check that the backend is running on port 3000 and the /api/v1/discover-yc endpoint is available.
              </p>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="archival-card p-8 text-center">
              <p className="text-body text-muted-foreground mb-4">No results found</p>
              <p className="text-caption text-muted-foreground">
                Try a different search query or browse all founders
              </p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div>
              <div className="mb-6">
                <p className="text-body text-muted-foreground">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result) => (
                  <Link
                    key={result.person_id}
                    href={`/founders/${result.person_id}`}
                    className="archival-card p-6 hover:shadow-lg transition-all hover:border-moss-green"
                  >
                    <div className="flex items-start gap-4">
                      {result.profile_picture_url ? (
                        <Image
                          src={result.profile_picture_url}
                          alt={result.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded-full bg-gray-cream-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-serif text-muted-foreground">
                            {result.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-subhead font-serif">{result.name}</h3>
                          {result.linkedin_url && (
                            <a
                              href={result.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-moss-green hover:text-moss-green/80 transition-colors"
                              title="View LinkedIn Profile"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                        {result.matched_occupation && (
                          <p className="text-ui text-muted-foreground mb-2">
                            {result.matched_occupation}
                          </p>
                        )}
                        {result.matching_entities && result.matching_entities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.matching_entities.slice(0, 3).map((entity, idx) => {
                              const entityValue = typeof entity === 'string' 
                                ? entity 
                                : entity.entity_value || entity.entity_type || 'Match'
                              return (
                                <span key={idx} className="badge-info text-xs">
                                  {entityValue}
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {result.combined_score && (
                          <p className="text-caption text-muted-foreground mb-3">
                            Match: {Math.round(result.combined_score * 100)}%
                          </p>
                        )}
                        
                        {/* Subject Datapoints (Occupation/Role matches) */}
                        {result.subject_datapoints && result.subject_datapoints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                              Role Evidence
                            </p>
                            <div className="space-y-2">
                              {result.subject_datapoints.slice(0, 3).map((datapoint) => (
                                <a
                                  key={datapoint.id}
                                  href={datapoint.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="block text-xs text-muted-foreground hover:text-moss-green transition-colors truncate"
                                  title={datapoint.title || datapoint.url}
                                >
                                  {datapoint.title || new URL(datapoint.url).hostname}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Criteria Datapoints (Education/Interests/Location matches) */}
                        {result.criteria_datapoints && result.criteria_datapoints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                              Criteria Evidence
                            </p>
                            <div className="space-y-2">
                              {result.criteria_datapoints.slice(0, 3).map((datapoint) => (
                                <a
                                  key={datapoint.id}
                                  href={datapoint.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="block text-xs text-muted-foreground hover:text-moss-green transition-colors truncate"
                                  title={datapoint.title || datapoint.url}
                                >
                                  {datapoint.title || new URL(datapoint.url).hostname}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="archival-card p-8 text-center">
              <p className="text-body text-muted-foreground mb-4">
                Enter a search query to find founders
              </p>
              <p className="text-caption text-muted-foreground">
                Examples: "founders that like eating sushi", "CTOs from Stanford", "founders working on consumer hardware"
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto text-center">
          <Link href="/" className="btn-outline">
            ← Back to Home
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}

