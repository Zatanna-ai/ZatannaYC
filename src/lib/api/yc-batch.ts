/**
 * API client for YC Batch data
 *
 * Updated to use real backend API endpoints:
 * - /api/v1/yc-dashboard/stats - Dashboard statistics
 * - /api/v1/yc-founders - Founders list
 * - /api/v1/yc-founders/:id - Individual founder details
 */

// Default to staging API for production, localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://sgapi.zatanna.ai' : 'http://localhost:3000')
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

export interface Founder {
  person_id: string
  name: string
  linkedin_url?: string
  profile_picture_url?: string
  linkedin_bio?: string
  interests: Interest[]
  occupations: Occupation[]
  universities: string[]
  high_schools: string[]
  locations: string[]
  companies: string[]
  datapoints: DataPoint[]
  research_summary?: string
}

export interface Interest {
  activity: string
  canonical_name: string
  intensity: 'casual' | 'enthusiast' | 'serious' | 'professional'
  confidence: number
  sources: Array<{
    url: string
    datapoint_id: string
    confidence: number
  }>
}

export interface Occupation {
  title: string
  canonical_name: string
  employer: string | null
  employment_type: string
  role_level: string
  industry: string
  functional_area: string
  status: string
  confidence: number
}

export interface DataPoint {
  url: string
  title?: string
  snippet?: string
  datapoint_id: string
  platform?: string
}

export interface BatchStats {
  total_founders: number
  education: {
    university: string
    count: number
    percentage: number
  }[]
  interests: {
    activity: string
    canonical_name: string
    count: number
    percentage: number
    intensity_breakdown: {
      casual: number
      enthusiast: number
      serious: number
      professional: number
    }
  }[]
  geography: {
    location: string
    count: number
    percentage: number
    type: 'current' | 'origin'
  }[]
  occupations: {
    title: string
    canonical_name: string
    count: number
    percentage: number
    industry: string
    role_level: string
  }[]
  companies: {
    name: string
    count: number
    percentage: number
  }[]
  other_stats: {
    avg_interests_per_founder: number
    most_common_combinations: Array<{
      interests: string[]
      count: number
    }>
    platform_distribution: {
      platform: string
      count: number
      percentage: number
    }[]
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }

  console.log('[YC Batch API] Making request to:', url, { method: options.method || 'GET' })
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // Disable Next.js caching for API calls to ensure fresh data
      cache: 'no-store',
    } as RequestInit)

    console.log('[YC Batch API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[YC Batch API] API error response:', errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[YC Batch API] Response data received')
    return data
  } catch (error) {
    console.error('[YC Batch API] Fetch error:', error)
    // Re-throw to trigger fallback to mock data
    throw error
  }
}

/**
 * Transform API founder data to match our Founder interface
 */
