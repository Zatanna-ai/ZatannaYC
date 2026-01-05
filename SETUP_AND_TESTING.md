# ZatannaYC - Setup and Testing Guide

The ZatannaYC frontend has been updated to use the real backend API instead of mock data.

## 🎯 What Changed

### Updated API Client
**File:** `src/lib/api/yc-batch.ts`

The API client now calls these real backend endpoints:
- `GET /api/v1/yc-dashboard/stats` - Dashboard statistics (schools, companies, founder counts)
- `GET /api/v1/yc-founders` - List of all founders (paginated)
- `GET /api/v1/yc-founders/:id` - Individual founder details

### Data Transformation
Added `transformFounderData()` function that converts the backend API response format to match the frontend's expected `Founder` interface, including:
- Extracting interests, occupations, universities from the entities structure
- Mapping social links (LinkedIn, Twitter, etc.)
- Converting datapoints to the frontend format
- Handling profile pictures and locations

### Graceful Fallback
If the backend API is unavailable, the app automatically falls back to mock data so development can continue.

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd /Users/rithvikvanga/Desktop/Zatanna/monorepo_parent/monorepo/backend
npm run dev
```

The backend should start on `http://localhost:3000`

### 2. Start the ZatannaYC Frontend

```bash
cd /Users/rithvikvanga/Desktop/Zatanna/monorepo_parent/ZatannaYC
npm run dev
```

The frontend should start on `http://localhost:3001` (or next available port)

### 3. Verify Connection

Open your browser to the ZatannaYC frontend. Check the console:
- ✅ If you see API responses with real data → Backend is connected!
- ⚠️ If you see "API unavailable, using mock data" → Backend isn't running or unreachable

---

## 🧪 Testing Each Page

### Dashboard / Home Page
**URL:** `http://localhost:3001/`

**What it shows:**
- Total founders count (from database)
- Top universities (from real entity data)
- Top companies (from real entity data)
- Education distribution chart
- Interest statistics
- Geographic distribution
- Occupation breakdown

**API Calls Made:**
1. `GET /api/v1/yc-dashboard/stats?limit=20` - Main dashboard stats
2. `GET /api/v1/yc-founders?limit=200` - All founders (for calculating additional stats)

**Test:**
```bash
# Test the dashboard stats endpoint directly
curl http://localhost:3000/api/v1/yc-dashboard/stats?limit=20
```

### Founders Directory
**URL:** `http://localhost:3001/founders`

**What it shows:**
- Grid of all founders (4 columns)
- Profile pictures
- Names and roles
- Current companies
- LinkedIn links

**API Calls Made:**
1. `GET /api/v1/yc-founders?limit=200&offset=0` - First 200 founders

**Test:**
```bash
# Test the founders list endpoint
curl http://localhost:3000/api/v1/yc-founders?limit=10
```

### Individual Founder Profile
**URL:** `http://localhost:3001/founders/[person-id]`

**What it shows:**
- Full profile with profile picture
- Research summary
- Education (universities)
- Professional background (companies, roles)
- Interests (if available in entities)
- Location
- Social media links
- Data sources (sample of datapoints)

**API Calls Made:**
1. `GET /api/v1/yc-founders/:id` - Detailed founder profile

**Test:**
```bash
# Replace FOUNDER_ID with a real ID from your database
curl http://localhost:3000/api/v1/yc-founders/FOUNDER_ID
```

### Search Page
**URL:** `http://localhost:3001/search`

**What it shows:**
- Natural language search interface
- Search results with matching founders
- Confidence scores and entity matches

**API Calls Made:**
1. `POST /api/v1/discover-yc` - Search query (already integrated)

**Note:** The search page already uses the real API and doesn't need updates.

---

## 🔍 Debugging

### Check if Backend is Running

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"OK","timestamp":"...","database":"connected"}
```

### Check API Responses

Open browser DevTools → Network tab → Filter by "Fetch/XHR"

You should see requests to:
- `/api/v1/yc-dashboard/stats`
- `/api/v1/yc-founders`
- `/api/v1/yc-founders/[id]`

### Common Issues

**Issue:** "API unavailable, using mock data" in console

**Solutions:**
1. Make sure backend is running on port 3000
2. Check `NEXT_PUBLIC_API_URL` environment variable (should be `http://localhost:3000`)
3. Verify CORS is enabled in backend (already configured for localhost:3001)

**Issue:** Empty data or no founders showing

**Solutions:**
1. Check if YC founders are in the database:
   ```bash
   # From backend directory
   npm run db:check-yc-founders
   ```
