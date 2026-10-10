# NIRAUM METALS PVT. LTD. — Website Master Blueprint

> **For the web designer and developer.** This one file holds all text copy, technical data, brand rules and photo placement for the Niraum Metals website. Version 2.0 — 10 Oct 2026. Replaces the brand brief in the Phase prompt pack where they differ.
>
> Items marked **[CONFIRM]** must be checked with the founder before going live. Do not publish them as fact until confirmed.

---

## 1. Company identity and contact

| Field                 | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Legal name            | NIRAUM METALS PVT. LTD. **[CONFIRM — letterhead footer says "Niraum Metals Limited"; use one name everywhere]**              |
| Tagline               | Strength Forged For Generations                                                                                              |
| Established           | 2026                                                                                                                         |
| Head office           | Lalitpur-13, Nepal                                                                                                           |
| Mine / project        | Katujpani Iron Deposit, Bakaiya Gaupalika-09, Makawanpur District, Bagmati Province, Nepal                                   |
| Topographic reference | Topo sheet 2785 10A · Main point Easting 627755.00 m, Northing 3033300.00 m · spot height 914 m                              |
| Business email        | niraummetals@gmail.com                                                                                                       |
| Phone / WhatsApp      | +977 985 109 0957 **[CONFIRM this number may be public as the company line]**                                                |
| Languages             | English / नेपाली toggle                                                                                                      |
| Primary goal          | Bulk supply inquiries from cement plants, steel/foundry buyers and mineral traders; credibility with institutional investors |

**Map pin note.** The mine coordinates are in the report's local grid (Easting/Northing on the Nepal topo sheet), not latitude/longitude. Do not convert them by guesswork. Ask the consultant for WGS-84 lat/long of the main point, then enter it in Admin → Settings → Map. Until then, show the head-office pin (Lalitpur-13) on the Contact map and the topo/lease map images on the Project page.

---

## 2. Founder

**Shivahari Pudasaini — Founder**
Businessman and investor based in Lalitpur, Nepal.

Approved bio copy (website, About → Leadership):

> Shivahari Pudasaini founded Niraum Metals to develop Nepal's iron ore resources responsibly. He has led Nepal Souvenir Craft and Trade, an exporter of Nepali handicrafts to international and European markets, since 2010, and invests across mining, hydropower and securities. He works with engineers, geologists and technical specialists to take the Katujpani project from study to commercial operation.

Other business interests (optional "Founder profile" panel, not the main page):

| Company                             | Role      | Sector               | Since |
| ----------------------------------- | --------- | -------------------- | ----- |
| Nepal Souvenir Craft and Trade      | President | Handicrafts & export | 2010  |
| Roadshow Securities Limited         | Investor  | Securities           | 2023  |
| Malta Bagmati Hydropower            | Investor  | Hydropower           | 2024  |
| Deshim Mines and Minerals Pvt. Ltd. | Investor  | Mining & minerals    | 2026  |
| Deshim Mineralium Energy            | Investor  | Hydropower           | 2026  |

- Photo: request a high-resolution portrait (the profile photo is too small for the web). Use a grey placeholder until then.
- Do **not** publish the personal email (sp9851090957@gmail.com) on the website.

**[CONFIRM] Lease holder.** The technical report is titled "Mine Scheme proposed by Ms Niru Upreti" and the maps say "Prepared for Mrs Niru Upreti, Dhunibesi-04, Dhading". Before the site says "our mine", confirm in writing that the Katujpani lease belongs to or is operated by Niraum Metals Pvt. Ltd., and how Ms Upreti should be credited (for example as a director or lease partner).

---

## 3. Brand and design system

Keep the system already built in Phases 1–4. Do not switch fonts now.

| Token                   | Hex                   | Use                               |
| ----------------------- | --------------------- | --------------------------------- |
| Copper (primary accent) | `#B8754A`             | Buttons, active tabs, key numbers |
| Copper light / deep     | `#DDA27C` / `#8A5236` | Gradient, highlights              |
| Charcoal slate          | `#2B2F36`             | Headers, text, structure          |
| Graphite                | `#14171C`             | Dark sections (raw hematite feel) |
| Silver                  | `#C9CDD3`             | Lines, icons                      |
| Off-white               | `#F6F4F1`             | Content areas, table backgrounds  |

