# Design System Specification: Editorial Financial Intelligence

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**

This design system moves beyond the "generic SaaS dashboard" by adopting a high-end editorial aesthetic. We treat financial data not as a cluttered spreadsheet, but as a curated architectural space. The system prioritizes **intentional whitespace, tonal depth, and typographic authority** over traditional structural lines. 

By utilizing "Organic Asymmetry"—where layout elements are weighted with purpose rather than rigid, centered grids—we create a sense of bespoke craftsmanship. We break the "template" look by layering surfaces like fine stationery, ensuring the user feels they are interacting with a premium advisory service, not just a tool.

---

## 2. Colors & Surface Philosophy
The palette is rooted in `primary` (#00236f) to establish institutional trust, balanced by `tertiary` emerald tones for growth.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. 
*   **Method:** Define boundaries solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation necessary.
*   **Exception:** If a boundary is vital for accessibility, use a "Ghost Border"—the `outline-variant` token at 15% opacity.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials.
*   **Base:** `surface` (#f8f9ff)
*   **Sub-sections:** `surface-container-low` (#eff4ff)
*   **Elevated Content (Cards):** `surface-container-lowest` (#ffffff)
*   **Interaction Layers:** `surface-container-high` (#dde9ff)

### The "Glass & Gradient" Rule
To inject "soul" into the data-heavy interface:
*   **Signature Gradients:** Use a subtle linear transition from `primary` (#00236f) to `primary-container` (#1e3a8a) for hero components or primary CTAs.
*   **Glassmorphism:** For floating menus or sidebar overlays, use `surface` with 80% opacity and a `20px` backdrop blur. This ensures the underlying data "bleeds" through, maintaining context and softness.

---

## 3. Typography
We use **Inter** as a variable font to create a hierarchy that feels like a premium financial journal.

*   **Display (lg/md):** Reserved for high-level total portfolio values. Tracking: `-0.02em`. Weight: `700`.
*   **Headline (sm/md):** Used for section titles. These should have generous `margin-bottom` (Scale 8 or 10) to let the data breathe.
*   **Title (md):** Used for metric card labels. Pairing `title-md` with `label-sm` in `on-surface-variant` creates a professional contrast.
*   **Body (md):** Our workhorse. High line-height (1.6) is mandatory to ensure financial legibility.
*   **Label (sm):** Used for micro-data and captions. Always uppercase with `0.05em` letter spacing for an "official" feel.

---

## 4. Elevation & Depth
We eschew the "drop shadow" defaults for **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift.
*   **Ambient Shadows:** If a card must float (e.g., a modal or active metric), use a multi-layered shadow: `0px 20px 40px rgba(13, 28, 47, 0.06)`. The color is a tint of `on-surface`, never pure black.
*   **Corner Radii:** Strictly adhere to the **XL (1.5rem/24px)** for parent containers and **LG (1rem/16px)** for internal components like buttons and metric cards. This "nested rounding" creates a sophisticated, modern silhouette.

---

## 5. Components

### Metric Cards (High-Growth)
*   **Structure:** No borders. Background: `surface-container-lowest`. 
*   **Growth Indicator:** Positive trends use `on-tertiary-container` (#27c38a) text on a `tertiary-container` (#004a31) soft pill.
*   **Spacing:** Internal padding must be `spacing-6` (1.5rem) minimum.

### Data Tables (The Ledger Style)
*   **Constraint:** Forbid the use of vertical or horizontal divider lines.
*   **Separation:** Use alternating row fills of `surface` and `surface-container-low`.
*   **Header:** `label-md` in `on-surface-variant`, all-caps, with a `2px` bottom clearance of `primary`.

### Sidebar Navigation
*   **Visual Style:** A vertical pillar of `surface-container-low`. 
*   **Active State:** Do not use a box. Use a `4px` vertical "ink-bar" of `primary` on the far left and transition the text weight to `600`.

### Form Elements
*   **Inputs:** `surface-container-highest` background. No border. On focus, transition the background to `surface-container-lowest` with a "Ghost Border" of `primary`.
*   **Buttons:** 
    *   *Primary:* Gradient fill (`primary` to `primary-container`), white text, `XL` roundedness.
    *   *Secondary:* `surface-container-high` fill, `on-surface` text. No border.

### Contextual Components (Special Addition)
*   **Trend Sparklines:** Ultra-thin (1.5px) vector lines using `tertiary-fixed-dim` (#4edea3) with a subtle glow (blur) effect to indicate financial vitality.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins to create focal points for key financial metrics.
*   **Do** lean into `surface-container` shifts to group related data points.
*   **Do** use `inter` Medium (500) for body text to maintain "authority" on light backgrounds.

### Don’t:
*   **Don’t** use a 1px #CCCCCC border—ever. It cheapens the "Architectural Ledger" feel.
*   **Don’t** crowd the screen. If a page feels full, increase the `spacing` scale values.
*   **Don’t** use pure black (#000) for text. Always use `on-surface` (#0d1c2f) to maintain the Deep Navy tonal depth.
*   **Don’t** use standard "Success Green." Use the specified `tertiary` palette which is tuned for professional financial contexts.