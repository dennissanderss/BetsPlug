═══════════════════════════════════════════════════════
DESIGN SYSTEM SPECIFICATION
BetsPlug Marketing Site
═══════════════════════════════════════════════════════

DESIGN PHILOSOPHY

Premium SaaS that happens to operate in football predictions. Visual 
language draws from modern SaaS leaders (Linear, Vercel, Stripe) but 
integrates subtle sport-DNA without falling into casino-aesthetic.

THREE PRINCIPLES

1. CLARITY OVER DECORATION — every element serves comprehension
2. CONFIDENCE WITHOUT HYPE — premium feel through restraint
3. SPORT-DNA, NOT SPORT-DECORATION — subtle, never literal

DEFAULT MODE: MIXED LIGHT/DARK

- Hero sections: DARK
- Content sections: LIGHT
- Conversion sections: DARK
- Final CTA strips: DARK

═══════════════════════════════════════════════════════
COLOR TOKENS
═══════════════════════════════════════════════════════

PITCH GREEN (primary CTA, success, positive)
- pitch-green-500: #00D26A   /* Default */
- pitch-green-400: #1FE07F   /* Hover */
- pitch-green-600: #00B85A   /* Pressed */
- pitch-green-100: #E0F7EB   /* Light tint */
- pitch-green-900: #003D1F   /* Dark text on light green */

DEEP NAVY (dark backgrounds)
- deep-navy-950: #050811
- deep-navy-900: #0A0E1F     /* Default dark */
- deep-navy-800: #131829
- deep-navy-700: #1A1F2E     /* Cards on dark */
- deep-navy-600: #252B3D     /* Borders on dark */

STADIUM WHITE (light backgrounds)
- stadium-white-50: #FAFAF9
- stadium-white-100: #F4F4F2
- stadium-white-200: #E8E8E5

CHARCOAL (text on light)
- charcoal-900: #0F1419       /* Primary text */
- charcoal-700: #2A3140       /* Secondary */
- charcoal-500: #5A6478       /* Tertiary */
- charcoal-300: #9BA3B5       /* Muted */

INVERSE (text on dark)
- white-pure: #FFFFFF
- white-soft: #E8EAEF
- white-muted: #9BA3B5
- white-faded: #5A6478

SEMANTIC

- success-default: #00D26A
- warning-default: #F59E0B
- danger-default: #DC2626
- info-default: #3B82F6

ACCENT

- plasma-blue-500: #3B82F6
- plasma-blue-300: #93C5FD

GRADIENTS

