'use client'

import { useState } from 'react'
import { InterestFoundersModal } from './InterestFoundersModal'
import { OccupationFoundersModal } from './OccupationFoundersModal'

interface Interest {
  canonical_name: string
  percentage: number
  count: number
  intensity_breakdown: {
    casual: number
    enthusiast: number
    serious: number
    professional: number
  }
}

interface Occupation {
  title: string
  percentage: number
  count: number
}

interface InterestsOccupationsSectionProps {
  interests: Interest[]
  occupations: Occupation[]
}

export function InterestsOccupationsSection({ interests, occupations }: InterestsOccupationsSectionProps) {
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null)

  return (
    <>
      {/* Interests List - Clickable */}
      <div>
        <h4 className="text-ui font-serif text-muted-foreground mb-2">Top Interests</h4>
        <p className="text-xs text-muted-foreground mb-3 italic">Click to see founders</p>
        <div className="space-y-1.5">
          {interests
            .filter(item => item.canonical_name.toLowerCase() !== 'other')
            .slice(0, 8)
            .map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedInterest(item.canonical_name)}
                className="w-full flex justify-between text-body items-center py-1 px-2 rounded hover:bg-moss-green/10 hover:border-moss-green/30 border border-transparent transition-all cursor-pointer"
              >
                <span className="text-muted-foreground truncate mr-2 text-sm">{item.canonical_name}</span>
                <span className="font-semibold text-info whitespace-nowrap text-sm">{item.percentage}%</span>
              </button>
            ))}
        </div>
      </div>

      {/* Occupations List - Clickable */}
      <div className="mt-8">
        <h4 className="text-ui font-serif text-muted-foreground mb-2">Top Occupations</h4>
        <p className="text-xs text-muted-foreground mb-3 italic">Click to see founders</p>
        <div className="space-y-2.5">
          {occupations.slice(0, 5).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOccupation(item.title)}
              className="w-full flex justify-between text-body items-center py-1.5 px-2 rounded hover:bg-moss-green/10 hover:border-moss-green/30 border border-transparent transition-all cursor-pointer"
            >
              <span className="text-muted-foreground truncate mr-2">{item.title}</span>
              <span className="font-semibold text-moss-green-400 whitespace-nowrap">{item.percentage}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <InterestFoundersModal
        isOpen={selectedInterest !== null}
        onClose={() => setSelectedInterest(null)}
        interestName={selectedInterest || ''}
      />

      <OccupationFoundersModal
        isOpen={selectedOccupation !== null}
        onClose={() => setSelectedOccupation(null)}
        occupationTitle={selectedOccupation || ''}
      />
    </>
  )
}
