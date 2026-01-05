'use client'

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PieChartProps {
  data: Array<{ name: string; value: number; fullName?: string; percentage?: number }>
  height?: number
  colors?: string[]
  onSliceClick?: (data: { name: string; value: number; fullName?: string }) => void
  showClickHint?: boolean
}

const DEFAULT_COLORS = [
  'hsl(var(--moss-green))',
  'hsl(var(--moss-green-400))',
  'hsl(var(--moss-green-300))',
  'hsl(var(--moss-green-200))',
  'hsl(var(--gray-cream-400))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
]

// Custom label renderer that only shows percentage on the slice
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  // Only show label if slice is large enough (> 5%)
  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={14}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Custom legend with better formatting
const renderLegend = (props: any) => {
  const { payload } = props
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 px-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground truncate leading-tight">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Custom tooltip with click hint
const CustomTooltip = ({ active, payload, showClickHint }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    // Use the original percentage if available, otherwise use Recharts calculated percentage
    const percentage = data.percentage !== undefined 
      ? data.percentage 
      : (payload[0].payload.percent * 100) // Recharts calculated percentage
    
    return (
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-3"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <p className="text-sm font-medium">{data.fullName || payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {percentage.toFixed(1)}%
        </p>
        {showClickHint && (
          <p className="text-xs text-info mt-2 italic">
            Click to see founders
          </p>
        )}
      </div>
    )
  }
  return null
}

export function PieChart({ data, height = 300, colors = DEFAULT_COLORS, onSliceClick, showClickHint = false }: PieChartProps) {
  const handleClick = (data: any) => {
    if (onSliceClick) {
      onSliceClick({
        name: data.name,
        value: data.value,
        fullName: data.fullName || data.name,
      })
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          labelLine={false}
          label={renderLabel}
          outerRadius={110}
          innerRadius={0}
          fill="hsl(var(--moss-green))"
          dataKey="value"
          paddingAngle={2}
          onClick={handleClick}
          cursor={onSliceClick ? 'pointer' : 'default'}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip showClickHint={showClickHint} />} />
        <Legend content={renderLegend} verticalAlign="bottom" />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
