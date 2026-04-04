# Design System: ReddiChat

## 1. Visual Theme & Atmosphere

ReddiChat is a Reddit-powered AI chat application that channels the energy of community conversation into a focused, intelligent interface. The design language is built around Reddit's iconic Orangered (`#ff4500`) — not as decoration, but as the singular brand accent that signals interactivity, warmth, and community. Every surface, every shadow, every typographic choice exists to make the chat experience feel fast, trustworthy, and alive.

The overall atmosphere is **warm dark** — not the cold blue-black of developer tools, but a dark canvas with subtle warm undertones that echo the conversational, human nature of Reddit. In light mode, the design shifts to a clean, airy canvas with warm grays (`#f8f7f6`) instead of cold ones, where Apple-inspired diffused shadows give cards and surfaces a natural, photographic lift. The light theme is not an afterthought — it is a first-class citizen with its own depth system.

The typography is anchored by Plus Jakarta Sans — a geometric sans-serif with softened terminals that balances technical precision with approachability. At display sizes, aggressive negative letter-spacing (-1.5px to -2px) creates compressed, confident headlines. At body sizes, the tracking relaxes into comfortable reading rhythm. JetBrains Mono serves as the monospace companion for code blocks, model labels, and technical metadata.

**Key Characteristics:**
- Reddit Orangered (`#ff4500`) as the singular brand accent — never decorative, always functional
- Warm dark surfaces: `#0c0c0d` base, `#141416` elevated, `#1b1b1e` highest — charcoal with warm undertones
- Warm light surfaces: `#ffffff` base, `#f8f7f6` secondary, `#f0efed` tertiary — cream-tinted, never sterile
- Plus Jakarta Sans with negative letter-spacing at display sizes (-1.5px to -2px)
- JetBrains Mono for code, model names, and technical labels
- Apple-inspired diffused shadow on light theme: `rgba(0, 0, 0, 0.08) 2px 4px 24px 0px` — soft, wide, natural
- Enhanced hover shadows: `rgba(0, 0, 0, 0.14) 3px 5px 30px 0px` — the card lifts toward you
- Semi-transparent borders throughout: `rgba(0, 0, 0, 0.06)` light, `rgba(255, 255, 255, 0.06)` dark
- Conservative border-radius (6px-10px) for UI chrome, pill (9999px) only for badges and status indicators
- OpenType features `"ss01"` enabled on Plus Jakarta Sans for cleaner geometric alternates

## 2. Color Palette & Roles

### Primary Brand
- **Reddit Orangered** (`#ff4500`): Primary CTA, active states, brand accent, send button, "New Chat" button. The ONLY chromatic accent in the core interface.
- **Orangered Hover** (`#e63e00`): Hover/pressed state — darker, more saturated.
- **Orangered Soft** (`rgba(255, 69, 0, 0.10)`): Tinted surface for active sidebar items, selected states, badges.
- **Orangered Glow** (`rgba(255, 69, 0, 0.04)`): Subtle background wash for hover states on large surfaces.

### Dark Theme Surfaces
- **Base** (`#0c0c0d`): Deepest background — chat area, main canvas. Near-black with imperceptible warm cast.
- **Elevated** (`#141416`): Sidebar, panels, secondary surfaces. One step up from the base.
- **Highest** (`#1b1b1e`): Cards, dropdowns, popovers, message input area.
- **Hover** (`#222226`): Interactive surface hover state.
- **Active** (`#2a2a2f`): Active/pressed surface state.

### Light Theme Surfaces
- **Base** (`#ffffff`): Main canvas, chat area background.
- **Secondary** (`#f8f7f6`): Sidebar, panels — warm off-white with cream undertone, not cold gray.
- **Tertiary** (`#f0efed`): Cards, prompt chips, secondary containers.
- **Hover** (`#e8e7e5`): Surface hover state.
- **Active** (`#dfdedd`): Surface active/pressed state.

