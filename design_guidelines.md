# Campus Music Design Guidelines

## Design Approach
**Reference-Based: Apple Music + Spotify Dark Theme**
- Primary inspiration: Apple Music's dark interface with large artwork tiles and horizontal carousels
- Secondary inspiration: Spotify's persistent player and clean typography
- Core principle: Premium, music-first experience that celebrates student artists

## Typography System

**Font Families:**
- Primary: Inter or SF Pro Display (via Google Fonts CDN)
- Fallback: -apple-system, system-ui, sans-serif

**Hierarchy:**
- Hero Headlines: 48px, bold (landing sections)
- Page Titles: 32px, bold
- Section Headers: 24px, semibold
- Track/Artist Names: 16px, medium
- Body/Metadata: 14px, regular
- Small Labels (university tags): 12px, medium

## Layout System

**Spacing Primitives:**
- Use Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24
- Section vertical spacing: py-12 to py-20
- Card padding: p-4 to p-6
- Gap in grids/carousels: gap-4 to gap-6

**Grid Structure:**
- Sidebar: Fixed 240px width on desktop, collapsible on mobile
- Main content: Fluid with max-w-7xl container
- Horizontal carousels: Overflow-x scrolling with snap points
- Track grids: 3-4 columns on desktop, 2 on tablet, 1 on mobile

## Component Library

### Navigation Sidebar (Desktop)
- Fixed left sidebar, full height
- Width: 240px
- Links with icons (use Heroicons via CDN)
- Active state: subtle highlight with border accent
- Sections: Main nav, Library, User profile at bottom

### Album/Track Tiles
- Square aspect ratio (1:1) for cover art
- Size: 200px × 200px in carousels
- Rounded corners: rounded-lg
- Hover: Slight scale (1.02) with play button overlay
- Metadata below: title, artist, university tag

### Horizontal Carousels
- Container: overflow-x-auto with snap-x
- Smooth scrolling behavior
- Show 4-5 tiles at once on desktop, 2-3 on mobile
- Navigation arrows on hover (optional)
- Padding: px-6 to create breathing room

### Global Audio Player (Bottom Bar)
- Fixed bottom, full width, height: 90px
- Three sections: Left (current track info + artwork 56×56px), Center (playback controls), Right (volume + queue)
- Backdrop blur effect for depth
- Progress bar spans full width above player
- Sticky across all pages

### Track List Items
- Horizontal layout: Cover thumbnail (48×48px) | Track info | Duration | Like button | Three-dot menu
- Hover: slight background highlight
- Play button appears on hover over thumbnail
- University tag as small badge

### Cards & Containers
- Background: Subtle elevation with semi-transparent overlays
- Borders: None or 1px with low-opacity borders
- Padding: p-6 for cards, p-4 for compact items
- Shadows: Minimal, use for depth only

### Buttons
- Primary CTA: Bold accent color, rounded-full, px-6 py-3
- Secondary: Outlined with accent border
- Icon buttons: Square, subtle hover states
- Play buttons: Circular, centered icon, accent background

### Forms (Auth, Upload, Profile)
- Input fields: Dark background with subtle borders, rounded-lg, py-3 px-4
- Labels: 14px, semibold, mb-2
- Error messages: Red accent, 12px below field
- .edu email validation: Clear inline error for non-.edu emails

### Search Bar
- Top bar, centered or right-aligned
- Width: 400px max on desktop, full width on mobile
- Icon prefix (magnifying glass), rounded-full
- Dropdown results overlay on focus

## Visual Treatments

**Theme:**
- Base background: Near-black (#0a0a0a to #121212)
- Surface elevation: Lighter grays (#1a1a1a, #242424)
- Accent color: Vibrant (purple, cyan, or brand-specific) for CTAs and highlights
- Text primary: White (#ffffff)
- Text secondary: Gray-400 (#9ca3af)

**Imagery:**
- Large artwork tiles: High quality, always square
- Artist profile images: Circular avatars
- Cover placeholders: Gradient fallbacks when no image

**Interactive States:**
- Hover: Subtle brightness increase or scale
- Active/Playing: Accent color glow or border
- Focus: Visible outline for accessibility

## Page-Specific Layouts

### Home Page
- Top bar: Logo left, search center, user avatar right
- Sidebar navigation (fixed left)
- Main scrollable content:
  - "Best of Campus 2025" horizontal carousel (large tiles)
  - "Latest Songs" vertical list
  - "Trending on Campus" horizontal carousel or grid
- Sticky audio player at bottom

### New Releases Page
- Grid layout: 4 columns desktop, 2 mobile
- Large square tiles with cover art
- Minimal text overlay on hover with play button

### Artist Dashboard
- Stats cards at top: Total plays, likes, tracks (3-column grid)
- Upload button: Prominent, top-right
- Track management table: Sortable list with inline stats

### Discover by University
- University selector: Searchable dropdown, prominent at top
- Filtered content in tabbed sections: Top Artists, Top Tracks, New Releases
- Empty state: Encourage exploration with university suggestions

## Responsive Behavior
- Desktop (≥1024px): Full sidebar, multi-column grids
- Tablet (768-1023px): Collapsible sidebar, 2-column grids
- Mobile (<768px): Bottom tab bar navigation, single column, swipeable carousels

## Images
**Hero Image:** No traditional hero needed - music artwork serves as visual focal point
**Key Images:**
- Album/track cover art: Square, high-quality, throughout interface
- Artist profile photos: Circular, professional or candid
- Placeholder graphics: Vibrant gradients for missing artwork
- University logos/badges: Small icons in tags

## Accessibility
- Maintain WCAG AA contrast ratios on dark backgrounds
- Keyboard navigation for all interactive elements
- Screen reader labels for icon-only buttons
- Focus visible states with accent outlines