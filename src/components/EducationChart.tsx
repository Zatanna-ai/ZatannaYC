'use client'

import { useState } from 'react'
import { PieChart } from './charts/PieChart'
import { EducationFoundersModal } from './EducationFoundersModal'

interface School {
  university: string
  count: number
  percentage: number
}

interface EducationChartProps {
  education: School[]
}

export function EducationChart({ education }: EducationChartProps) {
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Use count for pie chart sizing, but store percentage for tooltip
  const educationPieData = education.slice(0, 8).map(item => ({
    name: item.university, // Show full name in legend
    value: item.count, // Use count for pie chart sizing (Recharts will calculate percentages)
    percentage: item.percentage, // Store original percentage for tooltip display
    fullName: item.university,
  }))

  const handleSliceClick = (data: { name: string; value: number; fullName?: string }) => {
    const schoolName = data.fullName || data.name
    setSelectedSchool(schoolName)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="h-[500px]">
        <PieChart
          data={educationPieData}
          height={500}
          onSliceClick={handleSliceClick}
          showClickHint={true}
        />
      </div>
      {selectedSchool && (
        <EducationFoundersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSchool(null)
          }}
          schoolName={selectedSchool}
        />
      )}
    </>
  )
}