- **Font: Manrope** (already implemented). The new brief suggested Montserrat or Inter; Manrope is the same heavy geometric industrial style, so switching would only add work. Use Manrope 800 for headings, 400–500 for body and tables, tabular numerals (`font-variant-numeric: tabular-nums`) in all data tables.
- **Nepali text:** add **Mukta** (Google Fonts, Devanagari) as the fallback for `lang="ne"`, so Nepali never renders in a system font.
- Glassmorphism panels, copper accents, rock-grain texture, light and dark themes — unchanged.
- **New texture:** use `photos/Texture_Weathered_Hematite.png` at 6–10% opacity behind dark sections instead of generic noise.

---

## 4. Product and technical data

### Product

**Industrial Hematite Iron Ore (Fe₂O₃)** — Katujpani Deposit, Makawanpur.

### Applications (accurate wording — use this, not the shorter brief wording)

1. **Cement industry — iron corrective.** Hematite ore adds Fe₂O₃ to the cement raw mix. Plants use it to adjust the iron and silica moduli and to act as a flux, which lowers the clinkering temperature and helps form the C₄AF phase.
2. **Foundry and metallurgical buyers — on request.** Supplied for evaluation and blending. Suitability for direct furnace feed depends on the buyer's grade requirements and may need beneficiation. Samples and full assay sheets are available on request.

> **Writing rule:** do not call the ore "high-grade". The deposit average is 23.48% Fe (33.59% Fe₂O₃) with high silica. Selected samples reach 41.87% Fe (59.85% Fe₂O₃). Present the real numbers clearly; buyers in this market check them.

### Key numbers (Stats strip / Technical page)

| Label (EN)                     | Value                             | Source                    |
| ------------------------------ | --------------------------------- | ------------------------- |
| Deposit weighted average Fe₂O₃ | 33.59%                            | Table 14, 62.55 m sampled |
| Deposit weighted average Fe    | 23.48%                            | Table 14                  |
| Weighted average SiO₂ / Al₂O₃  | 53.05% / 3.22%                    | Table 14                  |
| Highest grab sample            | 41.87% Fe · 59.85% Fe₂O₃ (N-2)    | Table 7                   |
| Grab samples, Areas B & C      | 20 samples · average 44.88% Fe₂O₃ | Table 7                   |
| Total sample thickness         | 62.55 m across 5 sections         | Table 14                  |
| Mapped deposit zones           | Areas A, B and C                  | Fig. 1E                   |

### Weighted average grade by section (Table 14) — build as an HTML table, not an image

| Section              | Thickness (m) | SiO₂ %    | Fe %      | Fe₂O₃ %   | Al₂O₃ %  |
| -------------------- | ------------- | --------- | --------- | --------- | -------- |
| A                    | 13.90         | 49.79     | 25.63     | 36.63     | 3.34     |
| B                    | 10.75         | 51.04     | 24.82     | 35.49     | 2.25     |
| C                    | 9.15          | 54.22     | 22.15     | 31.67     | 2.65     |
| D                    | 12.35         | 55.22     | 21.03     | 30.07     | 2.89     |
| K, X, Y              | 16.40         | 54.84     | 23.35     | 33.48     | 4.34     |
| **Weighted average** | **62.55**     | **53.05** | **23.48** | **33.59** | **3.22** |

All sample-level data (grab, chip and channel) is in `data/assay_data.json` and the CSV files. I re-computed the averages from the rows and they match the report.

### Data origin statement (show under every technical table)

> Field grab, chip and channel sampling analysed and reported by Shubharambha Mining and Engineering Services Pvt. Ltd., Tarkeshwor-07, Kathmandu, in the mine scheme submitted under Department of Mines and Geology (DMG) guidelines. Figures are indicative of the sampled zones and are not a JORC/NI 43-101 reserve statement.

### Land and lease facts (from Map No. 1 — **[CONFIRM]** small print was hard to read in the scan)

- Survey area: 20.68 ha
- Quarry area: about 2.88 ha · top-soil yard 0.116 ha · waste yard 0.135 ha · office 0.032 ha · approach road about 0.147 ha
- Total land use: 3.41 ha, all forest land
- Geology: Middle Siwalik sandstone belt north of Shikharpur (regional map after DMG)

---

## 5. Sitemap and page content

Navigation: **Home · About · Our Project · Products · Technical Data · Sustainability · Investors · Contact** + **Request a Quote** button + EN/नेपाली toggle + theme toggle.

### Home

