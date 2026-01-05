import { getAllFounders } from '@/lib/api/yc-batch'
import Link from 'next/link'
import Image from 'next/image'

export default async function FoundersPage() {
  let founders
  let error: string | null = null

  try {
    founders = await getAllFounders()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load founders'
    console.error('Error loading founders:', err)
  }

  if (error) {
    return (
      <div className="min-h-screen hero-texture">
        <div className="container mx-auto py-16">
          <div className="archival-card p-8 text-center">
            <h1 className="text-hero font-serif mb-4">Founder Directory</h1>
            <p className="text-body text-error mb-4">Error loading founders: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!founders || founders.length === 0) {
    return (
      <div className="min-h-screen hero-texture">
        <div className="container mx-auto py-16">
          <div className="archival-card p-8 text-center">
            <h1 className="text-hero font-serif mb-4">Founder Directory</h1>
            <p className="text-body text-muted-foreground">No founders found.</p>
          </div>
        </div>
      </div>
    )
  }

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
              <Link href="/" className="btn-outline">
                Home
              </Link>
              <Link href="/search" className="btn-primary">
                Search
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-hero font-serif mb-4">Founder Directory</h1>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-6">
              Browse all {founders.length} founders from YC Batch W26. Click on any founder to view their detailed profile.
            </p>
            <a
              href="https://calendly.com/tarun-zatanna/30min?month=2026-01"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              Book a Demo for Full Data Access
            </a>
            <p className="text-caption text-muted-foreground mt-2">
              Get access to all 50+ data sources per founder
            </p>
          </div>
        </div>
      </section>

      {/* Founders Grid */}
      <section className="content-section py-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {founders.map((founder) => (
              <Link
                key={founder.person_id}
                href={`/founders/${founder.person_id}`}
                className="archival-card p-6 hover:shadow-lg transition-all hover:border-moss-green cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center mb-4">
                  {founder.profile_picture_url ? (
                    <Image
                      src={founder.profile_picture_url}
                      alt={founder.name}
                      width={80}
                      height={80}
                      className="rounded-full mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-cream-200 flex items-center justify-center mb-4">
                      <span className="text-2xl font-serif text-muted-foreground">
                        {founder.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h3 className="text-subhead font-serif mb-2 group-hover:text-moss-green transition-colors">
                    {founder.name}
                  </h3>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  {/* University */}
                  {founder.universities && founder.universities.length > 0 && (
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Education</p>
                      <div className="flex flex-wrap gap-1">
                        {founder.universities.slice(0, 2).map((uni, idx) => (
                          <span
                            key={idx}
                            className="badge-info text-xs"
                          >
                            {uni.length > 20 ? uni.substring(0, 20) + '...' : uni}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Role */}
                  {founder.occupations && founder.occupations.length > 0 && (
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Role</p>
                      <p className="text-ui font-medium">
                        {founder.occupations[0].title}
                      </p>
                    </div>
                  )}

                  {/* Top Interests */}
                  {founder.interests && founder.interests.length > 0 && (
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {founder.interests.slice(0, 3).map((interest, idx) => (
                          <span
                            key={idx}
                            className="badge-success text-xs"
                          >
                            {interest.canonical_name || interest.activity}
                          </span>
                        ))}
                        {founder.interests.length > 3 && (
                          <span className="text-caption text-muted-foreground">
                            +{founder.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {founder.locations && founder.locations.length > 0 && (
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Location</p>
                      <p className="text-ui">{founder.locations[0]}</p>
                    </div>
                  )}

                  {/* Previous Companies */}
                  {founder.companies && founder.companies.length > 0 && (
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Companies</p>
                      <div className="flex flex-wrap gap-1">
                        {founder.companies.slice(0, 3).map((company, idx) => (
                          <span key={idx} className="badge-info text-xs">
                            {company.length > 25 ? company.substring(0, 25) + '...' : company}
                          </span>
                        ))}
                        {founder.companies.length > 3 && (
                          <span className="text-caption text-muted-foreground">
                            +{founder.companies.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-ui text-moss-green group-hover:underline">
                    View Profile →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="accent-section py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-section font-serif mb-4">Need Full Data Access?</h2>
          <p className="text-body text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get complete access to all 50+ data sources per founder, detailed research summaries, 
            and comprehensive background information for all YC Batch W26 founders.
          </p>
          <a
            href="https://calendly.com/tarun-zatanna/30min?month=2026-01"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Book a Demo
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto text-center">
          <p className="text-caption text-muted-foreground">
            YC Batch W26 Report by Zatanna • {founders.length} founders
          </p>
        </div>
      </footer>
    </div>
  )
}