- gradient-pitch: linear-gradient(135deg, #00D26A 0%, #00B85A 100%)
- gradient-hero-dark: radial-gradient(ellipse at top, #1A1F2E 0%, #050811 70%)
- gradient-conversion: linear-gradient(180deg, #131829 0%, #050811 100%)

═══════════════════════════════════════════════════════
TYPOGRAPHY
═══════════════════════════════════════════════════════

FONT STACK

Primary (sans-serif):
- Inter (variable font, weights 400/500/600/700)

Mono (data display):
- JetBrains Mono (variable, weights 400/500/700)

WEIGHTS

- 400: body text
- 500: labels, small UI
- 600: subheadings, CTAs
- 700: main headings

TYPE SCALE

H1 (hero):
- Mobile: 36px / line-height 1.1 / weight 700
- Tablet: 48px / line-height 1.05
- Desktop: 64px / line-height 1.0

H2 (section):
- Mobile: 28px / line-height 1.2
- Tablet: 36px
- Desktop: 44px

H3 (subsection):
- Mobile: 22px / line-height 1.3
- Tablet: 26px
- Desktop: 28px

H4: 18px / line-height 1.4 / weight 600

Body Large (intro):
- Mobile: 18px / line-height 1.6
- Desktop: 20px

Body: 16px / line-height 1.65

Body Small: 14px / line-height 1.5

Micro: 12px / line-height 1.4 / weight 500 / uppercase

Data Display (Mono):
- Large stat: 40px / weight 700
- Default: 20px / weight 600
- Inline: 14px / weight 500

═══════════════════════════════════════════════════════
SPACING SYSTEM (8px grid)
═══════════════════════════════════════════════════════

- 4 (16px): tight spacing
- 6 (24px): default
- 8 (32px): section internal
- 12 (48px): between elements
- 16 (64px): mobile section padding
- 24 (96px): desktop section padding
- 32 (128px): dramatic spacing

CONTAINER WIDTHS

- container-sm: 640px
- container-md: 768px (article width)
- container-lg: 1024px (default)
- container-xl: 1280px
- container-2xl: 1536px

═══════════════════════════════════════════════════════
BORDER RADIUS
═══════════════════════════════════════════════════════

- radius-sm: 4px
- radius-md: 8px (buttons, inputs)
- radius-lg: 12px (cards)
- radius-xl: 16px (large cards)
- radius-2xl: 24px (hero containers)
- radius-full: 9999px

═══════════════════════════════════════════════════════
SHADOWS
═══════════════════════════════════════════════════════

- shadow-sm: 0 1px 2px rgba(15,20,25,0.05)
- shadow-md: 0 4px 6px rgba(15,20,25,0.1), 0 2px 4px rgba(15,20,25,0.06)
- shadow-lg: 0 10px 15px rgba(15,20,25,0.1), 0 4px 6px rgba(15,20,25,0.05)
- shadow-xl: 0 20px 25px rgba(15,20,25,0.1)
- shadow-glow-pitch: 0 0 0 1px rgba(0,210,106,0.1), 0 4px 16px rgba(0,210,106,0.4)

═══════════════════════════════════════════════════════
SPORT-DNA PATTERNS
═══════════════════════════════════════════════════════

PITCH-LINE PATTERN
SVG overlay on dark backgrounds:
- White lines at 2% opacity
- Inspired by football pitch markings
- Geometric, abstract

CONFIDENCE BAR
- Pitch-green fill on charcoal-700 track
- Animated reveal on scroll (0% → target % over 800ms)

CHEVRON ACCENTS
- Forward-pointing chevrons in CTAs
- Slide right 4px on hover (200ms)

═══════════════════════════════════════════════════════
COMPONENT LIBRARY
═══════════════════════════════════════════════════════

BUTTON

Variants: primary, secondary, ghost
Sizes: sm (36px), md (44px), lg (52px)

Primary on dark hero:
- Background: gradient-pitch
- Text: white-pure, weight 600
- Shadow: shadow-glow-pitch
- Hover: brightness 1.1, scale 1.02

Secondary on dark hero:
- Background: transparent
- Border: 1px white-pure 30%
- Hover: border opacity 50%

CARD

Base:
- Light bg: stadium-white-50, border stadium-white-200
- Dark bg: charcoal-700, border deep-navy-600
- Radius: radius-lg
- Padding: p-6 default
- Shadow: shadow-sm default, shadow-md hover

Variants: standard, feature, prediction, pricing, comparison

PREDICTION CARD (sport-DNA hero element)

Layout: 16:10 aspect ratio
Top: League badge + lock indicator
Middle: Teams + match info
Bottom: Prediction + confidence bar

Locked variant:
- Prediction blurred (filter: blur(8px))
- Overlay with lock icon + CTA

ACCORDION

- Border 1px (light/dark variant)
- Plus/minus icon (rotates 180deg on expand)
- Body slides down (max-height transition 300ms)

INPUT

- Height 44px
- Padding 0.75rem 1rem
- Focus: pitch-green-500 border + 2px ring

NAVIGATION HEADER

- Sticky top
- Background: deep-navy-900 80% opacity + backdrop-blur
- Logo left, nav center, locale + CTA right

FOOTER

- Background: deep-navy-950
- 4-column grid: Brand, Product, Resources, Legal
- Bottom strip: copyright, disclaimer, 18+

═══════════════════════════════════════════════════════
ICON SYSTEM
═══════════════════════════════════════════════════════

Library: lucide-react
Style: line-art only, stroke-width 2px
Sizes: xs (12px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (48px)

Functional icons: Lock, Check, X, ChevronRight, ChevronDown
Decorative: Database, Brain, LineChart, Shield, Trophy, Globe, Zap

NOT TO USE: football/soccer balls, stadiums, money/dollar, stars

═══════════════════════════════════════════════════════
MOTION
═══════════════════════════════════════════════════════

Athletic-fast motion. No slow elegant fades.

DURATIONS
- instant: 100ms
- fast: 150ms (button hover)
- default: 200ms (card hover)
- medium: 300ms (accordion)
- slow: 500ms (page entry)

EASINGS
- ease-out: cubic-bezier(0.16, 1, 0.3, 1)
- ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

PATTERNS

Button hover: scale 1.02, brightness 1.1, 150ms
Card hover: border tint, shadow upgrade, translateY -2px, 200ms
Confidence bar: 0% → target over 800ms ease-spring
Live indicator pulse: 2s loop, opacity 1 → 0.5 → 1

REDUCED MOTION
Respect prefers-reduced-motion: disable scale, parallax, heavy animations

═══════════════════════════════════════════════════════
RESPONSIVE BREAKPOINTS
═══════════════════════════════════════════════════════

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

Mobile-first. Build for 320px+, enhance for larger.

═══════════════════════════════════════════════════════
ACCESSIBILITY
═══════════════════════════════════════════════════════

WCAG 2.1 AA:
- Body text contrast: 4.5:1
- Large text: 3:1
- Focus rings: 2px pitch-green-300 50% opacity, 2px offset
- Touch targets: 44×44px minimum
- Skip-to-content link
- Semantic HTML

═══════════════════════════════════════════════════════
TAILWIND CONFIG INTEGRATION
═══════════════════════════════════════════════════════

extend in tailwind.config.js:

colors: {
  'pitch-green': { 100, 400, 500, 600, 900 },
  'deep-navy': { 600, 700, 800, 900, 950 },
  'stadium-white': { 50, 100, 200 },
  'charcoal': { 300, 500, 700, 900 },
  'plasma-blue': { 300, 500 },
}

fontFamily: {
  sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'monospace'],
}

═══════════════════════════════════════════════════════
DESIGN PRINCIPLES SUMMARY
═══════════════════════════════════════════════════════

In one sentence:
"Premium SaaS confidence with subtle sport-DNA — built for 
data-bewuste sportwedders who want serious tools, not entertainment."

THREE-SECOND TEST

A bezoeker should within 3 seconds know:
1. This is a serious data product, not a casino site
2. Football is the domain (subtle pitch references)
3. The brand is professional and trustworthy

WHAT WE ARE NOT:
- Casino aesthetic (gold, glitter, neon)
- Tipster-site aesthetic (over-the-top trust signals)
- Generic SaaS (no domain personality)
- Sports-media aesthetic (action photos, dramatic typography)

WHAT WE ARE:
- Modern SaaS (Linear, Vercel, Stripe lineage)
- Sport-aware through patterns and motion (subtle)
- Data-confident (Mono font for stats)
- Conversion-focused (every section serves funnel)