1. **Hero** — image `Hero_Banner_Hematite_Slope_Katujpani`. H1: "Strength Forged For Generations". Sub: "Hematite iron ore from the Katujpani deposit, Makawanpur — supplied to Nepal's cement and metals industry." CTAs: **Request Bulk Supply** · **View Technical Data**.
2. **Stats strip** — 33.59% Fe₂O₃ deposit average · 59.85% Fe₂O₃ top sample · 62.55 m sampled · 3 mapped zones.
3. **What we supply** — Hematite ore for cement plants; evaluation lots for foundry/metallurgical buyers; sampling and assay support.
4. **The Katujpani Project** — short text + `Lease_Map_Deposit_Areas_A_B_C` + link to Our Project.
5. **From field to supply** timeline: Survey → Sampling → Laboratory assay → Permitting → Extraction → Delivery (photos: `Field_Survey_Bed_Measurement`, `Field_Sampling_Team`, `Lab_Assay_Channel_Chip_Samples`).
6. **Sustainability band** — `Sustainability_Southern_Slope_Vegetation`.
7. **Inquiry CTA band** — "Need iron ore for your kiln mix? Tell us your tonnage and specification."

### About

Company story (est. 2026, Lalitpur), mission, values (Safety · Integrity · Community · Long-term thinking), Founder card (Section 2), consultant partner credit (Shubharambha Mining and Engineering Services).

### Our Project — Katujpani Iron Deposit

Location block (Makawanpur, Bakaiya-09, topo 2785 10A), maps: `Location_Map_Katujpani_Satellite`, `Location_Map_Katujpani_Topo_Sheet`, `Lease_Map_Deposit_Areas_A_B_C`, `Geology_Map_Regional_Lease_Area` + `Geology_Map_Legend`. Project status: "Government procedures and geological studies completed; development toward commercial mining in progress." Gallery of the hematite photos.

### Products

Hematite ore card (`Product_Hematite_Ore_Closeup`), applications (Section 4), typical chemistry (weighted averages), supply notes: lump/fines sizing, packing and delivery **[CONFIRM sizes, minimum order, delivery points]**.

### Technical Data

Weighted average table, interactive sample table (filter by area/section, sort by Fe), simple bar chart of Fe₂O₃ by section, sampling method text with `Channel_Sample_Line` and `Channel_Sample_CH-B-1`, data origin statement, button "Request full assay report" (opens inquiry form with type = Technical report).

### Sustainability & Safety

Forest land commitment, top-soil preservation (yard set aside), progressive rehabilitation, community employment, PPE and safe channel sampling (`Field_Sampling_Channel_Safety`). **[CONFIRM commitments from the EIA/IEE]**.

### Investors

Project overview, milestones (est. 2026 → studies complete → development), founder background, "Request investor deck" form. No financial projections unless the founder supplies them.

### Contact

Head office Lalitpur-13 map, email, phone/WhatsApp, active social links (admin-controlled), contact form, and the **Bulk Supply Inquiry** form:

| Field                                      | Type                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Company name, contact person, email, phone | text (required)                                                     |
| Buyer type                                 | Cement plant / Steel or foundry / Mineral trader / Investor / Other |
| Required quantity                          | number + unit (tonnes per month / one-off)                          |
| Delivery location                          | text                                                                |
| Required Fe₂O₃ / size spec                 | text (optional)                                                     |
| Message                                    | textarea                                                            |

---

## 6. Image placement map

All files are in `Niraum_Web_Assets.zip`. PNG for editing, WebP for the site.

