'use client'

import { BarChart } from './charts/BarChart'

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
  const geographyChartData = geography.slice(0, 10).map(item => ({
    name: item.location.length > 20 ? item.location.substring(0, 20) + '...' : item.location,
    value: item.percentage,
    fullName: item.location,
  }))

  return (
    <>
      <div className="h-96">
        <BarChart
          data={geographyChartData}
          dataKey="value"
          color="hsl(var(--success))"
          height={384}
        />
      </div>
      <div className="mt-6 space-y-2.5">
        {geography.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-body items-center py-1.5 px-2 rounded"
          >
            <span className="text-muted-foreground truncate mr-2">{item.location}</span>
            <span className="font-semibold text-success whitespace-nowrap">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </>
  )
}

