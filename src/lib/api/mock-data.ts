/**
 * Mock data for YC Batch W26
 * This data is used when the backend API is not available
 */

import { BatchStats, Founder } from './yc-batch'

export const mockFounders: Founder[] = [
  {
    person_id: '1',
    name: 'Alex Chen',
    linkedin_url: 'https://linkedin.com/in/alexchen',
    profile_picture_url: 'https://i.pravatar.cc/150?img=1',
    interests: [
      {
        activity: 'robotics',
        canonical_name: 'Robotics',
        intensity: 'serious',
        confidence: 0.95,
        sources: [{ url: 'https://example.com', datapoint_id: '1', confidence: 0.95 }],
      },
      {
        activity: 'photography',
        canonical_name: 'Photography',
        intensity: 'enthusiast',
        confidence: 0.88,
        sources: [{ url: 'https://example.com', datapoint_id: '2', confidence: 0.88 }],
      },
    ],
    occupations: [
      {
        title: 'CTO',
        canonical_name: 'Chief Technology Officer',
        employer: 'TechCorp',
        employment_type: 'founder',
        role_level: 'c_suite',
        industry: 'Technology',
        functional_area: 'Engineering',
        status: 'active',
        confidence: 0.92,
      },
    ],
    universities: ['Stanford University'],
    high_schools: [],
    locations: ['San Francisco, CA'],
    companies: ['TechCorp', 'Google'],
    datapoints: [
      { url: 'https://linkedin.com/in/alexchen', title: 'LinkedIn Profile', datapoint_id: '1', platform: 'LinkedIn' },
      { url: 'https://twitter.com/alexchen', title: 'Twitter Profile', datapoint_id: '2', platform: 'Twitter' },
    ],
    research_summary: 'Alex is a technology executive with a strong background in robotics and AI.',
  },
  {
    person_id: '2',
    name: 'Sarah Johnson',
    linkedin_url: 'https://linkedin.com/in/sarahjohnson',
    profile_picture_url: 'https://i.pravatar.cc/150?img=5',
    interests: [
      {
        activity: 'basketball',
        canonical_name: 'Basketball',
        intensity: 'professional',
        confidence: 0.90,
        sources: [{ url: 'https://example.com', datapoint_id: '3', confidence: 0.90 }],
      },
      {
        activity: 'travel',
        canonical_name: 'Travel',
        intensity: 'enthusiast',
        confidence: 0.85,
        sources: [{ url: 'https://example.com', datapoint_id: '4', confidence: 0.85 }],
      },
    ],
    occupations: [
      {
        title: 'CEO',
        canonical_name: 'Chief Executive Officer',
        employer: 'StartupXYZ',
        employment_type: 'founder',
        role_level: 'c_suite',
        industry: 'SaaS',
        functional_area: 'Executive',
        status: 'active',
        confidence: 0.95,
      },
    ],
    universities: ['MIT'],
    high_schools: [],
    locations: ['Boston, MA'],
    companies: ['StartupXYZ', 'Microsoft'],
    datapoints: [
      { url: 'https://linkedin.com/in/sarahjohnson', title: 'LinkedIn Profile', datapoint_id: '3', platform: 'LinkedIn' },
    ],
    research_summary: 'Sarah is a serial entrepreneur with a passion for basketball and travel.',
  },
  // Add more mock founders to make stats more interesting
  ...Array.from({ length: 48 }, (_, i) => {
    const universities = ['Stanford University', 'MIT', 'Harvard University', 'UC Berkeley', 'Yale University', 'Princeton University', 'Cornell University', 'University of Michigan', 'Carnegie Mellon', 'Columbia University']
    const interests = [
      { name: 'Robotics', intensity: 'serious' as const },
      { name: 'AI/ML', intensity: 'professional' as const },
      { name: 'Photography', intensity: 'enthusiast' as const },
      { name: 'Basketball', intensity: 'casual' as const },
      { name: 'Travel', intensity: 'enthusiast' as const },
      { name: 'Reading', intensity: 'casual' as const },
      { name: 'Coding', intensity: 'serious' as const },
      { name: 'Music', intensity: 'enthusiast' as const },
      { name: 'Cooking', intensity: 'casual' as const },
      { name: 'Hiking', intensity: 'serious' as const },
    ]
    const occupations = [
      { title: 'CTO', level: 'c_suite' as const, industry: 'Technology' },
      { title: 'CEO', level: 'c_suite' as const, industry: 'SaaS' },
      { title: 'Software Engineer', level: 'senior' as const, industry: 'Technology' },
      { title: 'Product Manager', level: 'director' as const, industry: 'Technology' },
      { title: 'Data Scientist', level: 'senior' as const, industry: 'AI' },
    ]
    const locations = ['San Francisco, CA', 'New York, NY', 'Boston, MA', 'Seattle, WA', 'Austin, TX', 'Los Angeles, CA']
    
    const uni = universities[i % universities.length]
    const interest = interests[i % interests.length]
    const occupation = occupations[i % occupations.length]
    const location = locations[i % locations.length]
    
    return {
      person_id: `${i + 3}`,
      name: `Founder ${i + 3}`,
      linkedin_url: `https://linkedin.com/in/founder${i + 3}`,
      profile_picture_url: `https://i.pravatar.cc/150?img=${i + 10}`,
      interests: [
        {
          activity: interest.name.toLowerCase(),
          canonical_name: interest.name,
          intensity: interest.intensity,
          confidence: 0.8 + Math.random() * 0.15,
          sources: [{ url: 'https://example.com', datapoint_id: `${i}`, confidence: 0.8 }],
        },
      ],
      occupations: [
        {
          title: occupation.title,
          canonical_name: occupation.title,
          employer: `Company${i}`,
          employment_type: 'founder',
          role_level: occupation.level,
          industry: occupation.industry,
          functional_area: 'Engineering',
          status: 'active',
          confidence: 0.85,
        },
      ],
      universities: [uni],
      high_schools: [],
      locations: [location],
      companies: [`Company${i}`],
      datapoints: [
        { url: `https://linkedin.com/in/founder${i + 3}`, title: 'LinkedIn Profile', datapoint_id: `${i}`, platform: 'LinkedIn' },
        { url: `https://twitter.com/founder${i + 3}`, title: 'Twitter Profile', datapoint_id: `${i + 1}`, platform: 'Twitter' },
      ],
      research_summary: `Founder ${i + 3} is an entrepreneur with interests in ${interest.name.toLowerCase()}.`,
    } as Founder
  }),
]