function transformFounderData(apiFounder: any): Founder {
  const entities = apiFounder.entities || {}

  // Extract interests from entities (interest type)
  const interests: Interest[] = []
  if (entities.interest && Array.isArray(entities.interest)) {
    entities.interest.forEach((interest: any) => {
      // Map intensity from backend format (e.g., "Casual") to lowercase format
      let intensity: 'casual' | 'enthusiast' | 'serious' | 'professional' = 'casual'
      if (interest.intensity) {
        const intensityLower = interest.intensity.toLowerCase()
        if (['casual', 'enthusiast', 'serious', 'professional'].includes(intensityLower)) {
          intensity = intensityLower as 'casual' | 'enthusiast' | 'serious' | 'professional'
        }
      }
      
      interests.push({
        activity: interest.name,
        canonical_name: interest.name,
        intensity: intensity,
        confidence: interest.confidence || 0.5,
        sources: interest.source_url ? [{
          url: interest.source_url,
          datapoint_id: '',
          confidence: interest.confidence || 0.5
        }] : []
      })
    })
  }

  // Extract occupations from entities (occupation type)
  const occupations: Occupation[] = []
  if (entities.occupation && Array.isArray(entities.occupation)) {
    entities.occupation.forEach((occ: any) => {
      occupations.push({
        title: occ.name,
        canonical_name: occ.name,
        employer: apiFounder.employer || null,
        employment_type: 'current',
        role_level: 'unknown',
        industry: 'unknown',
        functional_area: 'unknown',
        status: 'active',
        confidence: occ.confidence || 0.5
      })
    })
  } else if (apiFounder.occupation) {
    // Fallback to person.occupation field
    occupations.push({
      title: apiFounder.occupation,
      canonical_name: apiFounder.occupation,
      employer: apiFounder.employer || null,
      employment_type: 'current',
      role_level: 'unknown',
      industry: 'unknown',
      functional_area: 'unknown',
      status: 'active',
      confidence: 1.0
    })
  }

  // Extract universities
  const universities = entities.university && Array.isArray(entities.university)
    ? entities.university.map((u: any) => u.name)
    : []

  // Extract companies - use previous_companies from API if available, otherwise extract from entities
  const companies = apiFounder.previous_companies && Array.isArray(apiFounder.previous_companies)
    ? apiFounder.previous_companies.map((c: any) => typeof c === 'string' ? c : c.name)
    : (entities.company && Array.isArray(entities.company)
      ? entities.company.map((c: any) => c.name)
      : [])
  
  // Add current company if it's different from previous companies
  const currentCompany = apiFounder.current_company || apiFounder.employer
  if (currentCompany && !companies.includes(currentCompany)) {
    companies.push(currentCompany)
  }

  // Extract locations
  const locations = entities.location && Array.isArray(entities.location)
    ? entities.location.map((l: any) => l.name)
    : (apiFounder.location ? [apiFounder.location] : [])

  // Transform datapoints
  const datapoints: DataPoint[] = (apiFounder.datapoints || []).map((dp: any) => ({
    url: dp.url,
    title: dp.title || null,
    snippet: dp.snippet || null,
    datapoint_id: dp.id || dp.datapoint_id || '',
    platform: dp.type || dp.platform_type || dp.platform
  }))

  return {
    person_id: apiFounder.id,
    name: apiFounder.name,
    linkedin_url: apiFounder.social_links?.linkedin || apiFounder.linkedin_url || null,
    profile_picture_url: apiFounder.profile_picture_url || null,
    linkedin_bio: apiFounder.linkedin_bio || null,
    interests,
    occupations,
    universities,
    high_schools: [], // Not currently tracked in API
    locations,
    companies,
    datapoints,
    research_summary: apiFounder.research_summary || null
  }
}

/**
 * Get top companies that founders have worked at
 */
export async function getTopCompanies(limit: number = 50): Promise<{
  companies: Array<{
    id: string
    name: string
    founder_count: number
    percentage: number
  }>
  total_founders: number
}> {
  try {
    const response = await fetchAPI(`/api/v1/yc-dashboard/companies?limit=${limit}`)
    
    if (!response.success) {
      console.error('[YC Batch API] API returned unsuccessful response:', response)
      throw new Error('API returned unsuccessful response')
    }

    return response.data
  } catch (error) {
    console.error('[YC Batch API] Error fetching companies:', error)
    throw error
  }
}

/**
 * Get batch statistics from the dashboard API
 */
