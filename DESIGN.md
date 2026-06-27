---
name: Kisan Alert
colors:
  surface: '#fff8f6'
  surface-dim: '#e0d8d6'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ef'
  surface-container: '#f4ecea'
  surface-container-high: '#efe6e4'
  surface-container-highest: '#e9e1de'
  on-surface: '#1e1b1a'
  on-surface-variant: '#504440'
  inverse-surface: '#33302e'
  inverse-on-surface: '#f7efec'
  outline: '#82746f'
  outline-variant: '#d4c3bd'
  surface-tint: '#765749'
  primary: '#432a1e'
  on-primary: '#ffffff'
  primary-container: '#5c4033'
  on-primary-container: '#d3ac9c'
  inverse-primary: '#e6bead'
  secondary: '#885200'
  on-secondary: '#ffffff'
  secondary-container: '#fead4c'
  on-secondary-container: '#704200'
  tertiary: '#003818'
  on-tertiary: '#ffffff'
  tertiary-container: '#105129'
  on-tertiary-container: '#83c38f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#e6bead'
  on-primary-fixed: '#2c160b'
  on-primary-fixed-variant: '#5c4033'
  secondary-fixed: '#ffddbb'
  secondary-fixed-dim: '#ffb868'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#673d00'
  tertiary-fixed: '#b0f2bb'
  tertiary-fixed-dim: '#95d5a0'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#105229'
  background: '#fff8f6'
  on-background: '#1e1b1a'
  surface-variant: '#e9e1de'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  data-point-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is engineered for civic utility and clarity, specifically tailored for agricultural monitoring and distress management. The brand personality is grounded, authoritative, yet approachable, evoking the stability of government infrastructure. 

The aesthetic follows a **Modern Corporate** approach with a **Flat** execution. It prioritizes legibility and information density over decorative elements. By avoiding gradients and shadows, the UI achieves a "printed paper" quality that feels reliable and permanent. The emotional response is one of calm, focused efficiency—essential for users managing high-stress agricultural data. High contrast and a parchment-based palette ensure the dashboard remains comfortable for long-term daytime use.

## Colors
The palette is rooted in the natural landscape of the agricultural sector, using earthy, high-contrast tones to differentiate data states.

- **Primary (Soil Brown):** Used for global navigation, headers, and primary structural text to provide a sense of grounded authority.
- **Action (Turmeric):** Dedicated exclusively to primary actions and interactive highlights.
- **Success/Low Stress (Rice-Paddy Green):** Indicates stable regions or positive agricultural metrics.
- **Alert/High Stress (Clay Red):** A muted, dusty red used for critical distress signals. It is highly visible without being visually alarming.
- **Backgrounds:** The "Parchment" shade acts as the page canvas, while "Cream" provides a subtle lift for card surfaces, creating a layered hierarchy without the need for shadows.
- **Typography:** "Charcoal Ink" is used for long-form body text to ensure maximum readability against the cream/parchment backgrounds.

## Typography
The typographic system uses a tri-font strategy to separate structural navigation, narrative content, and quantitative data.

- **Space Grotesk** is used for headlines, section titles, and labels. Its geometric, technical character reinforces the "infrastructure" feel of the system.
- **Inter** handles all body copy, descriptions, and standard UI elements (buttons, menus) to provide a neutral, highly legible reading experience.
- **JetBrains Mono** is strictly reserved for numeric data, dates, and codes. Its monospaced nature ensures that columns of figures align perfectly in tables and dashboard widgets, facilitating quick scanning of agricultural metrics.

## Layout & Spacing
The system employs a **Fixed Grid** on desktop and a **Fluid Grid** on mobile devices. 

- **Desktop (1440px+):** A 12-column grid with a max-width of 1280px. Gutters are fixed at 24px.
- **Tablet (768px - 1439px):** 8-column fluid grid with 24px margins.
- **Mobile (< 767px):** 4-column fluid grid with 16px margins.

Spacing follows a 4px baseline, with most components using 8px (XS), 16px (SM), or 24px (MD) increments. Information-dense dashboards should utilize the SM spacing for internal card padding, while page-level sections should use LG spacing to maintain a "calm" atmosphere.

## Elevation & Depth
In alignment with the flat design philosophy, this design system **does not use shadows or blurs**. Depth is conveyed exclusively through **Tonal Layering** and **High-Contrast Outlines**.

- **Level 0 (Background):** Parchment (#F3EDE0).
- **Level 1 (Cards/Content Blocks):** Cream (#FBF8F1) with a 1px solid border in Soil Brown (#5C4033) at 10% opacity.
- **Level 2 (Active/Hover):** Cream (#FBF8F1) with a 2px solid border in Turmeric (#D98E2F).

Interactive elements rely on color shifts rather than physical elevation to signal state changes.

## Shapes
The shape language is controlled and systematic. Rounded corners are used moderately to prevent the UI from feeling "sharp" or unfriendly, while remaining structured enough for a government tool.

- **Cards and Dashboard Containers:** 12px radius. This softens the large data blocks.
- **Action Elements (Buttons, Selectors):** 8px radius. This provides a clear visual distinction from the layout containers.
- **Form Inputs:** 6px radius for a tighter, more precise appearance.

## Components

### Buttons
- **Primary:** Turmeric background, Soil Brown text (or white for high contrast), 8px radius, bold Inter. No shadow.
- **Secondary:** Transparent background, Soil Brown border (2px), 8px radius.
- **Distress Action:** Clay Red background, Cream text, used only for emergency reporting.

### Cards
- Cream background, 12px radius. Use a 1px border (#5C4033 at 15%) to define edges against the parchment background.
- Card headers should use Space Grotesk in Soil Brown.

### Data Tables
- Header row: Parchment background, Space Grotesk labels in All Caps.
- Cell data: JetBrains Mono for numbers, Inter for text. 
- Use subtle horizontal dividers (1px Soil Brown, 10% opacity); no vertical dividers.

### Inputs & Selectors
- Background: White (#FFFFFF) to differentiate from the Cream surface.
- Border: 1px solid Soil Brown (#5C4033).
- Active state: 2px solid Turmeric border.

### Status Chips
- **Low Stress:** Rice-Paddy Green background (20% opacity), Rice-Paddy Green text, 4px radius.
- **High Stress:** Clay Red background (20% opacity), Clay Red text, 4px radius.