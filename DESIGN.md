---
name: Office Watch
description: A friendly, approachable dashboard for monitoring office electrical usage
colors:
  base: #EEE7DA
  surface: #F8F3E5
  surface-2: #F1EADB
  ink: #1B1A17
  ink-2: #3A362D
  ink-3: #6E6757
  ink-4: #A39A86
  amber: #C77A18
  amber-2: #E09538
  amber-soft: #F4DDB1
  amber-glow: rgba(224,149,56,0.22)
  amber-line: rgba(199,122,24,0.32)
  rose: #A94338
  rose-2: #C2614F
  rose-soft: #F0D4C9
typography:
  display:
    fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.02em
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  mono:
    fontFamily: "'Fira Code', ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
---

# Design System: Office Watch

## 1. Overview

**Creative North Star: "Viltrum Office"**

in the middle friendly warm but professional

The Office Watch design system is friendly and approachable with a touch of industrial clarity. It avoids cold clinical feels and excessive charts, focusing on visual feedback and ease of understanding at a glance. The system is designed for office staff and bosses who need a clear, live picture of office electrical usage, with intuitive representations of device states (e.g., glowing lights, spinning fans).

**Key Characteristics:**
- Friendly and approachable aesthetic
- Visual feedback for device states (glowing lights, spinning fans)
- Clarity and at-a-glance understanding
- Real-time responsiveness
- Accessibility first (WCAG 2.1 AA compliance)

## 2. Colors

The Amber Glow palette provides a warm, inviting accent that stands out against neutral backgrounds, creating a friendly yet professional atmosphere.