export async function getBatchStats(): Promise<BatchStats> {
  try {
    console.log('[YC Batch API] Fetching dashboard stats from:', `${API_BASE_URL}/api/v1/yc-dashboard/stats?limit=20`)
    // Use the new dashboard stats endpoint
    const response = await fetchAPI('/api/v1/yc-dashboard/stats?limit=20')
    console.log('[YC Batch API] Dashboard stats response:', response.success ? 'success' : 'failed', response)

    if (!response.success) {
      console.error('[YC Batch API] API returned unsuccessful response:', response)
      throw new Error('API returned unsuccessful response')
    }

    const data = response.data
    const total = data.total_founders

    // Transform top schools to education format with percentages
    const education = data.top_schools.map((school: any) => ({
      university: school.name,
      count: school.count,
      percentage: Math.round((school.count / total) * 100 * 10) / 10
    }))

    // Transform top interests from API to match frontend interface
    const interests = (data.top_interests || []).map((interest: any) => ({
      activity: interest.name,
      canonical_name: interest.name,
      count: interest.count,
      percentage: Math.round((interest.count / total) * 100 * 10) / 10,
      intensity_breakdown: {
        casual: 0, // Not available from aggregated data
        enthusiast: 0,
        serious: 0,
        professional: 0,
      }
    }))

    // Transform top companies from API
    const companies = (data.top_companies || []).map((company: any) => ({
      name: company.name,
      count: company.count,
      percentage: Math.round((company.count / total) * 100 * 10) / 10
    }))

    // For geography and occupations, we still need to fetch founders
    // or create additional backend endpoints for these specific analytics
    try {
      const founders = await getAllFounders()
      const calculatedStats = calculateStatsFromFounders(founders)

      // Merge with dashboard stats, using API values when available
      return {
        total_founders: data.total_founders,
        education, // Use dashboard data for education
        interests, // Use dashboard data for interests
        companies, // Use dashboard data for companies
        geography: calculatedStats.geography,
        occupations: calculatedStats.occupations,
        other_stats: {
          ...calculatedStats.other_stats,
          // Use dashboard API value if available, otherwise use calculated value
          avg_interests_per_founder: data.avg_interests_per_founder !== undefined 
            ? data.avg_interests_per_founder 
            : calculatedStats.other_stats.avg_interests_per_founder
        }
      }
    } catch (error) {
      // If we can't get founders, return partial stats with interests from API
      return {
        total_founders: data.total_founders,
        education,
        interests, // Use dashboard data for interests
        companies, // Use dashboard data for companies
        geography: [],
        occupations: [],
        other_stats: {
          // Use dashboard API value if available
          avg_interests_per_founder: data.avg_interests_per_founder !== undefined 
            ? data.avg_interests_per_founder 
            : 0,
          most_common_combinations: [],
          platform_distribution: []
        }
      }
    }
  } catch (error) {
    console.error('[YC Batch API] Error fetching dashboard stats:', error)
    console.error('[YC Batch API] API_BASE_URL:', API_BASE_URL)
    console.error('[YC Batch API] NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET')
    console.error('[YC Batch API] NODE_ENV:', process.env.NODE_ENV)
    console.error('[YC Batch API] Full error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    console.warn('[YC Batch API] Dashboard stats API not available, falling back to mock data')
    // If API is completely unavailable, use mock data
    const { generateMockStats } = await import('./mock-data')
    return generateMockStats()
  }
}

/**
 * Get all founders from the API
 */
export async function getAllFounders(): Promise<Founder[]> {
  try {
    // Fetch up to 200 founders (max limit)
    const response = await fetchAPI('/api/v1/yc-founders?limit=200&offset=0')

    if (!response.success) {
      throw new Error('API returned unsuccessful response')
    }

    // Transform each founder from the list response
    const founders = (response.data.founders || []).map((founder: any) => {
      // Extract companies - use companies array if available, otherwise use previous_companies + current_company
      const companies = founder.companies && Array.isArray(founder.companies)
        ? founder.companies
        : [
            ...(founder.previous_companies && Array.isArray(founder.previous_companies) 
              ? founder.previous_companies.map((c: any) => typeof c === 'string' ? c : c.name)
              : []),
            ...(founder.current_company ? [founder.current_company] : [])
          ].filter(Boolean)

      // Transform universities from API response
      const universities = founder.universities && Array.isArray(founder.universities)
        ? founder.universities
        : []

      // Transform interests from API response
      const interests: Interest[] = (founder.interests && Array.isArray(founder.interests))
        ? founder.interests.map((interestName: string) => ({
            activity: interestName,
            canonical_name: interestName,
            intensity: 'casual' as const,
            confidence: 0.5,
            sources: []
          }))
        : []

      // For the list view, we have limited data - create a minimal founder object
      return {
        person_id: founder.id,
        name: founder.name,
        linkedin_url: founder.linkedin_url || null,
        profile_picture_url: founder.profile_picture_url || null,
        interests: interests,
        occupations: founder.current_role ? [{
          title: founder.current_role,
          canonical_name: founder.current_role,
          employer: founder.current_company || null,
          employment_type: 'current',
          role_level: 'unknown',
          industry: 'unknown',
          functional_area: 'unknown',
          status: 'active',
          confidence: 1.0
        }] : [],
        universities: universities,
        high_schools: [],
        locations: founder.location ? [founder.location] : [],
        companies: companies,
        datapoints: [],
        research_summary: null
      }
    })

    return founders
  } catch (error) {
    // If API is unavailable, use mock data
    console.warn('Founders API unavailable, using mock founders data', error)
    const { mockFounders } = await import('./mock-data')
    return mockFounders
  }
}

/**
 * Get detailed founder information by ID
 */
export async function getFounderById(personId: string): Promise<Founder> {
  try {
    const response = await fetchAPI(`/api/v1/yc-founders/${personId}`)

    if (!response.success) {
      throw new Error('API returned unsuccessful response')
    }

    // Transform the detailed founder data
    return transformFounderData(response.data)
  } catch (error) {
    // If API is unavailable, use mock data
    console.warn('Founder details API unavailable, using mock founder data')
    const { mockFounders } = await import('./mock-data')
    const founder = mockFounders.find(f => f.person_id === personId)
    if (!founder) {
      throw new Error(`Founder with ID ${personId} not found`)
    }
    return founder
  }
}

/**
 * Calculate statistics from a list of founders
 * Used when we have founder data but need to compute aggregates
 */
function calculateStatsFromFounders(founders: Founder[]): BatchStats {
  const total = founders.length

  // Calculate education stats
  const universityMap = new Map<string, number>()
  founders.forEach(founder => {
    founder.universities?.forEach(uni => {
      universityMap.set(uni, (universityMap.get(uni) || 0) + 1)
    })
  })
  const education = Array.from(universityMap.entries())
    .map(([university, count]) => ({
      university,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Calculate interest stats
  const interestMap = new Map<string, { count: number; intensity: Record<string, number> }>()
  founders.forEach(founder => {
    founder.interests?.forEach(interest => {
      const key = interest.canonical_name || interest.activity
      const existing = interestMap.get(key) || { count: 0, intensity: { casual: 0, enthusiast: 0, serious: 0, professional: 0 } }
      existing.count++
      existing.intensity[interest.intensity] = (existing.intensity[interest.intensity] || 0) + 1
      interestMap.set(key, existing)
    })
  })
  const interests = Array.from(interestMap.entries())
    .map(([canonical_name, data]) => ({
      activity: canonical_name,
      canonical_name,
      count: data.count,
      percentage: Math.round((data.count / total) * 100 * 10) / 10,
      intensity_breakdown: {
        casual: data.intensity.casual || 0,
        enthusiast: data.intensity.enthusiast || 0,
        serious: data.intensity.serious || 0,
        professional: data.intensity.professional || 0,
      },
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Calculate geography stats
  const locationMap = new Map<string, number>()
  founders.forEach(founder => {
    founder.locations?.forEach(loc => {
      locationMap.set(loc, (locationMap.get(loc) || 0) + 1)
    })
  })
  const geography = Array.from(locationMap.entries())
    .map(([location, count]) => ({
      location,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
      type: 'current' as const,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Calculate occupation stats
  const occupationMap = new Map<string, { count: number; industry: string; role_level: string }>()
  founders.forEach(founder => {
    founder.occupations?.forEach(occ => {
      const key = occ.canonical_name || occ.title
      const existing = occupationMap.get(key) || { count: 0, industry: occ.industry, role_level: occ.role_level }
      existing.count++
      occupationMap.set(key, existing)
    })
  })
  const occupations = Array.from(occupationMap.entries())
    .map(([canonical_name, data]) => ({
      title: canonical_name,
      canonical_name,
      count: data.count,
      percentage: Math.round((data.count / total) * 100 * 10) / 10,
      industry: data.industry,
      role_level: data.role_level,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Calculate other stats
  const totalInterests = founders.reduce((sum, f) => sum + (f.interests?.length || 0), 0)
  const avgInterests = totalInterests > 0 ? Math.round((totalInterests / total) * 10) / 10 : 0

  // Platform distribution
  const platformMap = new Map<string, number>()
  founders.forEach(founder => {
    founder.datapoints?.forEach(dp => {
      try {
        const platform = dp.platform || new URL(dp.url).hostname.replace('www.', '')
        platformMap.set(platform, (platformMap.get(platform) || 0) + 1)
      } catch {
        // Skip invalid URLs
      }
    })
  })
  const platform_distribution = Array.from(platformMap.entries())
    .map(([platform, count]) => ({
      platform,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Companies are calculated from API, not from founders list
  const companies: Array<{ name: string; count: number; percentage: number }> = []

  return {
    total_founders: total,
    education,
    interests,
    companies,
    geography,
    occupations,
    other_stats: {
      avg_interests_per_founder: avgInterests,
      most_common_combinations: [], // Would need more complex logic
      platform_distribution,
    },
  }
}
