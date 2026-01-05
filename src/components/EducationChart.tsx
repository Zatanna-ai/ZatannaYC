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

  const educationPieData = education.slice(0, 8).map(item => ({
    name: item.university.length > 30 ? item.university.substring(0, 30) + '...' : item.university,
    value: item.percentage,
    fullName: item.university,
  }))

  const handleSliceClick = (data: { name: string; value: number; fullName?: string }) => {
    const schoolName = data.fullName || data.name
    setSelectedSchool(schoolName)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="h-96">
        <PieChart
          data={educationPieData}
          height={384}
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
