import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function StatCard({ title, children, className = '' }: StatCardProps) {
  return (
    <div className={`archival-card p-6 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <h3 className="text-subhead font-serif mb-6 text-foreground border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}
