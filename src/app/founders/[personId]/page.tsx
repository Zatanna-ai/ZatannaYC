import { getFounderById } from '@/lib/api/yc-batch'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    personId: string
  }
}

export default async function FounderProfilePage({ params }: PageProps) {
  const founder = await getFounderById(params.personId)

  if (!founder) {
    notFound()
  }

  return (
    <div className="min-h-screen hero-texture">
      <header className="border-b border-border">
        <div className="container mx-auto py-6">
          <nav className="flex items-center justify-between">
            <a href="https://zatanna.ai" target="_blank" rel="noopener noreferrer" className="text-section font-serif hover:text-moss-green transition-colors">
              Zatanna
            </a>
            <div className="flex gap-4">
              <Link href="/founders" className="btn-outline">
                Back to Directory
              </Link>
              <Link href="/search" className="btn-primary">
                Search
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="py-12">
        <div className="container mx-auto">
          <div className="archival-card p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {founder.profile_picture_url ? (
                <Image
                  src={founder.profile_picture_url}
                  alt={founder.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-gray-cream-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl font-serif text-muted-foreground">
                    {founder.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-hero font-serif mb-2">{founder.name}</h1>
                {founder.linkedin_url && (
                  <a
                    href={founder.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline inline-block"
                  >
                    View LinkedIn
                  </a>
                )}
              </div>
            </div>

            {founder.linkedin_bio && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-section font-serif mb-4">Bio</h2>
                <p className="text-body text-foreground leading-relaxed">
                  {founder.linkedin_bio}
                </p>
              </div>
            )}

            {((founder.universities && founder.universities.length > 0) ||
             (founder.high_schools && founder.high_schools.length > 0)) && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-section font-serif mb-4">Education</h2>
                <div className="space-y-2">
                  {founder.universities && founder.universities.map((uni: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="badge-info">{uni}</span>
                    </div>
                  ))}
                  {founder.high_schools && founder.high_schools.map((hs: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="badge-info text-sm">{hs}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {founder.companies && founder.companies.length > 0 && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-section font-serif mb-4">Previous Companies</h2>
                <div className="flex flex-wrap gap-2">
                  {founder.companies.map((company: string, idx: number) => (
                    <span key={idx} className="badge-info">
                      {company}
                    </span>
                  ))}
                </div>
                <p className="text-caption text-muted-foreground mt-3">
                  Companies this founder has worked for or been associated with
                </p>
              </div>
            )}

            {founder.interests && founder.interests.length > 0 && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-section font-serif mb-4">Interests & Hobbies</h2>
                <div className="flex flex-wrap gap-2">
                  {founder.interests.map((interest: any, idx: number) => (
                    <div key={idx} className="archival-card p-3 inline-block">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-success">{interest.canonical_name || interest.activity}</span>
                        <span className="text-caption text-muted-foreground">
                          ({interest.intensity})
                        </span>
                      </div>
                      <p className="text-caption text-muted-foreground">
                        Confidence: {Math.round(interest.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {founder.locations && founder.locations.length > 0 && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-section font-serif mb-4">Location</h2>
                <div className="flex flex-wrap gap-2">
                  {founder.locations.map((loc: string, idx: number) => (
                    <span key={idx} className="badge-info">{loc}</span>
                  ))}
                </div>
              </div>
            )}

            {founder.datapoints && founder.datapoints.length > 0 && (
              <div className="mb-8">
                <h2 className="text-section font-serif mb-4">Sample Data Sources</h2>
                <p className="text-body text-muted-foreground mb-4">
                  Showing {Math.min(5, founder.datapoints.length)} of {founder.datapoints.length}+ data sources
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {founder.datapoints.slice(0, 5).map((dp: any, idx: number) => (
                    <a
                      key={idx}
                      href={dp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="archival-card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {dp.platform && (
                            <span className="badge-info text-xs mb-2 inline-block">
                              {dp.platform}
                            </span>
                          )}
                          {dp.title && (
                            <p className="text-ui font-medium mb-1">{dp.title}</p>
                          )}
                          {dp.snippet && (
                            <p className="text-caption text-muted-foreground line-clamp-2">
                              {dp.snippet}
                            </p>
                          )}
                        </div>
                        <span className="text-caption text-moss-green">→</span>
                      </div>
                    </a>
                  ))}
                </div>
                {founder.datapoints.length > 5 && (
                  <p className="text-body text-muted-foreground mt-4 text-center">
                    +{founder.datapoints.length - 5} more data sources available
                  </p>
                )}
              </div>
            )}

            <div className="archival-card p-6 bg-moss-green/5 border-2 border-moss-green/20 mt-8">
              <h3 className="text-subhead font-serif mb-2">Get Full Report</h3>
              <p className="text-body text-muted-foreground mb-4">
                Access all {founder.datapoints?.length || 50}+ data sources, detailed research,
                and comprehensive background information for this founder and all YC Batch W26 founders.
              </p>
              <a
                href="https://calendly.com/tarun-zatanna/30min?month=2026-01"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Book a Demo for Full Data Access
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto text-center">
          <Link href="/founders" className="btn-outline">
            Back to Directory
          </Link>
        </div>
      </footer>
    </div>
  )
}
