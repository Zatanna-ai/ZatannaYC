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
  '#6B8E23',                      // Olive/Dark green
  '#4A90E2',                      // Bright blue
  '#F5A623',                      // Orange
  '#50C878',                      // Emerald green
  '#9B59B6',                      // Purple
  '#E74C3C',                      // Red
  '#95A5A6',                      // Gray
  '#16A085',                      // Teal
]

// Custom label renderer that shows percentage on all slices
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
  // Use pre-calculated percentage if available, otherwise use Recharts calculated percent
  const displayPercent = payload.percentage !== undefined ? payload.percentage / 100 : percent

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Adjust font size based on percentage - smaller text for smaller slices
  const fontSize = displayPercent < 0.05 ? 10 : displayPercent < 0.10 ? 12 : 14

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight={600}
    >
      {`${(displayPercent * 100).toFixed(0)}%`}
    </text>
  )
}

// Custom legend with better formatting - single column to show full names
const renderLegend = (props: any) => {
  const { payload } = props
  return (
    <div className="flex flex-col gap-2 mt-4 px-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-start gap-2">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground leading-tight break-words">
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
          cy="35%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
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
