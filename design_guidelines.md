# Texas Hold'em Hand Strength Trainer - Design Guidelines

## Design Approach
**Reference-Based:** Drawing inspiration from professional poker platforms (PokerStars, GGPoker) and modern card game interfaces, creating a focused, immersive poker table experience.

## Core Design Principles
- **Poker Authenticity:** Replicate the feel of a real poker table environment
- **Clear Visual Hierarchy:** Cards and game state must be immediately readable
- **Instant Feedback:** Obvious visual responses to user actions
- **Minimal Distraction:** Focus remains on hand evaluation task

---

## Color Palette

### Primary Colors
- **Poker Table Green:** 140 35% 25% (main background, evoking classic felt table)
- **Dark Background:** 140 20% 12% (outer areas, creating depth)
- **Card White:** 0 0% 98% (card backgrounds)

### Semantic Colors
- **Correct Answer:** 142 76% 45% (vibrant green for success)
- **Incorrect Answer:** 0 84% 60% (clear red for mistakes)
- **Timer Accent:** 45 93% 58% (gold/amber for timer emphasis)
- **Neutral Gray:** 140 10% 60% (disabled states, unused cards)

### Card Suits
- **Red Suits (♥♦):** 0 84% 50%
- **Black Suits (♠♣):** 0 0% 10%

---

## Typography

### Font Families
- **Primary:** 'Inter' or 'Roboto' (clean, highly legible for UI)
- **Card Ranks:** 'Georgia' or serif font (traditional playing card aesthetic)
- **Timer/Score:** 'Roboto Mono' (monospace for numbers)

### Type Scale
- **Player Labels:** text-sm font-semibold (12-14px)
- **Card Ranks:** text-2xl to text-3xl font-bold (24-30px)
- **Buttons:** text-base font-semibold (16px)
- **Timer:** text-xl font-mono (20px)
- **Feedback Messages:** text-lg font-bold (18px)

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent rhythm
- Tight spacing: p-2, gap-2 (cards within hand)
- Standard spacing: p-4, gap-4 (between UI elements)
- Section spacing: p-8, gap-8 (major layout areas)

### Grid Structure
- **Viewport:** Full-height poker table (min-h-screen)
- **Player Positions:** CSS Grid with 3x3 layout
  - Corners: Player hands (top-left, top-right, bottom-left, bottom-right)
  - Center: Community cards (board)
- **Responsive:** Single column stack on mobile (<768px)

### Card Dimensions
- **Desktop:** w-16 h-24 (64x96px per card)
- **Mobile:** w-12 h-18 (48x72px per card)
- **Border Radius:** rounded-lg for cards
- **Shadow:** shadow-lg for elevation, shadow-2xl for selected cards

---

## Component Library

### Playing Cards
- **Background:** White with subtle gradient
- **Border:** 2px solid with rounded corners
- **Rank & Suit:** Prominently displayed in top-left, bottom-right corners
- **States:**
  - Default: Full opacity, shadow-lg
  - Used (after answer): opacity-100, ring-2 ring-yellow-400
  - Unused (after answer): opacity-40, grayscale filter

### Player Hand Containers
- **Background:** Semi-transparent dark overlay (bg-black/20)
- **Padding:** p-4
- **Rounded corners:** rounded-xl
- **Player Label:** Text above cards showing "Player 1", "Player 2", etc.
- **Card Layout:** Horizontal flex row with slight overlap (gap-2)

### Community Cards (Board)
- **Background:** Semi-transparent light overlay (bg-white/10)
- **Layout:** Horizontal flex row, centered
- **Spacing:** gap-3 between cards
- **Border:** Subtle border to separate from table

### Buttons

**Winner Selection Buttons:**
- **Style:** Solid with poker chip aesthetic
- **Default:** bg-blue-600 with shadow-md
- **Hover:** bg-blue-700, scale-105 transform
- **Active/Selected:** bg-yellow-500, ring-4 ring-yellow-300
- **Size:** px-6 py-2.5
- **Position:** Directly below each player's hand

**Chop Button:**
- **Style:** bg-purple-600 (distinct from winner buttons)
- **Icon:** Include "=" or split icon
- **Position:** Centered below community cards

**New Game Button:**
- **Style:** Outline button (border-2 border-white/40)
- **Position:** Top-right corner of viewport
- **Hover:** bg-white/10

### Timer Display
- **Background:** bg-black/60 backdrop-blur-sm
- **Position:** Top-center of viewport
- **Font:** Monospace, large text-xl
- **Color:** Text amber-400 for emphasis
- **Format:** "00:00" or "0.0s"
- **Padding:** px-6 py-3, rounded-full

### Feedback Modal/Toast
- **Correct:** Green banner with checkmark icon, slide-in animation
- **Incorrect:** Red banner with X icon, shake animation
- **Content:** Large text showing result + explanatory text about winning hand
- **Duration:** 3-4 seconds before fade out
- **Position:** Top-center overlay

### Game Setup Screen
- **Player Count Selector:** Large radio buttons or number stepper
- **Style:** Card-style container centered on green background
- **Button:** Primary CTA "Start Game" (bg-green-600)

---

## Interaction States

### Card Interactions
- **Hover:** Subtle lift (translate-y-1), brightness increase
- **Selection Highlight:** Ring outline appears around player's cards when button clicked

### Button States
- **Disabled:** opacity-50, cursor-not-allowed
- **Loading:** Spinner icon, disabled state
- **Success/Error:** Brief color flash transition

---

## Visual Enhancements

### Poker Table Texture
- **Background Pattern:** Subtle radial gradient simulating felt texture
- **Outer Shadow:** Vignette effect darkening edges

### Animations (Minimal)
- **Card Deal:** Quick slide-in from deck position (0.3s)
- **Answer Reveal:** Smooth opacity/filter transition on unused cards (0.5s)
- **Feedback Banner:** Slide-down entrance, fade-out exit
- **Button Clicks:** Scale micro-interaction (0.1s)

### Depth & Layering
- **Z-index hierarchy:** Background < Table elements < Cards < Buttons < Modals
- **Drop shadows:** Consistent shadow-lg for elevated elements
- **Backdrop blur:** Use on overlays for depth perception

---

## Accessibility Considerations

### Color Contrast
- Ensure 4.5:1 contrast ratio for all text on backgrounds
- Red/Black suit colors clearly distinguishable for color-blind users
- Used/unused card distinction relies on brightness + optional icons, not just color

### Keyboard Navigation
- Tab through player selection buttons
- Enter/Space to activate buttons
- ESC to dismiss feedback messages

### Screen Readers
- Aria labels for all cards ("Ace of Spades", "King of Hearts")
- Announce timer updates periodically
- Clear feedback messages for correct/incorrect answers

---

## Responsive Behavior

### Desktop (≥1024px)
- Full 3x3 grid layout with corners + center
- All 4 player positions visible simultaneously
- Larger card sizes (w-16 h-24)

### Tablet (768px - 1023px)
- Maintain grid but reduce card sizes (w-14 h-20)
- Tighter spacing (gap-3)

### Mobile (<768px)
- Stack vertically: Player 1 → Player 2 → Board → Player 3 → Player 4
- Smaller cards (w-12 h-18)
- Single-column button layout
- Collapsible sections for inactive players

---

This design creates an authentic, professional poker training environment that prioritizes clarity, immediate feedback, and focused practice without unnecessary visual noise.