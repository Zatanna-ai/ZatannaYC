'use client'

import { useState } from 'react'
import { PieChart } from './charts/PieChart'
import { EducationLevelFoundersModal } from './EducationLevelFoundersModal'

interface EducationLevel {
  level: string
  count: number
  percentage: number
}

interface EducationLevelChartProps {
  educationLevels: EducationLevel[]
}

export function EducationLevelChart({ educationLevels }: EducationLevelChartProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Transform data for pie chart
  const chartData = educationLevels.map(item => ({
    name: item.level,
    value: item.count,
    percentage: item.percentage,
    fullName: item.level,
  }))

  const handleSliceClick = (data: { name: string; value: number; fullName?: string }) => {
    const levelName = data.fullName || data.name
    setSelectedLevel(levelName)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="h-96">
        <PieChart
          data={chartData}
          height={384}
          onSliceClick={handleSliceClick}
          showClickHint={true}
        />
      </div>
      {selectedLevel && (
        <EducationLevelFoundersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedLevel(null)
          }}
          levelName={selectedLevel}
        />
      )}
    </>
  )
}
