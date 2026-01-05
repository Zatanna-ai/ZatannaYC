# Backend Integration Requirements for YC Batch Report Frontend

## Overview
The frontend is a Next.js 14 application that needs to connect to your backend API. The backend should be running on **localhost:3000** for local development.

## Base Configuration
- **Base URL**: `http://localhost:3000`
- **API Version**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer token (optional, via `Authorization` header)

## Required API Endpoints

### 1. Get Batch Statistics
**Endpoint**: `GET /api/v1/yc-batch/stats`

**Description**: Returns aggregated statistics across all founders in the batch.

**Request**: No body required

**Response Format**:
```typescript
{
  total_founders: number
  education: Array<{
    university: string
    count: number
    percentage: number
  }>
  interests: Array<{
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
  }>
  geography: Array<{
    location: string
    count: number
    percentage: number
    type: 'current' | 'origin'
  }>
  occupations: Array<{
    title: string
    canonical_name: string
    count: number
    percentage: number
    industry: string
    role_level: string
  }>
  other_stats: {
    avg_interests_per_founder: number
    most_common_combinations: Array<{
      interests: string[]
      count: number
    }>
    platform_distribution: Array<{
      platform: string
      count: number
      percentage: number
    }>
  }
}
```

**Notes**:
- If this endpoint doesn't exist, the frontend will fall back to fetching all founders and calculating stats client-side
- Percentages should be rounded to 1 decimal place (e.g., 23.5)
- Education, interests, geography, and occupations should be sorted by count (descending)
- Top 15 universities, top 20 interests, top 15 locations, top 15 occupations are displayed

---

### 2. Get All Founders
**Endpoint**: `GET /api/v1/yc-batch/founders`

**Description**: Returns a list of all founders in the batch.

**Request**: No body required

**Response Format** (either format works):
```typescript
// Option 1: Direct array
Founder[]

// Option 2: Wrapped in object
{
  founders: Founder[]
}
```

**Founder Type**:
```typescript
{
  person_id: string                    // UUID
  name: string
  linkedin_url?: string
  profile_picture_url?: string
  interests: Interest[]
  occupations: Occupation[]
  universities: string[]
  high_schools: string[]
  locations: string[]
  companies: string[]
  datapoints: DataPoint[]
  research_summary?: string
}
```

**Interest Type**:
```typescript
{
  activity: string                     // e.g., "basketball"
  canonical_name: string               // Normalized name
  intensity: 'casual' | 'enthusiast' | 'serious' | 'professional'
  confidence: number                   // 0-1
  sources: Array<{
    url: string
    datapoint_id: string
    confidence: number
  }>
}
```

**Occupation Type**:
```typescript
{
  title: string                        // e.g., "Software Engineer"
  canonical_name: string              // Normalized occupation
  employer: string | null
  employment_type: string              // "full_time", "founder", etc.
  role_level: string                   // "senior", "director", "c_suite", etc.
  industry: string
  functional_area: string
  status: string                       // "active", "retired", etc.
  confidence: number                   // 0-1
}
```

**DataPoint Type**:
```typescript
{
  url: string
  title?: string
  snippet?: string
  datapoint_id: string
  platform?: string                    // e.g., "LinkedIn", "Twitter"
}
```

---

### 3. Get Individual Founder
**Endpoint**: `GET /api/v1/yc-batch/founders/:personId`

**Description**: Returns detailed information for a single founder.

**Request**: 
- Path parameter: `personId` (UUID string)

**Response Format**:
```typescript
Founder  // Same structure as above
```

**Error Handling**:
- Return 404 if founder not found
- Frontend will handle 404 and show not-found page

---

### 4. Semantic Search
**Endpoint**: `POST /api/v1/discover-yc`

**Description**: Natural language search for founders based on any criteria.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {API_KEY}  // Optional, but recommended
```

**Request Body**:
```typescript
{
  query: string                       // e.g., "CTOs who went to Michigan"
  num_results?: number                // Default: 20
  organization_id?: string            // Optional
}
```

**Response Format**:
```typescript
{
  success: boolean
  data: {
    query: string
    parsed_query?: {
      subject: string
      subject_variations: string[]
      criteria: string[]
      criteria_type: string
    }
    founders_found: number
    top_founders: Array<{
      person_id: string
      name: string
      profile_picture_url?: string
      matched_occupation?: string
      occupation_score?: number
      criteria_score?: number
      combined_score?: number
      matching_entities?: string[]
      subject_datapoints?: DataPoint[]
      criteria_datapoints?: DataPoint[]
    }>
    elapsed_time_ms?: number
  }
}
```

**Notes**:
- This endpoint requires authentication (API key)
- The frontend will use mock data if API is unavailable
- `top_founders` should be sorted by `combined_score` (descending)
- Scores should be between 0 and 1

---

## CORS Configuration

The backend must allow CORS requests from:
- `http://localhost:4000` (frontend dev server)
- `http://localhost:3000` (if needed)

**Required CORS Headers**:
```
Access-Control-Allow-Origin: http://localhost:4000
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Error Handling

The frontend expects standard HTTP status codes:
- **200**: Success
- **404**: Not found (for individual founder)
- **401**: Unauthorized (for protected endpoints)
- **500**: Server error

**Error Response Format** (optional, but helpful):
```typescript
{
  error: string
  message?: string
  statusCode?: number
}
```

---

## Environment Variables

The frontend uses these environment variables (set in `.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-api-key-here  # Optional, for search endpoint
```

---

## Testing Checklist

1. ✅ `GET /api/v1/yc-batch/stats` returns valid BatchStats
2. ✅ `GET /api/v1/yc-batch/founders` returns array of Founder objects
3. ✅ `GET /api/v1/yc-batch/founders/:personId` returns single Founder
4. ✅ `POST /api/v1/discover-yc` returns search results with proper structure
5. ✅ CORS is configured for localhost:4000
6. ✅ All endpoints return proper Content-Type: application/json
7. ✅ Error responses use appropriate HTTP status codes
8. ✅ Authentication works for search endpoint (if implemented)

---

## Frontend Fallback Behavior

The frontend has built-in fallbacks:
- If API is not configured → Uses mock data
- If stats endpoint fails → Fetches all founders and calculates stats client-side
- If any endpoint fails → Falls back to mock data
- All fallbacks are logged to console with warnings

This means the backend can be implemented incrementally - the frontend will work even if some endpoints aren't ready yet.

---

## Example Requests

### Get Stats
```bash
curl http://localhost:3000/api/v1/yc-batch/stats
```

### Get All Founders
```bash
curl http://localhost:3000/api/v1/yc-batch/founders
```

### Get Single Founder
```bash
curl http://localhost:3000/api/v1/yc-batch/founders/123e4567-e89b-12d3-a456-426614174000
```

### Search
```bash
curl -X POST http://localhost:3000/api/v1/discover-yc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"query": "CTOs who went to Stanford", "num_results": 20}'
```

---

## Questions or Issues?

If the backend structure differs from these requirements, please let me know:
- What endpoints are available?
- What's the actual response format?
- Are there any authentication requirements?
- Any CORS issues?

The frontend is flexible and can be adjusted to match your backend structure.

