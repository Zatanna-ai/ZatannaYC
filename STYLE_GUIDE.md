# Zatanna Design System - Style Guide

Quick reference for using the Zatanna design system in your YC Batch Report website.

## Setup

1. **Copy `GLOBAL_STYLES.css`** into your project and import it in your main CSS file or layout
2. **Copy `TAILWIND_CONFIG.js`** configuration into your `tailwind.config.js`
3. **Load Crimson Pro font** (from Google Fonts or local):
   ```tsx
   import { Crimson_Pro } from 'next/font/google';
   
   const crimsonPro = Crimson_Pro({
     subsets: ['latin'],
     variable: '--font-crimson-pro',
   });
   ```

## Color Palette

### Primary Colors
- **Moss Green** (`moss-green`): Primary brand color `#8E8E67`
  - Use: Buttons, links, accents, primary actions
  - Shades: `moss-green-50` (lightest) to `moss-green-900` (darkest)

### Neutral Colors
- **Gray Cream** (`gray-cream`): Warm neutral palette
  - Use: Backgrounds, borders, subtle elements
  - Shades: `gray-cream-25` (lightest) to `gray-cream-900` (darkest)

### Semantic Colors
- **Success** (`success`): Green for positive states
- **Error** (`error`): Red for negative states
- **Info** (`info`): Blue for informational content
- **Warning** (`warning`): Amber for warnings

### Usage Examples
```tsx
// Primary button
<button className="bg-moss-green text-white hover:bg-moss-green-400">
  Click me
</button>

// Card with background
<div className="bg-gray-cream-25 border border-gray-cream-200">
  Content
</div>

// Success badge
<span className="badge-success">Active</span>
```

## Typography

### Font Families
- **Serif** (`font-serif`): Crimson Pro - Use for headings
- **Sans** (`font-sans`): System fonts - Use for body text

### Font Sizes
- `text-hero`: 48px/56px - Hero sections
- `text-section`: 32px/40px - Section headings
- `text-subhead`: 24px/32px - Subheadings
- `text-body`: 16px/24px - Body text
- `text-ui`: 14px/20px - UI elements
- `text-caption`: 12px/16px - Captions, labels

### Usage
```tsx
<h1 className="text-hero font-serif">YC Batch W26</h1>
<p className="text-body font-sans">Founder information...</p>
```

## Textures & Patterns

### Paper Textures
- `paper-texture`: Subtle background texture
- `paper-texture-card`: Enhanced texture for cards
- `moss-texture`: Moss green tinted texture

### Patterns
- `pattern-stripes`: Vertical stripes
- `pattern-stripes-dense`: Dense vertical stripes
- `pattern-diagonal`: Diagonal lines
- `pattern-grid`: Grid pattern
- `pattern-dots`: Dots pattern

### Usage
```tsx
// Card with paper texture
<div className="archival-card paper-texture-card">
  Content
</div>

// Hero section with texture
<section className="hero-texture">
  Hero content
</section>
```

## Card Styles

### Pre-built Card Classes
- `archival-card`: Paper texture with subtle border
- `document-card`: Heavier texture, like aged paper
- `case-card`: Card with stripe pattern

### Usage
```tsx
<div className="archival-card p-6">
  <h2 className="text-section font-serif">Founder Profile</h2>
  <p className="text-body">Details...</p>
</div>
```

## Button Styles

### Button Classes
- `btn-primary`: Moss green primary button
- `btn-secondary`: Gray cream secondary button
- `btn-outline`: Outlined button with moss green border
- `btn-success` / `btn-accept`: Success state button
- `btn-error` / `btn-reject`: Error state button

### Usage
```tsx
<button className="btn-primary">Get Full Report</button>
<button className="btn-secondary">Learn More</button>
<button className="btn-outline">View Profile</button>
```

## Badge Styles

### Badge Classes
- `badge-success`: Green success badge
- `badge-error`: Red error badge
- `badge-info`: Blue info badge
- `badge-warning`: Amber warning badge

### Usage
```tsx
<span className="badge-success">Active</span>
<span className="badge-error">Inactive</span>
```

## Section Styles

### Section Classes
- `section-legal`: Section with subtle top border pattern
- `hero-texture`: Hero section with texture
- `content-section`: Content section with subtle texture
- `accent-section`: Accent section with moss green tint

### Usage
```tsx
<section className="section-legal">
  <h2 className="text-section font-serif">Batch Statistics</h2>
  {/* Content */}
</section>
```

## Layout Utilities

### Container
Use the container class for centered, responsive layouts:
```tsx
<div className="container mx-auto">
  {/* Content */}
</div>
```

### Spacing
Use Tailwind's spacing scale:
- `p-4`, `p-6`, `p-8` for padding
- `m-4`, `m-6`, `m-8` for margin
- `gap-4`, `gap-6` for flex/grid gaps

## Common Patterns

### Founder Card
```tsx
<div className="archival-card p-6 hover:shadow-md transition-shadow">
  <img src={profilePicture} className="w-24 h-24 rounded-full mb-4" />
  <h3 className="text-subhead font-serif">{name}</h3>
  <p className="text-body text-muted-foreground">{occupation}</p>
  <div className="flex gap-2 mt-4">
    {interests.map(interest => (
      <span key={interest} className="badge-info">{interest}</span>
    ))}
  </div>
</div>
```

### Statistics Card
```tsx
<div className="archival-card p-6">
  <h4 className="text-ui font-serif text-muted-foreground">Education</h4>
  <p className="text-section font-serif mt-2">23%</p>
  <p className="text-body">Went to Stanford</p>
</div>
```

### Search Bar
```tsx
<div className="archival-card p-6">
  <input
    type="text"
    className="w-full px-4 py-2 border border-gray-cream-200 rounded-md 
               bg-background focus:outline-none focus:ring-2 focus:ring-moss-green"
    placeholder="Search founders..."
  />
</div>
```

## Dark Mode

The design system supports dark mode. Use the `dark` class on the root element:
```tsx
<html className="dark">
  {/* All colors will automatically adjust */}
</html>
```

## Accessibility

- All interactive elements have focus styles
- Use semantic HTML
- Ensure sufficient color contrast
- Include ARIA labels where needed

## Examples for YC Batch Report

### Homepage Stats Section
```tsx
<section className="hero-texture py-16">
  <div className="container mx-auto">
    <h1 className="text-hero font-serif text-center mb-12">
      YC Batch W26 Report
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="archival-card p-6">
        <h3 className="text-subhead font-serif">Education</h3>
        {/* Chart here */}
      </div>
      {/* More stat cards */}
    </div>
  </div>
</section>
```

### Founder Profile
```tsx
<div className="archival-card p-8">
  <div className="flex items-start gap-6">
    <img src={profilePicture} className="w-32 h-32 rounded-full" />
    <div>
      <h1 className="text-section font-serif">{name}</h1>
      <p className="text-body text-muted-foreground">{occupation}</p>
      <div className="mt-4">
        <h3 className="text-subhead font-serif mb-2">Interests</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map(interest => (
            <span key={interest} className="badge-info">{interest}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
```

---

For more details, see `GLOBAL_STYLES.css` for all available classes and utilities.

