'use client'

import { useState } from 'react'
import { BarChart } from './charts/BarChart'
import { LocationFoundersModal } from './LocationFoundersModal'

interface Location {
  location: string
  count: number
  percentage: number
  type: 'current' | 'origin'
}

interface GeographyChartProps {
  geography: Location[]
}

export function GeographyChart({ geography }: GeographyChartProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const geographyChartData = geography.slice(0, 10).map(item => ({
    name: item.location.length > 20 ? item.location.substring(0, 20) + '...' : item.location,
    value: item.percentage,
    fullName: item.location,
  }))

  const handleBarClick = (data: { name: string; value: number; fullName?: string }) => {
    const locationName = data.fullName || data.name
    setSelectedLocation(locationName)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="h-96">
        <BarChart
          data={geographyChartData}
          dataKey="value"
          color="hsl(var(--success))"
          height={384}
          onBarClick={handleBarClick}
          showClickHint={true}
        />
      </div>
      <div className="mt-6 space-y-2.5">
        {geography.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-body items-center py-1.5 px-2 rounded hover:bg-gray-cream-100 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedLocation(item.location)
              setIsModalOpen(true)
            }}
          >
            <span className="text-muted-foreground truncate mr-2">{item.location}</span>
            <span className="font-semibold text-success whitespace-nowrap">{item.percentage}%</span>
          </div>
        ))}
      </div>
      {selectedLocation && (
        <LocationFoundersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedLocation(null)
          }}
          locationName={selectedLocation}
        />
      )}
    </>
  )
}

