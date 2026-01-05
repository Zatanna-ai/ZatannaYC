import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen hero-texture">
      <div className="container mx-auto py-16">
        <div className="archival-card p-8 text-center max-w-2xl mx-auto">
          <h1 className="text-hero font-serif mb-4">Founder Not Found</h1>
          <p className="text-body text-muted-foreground mb-8">
            The founder you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/founders" className="btn-primary">
            Back to Directory
          </Link>
        </div>
      </div>
    </div>
  )
}

