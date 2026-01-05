# Backend Endpoint Structure - Discover YC

## Current Backend Implementation

Please fill in the details below about your existing `/api/v1/discover-yc` endpoint:

### Endpoint Details
- **URL**: `POST /api/v1/discover-yc` (or what is it actually?)
- **Base URL**: `http://localhost:3000`
- **Authentication**: 
  - [ ] Required (Bearer token)
  - [ ] Optional
  - [ ] Not required
  - Header format: `Authorization: Bearer {token}` or other?

### Request Structure
**Current request body format:**
```json
{
  // What fields does your endpoint expect?
  // Example:
  "query": "string",
  "num_results": number,
  "organization_id": "string",
  // Add all actual fields here
}
```

**Required fields:**
- 

**Optional fields:**
- 

### Response Structure
**Current response format:**
```json
{
  // What does your endpoint actually return?
  // Paste actual response structure here
}
```

**Example actual response:**
```json
{
  // Paste a real response example here
}
```

### Response Fields
- `success`: boolean? (or is it different?)
- `data`: object? (or is it at root level?)
- `top_founders`: array? (or is it named differently?)
- `founders_found`: number? (or `count` or `total`?)
- `parsed_query`: object? (what structure?)
- `elapsed_time_ms`: number? (or different field name?)

### Founder Object in Results
**What fields does each founder in the results have?**
```typescript
{
  person_id: string?        // or id? or _id?
  name: string?
  profile_picture_url: string?
  matched_occupation: string?
  occupation_score: number?
  criteria_score: number?
  combined_score: number?
  matching_entities: string[]?
  // What other fields?
}
```

### Error Responses
**What format do errors use?**
```json
{
  // Paste error response structure
}
```

**HTTP Status Codes:**
- Success: 200? 201?
- Not Found: 404?
- Unauthorized: 401?
- Server Error: 500?

### CORS
- Is CORS configured?
- What origins are allowed?
- Any special headers needed?

---

## Instructions
Please fill in the above sections with your actual backend endpoint structure, then I'll update the frontend to match exactly.

