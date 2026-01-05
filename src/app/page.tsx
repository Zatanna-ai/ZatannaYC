import { getBatchStats } from '@/lib/api/yc-batch'
import { StatCard } from '@/components/StatCard'
import { BarChart, PieChart } from '@/components/charts'
import { SearchSection } from '@/components/SearchSection'
import { CompaniesModalClient } from '@/components/CompaniesModalClient'
import { CompaniesChart } from '@/components/CompaniesChart'
import { EducationChart } from '@/components/EducationChart'
import { GeographyChart } from '@/components/GeographyChart'
import { InterestsOccupationsSection } from '@/components/InterestsOccupationsSection'
import Link from 'next/link'

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
  const topInterests = stats.interests.slice(0, 10).map(item => ({
    name: item.canonical_name.length > 20 ? item.canonical_name.substring(0, 20) + '...' : item.canonical_name,
    value: item.percentage,
    fullName: item.canonical_name,
  }))


  const occupationChartData = stats.occupations.slice(0, 10).map(item => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    value: item.count, // Use count for bar chart sizing
    percentage: item.percentage, // Store original percentage for tooltip display
    fullName: item.title,
  }))

  const educationPieData = stats.education.slice(0, 8).map(item => ({
    name: item.university,
    value: item.percentage,
  }))

  const companiesChartData = stats.companies.slice(0, 10).map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    value: item.percentage,
    fullName: item.name,
  }))

  const companiesPieData = stats.companies.slice(0, 8).map(item => ({
    name: item.name,
    value: item.percentage,
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
              For in-depth data for all of YC, or sales related use cases involving anyone on the planet, {' '}
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

                {/* Geographic Distribution */}
                <StatCard title="Geographic Distribution">
                  <GeographyChart geography={stats.geography} />
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

      {/* Top Interests & Additional Insights Section */}
      <section className="content-section py-12 border-t border-border">
        <div className="container mx-auto">
          <StatCard title="Top Interests & Additional Insights">
            <div className="space-y-4">
              {/* Top row: Interests list and Average Interests side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Top Interests List - Now Clickable */}
                <InterestsOccupationsSection
                  interests={stats.interests}
                  occupations={stats.occupations}
                />

                {/* Additional Insights */}
                <div className="space-y-4">
                  {/* Average Interests */}
                  <div className="bg-moss-green/5 rounded-lg p-3 border border-moss-green/20">
                    <h4 className="text-sm font-serif text-moss-green-600 mb-0.5">Average Interests</h4>
                    <p className="text-2xl font-serif font-bold text-moss-green">{stats.other_stats.avg_interests_per_founder}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">per founder</p>
                  </div>

                  {/* Top Platforms */}
                  <div>
                    <h4 className="text-ui font-serif text-muted-foreground mb-2">Top Platforms</h4>
                    <div className="space-y-1.5">
                      {stats.other_stats.platform_distribution.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-body items-center py-1 px-2 rounded hover:bg-gray-cream-100 transition-colors">
                          <span className="text-muted-foreground truncate mr-2 text-sm">{item.platform}</span>
                          <span className="font-semibold whitespace-nowrap text-sm">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StatCard>
        </div>
      </section>

      {/* Interest Intensity Breakdown */}
      <section className="section-legal content-section py-12">
        <div className="container mx-auto">
          <h2 className="text-section font-serif mb-8">Interest Intensity Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.interests.slice(0, 8).map((interest, idx) => (
              <div key={idx} className="archival-card p-4">
                <h4 className="text-ui font-serif mb-2">{interest.canonical_name}</h4>
                <div className="space-y-1 text-caption">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Casual:</span>
                    <span>{interest.intensity_breakdown.casual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enthusiast:</span>
                    <span>{interest.intensity_breakdown.enthusiast}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serious:</span>
                    <span>{interest.intensity_breakdown.serious}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Professional:</span>
                    <span>{interest.intensity_breakdown.professional}</span>
                  </div>
                </div>
              </div>
            ))}
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