### Text — Dark Theme
- **Primary** (`#ededef`): Near-white, warm cast. Default text — not pure white, prevents eye strain.
- **Secondary** (`#a0a0a8`): Descriptions, timestamps, secondary content.
- **Tertiary** (`#6b6b74`): Placeholders, disabled states, metadata.
- **Quaternary** (`#4a4a52`): Most subdued — divider labels, subtle hints.

### Text — Light Theme
- **Primary** (`#1a1a1c`): Near-black headlines and body. Warm, not cold.
- **Secondary** (`#5c5c64`): Descriptions, timestamps, secondary content.
- **Tertiary** (`#8c8c94`): Placeholders, metadata, helper text.
- **Quaternary** (`#b0b0b8`): Disabled states, subtle hints.

### Semantic
- **Success** (`#22c55e`): Completion states, online indicators.
- **Warning** (`#f59e0b`): Rate limit warnings, attention states.
- **Error** (`#ef4444`): Error messages, destructive actions.
- **Info** (`#3b82f6`): Informational badges, external links.

### Borders
- **Light theme**: `rgba(0, 0, 0, 0.06)` default, `rgba(0, 0, 0, 0.10)` emphasized, `rgba(0, 0, 0, 0.03)` whisper.
- **Dark theme**: `rgba(255, 255, 255, 0.06)` default, `rgba(255, 255, 255, 0.10)` emphasized, `rgba(255, 255, 255, 0.03)` whisper.
- **Brand border**: `rgba(255, 69, 0, 0.3)` for active/selected elements.

### Shadows — Light Theme (Apple-Inspired)
- **Card Resting**: `rgba(0, 0, 0, 0.08) 2px 4px 24px 0px` — diffused, wide, natural. The signature.
- **Card Hover**: `rgba(0, 0, 0, 0.14) 3px 5px 30px 0px` — lifts toward user on hover. Smooth transition.
- **Elevated**: `rgba(0, 0, 0, 0.06) 0px 2px 8px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px` — subtle lift with border ring.
- **Popover**: `rgba(0, 0, 0, 0.12) 0px 8px 32px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px` — dropdowns, menus.
- **Input Focus**: `0 0 0 2px rgba(255, 69, 0, 0.2), 0 0 0 1px rgba(255, 69, 0, 0.4)` — orange focus ring.

### Shadows — Dark Theme
- **Card Resting**: `rgba(0, 0, 0, 0.4) 0px 2px 12px 0px` — heavier on dark to be visible.
- **Elevated**: `rgba(0, 0, 0, 0.5) 0px 4px 20px 0px`.
- **Input Focus**: `0 0 0 2px rgba(255, 69, 0, 0.15), 0 0 0 1px rgba(255, 69, 0, 0.3)` — dimmer orange glow.

## 3. Typography Rules

### Font Families
- **Display & UI**: `Plus Jakarta Sans`, fallbacks: `system-ui, -apple-system, sans-serif`
- **Monospace**: `JetBrains Mono`, fallbacks: `ui-monospace, SF Mono, Consolas, monospace`
- **OpenType Features**: `"ss01"` (stylistic alternates) enabled globally on Plus Jakarta Sans

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Page Title | Plus Jakarta Sans | 28px (1.75rem) | 700 | 1.15 | -1.5px | Welcome screen headline, page titles |
| Section Heading | Plus Jakarta Sans | 20px (1.25rem) | 600 | 1.25 | -0.8px | Sidebar header, section labels |
| Card Title | Plus Jakarta Sans | 15px (0.9375rem) | 600 | 1.35 | -0.3px | Thread titles, card headings |
| Body | Plus Jakarta Sans | 14px (0.875rem) | 400 | 1.6 | -0.1px | Chat messages, descriptions |
| Body Emphasis | Plus Jakarta Sans | 14px (0.875rem) | 500 | 1.6 | -0.1px | Active nav items, selected labels |
| Small | Plus Jakarta Sans | 13px (0.8125rem) | 400 | 1.45 | 0 | Secondary text, timestamps |
| Caption | Plus Jakarta Sans | 12px (0.75rem) | 400 | 1.35 | 0 | Metadata, helper text |
| Micro | Plus Jakarta Sans | 11px (0.6875rem) | 500 | 1.3 | 0.2px | Badges, status indicators |
| Code | JetBrains Mono | 13px (0.8125rem) | 400 | 1.6 | 0 | Code blocks, model names |
| Code Small | JetBrains Mono | 11px (0.6875rem) | 400 | 1.4 | 0.3px | Inline code, technical metadata |

