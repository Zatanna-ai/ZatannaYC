'use client'

import { useState } from 'react'

const exampleSearches = [
  {
    query: 'founders that like eating sushi',
    icon: '🍣',
    category: 'Interests',
  },
  {
    query: 'founders working on consumer hardware',
    icon: '🔧',
    category: 'Industry',
  },
  {
    query: 'CTOs who went to Stanford',
    icon: '🎓',
    category: 'Education',
  },
  {
    query: 'founders interested in robotics',
    icon: '🤖',
    category: 'Interests',
  },
  {
    query: 'CEOs from San Francisco',
    icon: '📍',
    category: 'Location',
  },
  {
    query: 'founders with photography hobbies',
    icon: '📸',
    category: 'Interests',
  },
]

interface SearchSectionProps {
  compact?: boolean
}

export function SearchSection({ compact = false }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleExampleClick = (query: string) => {
    // Auto-navigate to search with example query
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="archival-card p-6 sticky top-4">
          <h2 className="text-subhead font-serif mb-4">Discover Founders</h2>
          <p className="text-caption text-muted-foreground mb-4">
            Use natural language to search by interests, education, location, role, and more
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., CTOs from Stanford..."
              className="w-full px-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-moss-green text-body mb-3"
              disabled={isSearching}
            />
            <button
              type="submit"
              className="w-full btn-primary"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Example Searches - Compact */}
          <div>
            <h3 className="text-ui font-serif mb-3 text-muted-foreground">Try searching for:</h3>
            <div className="space-y-2">
              {exampleSearches.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example.query)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-cream-100 transition-colors group border border-transparent hover:border-moss-green/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{example.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-moss-green transition-colors line-clamp-2">
                        {example.query}
                      </p>
                    </div>
                    <span className="text-moss-green opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="content-section py-16">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-section font-serif mb-4">Discover Founders</h2>
            <p className="text-body text-muted-foreground">
              Use natural language to search for founders by any criteria - interests, education, location, role, and more
            </p>
          </div>

          {/* Search Bar */}
          <div className="archival-card p-6 mb-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Example Searches */}
          <div>
            <h3 className="text-subhead font-serif mb-6 text-center">Try searching for:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {exampleSearches.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example.query)}
                  className="archival-card p-4 text-left hover:shadow-lg transition-all hover:border-moss-green group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{example.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-caption text-muted-foreground mb-1">{example.category}</p>
                      <p className="text-ui font-medium group-hover:text-moss-green transition-colors line-clamp-2">
                        {example.query}
                      </p>
                    </div>
                    <span className="text-moss-green opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
