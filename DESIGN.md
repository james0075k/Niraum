---
name: Forged Heritage
colors:
  surface: '#111418'
  surface-dim: '#111418'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0e12'
  surface-container-low: '#191c20'
  surface-container: '#1d2024'
  surface-container-high: '#272a2f'
  surface-container-highest: '#323539'
  on-surface: '#e1e2e8'
  on-surface-variant: '#d6c3b8'
  inverse-surface: '#e1e2e8'
  inverse-on-surface: '#2e3135'
  outline: '#9e8d83'
  outline-variant: '#51443c'
  surface-tint: '#fbb88a'
  primary: '#fbb98b'
  on-primary: '#4e2604'
  primary-container: '#dd9e72'
  on-primary-container: '#613511'
  inverse-primary: '#85522d'
  secondary: '#ffb689'
  on-secondary: '#512400'
  secondary-container: '#733500'
  on-secondary-container: '#f9a065'
  tertiary: '#b9c8dc'
  on-tertiary: '#233241'
  tertiary-container: '#9eadc1'
  on-tertiary-container: '#334151'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#fbb88a'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#693b18'
  secondary-fixed: '#ffdbc7'
  secondary-fixed-dim: '#ffb689'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#733500'
  tertiary-fixed: '#d5e4f9'
  tertiary-fixed-dim: '#b9c8dc'
  on-tertiary-fixed: '#0d1d2b'
  on-tertiary-fixed-variant: '#3a4859'
  background: '#111418'
  on-background: '#e1e2e8'
  surface-variant: '#323539'
  slate-surface: '#14171C'
  iron-depth: '#0A0D10'
  copper-glow: '#F0B892'
  copper-deep: '#82461D'
  ore-highlight: '#E8D8CD'
  success-emerald: '#2E7D5B'
  warning-amber: '#D9822B'
typography:
  display-lg:
    fontFamily: Domine
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Domine
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 46px
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Domine
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Domine
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Domine
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Domine
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Domine
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-xl:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-tablet: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

This design system establishes an institutional, commanding presence tailored to the heavy metallurgy and resource extraction sector in the Himalayas. The visual identity merges the geological permanence of high-altitude rock strata with the precision engineering of refined copper and elemental iron. 

Rooted in a **Premium Industrial & Editorial Hybrid** aesthetic, the interface balances executive prestige with raw mechanical authority. Chiseled, classical serif typography provides historical gravitas, grounded alongside razor-sharp technical sans-serif text to convey geological legacy and metallurgical rigor. 

Visual surfaces layer deep slate iron with warm, polished copper accents. Micro-textures evoke brushed metal and crystalline mineral formations, while structural glass overlays reflect modern computational oversight in heavy extraction. The user experience evokes institutional trust, environmental stewardship, and generational permanence.

## Colors

The palette draws directly from native copper deposits embedded in dark ironstone and Himalayan metamorphic rock.

- **Primary (`#DD9E72`)**: Raw polished copper. Serves as the primary brand touchpoint for interactive targets, primary action states, key badges, and high-priority metrics.
- **Secondary (`#B86B35`)**: Smelted bronze. Used for directional indicators, hover gradients, and secondary accents that require metallurgical richness.
- **Tertiary (`#8C9BAE`)**: Geological slate. Used for precise technical markers, structural lines, unit measurements, and secondary data readouts.
- **Neutral (`#0F1216`)**: Deep basalt void. The bedrock of the interface in dark mode, supplemented by `slate-surface` (`#14171C`) for layered paneling and `iron-depth` (`#0A0D10`) for recessed wells.

In high-contrast scenarios, gradient transitions between `#DD9E72` and `#B86B35` apply exclusively to key focal items (such as hero metrics, active toggle tracks, and primary CTAs) to evoke brushed, heat-forged metal.

## Typography

The typographic hierarchy juxtaposes archival permanence with computational clarity. 

- **Domine** captures the historic, monumental presence of Himalayan stone carving and corporate lineage. It is reserved exclusively for display and heading levels (`display-*`, `headline-*`). Its sharp, bracketed serifs and sturdy proportions give operational statements and production statistics executive distinction.
- **Manrope** provides an unyielding, geometric baseline for analytical tables, operational readouts, and running body prose (`body-*`, `label-*`). Its open apertures and structured rhythm ensure high legibility under complex data visualizations and harsh field-computing environments.

Label styles leverage heightened letter-spacing and uppercase tracking for technical telemetry, metallurgy grade specifications, and operational statuses.

## Layout & Spacing

The layout is structured around an industrial 12-column grid system built for high-density telemetric reporting and wide editorial expanses.

- **Desktop (1200px+)**: 12 columns with `1.5rem` gutters and generous `3rem` canvas margins. Structural dashboards maximize horizontal real estate, while narrative reports lock inside an 1120px reading container.
- **Tablet (768px - 1199px)**: 8 columns with `1.5rem` gutters and `2rem` outer margins. Data panels stack into split halves, preserving tabular alignment.
- **Mobile (< 768px)**: 4 columns with `1rem` gutters and `1rem` margins. Complex operational controls compress into stacked vertical sheets with sticky bottom telemetry rails.

