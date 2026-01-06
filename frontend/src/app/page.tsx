import { getBatchStats } from '@/lib/api/yc-batch'
import { StatCard } from '@/components/StatCard'
import { BarChart, PieChart } from '@/components/charts'
import { SearchSection } from '@/components/SearchSection'
import { CompaniesModalClient } from '@/components/CompaniesModalClient'
import { CompaniesChart } from '@/components/CompaniesChart'
import { EducationChart } from '@/components/EducationChart'
import { InterestsListWithModal } from '@/components/InterestsListWithModal'
import Link from 'next/link'

// Force dynamic rendering since we're fetching live data from API
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let stats
  let error: string | null = null

  try {
    stats = await getBatchStats()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load statistics'
    console.error('Error loading stats:', err)
  }

  if (error) {
    return (
      <div className="min-h-screen hero-texture">
        <div className="container mx-auto py-16">
          <div className="archival-card p-8 text-center">
            <h1 className="text-hero font-serif mb-4">YC Batch W26 Report</h1>
            <p className="text-body text-error mb-4">Error loading statistics: {error}</p>
            <p className="text-body text-muted-foreground">
              Please check your API configuration and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen hero-texture">
        <div className="container mx-auto py-16">
          <div className="archival-card p-8 text-center">
            <h1 className="text-hero font-serif mb-4">YC Batch W26 Report</h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-gray-cream-200 border-t-moss-green rounded-full animate-spin" />
              <p className="text-body text-muted-foreground">Loading statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const occupationChartData = stats.occupations.slice(0, 10).map(item => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    value: item.percentage,
    percentage: item.percentage,
    fullName: item.title,
  }))

  return (
    <div className="min-h-screen hero-texture">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto py-6">
          <nav className="flex items-center justify-between">
            <a href="https://zatanna.ai" target="_blank" rel="noopener noreferrer" className="text-section font-serif hover:text-moss-green transition-colors">
              Zatanna
            </a>
            <div className="flex gap-4">
              <Link href="/founders" className="btn-outline">
                Browse Founders
              </Link>
              <Link href="/search" className="btn-primary">
                Search
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section with Sidebar Layout */}
      <section className="py-6">
        <div className="container mx-auto">
          {/* Title and Quick Stats Bar */}
          <div className="mb-6">
            <h1 className="text-hero font-serif mb-3">YC Batch W26 Insights</h1>
            <p className="text-body text-muted-foreground mb-4 max-w-3xl">
              All of these {stats.total_founders} people were researched in <span className="font-semibold text-moss-green">5 minutes</span>.
              For in-depth data for all of YC, or sales / demographic related use cases involving anyone on the planet, {' '}
              <a href="mailto:rithvik@zatanna.ai" className="text-moss-green hover:underline font-medium">
                email us at rithvik@zatanna.ai
              </a>
              {' '}or{' '}
              <a href="https://calendly.com/tarun-zatanna/30min?month=2026-01" target="_blank" rel="noopener noreferrer" className="text-moss-green hover:underline font-medium">
                book a demo
              </a>.
            </p>
            <div className="flex flex-wrap gap-6 items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-moss-green">{stats.total_founders}</span>
                <span className="text-body text-muted-foreground">Founders</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-info">{stats.education.length}</span>
                <span className="text-body text-muted-foreground">Universities</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-success">{stats.geography.length}</span>
                <span className="text-body text-muted-foreground">Locations</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-moss-green-400">{stats.occupations.length}</span>
                <span className="text-body text-muted-foreground">Roles</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <CompaniesModalClient />
            </div>
          </div>

          {/* Main Content: Search Left, Stats Right */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mb-8">
            {/* Left Sidebar: Search */}
            <div>
              <SearchSection compact />
            </div>

            {/* Right: Charts Grid */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Education Pie Chart */}
                <StatCard title="Education Distribution">
                  <EducationChart education={stats.education} />
                </StatCard>

                {/* Top Interests - Clickable List */}
                <StatCard title="Top Interests">
                  <InterestsListWithModal interests={stats.interests} />
                </StatCard>

                {/* Occupation Distribution with clickable list below */}
                <StatCard title="Top Occupations & Roles">
                  <div className="h-96">
                    <BarChart
                      data={occupationChartData}
                      dataKey="value"
                      color="hsl(var(--moss-green-400))"
                      height={384}
                    />
                  </div>
                </StatCard>

                {/* Top Companies Distribution */}
                <StatCard title="Top Companies">
                  <CompaniesChart companies={stats.companies} />
                </StatCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="accent-section py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-section font-serif mb-4">Explore Individual Profiles</h2>
          <p className="text-body text-muted-foreground mb-8 max-w-2xl mx-auto">
            Dive deep into each founder's background, interests, education, and professional journey. 
            Access full reports with 50+ data sources per person.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/founders" className="btn-primary">
              Browse All Founders
            </Link>
            <Link href="/search" className="btn-outline">
              Search Founders
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto text-center">
          <p className="text-caption text-muted-foreground">
            YC Batch W26 Report by Zatanna • Data from 50+ sources per founder
          </p>
        </div>
      </footer>
    </div>
  )
}

