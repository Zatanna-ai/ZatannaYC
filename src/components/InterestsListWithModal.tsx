'use client'

import { useState } from 'react'
import { InterestFoundersModal } from './InterestFoundersModal'

interface Interest {
  canonical_name: string
  original_name?: string // Database name for API calls
  percentage: number
  count: number
  intensity_breakdown: {
    casual: number
    enthusiast: number
    serious: number
    professional: number
  }
}

interface InterestsListWithModalProps {
  interests: Interest[]
}

export function InterestsListWithModal({ interests }: InterestsListWithModalProps) {
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-3 italic">Hover to see hint, click to see all founders</p>
        {interests
          .filter(item => item.canonical_name.toLowerCase() !== 'other')
          .slice(0, 8)
          .map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedInterest(item.original_name || item.canonical_name.toLowerCase().replace(/\s+/g, '_'))}
              className="w-full flex justify-between text-body items-center py-2 px-3 rounded hover:bg-moss-green/10 hover:border-moss-green/30 border border-transparent transition-all cursor-pointer group relative"
              title="Click to see all founders"
            >
              <span className="text-muted-foreground truncate mr-2">{item.canonical_name}</span>
              <span className="font-semibold text-info whitespace-nowrap">{item.percentage}%</span>
              <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Click to see all founders
              </span>
            </button>
          ))}
      </div>

      <InterestFoundersModal
        isOpen={selectedInterest !== null}
        onClose={() => setSelectedInterest(null)}
        interestName={selectedInterest || ''}
      />
    </>
  )
}