Spacing intervals reflect an 8px architectural grid. Component layouts prioritize structural cadence (`space-md`, `space-lg`), while macro narrative sections rely on expansive pacing (`space-2xl`, `space-3xl`) to establish an open, monumental scale.

## Elevation & Depth

Visual depth mirrors the layering of refined metal sheets upon solid bedrock, avoiding generic drop shadows in favor of ambient luminescence and frosted glass strata.

- **Bedrock Surface (Level 0)**: Base color `#0F1216` overlaid with a continuous 2% monochromatic mineral-grain noise to prevent digital sterile flatness.
- **Structural Glass Panels (Level 1)**: `#14171C` rendered at 80% opacity with `backdrop-filter: blur(20px)`. Outlined by a crisp `1px` border in copper at 15% opacity (`rgba(221, 158, 114, 0.15)`).
- **Elevated Controls & Floating Cards (Level 2)**: Semi-transparent charcoal (`#1C2128`, 88% opacity) accompanied by an ambient ground cast: `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(221, 158, 114, 0.25)`.
- **Modals & Overlays (Level 3)**: Supported by an intense obsidian backdrop blur (32px, `#07090B` at 75% opacity) and highlighted along the upper perimeter with an internal brushed copper hairline gradient (`linear-gradient(90deg, rgba(221,158,114,0.4) 0%, rgba(184,107,53,0.1) 100%)`).

## Shapes

The shape grammar adheres strictly to **Roundedness 1 (Soft)**. This preserves the chiseled, hard-hewn nature of extracted ore and cast ingots without leaving corners aggressively raw.

- **Standard Containers, Buttons & Inputs**: Carry an exact `0.25rem` (4px) corner radius. This conveys architectural solidity and mechanical reliability.
- **Structural Glass Cards & Metric Panels**: Utilize `rounded-lg` (`0.5rem` / 8px) to soften larger surface intersections while retaining clean vertical gutters.
- **Modals & Executive Flyouts**: Implement `rounded-xl` (`0.75rem` / 12px) to frame complex dashboard views gracefully.
- **Data Tags & Status Badges**: Strictly constrained to `0.25rem` (4px) to retain an engineered plate aesthetic; circular pills are prohibited.

## Components

### Buttons
- **Primary CTA**: Metal-forged finish. Linear gradient background (`135deg, #DD9E72 0%, #B86B35 100%`) with dark iron text (`#0F1216`), font weight 600, `0.25rem` radius, and 1px internal border (`rgba(255, 255, 255, 0.25)`). Hover triggers an ambient copper glow: `box-shadow: 0 0 18px rgba(221, 158, 114, 0.35)`.
- **Secondary (Technical Outline)**: Transparent background, 1px solid `#DD9E72`, text `#DD9E72`. Hover fills with `rgba(221, 158, 114, 0.08)`.
- **Ghost/Tertiary**: Slate iron text (`#8C9BAE`), borderless. Hover shifts text to `#DD9E72`.

### Chips & Status Badges
- Constructed as machined tags. Height 24px, radius `0.25rem`, padding `0 8px`.
- Background: `rgba(20, 23, 28, 0.9)` with a 1px border matched to the status indicator.
- Typography: `label-sm` in Manrope, uppercase with 0.08em letter-spacing.
- Production/Safety Status: Emerald (`#2E7D5B`), Caution/Smelting (`#D9822B`), Active Copper (`#DD9E72`).

### Input Fields
- Enclosed in an iron plate frame (`#14171C`, 1px border in `#2A303A`, radius `0.25rem`).
- Typography: `body-md` in Manrope, text `#E8D8CD` with placeholder in `#5A6575`.
- Focus State: Border transitions to `#DD9E72` accompanied by a subtle outer ring (`box-shadow: 0 0 0 1px #DD9E72`).

### Checkboxes & Radio Buttons
- Precision switches. Checkboxes are 18x18px squares with a `0.25rem` radius; radio buttons are 18x18px discs.
- Border: 1.5px solid `#8C9BAE` on `#14171C`. Checked state fills with copper gradient (`#DD9E72` to `#B86B35`) displaying an obsidian check mark or center pip.

### Cards & Telemetry Panels
- Backed by dark charcoal glass (`#14171C` at 85% opacity, backdrop blur 20px).
- Bounded by a crisp 1px hairline border (`rgba(221, 158, 114, 0.15)`).
- Header sections feature `headline-sm` in Domine paired with a copper section rule (1px bar trailing into transparency).

### Lists & Data Grids
- Alternating subtle iron rows (`transparent` vs `rgba(20, 23, 28, 0.4)`).
- Cell borders: 1px horizontal dividers in `rgba(140, 155, 174, 0.1)`.
- Header row set in `label-md` uppercase slate typography, anchored with a 1px copper bottom border.