# YC Batch W26 Report Website

A comprehensive public-facing website showcasing YC Batch W26 founders with their interests, backgrounds, education, and professional journeys.

## Features

- **Homepage**: Batch-wide statistics and trends with interactive charts
- **Profile Directory**: Browseable list of all founders (coming soon)
- **Semantic Search**: Natural language search for founders (coming soon)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Zatanna design system
- **Charts**: Recharts
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. (Optional) Set up environment variables:
If you want to connect to a backend API, create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://sgapi.zatanna.ai
NEXT_PUBLIC_API_KEY=your-api-key-here
```

**Note**: The app works without a backend! If no API URL is configured, it will automatically use mock/seed data with 50 sample founders. This is perfect for development and testing.

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:4000](http://localhost:4000) in your browser.

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx     # Root layout with font setup
│   │   ├── page.tsx       # Homepage with batch statistics
│   │   └── globals.css    # Global styles import
│   ├── components/        # React components
│   │   ├── charts/        # Chart components (BarChart, PieChart)
│   │   └── StatCard.tsx   # Statistics card component
│   ├── lib/              # Utilities and API clients
│   │   └── api/          # API client for YC batch data
│   └── styles/           # Global CSS styles
│       └── global.css    # Zatanna design system styles
├── GLOBAL_STYLES.css     # Design system reference
├── STYLE_GUIDE.md        # Design system documentation
└── TAILWIND_CONFIG.js    # Tailwind configuration reference
```

## Mock Data

The app includes comprehensive mock data with 50 sample founders. If the API is not configured or unavailable, the app will automatically use this mock data. The mock data includes:

- 50 founders with realistic profiles
- Distribution across top universities (Stanford, MIT, Harvard, etc.)
- Various interests (Robotics, AI/ML, Photography, Basketball, Travel, etc.)
- Different locations (San Francisco, New York, Boston, Seattle, etc.)
- Various occupations (CTO, CEO, Software Engineer, etc.)

This allows you to develop and test the frontend without needing a backend.

## API Integration

When ready to connect to a backend, the website expects the following API endpoints:

### Batch Statistics
- `GET /api/v1/yc-batch/stats` - Returns aggregated statistics
- Fallback: `GET /api/v1/yc-batch/founders` - Returns all founders (stats calculated client-side)

### Founders
- `GET /api/v1/yc-batch/founders` - List all founders
- `GET /api/v1/yc-batch/founders/:personId` - Get individual founder profile

### Authentication
The search endpoint requires API key authentication via Bearer token:
```
Authorization: Bearer ${NEXT_PUBLIC_API_KEY}
```

## Design System

This project uses the Zatanna design system with:
- **Primary Color**: Moss Green (`#8E8E67`)
- **Neutral Colors**: Gray Cream palette
- **Typography**: Crimson Pro (serif) for headings, system fonts for body
- **Textures**: Paper-like textures and patterns for archival aesthetic

See `STYLE_GUIDE.md` for detailed usage instructions.

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | (empty) | No - uses mock data if not set |
| `NEXT_PUBLIC_API_KEY` | API key for authenticated endpoints | (empty) | No |

## Next Steps

1. **Profile Directory**: Create `/founders` page with grid/list view
2. **Individual Profiles**: Create `/founders/[personId]` dynamic route
3. **Search Page**: Enhance existing search functionality at `/search`
4. **Error Handling**: Add comprehensive error boundaries
5. **Loading States**: Add skeleton loaders for better UX

## License

Private project for Zatanna YC Batch Report.

