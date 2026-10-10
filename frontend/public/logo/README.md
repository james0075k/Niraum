# Logo files — supplied by Niraum Metals (do not redraw or recolour)

**Status: supplied 10 Oct 2026.** The official files live in
`frontend/src/assets/site/brand/` (bundled by Vite):

| File                                | Use                                                 |
| ----------------------------------- | --------------------------------------------------- |
| `Brand_Logo_Full_Transparent.png`   | Full lockup (emblem + NIRAUM METALS), portrait      |
| `Brand_Logo_Emblem_Transparent.png` | Emblem only — navbar, footer, favicons, map marker  |
| `Brand_Logo_Full.png` / `.webp`     | Full lockup on off-white                            |
| `Brand_Logo_Emblem.png` / `.webp`   | Emblem on off-white                                 |

The emblem is charcoal + copper, so on dark backgrounds it sits on an off-white tile
(`components/common/Logo.tsx`) instead of being recoloured.

`public/` icons — `favicon.ico` (16/32/48), `favicon.svg` (64 px PNG inside SVG),
`apple-touch-icon.png` (180), `android-chrome-192x192.png`, `android-chrome-512x512.png` and
`og-image.jpg` (1200×630) — were generated from these files with sharp. An admin-uploaded logo
(SiteSettings.logo light + dark) still takes precedence in the navbar.