### Primary
- **Amber Glow** (#C77A18): Used for primary actions, current selection, and state indicators (e.g., active circuits, power metrics, hover states). Its warmth draws attention to important interactive elements.

### Secondary
- **Amber 2** (#E09538): A lighter variant of the primary accent used for secondary actions and subtle highlights.

### Tertiary
- **Rose** (#A94338): Used for alerts, warnings, and error states to convey urgency without being overly aggressive.

### Neutral
- **Base** (#EEE7DA): The page background color, providing a warm, off-white canvas that reduces glare.
- **Surface** (#F8F3E5): The background color for cards, containers, and elevated surfaces, offering a slight contrast to the base for layering.
- **Surface-2** (#F1EADB): Used for even more elevated surfaces or to create subtle depth within cards.
- **Ink** (#1B1A17): Primary text color for high-readability content.
- **Ink-2** (#3A362D): Secondary text for less prominent information.
- **Ink-3** (#6E6757): Tertiary text for hints, disabled states, or supplementary details.
- **Ink-4** (#A39A86): Hint text and borders, providing the lowest contrast neutral for separators and dividers.
- **Amber Soft** (#F4DDB1): A soft background tint for accent-related elements, such as hover states or active indicators.
- **Amber Glow (rgba)**: Used for glow effects around active lights and indicators.
- **Amber Line (rgba)**: Used for subtle accent borders on interactive elements.

### Named Rules
**The Amber Glow Rule.** The primary accent color is used on ≤10% of any given screen to maintain its visual significance and avoid overwhelming the warm neutral base.

## 3. Typography

**Display Font:** Bebas Neue, Impact, 'Arial Narrow', sans-serif (with fallback to any sans-serif)
**Body Font:** Plus Jakarta Sans, system-ui, -apple-system, sans-serif (with fallback to any sans-serif)
**Label/Mono Font:** Fira Code, ui-monospace, monospace (with fallback to any monospace)

**Character:** The pairing combines a bold, industrial-inspired display font for headlines and metrics with a highly readable, geometric sans-serif for body text, creating a balance of character and clarity. The monospace font is used for code and technical details, adding a touch of precision.

### Hierarchy
- **Display** (400, 64px, 1, 0.02em): Used for large metrics like power consumption values and the brand mark, where immediate visual impact is needed.
- **Headline** (400, 30px, 1.2, 0): Used for section titles like "The office blueprint" and "Est. today", providing clear section hierarchy.
- **Title** (400, 20px, 1.2, 0): Used for room names (e.g., "Drawing Room", "Work Room 1"), ensuring readability at smaller sizes.
- **Body** (400, 14px, 1.55, 0): Used for most paragraph text, labels, and tooltips, optimized for readability at the base font size.
- **Label** (400, 9px, 1, 0.08em, uppercase): Used for data labels, section metadata, and UI elements like "Circuits on" and "Watts live", where compact, uppercase labels are needed.

### Named Rules
**The Single Sans Rule.** The body and label fonts share the same sans-serif family (Plus Jakarta Sans) to ensure visual harmony and readability across the interface, reserving the display font for moments that need emphasis.

## 4. Elevation

The system uses a flat design with subtle shadows to convey depth and interactivity, avoiding excessive layering that could clutter the interface.

### Shadow Vocabulary
- **Ambient Low** (`box-shadow: 0 1px 0 rgba(27,26,23,0.06), 0 2px 8px -2px rgba(27,26,23,0.06)`): Applied to elements like the app header and meta bar to create a subtle separation from the content below.
- **Elevation Medium** (`box-shadow: 0 2px 0 rgba(27,26,23,0.08), 0 12px 32px -16px rgba(27,26,23,0.18)`): Used for cards, containers, and panels (e.g., stat tiles, power meter, alerts panel) to lift them slightly off the background, indicating they are interactive surfaces.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus) or to define surface hierarchy, ensuring that motion and depth serve a functional purpose.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (8px radius)
- **Primary:** Amber Glow background with Ink text, padding 16px 48px, letter-spacing 0.02em, text-transform uppercase
- **Hover / Focus:** Background shifts to a slightly brighter Amber Glow (or Amber 2) with a soft glow effect; focus ring uses Amber Glow outline
- **Secondary / Ghost:** Transparent background with Ink text and Amber Glow border on hover/focus

### Cards / Containers
- **Corner Style:** Slightly rounded (8px radius)
- **Background:** Surface color (#F8F3E5) for standard containers, Surface-2 (#F1EADB) for elevated containers
- **Shadow Strategy:** References the Elevation section (Ambient Low and Medium shadows)
- **Border:** None for most containers; Ink-4 (1px) used for dividers within cards when needed
- **Internal Padding:** Spacing scale (16px for vertical, 24px for horizontal) adjusted per container type

### Inputs / Fields
- **Style:** Transparent background, Ink-4 border (1px), 8px radius, padding 10px 14px
- **Focus:** Border shifts to Amber Glow, with a soft glow effect; background remains transparent
- **Error / Disabled:** Error state uses Rose text and border; disabled state uses Ink-4 text and border with reduced opacity

### Navigation
- **Style:** Horizontal layout with Amber Glow accents for active items; text uses Ink for inactive items and Amber Glow for active
- **Typography:** Body font for labels, Display font for section headers in navigation
- **Default/Hover/Active States:** Active items use Amber Glow background and Ink text; hover states use Amber Glow background at 10% opacity
- **Mobile Treatment:** Collapses to a vertical stack with increased touch targets (minimum 48px)

### [Signature Component] (optional)
**Device Node:** The visual representation of electrical devices (fans and lights) is a signature component that embodies the system's friendly and approachable aesthetic.
- **Shape:** Circular nodes with a 48px diameter for fans and 44px for lights
- **Color Assignment:** Nodes use Ink-4 in off state; shift to Amber Glow background and Amber text when on, with additional glow effects for lights and spinning animations for fans
- **State:** Off nodes are subtle; on nodes are vibrant and animated to convey activity clearly
- **Distinctive Behavior:** Fans animate with a spinning blade effect when on; lights pulse with a glow effect to simulate illumination

## 6. Do's and Don'ts

### Do:
- **Do** use Amber Glow for primary actions and state indicators, keeping its usage to ≤10% of the screen to maintain visual significance.
- **Do** use Surface and Surface-2 for card and container backgrounds to create subtle elevation without relying solely on shadows.
- **Do** use the Bebas Neue display font for large metrics and the brand mark to add character and immediate visual impact.
- **Do** use glowing effects (Amber Glow rgba) for lights when on and spinning animations for fans to convey state intuitively.
- **Do** ensure all interactive components have clear hover, focus, active, and disabled states, using Amber Glow and Rose for feedback.

### Don't:
- **Don't** use cold, clinical, hospital-like dashboards with excessive charts and graphs; avoid blue-heavy palettes and sterile layouts.
- **Don't** use overly playful or toy-like interfaces; avoid bright, saturated colors that undermine the professional context.
- **Don't** reinvent standard affordances (e.g., custom scrollbars or non-standard modals); use native button and input behaviors.
- **Don't** use decorative motion that doesn't convey state; all animations should reflect device status or user interaction.
- **Don't** use text with insufficient contrast; always verify that text meets WCAG 2.1 AA against its background (e.g., Ink on Base: 12.6:1, Ink-2 on Surface: 8.3:1).