'use client'

import { useState } from 'react'
import { BarChart } from './charts/BarChart'
import { CompanyFoundersModal } from './CompanyFoundersModal'

interface Company {
  name: string
  count: number
  percentage: number
}

interface CompaniesChartProps {
  companies: Company[]
}

export function CompaniesChart({ companies }: CompaniesChartProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const companiesChartData = companies.slice(0, 10).map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    value: item.percentage,
    fullName: item.name,
  }))

  const handleBarClick = (data: { name: string; value: number; fullName?: string }) => {
    const companyName = data.fullName || data.name
    setSelectedCompany(companyName)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="h-96">
        <BarChart
          data={companiesChartData}
          dataKey="value"
          color="hsl(var(--info))"
          height={384}
          onBarClick={handleBarClick}
          showClickHint={true}
        />
      </div>
      <div className="mt-6 space-y-2.5">
        {companies.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-body items-center py-1.5 px-2 rounded hover:bg-gray-cream-100 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedCompany(item.name)
              setIsModalOpen(true)
            }}
          >
            <span className="text-muted-foreground truncate mr-2">{item.name}</span>
            <span className="font-semibold text-info whitespace-nowrap">{item.percentage}%</span>
          </div>
        ))}
      </div>
      {selectedCompany && (
        <CompanyFoundersModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCompany(null)
          }}
          companyName={selectedCompany}
        />
      )}
    </>
  )
}