2. Verify the YC organization ID in the database matches `78e0a525-cc65-44c1-be05-93bb55247fde`
3. Check backend logs for any errors

**Issue:** Profile pictures not loading

**Solutions:**
1. Profile pictures come from external URLs (LinkedIn, etc.)
2. Some images may be blocked by CORS - this is expected
3. Backend has an image proxy at `/image-proxy` if needed

---

## 📊 Expected Data Flow

### Dashboard Load
```
User opens homepage
    ↓
Frontend calls getBatchStats()
    ↓
GET /api/v1/yc-dashboard/stats
    ↓
Backend queries database:
  - person table (count)
  - datapoint_entity_index (schools, companies)
    ↓
Returns stats to frontend
    ↓
Frontend also calls getAllFounders() for additional stats
    ↓
Calculates interests, geography, occupations from founder data
    ↓
Displays dashboard with charts
```

### Founder Directory Load
```
User opens /founders
    ↓
Frontend calls getAllFounders()
    ↓
GET /api/v1/yc-founders?limit=200
    ↓
Backend queries:
  - person table (basic info)
  - person_datapoints (profile pictures)
  - datapoint_entity_index (LinkedIn URLs, roles)
    ↓
Returns list of founders
    ↓
Frontend displays grid of founder cards
```

### Founder Profile Load
```
User clicks on a founder
    ↓
Frontend calls getFounderById(id)
    ↓
GET /api/v1/yc-founders/:id
    ↓
Backend queries:
  - person table (full profile)
  - person_datapoints (all datapoints)
  - datapoint_entity_index (all entities - schools, companies, interests)
    ↓
Returns complete founder profile
    ↓
Frontend displays detailed profile page
```

---

## 🎨 UI Features That Use Real Data

### ✅ Already Working
- Total founder count
- Top schools/universities
- Top companies
- Founder names and basic info
- Profile pictures (when available)
- LinkedIn URLs
- Current roles and companies
- Data source links
- Search functionality

### ⚠️ Depends on Data Quality
- **Interests**: Only shown if extracted from datapoints (requires interest entities in database)
- **Locations**: Shown if populated in person table or location entities exist
- **Occupation details**: Role level, industry, functional area (depends on occupation entity metadata)
- **Research summaries**: Shown if generated by LLM analysis

### 💡 To Improve Data Quality
If you're seeing empty fields or missing data:

1. **Run enrichment on more founders:**
   ```bash
   cd monorepo/backend
   npm run enqueue-yc-founders
   ```

2. **Check entity extraction:**
   - Ensure the entity extraction job completed
   - Check `datapoint_entity_index` table for entities

3. **Verify datapoints exist:**
   - Check `person_datapoints` table
   - Ensure scrapers successfully collected data

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` in ZatannaYC root:

```bash
# Backend API URL (default: http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: API key if backend requires authentication
NEXT_PUBLIC_API_KEY=
```

### Backend CORS Configuration

The backend is already configured to allow requests from:
- `http://localhost:3001` (ZatannaYC frontend)
- `http://localhost:4000` (main monorepo frontend)

No changes needed!

---

## 📝 Next Steps

### For Better Dashboard Stats
Consider creating additional backend endpoints for:
- Interest distribution (instead of calculating client-side)
- Occupation breakdowns with metadata
- Geographic clusters
- Platform distribution stats

This would reduce the data transferred and improve performance.

### For Better Founder Profiles
- Ensure all YC founders have been enriched with datapoints
- Run entity extraction on all datapoints
- Generate research summaries using LLM analysis

### For Production
- Add authentication to the backend endpoints
- Implement rate limiting
- Add caching for frequently accessed data
- Consider pagination for the dashboard (currently loads all 200+ founders)
- Add error boundaries in React components
- Implement retry logic for failed API calls

---

## 🎉 Success Checklist

- [ ] Backend running on `http://localhost:3000`
- [ ] ZatannaYC running on `http://localhost:3001`
- [ ] Dashboard shows real founder count
- [ ] Dashboard shows real university names
- [ ] Founders directory shows real founders with names
- [ ] Founder profile pages load with real data
- [ ] Search functionality works
- [ ] No errors in browser console (except expected image CORS)
- [ ] No errors in backend logs

---

## 💬 Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Check backend terminal for API errors
3. Verify database has YC founder data
4. Try the cURL commands above to test endpoints directly
5. Fall back to mock data is working if needed (automatic)

The app is designed to gracefully handle API failures, so you can continue development even if the backend is temporarily unavailable.
