'use client'

import { useState } from 'react'
import { BarChart } from './charts/BarChart'
import { OccupationFoundersModal } from './OccupationFoundersModal'

interface Occupation {
  title: string
  canonical_name: string
  count: number
  percentage: number
  industry: string
  role_level: string
}

interface OccupationsChartProps {
  occupations: Occupation[]
}

export function OccupationsChart({ occupations }: OccupationsChartProps) {
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Transform data for bar chart - top 10
  const chartData = occupations.slice(0, 10).map(item => ({
    name: item.title,
    value: item.percentage,
    percentage: item.percentage,
    fullName: item.title,
  }))

  const handleBarClick = (data: { name: string; value: number; fullName?: string }) => {
    const occupationTitle = data.fullName || data.name
    setSelectedOccupation(occupationTitle)
    setIsModalOpen(true)
  }

  return (
    <>
      {/* Bar Chart */}
      <div className="h-96">
        <BarChart
          data={chartData}
          dataKey="value"
          color="hsl(var(--moss-green-400))"
          height={384}
          onBarClick={handleBarClick}
          showClickHint={true}
        />
      </div>

      {/* List - Top 5 */}
      <div className="mt-6 space-y-2.5">
        {occupations.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-body items-center py-1.5 px-2 rounded hover:bg-gray-cream-100 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedOccupation(item.title)
              setIsModalOpen(true)
            }}
          >
            <span className="text-muted-foreground mr-2">{item.title}</span>
            <span className="font-semibold text-moss-green-400 whitespace-nowrap">{item.percentage}%</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedOccupation && (
        <OccupationFoundersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOccupation(null)
          }}
          occupationTitle={selectedOccupation}
        />
      )}
    </>
  )
}