export function generateMockStats(): BatchStats {
  const total = mockFounders.length

  // Calculate education stats
  const universityMap = new Map<string, number>()
  mockFounders.forEach(founder => {
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

  // Calculate interest stats
  const interestMap = new Map<string, { count: number; intensity: Record<string, number> }>()
  mockFounders.forEach(founder => {
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

  // Calculate geography stats
  const locationMap = new Map<string, number>()
  mockFounders.forEach(founder => {
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

  // Calculate occupation stats
  const occupationMap = new Map<string, { count: number; industry: string; role_level: string }>()
  mockFounders.forEach(founder => {
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

  // Calculate other stats
  const totalInterests = mockFounders.reduce((sum, f) => sum + (f.interests?.length || 0), 0)
  const avgInterests = Math.round((totalInterests / total) * 10) / 10

  // Platform distribution
  const platformMap = new Map<string, number>()
  mockFounders.forEach(founder => {
    founder.datapoints?.forEach(dp => {
      const platform = dp.platform || 'Other'
      platformMap.set(platform, (platformMap.get(platform) || 0) + 1)
    })
  })
  const platform_distribution = Array.from(platformMap.entries())
    .map(([platform, count]) => ({
      platform,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    total_founders: total,
    education,
    education_levels: [], // Mock data doesn't have detailed education levels
    interests,
    companies: [],
    geography,
    occupations,
    other_stats: {
      avg_interests_per_founder: avgInterests,
      most_common_combinations: [],
      platform_distribution,
    },
  }
}