### Principles
- **Weight discipline**: 400 (regular) for body, 500 (medium) for emphasis, 600 (semibold) for headings, 700 (bold) for page titles only. Never use 800 or 900.
- **Negative tracking at display sizes**: Headlines compress for engineered density. Body text relaxes for readability.
- **Monospace for technical context**: Model names (GPT-4o, Gemini), response times, token counts, code blocks — always JetBrains Mono.
- **Single font load**: Only Plus Jakarta Sans + JetBrains Mono. Remove all other font imports (Inter, Space Grotesk, Outfit, DM Sans, Syne).

## 4. Component Stylings

### Buttons

**Primary (Brand CTA)**
- Background: `#ff4500` (Reddit Orangered)
- Text: `#ffffff`, weight 500, 14px
- Padding: 8px 16px
- Radius: 8px
- Border: none
- Hover: `#e63e00` background, shadow `rgba(255, 69, 0, 0.25) 0px 4px 12px`
- Active: `#cc3900`, scale(0.98)
- Use: "New Chat", "Send", "Sign In", primary actions

**Secondary**
- Light: `#f0efed` background, `#1a1a1c` text
- Dark: `#222226` background, `#ededef` text
- Padding: 8px 16px
- Radius: 8px
- Border: 1px solid `rgba(0,0,0,0.06)` / `rgba(255,255,255,0.06)`
- Hover: background shifts one step darker, border to `rgba(0,0,0,0.10)` / `rgba(255,255,255,0.10)`
- Use: "Export", category filters, secondary actions

**Ghost / Icon**
- Background: transparent
- Text: secondary text color
- Padding: 6px
- Radius: 6px
- Hover: surface hover color
- Use: Collapse sidebar, menu toggles, close buttons

**Upgrade / Premium**
- Background: `linear-gradient(135deg, #ff4500, #ff6b35)`
- Text: `#ffffff`, weight 500
- Radius: 9999px (pill)
- Hover: `linear-gradient(135deg, #e63e00, #ff4500)`, shadow `rgba(255, 69, 0, 0.3) 0px 4px 16px`
- Use: "Upgrade to Pro" — the only gradient in the system

### Cards & Containers

**Prompt Chip**
- Light: `#ffffff` background, `rgba(0, 0, 0, 0.08) 2px 4px 24px 0px` shadow (Apple-style), no border
- Dark: `#1b1b1e` background, `1px solid rgba(255, 255, 255, 0.06)`, no shadow
- Radius: 10px
- Padding: 12px 14px
- Hover (light): shadow transitions to `rgba(0, 0, 0, 0.14) 3px 5px 30px 0px` — card lifts
- Hover (dark): background to `#222226`, border brightens
- Text: 13px, secondary text color
- Transition: `box-shadow 0.3s ease, transform 0.2s ease`

**Sidebar Thread Item**
- Default: transparent background
- Hover: surface hover color
- Active: `rgba(255, 69, 0, 0.10)` background, `2px solid rgba(255, 69, 0, 0.4)` left border
- Text: 13px, primary on active, secondary on default
- Radius: 6px
- Padding: 8px 12px

**Message Bubble (User)**
- Light: `#f0efed` background, no border
- Dark: `#1b1b1e` background, no border
- Radius: 12px 12px 4px 12px
- Padding: 10px 14px

**Message Bubble (AI)**
- Background: transparent (no bubble — text flows naturally)
- Padding: 10px 0