| File                                                      | Website section                      | Notes                                                                      |
| --------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| photos/Hero_Banner_Hematite_Slope_Katujpani               | Home hero, About banner              | 1116 px wide; place with dark gradient overlay and slight blur behind text |
| photos/Product_Hematite_Ore_Closeup                       | Products card, Home "What we supply" |                                                                            |
| photos/Gallery_Hematite_Boulder_SW_Slope                  | Project gallery                      |                                                                            |
| photos/Gallery_Hematite_Specimen_Detail                   | Project gallery, Products            |                                                                            |
| photos/Gallery_Hematite_Boulder_Forest                    | Project gallery                      | Portrait                                                                   |
| photos/Texture_Weathered_Hematite                         | Dark section background texture      | 6–10% opacity                                                              |
| photos/Lab_Assay_Channel_Chip_Samples                     | Technical Data, timeline "Assay"     |                                                                            |
| photos/Field_Survey_Bed_Measurement                       | Timeline "Survey"                    |                                                                            |
| photos/Field_Survey_Benchmark_Marker                      | Technical Data, survey method        |                                                                            |
| photos/Field_Sampling_Team                                | Timeline "Sampling", About           | Get consent from people shown **[CONFIRM]**                                |
| photos/Field_Sampling_Channel_Safety                      | Sustainability & Safety              |                                                                            |
| photos/Channel_Sample_Line, Channel_Sample_CH-B-1         | Technical Data, sampling method      |                                                                            |
| photos/Sustainability_Southern_Slope_Vegetation           | Home sustainability band             |                                                                            |
| photos/Sustainability_Topsoil_Vegetation                  | Sustainability page                  |                                                                            |
| maps/Location_Map_Katujpani_Satellite                     | Our Project, location                |                                                                            |
| maps/Location_Map_Katujpani_Topo_Sheet                    | Our Project, location                | Rotated so north is up                                                     |
| maps/Lease_Map_Deposit_Areas_A_B_C                        | Our Project, Home project teaser     |                                                                            |
| maps/Geology_Map_Regional_Lease_Area + Geology_Map_Legend | Our Project, geology                 |                                                                            |
| tables/*.png                                              | Reference only                       | Rebuild as HTML tables from `data/`                                        |
| brand/Brand_Logo_Full(_Transparent)                       | Navbar, footer, preloader            |                                                                            |
| brand/Brand_Logo_Emblem(_Transparent)                     | Favicon, map marker, preloader       |                                                                            |

**Image quality note.** These come from phone screenshots of a scanned report, so the originals are small (about 340–560 px per photo). I cropped, colour-corrected, sharpened and upscaled them 2×, but they are not true high-definition. They are fine for cards, galleries and a darkened hero, not for a sharp full-screen hero on large monitors. Ask Shubharambha for the original camera files. Government seals and signatures were left out of every crop and should never appear on the website.

---

## 7. SEO plan (English + Nepali)

| Page           | Primary keyword          | Title tag                                           |
| -------------- | ------------------------ | --------------------------------------------------- |
| Home           | iron ore supplier Nepal  | Iron Ore Supplier in Nepal \| Niraum Metals         |
| Our Project    | Makawanpur iron ore mine | Katujpani Iron Deposit, Makawanpur \| Niraum Metals |
| Products       | hematite ore for cement  | Hematite Ore for Cement Plants \| Niraum Metals     |
| Technical Data | iron ore assay Nepal     | Iron Ore Assay and Grade Data \| Niraum Metals      |
| Investors      | mining investment Nepal  | Mining Investment in Nepal \| Niraum Metals         |
| Contact        | buy iron ore Nepal       | Request Bulk Iron Ore Supply \| Niraum Metals       |

Nepali keywords: फलाम खानी नेपाल, हेमाटाइट फलाम, सिमेन्ट उद्योगका लागि फलाम, मकवानपुर फलाम खानी.
Use `/en/...` and `/ne/...` URLs with `hreflang` links, `Organization` + `LocalBusiness` + `Product` JSON-LD.

---

## 8. Starter Nepali UI strings (have a native speaker review)

| Key                | English                         | नेपाली                |
| ------------------ | ------------------------------- | --------------------- |
| nav.home           | Home                            | गृहपृष्ठ              |
| nav.about          | About                           | हाम्रो बारेमा         |
| nav.project        | Our Project                     | हाम्रो परियोजना       |
| nav.products       | Products                        | उत्पादनहरू            |
| nav.technical      | Technical Data                  | प्राविधिक विवरण       |
| nav.sustainability | Sustainability                  | दिगोपना               |
| nav.investors      | Investors                       | लगानीकर्ता            |
| nav.contact        | Contact                         | सम्पर्क               |
| cta.quote          | Request a Quote                 | मूल्य सोधपुछ          |
| hero.tagline       | Strength Forged For Generations | पुस्तौँसम्म टिक्ने बल |
| form.submit        | Send inquiry                    | सोधपुछ पठाउनुहोस्     |

---

## 9. Before launch — confirm list

- [ ] One legal name (Pvt. Ltd. vs Limited)
- [ ] Lease ownership and how to credit Ms Niru Upreti
- [ ] Public phone number and email
- [ ] WGS-84 coordinates for the mine pin
- [ ] Land figures from Map No. 1
- [ ] Product sizes, minimum order, delivery points
- [ ] Permission to publish full sample-level assay data (or show averages only and send detail on request)
- [ ] Consent from people in field photos
- [ ] Original high-resolution photos and founder portrait
- [ ] Nepali copy reviewed by a native speaker
