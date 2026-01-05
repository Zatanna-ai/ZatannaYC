'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BarChartProps {
  data: Array<{ name: string; value: number; fullName?: string; [key: string]: any }>
  dataKey?: string
  color?: string
  height?: number
  onBarClick?: (data: { name: string; value: number; fullName?: string }) => void
  showClickHint?: boolean
}

// Custom label for X-axis with smart truncation
const CustomXAxisTick = ({ x, y, payload }: any) => {
  const maxLength = 12
  const text = payload.value
  const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="end"
        fill="hsl(var(--muted-foreground))"
        transform="rotate(-45)"
        fontSize={10}
      >
        {truncated}
      </text>
    </g>
  )
}

// Custom tooltip with full name and click hint
const CustomTooltip = ({ active, payload, showClickHint }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const fullName = data.fullName || data.name
  const value = payload[0].value

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 shadow-lg"
      style={{ maxWidth: '250px' }}
    >
      <p className="text-sm font-medium text-foreground mb-1">{fullName}</p>
      <p className="text-sm text-muted-foreground mb-1">
        {value.toFixed(1)}%
      </p>
      {showClickHint && (
        <p className="text-xs text-info mt-2 italic">
          Click to see founders
        </p>
      )}
    </div>
  )
}

export function BarChart({ data, dataKey = 'value', color = 'hsl(var(--moss-green))', height = 300, onBarClick, showClickHint = false }: BarChartProps) {
  const handleBarClick = (clickedData: any) => {
    if (onBarClick && clickedData) {
      onBarClick({
        name: clickedData.name,
        value: clickedData.value,
        fullName: clickedData.fullName || clickedData.name,
      })
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 10, right: 20, left: 10, bottom: 90 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.3}
        />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          tick={<CustomXAxisTick />}
          height={90}
          interval={0}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 11 }}
          width={45}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} showClickHint={showClickHint} />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[6, 6, 0, 0]}
          maxBarSize={50}
          onClick={handleBarClick}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
