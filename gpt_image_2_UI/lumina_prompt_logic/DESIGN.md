---
name: Lumina Prompt Logic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 48px
  container-max: 1440px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built upon a **Minimalist-Gallery** aesthetic, merging the precision of developer tools with the expansive breathing room of a high-end art exhibition. The personality is quiet yet authoritative, designed to vanish into the background so that the generated visual imagery takes center stage.

The emotional response should be one of "infinite clarity"—an organized sanctuary for creative prompts. It avoids decorative fluff in favor of structural integrity, utilizing heavy whitespace and a strict adherence to a grid to signify professional reliability. The interface feels like a sophisticated canvas, where interaction is intentional and feedback is crisp.

## Colors

The palette is anchored by **Slate (Primary)** for high-contrast typography and structural elements, ensuring a grounded, editorial feel. The background is a **Clean White**, serving as a neutral stage for vibrant image previews.

**Electric Blue (Secondary)** is reserved exclusively for interactive states—hovers, active selections, and primary call-to-actions—providing a surgical strike of color that guides the eye. **Cool Grey (Tertiary)** is used for metadata, prompt parameters, and secondary information to maintain a clear hierarchy of content.

## Typography

This design system utilizes a tiered typographic approach to ensure Chinese characters are rendered with maximum legibility while maintaining a technical edge. 

- **Manrope** is used for headlines, providing a refined, geometric stability.
- **Inter** handles the bulk of body text and prompt descriptions, selected for its exceptional performance in both English and CJK (Chinese, Japanese, Korean) environments when paired with system-level sans-serif fallbacks.
- **Space Grotesk** is applied to labels, tags, and technical parameters to evoke a "developer-tool" precision.

Text contrast is strictly managed: Slate for primary content, Slate-600 for descriptions, and Slate-400 for utility text.

## Layout & Spacing

The layout follows a **Fixed-Grid philosophy** on desktop, centered within a maximum container width of 1440px to prevent prompt strings from becoming unreadably wide. A 12-column grid is employed for the gallery view, allowing for flexible card densities (2, 3, or 4 columns).

The spacing rhythm is based on a 4px baseline, but defaults to generous "breathing" gaps. Use the `margin` of 48px to separate major sections, ensuring that the visual imagery never feels crowded. Internal card padding should be a consistent 24px (stack-md + stack-sm) to maintain a luxurious, gallery-like proportion.

## Elevation & Depth

To maintain the minimalist aesthetic, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

1.  **Level 0 (Base):** Clean White (#FFFFFF).
2.  **Level 1 (Cards/Containers):** A 1px border in Slate-100 or a subtle background shift to Neutral (#F8FAFC).
3.  **Level 2 (Interaction):** When hovering over a prompt card, apply a soft, ambient shadow (10% opacity Slate) and a 1px Electric Blue border to indicate focus.

Glassmorphism is used sparingly—only for sticky navigation bars or floating action buttons—to provide a sense of context without distracting from the images.

## Shapes

The design system adopts a **Soft (Level 1)** shape language. The subtle 0.25rem (4px) corner radius provides just enough approachability to feel modern without losing the "professional tool" edge that sharp corners imply.

- **Primary Buttons:** 4px radius.
- **Image Containers:** 8px radius (`rounded-lg`) to soften the visual impact of the AI-generated art.
- **Input Fields:** 4px radius for a crisp, technical look.
- **Tags/Chips:** Fully pill-shaped to differentiate them from functional buttons.

## Components

- **Buttons:** Primary buttons use a solid Slate background with White text. Secondary buttons use a transparent background with an Electric Blue outline.
- **Prompt Cards:** Large image preview on top, followed by a metadata section. The prompt text itself is presented in a "Copy-on-Click" block using the `code-snippet` type style.
- **Chips (Tags):** Small, low-contrast pills (Slate-100 background) used for categorizing prompts by "Art Style," "Model Version," or "Lighting."
- **Input Fields:** Minimalist design with only a bottom border that transforms into a full 1px Electric Blue outline upon focus.
- **Copy Utility:** A dedicated component for the prompt library—a discrete "Copy" icon that appears on hover over any prompt string, providing instant feedback via a small "Copied!" tooltip in Electric Blue.
- **Image Lightbox:** When an image is clicked, it opens in a full-screen, high-contrast modal with a black background to eliminate all distractions and focus entirely on the visual output.