### Input

**Message Input**
- Light: `#ffffff` background, `1px solid rgba(0, 0, 0, 0.10)`, shadow `rgba(0, 0, 0, 0.06) 0px 2px 8px`
- Dark: `#1b1b1e` background, `1px solid rgba(255, 255, 255, 0.08)`
- Radius: 12px
- Padding: 12px 16px
- Focus: orange ring — `0 0 0 2px rgba(255, 69, 0, 0.2), 0 0 0 1px rgba(255, 69, 0, 0.4)`
- Placeholder: tertiary text color
- Font: 14px Plus Jakarta Sans, weight 400

### Navigation / Sidebar

**Sidebar**
- Light: `#f8f7f6` background, right border `rgba(0, 0, 0, 0.06)`
- Dark: `#141416` background, right border `rgba(255, 255, 255, 0.06)`
- Width: 260px expanded, 64px collapsed
- Transition: `width 0.25s ease, transform 0.25s ease`

**Brand Mark**
- "ReddiChat" in Plus Jakarta Sans, 18px, weight 700, letter-spacing -0.5px
- Default: primary text color
- Hover: `#ff4500` (Orangered) — the name glows on hover

### Model Selector
- Font: JetBrains Mono, 12px, weight 400
- Background: transparent with border
- Dropdown items: model name in mono, provider badge in caption size
- Selected: Orangered dot indicator

## 5. Layout Principles

### Spacing System
- Base unit: 4px
- Scale: 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64
- Chat message gap: 16px between messages
- Sidebar item gap: 2px between thread items
- Section padding: 16px-24px

### Grid & Container
- Sidebar: 260px fixed (64px collapsed)
- Chat area: fluid, fills remaining space
- Message content: max-width 768px, centered
- Welcome screen: max-width 640px, centered
- Prompt grid: 2 columns on desktop, 1 on mobile

### Whitespace Philosophy
- **Breathing room in chat**: Messages have generous vertical spacing. The chat area never feels cramped.
- **Compact sidebar**: Thread list is dense but scannable — tight vertical rhythm with clear active states.
- **Centered focus**: Message content and welcome screen are narrow and centered, creating a reading-optimized column with comfortable margins.

### Border Radius Scale
- Micro (4px): Inline code, tiny badges
- Small (6px): Icon buttons, thread items, small controls
- Standard (8px): Primary buttons, cards, inputs
- Comfortable (10px): Prompt chips, larger cards
- Message (12px): Chat bubbles, message input
- Pill (9999px): Status badges, upgrade button

## 6. Depth & Elevation

| Level | Light Theme | Dark Theme | Use |
|-------|-------------|------------|-----|
| Flat (0) | No shadow | No shadow | Text content, inline elements |
| Subtle (1) | `rgba(0,0,0,0.04) 0 1px 3px` | `1px solid rgba(255,255,255,0.04)` | Thread items, subtle containers |
| Card (2) | `rgba(0,0,0,0.08) 2px 4px 24px` | `1px solid rgba(255,255,255,0.06)` | Prompt chips, cards — the signature Apple shadow |
| Card Hover (2.5) | `rgba(0,0,0,0.14) 3px 5px 30px` | Border brightens to `0.10` | Interactive cards on hover — lifts toward user |
| Elevated (3) | `rgba(0,0,0,0.06) 0 2px 8px, rgba(0,0,0,0.04) 0 0 0 1px` | `rgba(0,0,0,0.4) 0 2px 12px` | Message input, model selector |
| Popover (4) | `rgba(0,0,0,0.12) 0 8px 32px, rgba(0,0,0,0.04) 0 0 0 1px` | `rgba(0,0,0,0.5) 0 4px 20px` | Dropdowns, menus, profile popover |
| Focus | `0 0 0 2px rgba(255,69,0,0.2), 0 0 0 1px rgba(255,69,0,0.4)` | `0 0 0 2px rgba(255,69,0,0.15), 0 0 0 1px rgba(255,69,0,0.3)` | Keyboard focus on all interactive elements |

**Shadow Philosophy**: In light mode, shadows are Apple-inspired — wide, soft, diffused, slightly offset. They create a natural "studio lighting" effect where elements feel like physical objects on a desk. On hover, the shadow deepens and spreads, making the element feel like it's lifting toward your finger. In dark mode, shadows are replaced by border luminance — brighter borders on elevated surfaces, since shadows are invisible on dark backgrounds.

## 7. Do's and Don'ts

### Do
- Use Reddit Orangered (`#ff4500`) ONLY for interactive elements — it must be the singular accent
- Apply Apple-style diffused shadows on light theme cards (`2px 4px 24px` at 0.08 opacity)
- Transition shadows smoothly on hover (0.3s ease) for a tactile lift effect
- Use warm grays with cream/beige undertones — never blue-tinted grays
- Keep Plus Jakarta Sans as the sole UI font; JetBrains Mono only for code/technical context
- Enable `"ss01"` OpenType features for cleaner letterforms
- Compress headline letter-spacing (-1.5px to -2px at display sizes)
- Use semi-transparent borders (`rgba` with 0.06 opacity) instead of hard hex borders
- Give the message input an elevated treatment — it's the most important interactive element

### Don't
- Don't introduce purple, blue-gradient, or any second accent color — the chromatic budget is Orangered only
- Don't use flat, hard borders (`border-gray-200`) — always use semi-transparent `rgba` borders
- Don't load more than 2 font families — strip Inter, Space Grotesk, Outfit, DM Sans, Syne
- Don't use pure black (`#000000`) text on light backgrounds — always near-black (`#1a1a1c`)
- Don't use pure white (`#ffffff`) text on dark backgrounds for body copy — use `#ededef`
- Don't apply the same shadow treatment in dark mode as light mode — dark mode uses border luminance
- Don't round anything beyond 12px except pills (9999px) — no 16px, 20px, 32px radius on rectangular elements
- Don't use color-coded category icons (orange, blue, green, yellow) — all icons should be secondary text color, Orangered only on active
- Don't make cards borderless in dark mode — they need `rgba(255,255,255,0.06)` borders to be visible
- Don't use gradients except for the single Upgrade button — solid colors everywhere else

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Sidebar collapses to overlay, single-column prompts, full-width input |
| Tablet | 640-1024px | Sidebar collapsed by default, 2-column prompts |
| Desktop | >1024px | Sidebar expanded, 2-column prompts, full layout |

### Touch Targets
- Primary buttons: minimum 36px height, 44px recommended
- Sidebar thread items: 36px minimum height with 8px vertical padding
- Icon buttons: 32px minimum (padding creates the target area)
- Message input: 48px minimum height for comfortable typing

### Collapsing Strategy
- Sidebar: slides off-screen on mobile as an overlay with backdrop blur
- Prompt grid: 2 columns → 1 column at 640px
- Message content: max-width shrinks from 768px to full-width with 16px padding
- Model selector: moves to a compact icon-only mode on mobile
- Welcome heading: 28px → 22px on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Brand accent: `#ff4500` (Reddit Orangered)
- Light page bg: `#ffffff`, secondary: `#f8f7f6`, tertiary: `#f0efed`
- Dark page bg: `#0c0c0d`, sidebar: `#141416`, elevated: `#1b1b1e`
- Light text: `#1a1a1c` primary, `#5c5c64` secondary, `#8c8c94` tertiary
- Dark text: `#ededef` primary, `#a0a0a8` secondary, `#6b6b74` tertiary
- Card shadow (light): `rgba(0, 0, 0, 0.08) 2px 4px 24px 0px`
- Card shadow hover (light): `rgba(0, 0, 0, 0.14) 3px 5px 30px 0px`
- Border: `rgba(0, 0, 0, 0.06)` light, `rgba(255, 255, 255, 0.06)` dark
- Focus ring: `0 0 0 2px rgba(255, 69, 0, 0.2), 0 0 0 1px rgba(255, 69, 0, 0.4)`

### CSS Variables Template
```css
:root {
  --rc-brand: #ff4500;
  --rc-brand-hover: #e63e00;
  --rc-brand-soft: rgba(255, 69, 0, 0.10);
  --rc-brand-glow: rgba(255, 69, 0, 0.04);

  --rc-bg: #ffffff;
  --rc-bg-secondary: #f8f7f6;
  --rc-bg-tertiary: #f0efed;
  --rc-bg-hover: #e8e7e5;

  --rc-text: #1a1a1c;
  --rc-text-secondary: #5c5c64;
  --rc-text-tertiary: #8c8c94;

  --rc-border: rgba(0, 0, 0, 0.06);
  --rc-border-emphasis: rgba(0, 0, 0, 0.10);

  --rc-shadow-card: rgba(0, 0, 0, 0.08) 2px 4px 24px 0px;
  --rc-shadow-card-hover: rgba(0, 0, 0, 0.14) 3px 5px 30px 0px;
  --rc-shadow-elevated: rgba(0, 0, 0, 0.06) 0px 2px 8px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --rc-shadow-popover: rgba(0, 0, 0, 0.12) 0px 8px 32px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;

  --rc-radius-sm: 6px;
  --rc-radius: 8px;
  --rc-radius-lg: 10px;
  --rc-radius-xl: 12px;
  --rc-radius-pill: 9999px;
}

.dark {
  --rc-bg: #0c0c0d;
  --rc-bg-secondary: #141416;
  --rc-bg-tertiary: #1b1b1e;
  --rc-bg-hover: #222226;

  --rc-text: #ededef;
  --rc-text-secondary: #a0a0a8;
  --rc-text-tertiary: #6b6b74;

  --rc-border: rgba(255, 255, 255, 0.06);
  --rc-border-emphasis: rgba(255, 255, 255, 0.10);

  --rc-shadow-card: none;
  --rc-shadow-card-hover: none;
  --rc-shadow-elevated: rgba(0, 0, 0, 0.4) 0px 2px 12px 0px;
  --rc-shadow-popover: rgba(0, 0, 0, 0.5) 0px 4px 20px 0px;
}
```

### Font Loading
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Example Component Prompts
- "Style the New Chat button: #ff4500 background, white text, 14px Plus Jakarta Sans weight 500, 8px radius, 8px 16px padding. On hover: #e63e00 background with shadow rgba(255,69,0,0.25) 0px 4px 12px."
- "Style prompt chips on light theme: white background, NO border, shadow rgba(0,0,0,0.08) 2px 4px 24px, 10px radius. On hover: shadow deepens to rgba(0,0,0,0.14) 3px 5px 30px with transition 0.3s ease."
- "Style the sidebar: #f8f7f6 background (light) or #141416 (dark), right border rgba(0,0,0,0.06). Active thread: rgba(255,69,0,0.10) background with 2px left border in rgba(255,69,0,0.4)."
- "Style the message input: white background, border rgba(0,0,0,0.10), shadow rgba(0,0,0,0.06) 0 2px 8px, 12px radius. On focus: orange ring 0 0 0 2px rgba(255,69,0,0.2), 0 0 0 1px rgba(255,69,0,0.4)."

### Iteration Guide
1. Every interactive element gets Orangered (`#ff4500`) — no purple, no blue, no gradients (except Upgrade pill)
2. Light mode cards use Apple-style diffused shadows with hover lift transitions
3. Dark mode cards use border luminance instead of shadows
4. Warm grays only — `#f8f7f6` not `#f5f5f5`, `#1a1a1c` not `#171717`
5. Two fonts maximum: Plus Jakarta Sans + JetBrains Mono
6. Semi-transparent borders everywhere — never hard hex borders
7. Focus rings are always Orangered-tinted — this ties accessibility to brand
8. Message input is the hero element — it gets elevated treatment (shadow + border + generous padding)
