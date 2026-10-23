# WardLine — Reference UI Design Specification

**Purpose:** implementation-ready visual specification for reproducing the supplied healthcare dashboard reference as closely as practical, then adapting its layout and visual language to WardLine's quarantine-facility workflows.

**Reference:** [Healthcare Hospital Management Web Design — Ronas IT | UI/UX Team, Dribbble](https://dribbble.com/shots/27035970-Healthcare-Hospital-Management-Web-Design)

**Sources reviewed:** four user-provided 1024 × 768 PNG images: (1) front-on dashboard, (2) angled close-up, (3) multi-panel angled composition, and (4) branding board plus dashboard. The front-on image is the primary layout reference; the branding board is the primary source for the displayed typeface and four large colour swatches.

> **Accuracy note:** this document records visible pixels, relative geometry, labels, colour swatches, and inferred implementation tokens. A raster screenshot does not expose the original CSS, component tree, source Figma file, exact font weights, or uncompressed source colours. Coordinates and many spacing values below are therefore **reference measurements/estimates**, not claims about the original source code. The target is a highly faithful visual recreation at the stated viewport, not guaranteed byte-for-byte pixel identity across browsers and operating systems.

---

## 1. Design intent and visual principles

The interface is a modern, desktop-first hospital/clinic management dashboard. Its identity comes from a high-contrast, near-black left sidebar paired with a very light cool-gray canvas, almost-white cards, soft blue analytics, small pink accents, compact status pills, and thin-line icons.

The reference is not a dense, traditional hospital ERP. It reads more like a calm, contemporary SaaS dashboard: simple card geometry, generous whitespace, small labels, large numerical values, minimal dividers, and a moderate information density.

### Principles to preserve

1. **Dark anchor, light workspace.** A black/charcoal left rail anchors the layout; the main workspace stays bright and low-noise.
2. **Card-based information hierarchy.** Information is split into rounded, individually scannable cards rather than one continuous grid of boxed panels.
3. **Numbers first.** Main metric values are large and visually distinct; explanatory copy and comparison badges remain small.
4. **Pastel data visualisation.** Use dusty/periwinkle blue for the main series, very pale blue as the chart track, pink for a secondary series, and near-black for the selected/highlighted bar.
5. **Small, restrained controls.** Filters use compact white pills with subtle borders. Header actions are small circular icon buttons.
6. **Status without visual noise.** Semantic states appear as pale pills with coloured text or icons; do not fill large surfaces with bright colours.
7. **Repeatable rhythm.** Cards align to common edges, share a medium radius, and have consistent internal padding.
8. **Typography is quiet.** Inter is explicitly named on the branding board. Most text is small; the page greeting and KPI values provide the strongest typographic contrast.

### What to avoid

- Heavy drop shadows, thick borders, large gradients, glassmorphism, or saturated coloured cards.
- Oversized page headings or marketing-style hero sections.
- Dense vertical/horizontal gridlines in tables and charts.
- Many competing accent colours.
- Using colour alone to communicate fever, eligibility, mortality breach, or task status.
- Replacing the near-black left sidebar with a light sidebar.

---

## 2. Canvas, coordinate system, and layout measurements

### 2.1 Reference viewport

The main screenshot is **1024 × 768 px**. It is a design presentation canvas, not necessarily the exact viewport of the original web application. At this size, the application frame appears inset inside a light-gray background.

Approximate bounding boxes measured from the front-on image:

| Element | X | Y | Width | Height | Notes |
|---|---:|---:|---:|---:|---|
| Presentation canvas | 0 | 0 | 1024 | 768 | Cool light gray |
| App outer frame | 64 | 65 | 896 | 638 | Rounded outer corners, roughly 22–24 px radius |
| Dark sidebar shell | 74 | 75 | 277 | 618 | Near-black, rounded at the outer corners |
| Sidebar icon rail | 75 | 76 | 51 | 616 | Visually separated by a subtle vertical boundary |
| Sidebar content column | 126 | 76 | 225 | 616 | Contains calendar, day summary and patient list |
| Main workspace | 352 | 76 | 600 | 626 | Almost-white; aligns to the sidebar's inner top edge |
| Main horizontal content inset | 14 | — | — | — | Main content starts near x = 366 |
| Greeting/header row | 366 | 83 | 585 | 31 | Greeting left; three utility icons right |
| Top metric card 1 | 366 | 122 | 174 | 109 | Peak activity hours in original concept |
| Top metric card 2 | 550 | 122 | 213 | 109 | Total patients in original concept |
| Top metric card 3 | 773 | 122 | 177 | 109 | Doctor rating in original concept |
| Analytics card | 366 | 242 | 398 | 208 | Monthly bar chart |
| Working-hours card | 773 | 242 | 178 | 208 | Semi-circular segmented gauge |
| Table title/filter row | 366 | 461 | 585 | 24 | Appointment label and two compact filters |
| Table header | 366 | 490 | 585 | 27 | Small muted column labels |
| Table data region | 366 | 517 | 585 | ~176 | About five fully legible rows plus a partly clipped/faded continuation |
| Calendar card | 135 | 85 | 206 | 200 | White, rounded; inside sidebar content column |
| Sidebar day-summary card | 136 | 305 | 205 | 40 | Dark charcoal capsule/card |

**Measurement tolerance:** allow approximately ±2–5 px for boundaries estimated from the screenshot, and more for antialiased rounded corners. Use these coordinates as a screenshot-matching target at 1024 × 768; use proportional constraints below for other sizes.

### 2.2 Main layout proportions

Inside the outer application frame:

- Sidebar shell: approximately **31%** of the frame width.
- Main workspace: approximately **67%** of the frame width.
- Small gap/boundary between them: 1–2 px visually.
- Sidebar navigation rail: approximately **19%** of sidebar width.
- Sidebar content area: approximately **81%** of sidebar width.
- Main content horizontal inset: around **14 px** from the workspace edge.
- Main metric cards: three columns with approximate widths `174 : 213 : 177` and gaps of about `9–10 px`.
- Mid-row cards: analytics card around **69%** of the row and gauge card around **31%**, with a narrow gap.
- The lower table uses the full main content width.

The asymmetrical card widths are part of the reference. Do not force all three top cards or the two middle cards to be identical widths.

### 2.3 Outer shell geometry

- App frame: almost-white background, radius approximately `22–24px`.
- The sidebar sits about `10px` inside the top, left, and bottom of the outer frame.
- Sidebar shell radius: approximately `20–22px`.
- Main canvas corners are visually subordinate to the black sidebar and white content cards.
- There is no obvious heavy frame border. If a border is needed to separate the canvas, use a subtle cool-gray line.
- Large regions should feel flat; elevation comes primarily from light/dark contrast and whitespace, not shadows.

### 2.4 Card geometry

| Component | Suggested radius | Border/shadow treatment |
|---|---:|---|
| Main app frame | 22–24 px | No visible heavy border; minimal/no shadow |
| Sidebar shell | 20–22 px | Solid near-black |
| Major white cards | 12–15 px | Very subtle border or no border; no pronounced shadow |
| Calendar card | 14–16 px | White surface on black background |
| Header icon buttons | 50% / circular | White or nearly-white fill |
| Sidebar nav active tile | 10–12 px | Blue fill, no visible border |
| Small filter controls | 7–9 px | Fine cool-gray border |
| Status pills | 9–12 px / pill | Pastel fill, no heavy outline |
| Avatar tiles | 8–11 px | Use image or muted initials surface |
| Tooltip | 6–8 px | Near-black fill; white text |

---

## 3. Brand system and visual tokens

### 3.1 Typeface

The branding board explicitly names **Inter** and displays uppercase/lowercase alphabets and numerals. Treat Inter as the required typeface.

Suggested implementation:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Prefer a locally bundled Inter font or a dependable project font package to avoid layout changes caused by external font loading. Match the visible scale hierarchy below; exact weights are estimated from the raster.

| Text role | Approx. size at 1024 × 768 | Weight | Colour |
|---|---:|---:|---|
| Page greeting | 17–19 px | 400–500 | Near-black |
| Major KPI number | 26–29 px | 400 | Near-black |
| Emphasised metric (4.9 in source) | 25–28 px | 400 | Amber |
| Chart/table section title | 13–15 px | 500 | Near-black |
| Calendar title | 12–13 px | 500 | Near-black |
| Sidebar daily count | 13–15 px | 400–500 | White, selected number in blue |
| Table row primary label | 11–12 px | 400–500 | Near-black |
| Body/supporting copy | 10–12 px | 400 | Medium gray |
| Table headers, chart labels, legends | 9–10 px | 400 | Muted gray-blue |
| Tiny badges / metadata | 8–10 px | 400–500 | Semantic foreground |
| Large brand specimen on board | Roughly 72–80 px | 400 | Near-black |

**Type behaviour:** avoid heavy bold. KPI numerals have generous open shapes and do not look extra-bold. Use `font-variant-numeric: tabular-nums` for temperatures, room numbers, time values and counts so columns remain stable.

### 3.2 Primary displayed palette

The four large swatches on the supplied branding board explicitly label these colours:

| Token | Hex | RGB | Primary use |
|---|---|---|---|
| `--brand-pink` | `#E3B9DF` | `227, 185, 223` | Secondary data series, tiny legend dots, subtle auxiliary highlights |
| `--brand-ink` | `#131315` | `19, 19, 21` | Sidebar, selected chart column, tooltips, primary text where appropriate |
| `--brand-blue` | `#8AADDB` | `138, 173, 219` | Main data bars, selected navigation tile, key chart series |
| `--brand-white` | `#F8F8F8` | `248, 248, 248` | Main workspace and major card surfaces |

### 3.3 Supporting palette inferred from the screenshot

These are implementation tokens estimated from the visual, not additional labelled swatches from the branding board.

| Token | Suggested hex | Use |
|---|---|---|
| `--canvas` | `#E7EAEC` | Presentation/page canvas around the app frame |
| `--sidebar` | `#131315` | Sidebar shell |
| `--sidebar-raised` | `#202024` | Daily count card and unselected nav surfaces |
| `--surface` | `#F8F8F8` | White workspace and white cards |
| `--surface-pure` | `#FFFFFF` | Calendar, small utility buttons if contrast requires |
| `--surface-soft-blue` | `#EDF3FA` | Pale chart tracks and light-blue status pills |
| `--blue-muted` | `#7FA3D1` | Main visible bar fill / gauge segment variation |
| `--pink-soft` | `#F5EAF4` | Pale pink status background |
| `--text-primary` | `#171719` | Main labels and values |
| `--text-secondary` | `#626A73` | Supporting text and patient symptoms |
| `--text-muted` | `#969DA6` | Axis labels, table headings, subdued metadata |
| `--line` | `#E8EBEF` | Subtle dividers and control outlines |
| `--success` | `#2F9E59` | Paid/completed/check icons and success labels |
| `--success-soft` | `#E6F5EA` | Success pill background |
| `--warning` | `#E6A51B` | Follow-up or warning label / key value |
| `--warning-soft` | `#FFF4D7` | Warning pill background |
| `--pending` | `#96A1AC` | Pending icon and muted status |
| `--pending-soft` | `#E9ECEF` | Pending pill background |
| `--info` | `#477FB8` | Blue status text |
| `--info-soft` | `#EAF2FB` | Information/first-visit pill background |

Dribbble's page also displays an extracted palette (`#E7EAEC`, `#030303`, `#B0B8BF`, `#426BB3`, `#354943`, `#5F6064`, `#A48382`). This is not identical to the four explicitly labelled branding swatches in the uploaded board. For the most faithful recreation, use the board's four explicit brand values as primaries and the supporting values above only as secondary UI colours.

### 3.4 CSS token starter

```css
:root {
  --canvas: #E7EAEC;
  --surface: #F8F8F8;
  --surface-pure: #FFFFFF;
  --brand-ink: #131315;
  --sidebar-raised: #202024;
  --brand-blue: #8AADDB;
  --brand-pink: #E3B9DF;

  --text-primary: #171719;
  --text-secondary: #626A73;
  --text-muted: #969DA6;
  --line: #E8EBEF;

  --surface-soft-blue: #EDF3FA;
  --success: #2F9E59;
  --success-soft: #E6F5EA;
  --warning: #E6A51B;
  --warning-soft: #FFF4D7;
  --pending: #96A1AC;
  --pending-soft: #E9ECEF;
  --info: #477FB8;
  --info-soft: #EAF2FB;

  --radius-app: 24px;
  --radius-sidebar: 21px;
  --radius-card: 14px;
  --radius-control: 8px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
}
```

For pixel matching, freeze token values during screenshot implementation rather than introducing one-off colours at component level.

---

## 4. Global application shell

### 4.1 Desktop structure

The reference layout uses a **two-part sidebar** followed by a main workspace:

1. Near-black vertical icon rail.
2. Near-black sidebar content column with a white calendar and daily patient/task list.
3. Light workspace containing header, KPI cards, two analytics cards and a full-width table.

This is an unusual but memorable pattern: the sidebar includes both navigation and a compact “today” context panel. Preserve this rather than simplifying it to a narrow icon rail alone.

### 4.2 Sidebar icon rail

**Appearance**
- Near-black background identical to the sidebar shell.
- Brand mark near the top, white, roughly 26–30 px visual footprint.
- Vertical icon buttons centred on the rail, approximately 30–34 px square; spacing approximately 6–8 px.
- Active item is a soft-blue rounded square, roughly 31 × 31 px, with a white icon.
- Inactive items sit on dark charcoal circular/squircle backgrounds, with white or light-gray line icons.
- Lower utility icons (settings, help/support, logout) are anchored near the bottom, separated visually from primary navigation.
- Use one coherent outline icon family, e.g. Lucide icons at `15–18px`, stroke width around `1.75–2px`.

**Icon order visible in the reference**
- Brand mark at top.
- Dashboard/grid selected.
- People/team.
- Document/list.
- Calendar.
- Chat/messages.
- Bottom: settings, help/support-like utility, logout/exit.

**WardLine adaptation**
- Overview, patient worklist, patient records, ward/bed map, discharge queue, audit/analytics as primary destinations.
- Settings and sign out remain at the bottom.
- Keep selected navigation blue, and pair it with an icon and accessible label (do not rely on blue alone).

### 4.3 Sidebar context column

**Calendar card**
- White card close to the top (`x≈135, y≈85, w≈206, h≈200` in the reference capture).
- Title aligned top-left, compact 12–13 px.
- Previous/next month actions appear as two small pale square buttons in top-right.
- Seven-column calendar, tiny weekday labels, subdued out-of-month dates, and a single selected date shown in a blue rounded tile.
- Weekend weekday labels use a very light pink tint.
- Calendar text and day numbers are deliberately small; they are secondary to the daily patient/task list.

**Daily summary capsule**
- Appears just under the calendar card, approximately 205 × 40 px.
- Darker charcoal than the sidebar background.
- Large count/number in blue, followed by a white summary label.
- Circular/rounded arrow action at the right edge.
- For WardLine, replace “19 Patients today” with a shift-relevant count such as “36 checks pending”, “19 patients to review”, or “6 discharge reviews”. The label must remain brief.

**Patient/task list**
- Uses compact rows on the dark sidebar with rounded initial/avatar tiles on the left, name in white, smaller symptom/task text in muted gray, and a small time or state icon aligned to the right.
- Rows have little or no outline; the list itself is not a stack of white cards.
- Completed items use a small green circular check.
- Secondary names/symptoms should never compete visually with the patient name.
- In WardLine use fictional demo people only; show patient name, room number or room tag, and concise state such as “38.4 °C · Fever”, “Temperature pending”, or “Visit complete”. Do not expose unnecessary sensitive details in the sidebar.

### 4.4 Main header

- Left-aligned greeting (`Hello, Jane Doe!` in the source) at about 18 px, normal to medium weight.
- At the right: search, notification/bell with a small green unread indicator, and user/profile icon.
- Header icon actions have tiny, very light surfaces, circular footprints roughly 30–34 px, with 8–10 px spacing.
- No large logo or top navigation links in the workspace; the left navigation is the main route system.
- Main header aligns with the KPI card edges at x≈366.

**WardLine copy:** “Good morning, Meera.” or “Hello, Dr. Shah.” based on the logged-in demo persona. The current facility date and role label can appear as subdued metadata without making the top bar taller.

---

## 5. KPI cards and top-row information design

### 5.1 Geometry

At 1024 × 768, the top row begins about 122 px from the canvas top and is approximately 109 px tall. Three cards sit on a single row with 9–10 px gaps. The cards use identical top/bottom alignment but intentionally different widths.

Each card has about 10–12 px internal padding. Labels are small gray text at the top. Values are larger and positioned toward the lower half. Any comparison badge or micro-chart is subordinate.

### 5.2 Card patterns visible in the source

**Card A — “Peak activity hours”**
- Small label at top-left.
- Tiny northeast arrow at top-right.
- Large time-range value near the bottom-left; a small “PM” chip sits on the baseline after the time.
- No graph or border decoration.

**Card B — “Total patients”**
- Small label; three-dot overflow menu at top-right.
- Large value “492”.
- Small green “+13%” badge and tiny text “vs last month”.
- Thin horizontal segmented/progress bar close to the bottom; two category legend dots and labels beneath it.

**Card C — “Avg doctor rating”**
- Label and tiny diagonal arrow.
- Large amber “4.9” and an adjacent pale-amber `654 reviews` badge.

### 5.3 WardLine replacement content

Do not carry irrelevant appointment/payment/rating metrics into the product. Preserve the *visual pattern*, but choose metrics that directly solve the treatment-centre problem. Suggested role-aware card mapping:

| Reference visual pattern | WardLine metric suggestion | Visual treatment |
|---|---|---|
| Time-range card | `Checks remaining` or current shift window | Large concise value, small supporting label |
| Big count + delta + segmented bar | `Patients in facility` with `occupied / 74`, plus occupied/free split | Large count; thin blue/pink or blue/gray bar; small legend |
| Large amber score + mini badge | `Mortality rate` against 15% benchmark, or `Discharge eligible` count | Large number; compact state/benchmark badge; avoid fake ratings |

Keep the metric semantics true. A patient still under treatment is not a closed case; mortality rates should use the defined denominator and show “insufficient data” when the sample rule applies.

### 5.4 Number and badge styling

- Main number: approximately 27–29 px, regular weight, near-black.
- Unit/time suffix: 8–10 px in a tiny pale-blue chip where appropriate.
- Delta badge: pastel green fill, green text, radius 4–6 px.
- Card micro-chart: 4–5 px high, rounded ends, no axis or grid.
- Overflow and direction icons: about 12 px, muted gray-blue.

---

## 6. Middle row: analytical chart + semicircular gauge

### 6.1 Monthly bar chart card

**Bounds:** approximately 398 × 208 px in the reference capture.

**Header row**
- “Patients” title on the left; 13–15 px medium weight.
- Two small filters on the right, like `Recovered ▾` and `Month ▾`.
- Filters are white, thin gray outline, compact text, mild radius.

**Plot area**
- Twelve monthly columns, labelled Jan–Dec.
- Each month has a tall, very pale blue rounded-rectangle track behind a filled bar.
- Filled bars are medium dusty blue and vary by height; bar width is about 25–27 px in the provided 1024 capture, with 7–9 px gaps depending on the track width.
- The selected month is near-black rather than blue.
- A dark tooltip above the active bar reads `112 recovered`, with a tiny downward pointer/dot.
- Month labels are 9–10 px, gray; legend below chart is a tiny blue dot plus the series name.
- No heavy axes, no horizontal grid lines; chart value is communicated by bar height and selected tooltip.

**WardLine adaptation**
- For this product, the chart can show monthly `Discharged`, `Deceased`, or `Closed cases`, with the selected segment/window described in the filter.
- For a daily workflow chart, use `Temperature checks completed` by day or `Patient outcomes` by month.
- Do not label the chart “recovered” unless discharge is genuinely being used as the outcome definition and that definition is made explicit.
- Critical operational queues belong in the table/worklist, not hidden inside the chart.

### 6.2 Working-hours / gauge card

**Bounds:** approximately 178 × 208 px.

**Header**
- Title at upper-left (`Working hours` in the source).
- Small `Week ▾` selector on upper-right.

**Gauge**
- Semi-circular / horseshoe arc located in the upper-middle.
- Segmented arc uses medium blue, pale blue, and pale pink; the ends have rounded caps.
- A large number (`40`) is centred beneath the top of the arc, with a very small label (`Total hours`) beneath.
- No axis ticks or numeric markings on the arc.

**Legend beneath**
- Three compact rows with small coloured dots, bold numeric values, and muted category labels.
- In the image values are 26, 10 and 4; categories are patient reception, document processing, and online consultations.

**WardLine adaptation**
- Replace hours with `Today’s completion` or a clearly defined single operational measure, e.g. temperature checks completed versus expected.
- The central number and label must identify the unit unambiguously (for example, `51%` / `Temperatures complete`).
- Use the three-line legend for `Recorded`, `Pending`, and `Doctor-recorded override`, or another mutually exclusive breakdown whose counts add up correctly.
- Avoid combining temperature completion and doctor visits into one unlabeled percentage.

---

## 7. Table pattern and row components

### 7.1 Table layout

The reference has a section heading `Appointment` below the analytics row. On the same baseline, the right side contains `Status` and `Payment` dropdown filters.

The table spans the available workspace width and has columns similar to:

- Name
- Status
- Date
- Time
- Payment

The header is small, desaturated blue-gray text with extra breathing room. There are no vertical borders. A subtle horizontal divider separates the header from content; rows mostly rely on whitespace rather than outlined cells.

### 7.2 Row anatomy

- Height: approximately 32–34 px for the desktop reference.
- First column: small rounded avatar or initials badge, then the patient's name.
- Status: small pastel pill (e.g. blue `First visit`, amber `Follow-up`, green `Discharge summary`).
- Date/time: regular small gray text.
- Final status: a small circular semantic icon and short text (green `Paid`, gray `Pending`).
- Column alignment should be stable across every row.
- Text uses about 10–11 px; avatars about 22–24 px.
- The table's lower portion is cropped/faded by the presentation framing; do not reproduce a fade as an operational UI requirement. Use normal scrolling for additional records.

### 7.3 WardLine table adaptation

Use the same style for `Today's patients`, `Nurse worklist`, `Doctor rounds`, or `Discharge queue`. A strong default table schema is:

| Column | Content | Why it matters |
|---|---|---|
| Patient | Initials/avatar + name + room sublabel | Quick identification |
| Temperature | Value and time, or `Not recorded` | Nurse/doctor handoff |
| Fever-free streak | `0/3`, `1/3`, `2/3`, `3/3` | Makes eligibility evidence visible |
| Daily workflow | `Temperature pending`, `Ready for visit`, `Visit complete` | Prevents missed/duplicate tasks |
| Action | Role-permitted primary action | Supports work completion without extra navigation |

Role-specific table schemas can vary, but retain the reference pattern: quiet header, clean rows, small avatars, compact pastel state pills, no vertical cell borders, and compact controls aligned to the right.

---

## 8. Status, tags, avatars, tooltips and micro-details

### 8.1 Status pills

Source examples include `First visit` on pale blue, `Follow-up` on pale amber, `Discharge summary` on pale green, `Paid` with a green check, and `Pending` with a gray clock.

Recreate these as compact capsules:
- Horizontal padding around `7–9px`.
- Vertical padding around `3–4px`.
- Font size `9–10px`.
- Medium/regular weight, not bold.
- Very light pastel fill, with more saturated text/icon.
- Radius `6–10px` or full pill where the source appears fully rounded.

WardLine semantic mapping:
- **Needs temperature:** gray/pale slate; a thermometer icon or clear text.
- **Fever:** pale pink/red-leaning fill with fever label and thermometer icon.
- **Critical:** stronger danger status with both icon and `Critical` text; not colour-only.
- **Ready for doctor:** pale blue.
- **Visit complete:** pale green with check.
- **1/3 or 2/3 fever-free:** pale blue/neutral with explicit count.
- **Eligible for discharge:** pale green or pale pink accent depending on hierarchy; explicit `Eligible` label and `3/3` evidence.
- **Awaiting approval/checkout:** pale amber.
- **Mortality warning/breach:** amber/red text and icon in a banner; it is one of the few cases where a more prominent state is warranted.

### 8.2 Avatar and initials treatment

- Reference mixes tiny person photos and square initials badges.
- Avatar dimensions in rows: roughly 22–26 px; corners around 7–9 px for the initial tile.
- Initials tile has white/near-white fill with light border or dark muted tile in the sidebar.
- Use generic initials for demo patients. Real clinical deployments should use only authorised patient imagery and only if operationally necessary.

### 8.3 Tooltips / selected bar

- Tooltip fill: near-black (`#131315`).
- Text white, about 9–10 px.
- Rounded corners around 6 px.
- Tiny centered triangle/dot pointer down toward the selected item.
- Avoid excessive shadow; a small shadow is acceptable if needed to separate the tooltip from pale tracks.

### 8.4 Tiny icon conventions

- Outline icons rather than filled glyphs, except small semantic check/dot states.
- Icons generally sit optically centred in their hit area.
- Utility icons are low-contrast gray-blue; action icons become white on dark or blue when active.
- Tiny green dot at the notification icon's upper-right is a notification indicator, not a general decoration.

### 8.5 Separators and whitespace

- Use very subtle cool-gray borders only where a control or table needs separation.
- Do not wrap every row in a separate card.
- Use roughly 9–12 px between adjacent cards; 12–16 px inside cards; 10–14 px between section rows.
- Strong negative space is a feature. The workspace should remain brighter and visually calmer than the sidebar.

---

## 9. The chart, table and sidebar should form a consistent hierarchy

Use the hierarchy below when deciding what to emphasise:

1. **Primary action/current work:** pending temperature or visit task; selected patient; critical reading or overdue state.
2. **Facility-level KPI:** occupancy, task completion, discharge-eligible count, mortality benchmark state.
3. **Trend/context:** monthly outcomes, completion history, chart legends.
4. **Supporting details:** dates, room labels, recorder names, secondary symptoms, tooltips, footer metadata.

The source design has attractive patient analytics but WardLine is an operational workflow tool. Do not let charts push actionable work too far below the fold. At 1024 × 768, the reference fits the main chart and the start of its table. WardLine should similarly show at least several actionable rows without requiring a scroll on the common desktop viewport.

---

## 10. WardLine role-based screens in the reference visual language

The UI shell remains visually consistent across roles. Change the metric values, task rows, primary action and navigation emphasis per role; do not create a completely different visual theme for each role.

### 10.1 Nurse overview / worklist

**Top KPIs**
- Temperatures recorded / expected today (e.g. `38 / 74`).
- Temperatures pending (e.g. `36`).
- Fever/critical readings needing attention (data-driven count).

**Sidebar context list**
- `Today's patients` count capsule.
- Pending list rows should be prioritised before done rows or provide a clear tab toggle.
- Each row shows room, patient name, last reading/symptom and current state.

**Main chart/gauge**
- Temperature completion by day or ward; completion gauge for today's expected measurements.

**Main table**
- Patient, room, last reading, today's temperature state, action (`Record temperature`).
- Once recorded, the patient moves from Pending to Done immediately after API success.

**Key action feedback**
- Success: “Recorded 38.4 °C for Room 03.”
- Duplicate: show existing reading/time/recorder and offer correction if authorised; never silently create a second active reading.
- Unusual values need a confirm flow; out-of-range values need an inline error.

### 10.2 Doctor rounds and patient profile

**Top KPIs**
- Visits complete / expected today.
- Ready to visit (temperature recorded, visit incomplete).
- Patients eligible for discharge review.

**Sidebar context list**
- Prioritise critical readings, discharge-eligible patients, fever patients, ready-for-visit rows, then awaiting-temperature and completed patients.

**Main table**
- Patient/room, today’s temperature, fever-free streak, visit status, primary `Review / Visit` action.
- Visit action should be disabled when today's reading is absent, except where the explicitly designed doctor temperature override is available.

**Patient context panel**
- Readings chart and history should reuse the same blue/pink palette, selected value tooltip and minimal axes.
- Visit notes and clinical status should use standard white cards and restrained forms.
- The three-day eligibility evidence needs explicit date/value/state details—not merely a green badge.

### 10.3 Admin / beds and discharge queue

**Top KPIs**
- Occupancy (`74 / 74`), free rooms, approved discharges awaiting checkout.

**Middle visualisation**
- Use the reference’s chart-card layout for occupancy/outcomes or a ward summary. Keep the operational bed-map view available as a primary screen, since room availability is central to the scenario.

**Main table**
- Awaiting approval and ready for checkout can be separate sections or filter states.
- Show room, patient, eligibility/approval time, delay flag and authorised action.
- Completing discharge frees the room and updates occupancy in the shared data store.

### 10.4 Director / operations and outcomes

**Top KPIs**
- Mortality rate and 15% benchmark.
- Success rate and 85% benchmark.
- Patients closed / sample sufficiency.

**Middle chart**
- Monthly closed cases, discharged versus deceased, using blue and pink series.
- Selected month uses black bar or a black tooltip highlight as in the reference.

**Gauge/card**
- Daily temperature and visit completion, or another clearly labelled operational completion metric.

**Table**
- Outcome or operational exception feed: mortality threshold transition, missed temperatures, overdue discharge approvals, overdue checkout.

If there are fewer than the configured minimum closed cases, show an `Insufficient data` state and do not imply that the rate is statistically reliable. The number of closed cases and formula must be visible in the reporting view.

---

## 11. Interaction details and states

The reference is a static visual, so these behaviours are implementation recommendations inferred from the visible controls and the WardLine product brief. They are not claims that the original Dribbble concept implements them.

### 11.1 Navigation

- Clicking the icon rail changes the primary page and active blue tile.
- Hover/focus state may gently lighten the dark tile but should not introduce a new saturated colour.
- Show accessible `aria-label`s or tooltips on icon-only navigation.
- On route change, preserve the same shell geometry and avoid layout jumps.

### 11.2 Calendar and filter controls

- Calendar arrows change the displayed month; selecting a date updates relevant task/chart context if implemented.
- Dropdowns use small outlined pill controls that open compact menus.
- Selected options should not change control widths unexpectedly where avoidable.
- In WardLine, ensure historical calendar selection is read-only if backdated clinical actions are disallowed.

### 11.3 Forms and mutation feedback

- Keep forms visually light: white cards, thin borders, clear labels, inline feedback.
- Primary actions use near-black or blue; dangerous/irreversible actions use a clearly worded confirmation.
- Toasts should be brief and positioned consistently, without obscuring chart values or table actions.
- Loading states should preserve card dimensions to prevent layout shift.
- Empty states should include the next useful action (for example, `All temperature checks are complete`).

### 11.4 Key WardLine state transitions that must be visible

- `Temperature pending` → `Ready for doctor` after a successful reading save.
- `Ready for doctor` → `Visit complete` after a successful visit log.
- `0/3`, `1/3`, `2/3` → `3/3 eligible` when all required daily readings meet the confirmed fever-free rule.
- `Eligible` → `Approved` after doctor action (if this approval step is adopted).
- `Approved` → `Discharged` after authorised admin checkout.
- A new fever or corrected reading that invalidates eligibility must visibly revoke/flag any approval according to the domain rules.
- Patient death closes the active case, frees the bed and recalculates outcome metrics immediately.

### 11.5 Live data in the planned full-stack app

- The backend/database are the source of truth; React state is a presentation cache, not the authority for permission or data integrity.
- After a successful mutation, update the current view and invalidate/refetch dependent metrics, queue counts, patient profile and room occupancy.
- Provide a visible loading and error state if the Render API is cold-starting, unavailable, or returns a validation/conflict response.
- The reference itself does not demonstrate live updates or any particular backend.

---

## 12. Responsive behaviour

The supplied screenshots are desktop dashboard compositions. The following breakpoints are **implementation guidance**, not measured source-reference behaviour.

### ≥ 1200 px — full desktop layout

- Retain both sidebar rail and calendar/task column.
- Keep three KPI cards on one row; chart and gauge in a two-column middle row; table full width.
- Use a max-width container so proportions do not become excessively stretched on very wide monitors.

### 960–1199 px — compact desktop

- Maintain the two-part sidebar if space allows, narrowing the context column slightly.
- Reduce main content gap and card padding before reducing type below readable sizes.
- Preserve the KPI row if each card can retain enough space for its main value. Otherwise move the third KPI below at a consistent breakpoint.

### 768–959 px — tablet

- Collapse the calendar/task context column behind a drawer or a toggle; retain the icon rail or replace it with a compact menu.
- KPI cards may form a 2 + 1 layout.
- Stack the chart and gauge; keep the table horizontally scrollable only if columns cannot reasonably be summarised.
- Doctor visit details should use a stacked, single-column panel.

### < 768 px — mobile

- Replace the wide sidebar with a bottom navigation or a drawer. Do not try to keep the full desktop sidebar and table visible at phone width.
- Make the current task list the first content section.
- Stack KPI cards and use a two-column mini-KPI layout when it remains readable.
- Charts may move beneath worklists or be reduced to a compact summary.
- Use row cards or a horizontally scrollable table with a sticky patient identity column.
- Temperature entry needs a large numeric field, large tap targets and clear save/cancel controls.

### Shared responsive constraints

- No horizontal overflow at 360 px viewport width except intentionally scrollable data tables.
- Preserve the palette, card radius, compact chips and icon language at every breakpoint.
- At smaller sizes, simplify the number of visible data points, not the clarity of critical status text.

---

## 13. Accessibility and clinical usability guardrails

The image's pastel palette is attractive, but several colours are intentionally low contrast. Use pastel backgrounds with darker foreground text/icons. Do not copy low contrast for small status text if it makes the actual application hard to read.

- Body text and interactive labels should meet WCAG AA contrast wherever practical.
- Never communicate `Fever`, `Critical`, `Eligible`, `Pending`, `Complete`, `Warning`, or `Breach` by colour alone. Include words and/or recognizable icons.
- Provide focus indicators visible against both black sidebar and pale card surfaces.
- Give icon-only controls accessible names and tooltips.
- Ensure dialogs trap focus, close predictably, and return focus to the triggering action.
- Set touch targets to at least 44 × 44 CSS px on mobile bedside workflows, even if the visual icon itself is smaller.
- Respect reduced-motion preferences; limit animation to state feedback such as a row moving to Done or a room tile becoming free.
- Avoid rapidly flashing mortality or critical-state indicators.
- Do not present prototype data as real patient care; retain a clear prototype/simulated-data notice in the app.

---

## 14. Screenshot fidelity checklist

Use the front-on 1024 × 768 screenshot as the baseline. Run local screenshot capture at the same viewport and device scale factor (`1`) before comparing.

### Page shell

- [ ] Canvas is cool light gray, approximately `#E7EAEC`.
- [ ] Application frame starts around x=64/y=65 and ends around x=960/y=703.
- [ ] App is rounded; sidebar is near-black and inset around 10 px inside the frame.
- [ ] Main content remains almost-white.

### Sidebar

- [ ] Two-part structure: icon rail + contextual calendar/patient list.
- [ ] White logo mark near top.
- [ ] Selected nav item uses blue rounded tile.
- [ ] Calendar sits near the top, uses tiny labels and a blue selected date.
- [ ] Dark daily-count capsule appears below the calendar.
- [ ] Compact patient rows use avatars/initials, small text and status markers.

### Header and cards

- [ ] Greeting aligned to main content left edge.
- [ ] Three utility icons aligned top-right.
- [ ] Top KPI row starts near y=122, with approximate widths 174/213/177 px and 9–10 px gaps.
- [ ] Metric labels are small, values are large but not bold-heavy.
- [ ] Main values, badge and progress stripe share the reference baseline/vertical rhythm.

### Analytics row

- [ ] Main chart card is substantially wider than the gauge card.
- [ ] Chart shows pale full-height tracks behind rounded medium-blue bars.
- [ ] Selected bar is near-black and has a near-black tooltip.
- [ ] Month labels and legend are small and muted.
- [ ] Gauge has a semi-circular segmented blue/pale-blue/pink arc with a centered value.

### Table

- [ ] Table title and compact filters share a row.
- [ ] Header is tiny and muted, with no vertical gridlines.
- [ ] Rows have small avatars, name, pale status pills and compact metadata.
- [ ] Completed/pending statuses use small semantic icon + text.

### Visual polish

- [ ] Inter is loaded; no unintended font substitution.
- [ ] Use the explicitly shown palette (`#E3B9DF`, `#131315`, `#8AADDB`, `#F8F8F8`).
- [ ] No heavy shadows, gradients, large colourful panels or thick borders.
- [ ] Spacing, alignment, corner radii and typography remain consistent between sections.
- [ ] The UI uses WardLine-accurate clinical labels rather than irrelevant ratings/payments.
- [ ] Any operational state can be understood without colour alone.

### What can cause unavoidable pixel differences

Browser font rasterisation, operating-system font hinting, antialiasing, image assets, and the fact that all measurements come from compressed/raster previews can produce small deviations. Exact pixel identity would require the original source design file and matching font assets. Use visual screenshot comparison to tune large bounding boxes and spacing first, then typography and icons, then subtle colours.

---

## 15. Suggested component inventory

These component names are implementation suggestions for the WardLine React application, not inferred original component names.

```text
AppShell
├── Sidebar
│   ├── BrandMark
│   ├── PrimaryIconNav
│   ├── MiniCalendar
│   ├── DailySummaryCard
│   └── SidebarPatientList
├── MainHeader
│   ├── Greeting
│   ├── SearchButton
│   ├── NotificationButton
│   └── UserMenuButton
├── KPIGrid
│   ├── MetricCard
│   ├── MetricCard
│   └── MetricCard
├── AnalyticsGrid
│   ├── MonthlyBarChartCard
│   └── CompletionGaugeCard
├── DataSection
│   ├── SectionHeading
│   ├── CompactFilter
│   └── PatientTaskTable
├── StatusBadge
├── PatientAvatar
├── IconButton
├── Tooltip
├── ToastRegion
└── PrototypeNotice
```

**Component rules**
- `MetricCard` receives a label, value, optional suffix, optional trend/support text, and optional small visual indicator.
- `StatusBadge` gets a semantic variant and text label; it must not choose meaning solely by colour.
- `PatientTaskTable` receives data and callbacks; it does not own clinical business logic.
- `SidebarPatientList` must be role-aware and show the next task, not only a generic list of names.
- `MonthlyBarChartCard` and `CompletionGaugeCard` take explicit labels, periods and data so the visual cannot misrepresent its metric.
- Actions and permission checks belong in the application/API/domain layers, not inside low-level presentational components.

---

## 16. Source-derived facts vs implementation recommendations

### Directly visible in the supplied images / reference page

- The dashboard is desktop-oriented and uses a dark left sidebar, light gray overall canvas and very light main workspace.
- There is a calendar inside the sidebar, a compact patient list, a greeting, small utility icons, a row of three KPI cards, a large monthly bar chart, a smaller gauge card and a lower table.
- The chart uses pale tracks with blue filled bars and a dark selected bar/tooltip.
- The status styling includes pale blue, amber and green pills, with compact check/pending icons.
- The branding board explicitly shows Inter and the four labelled palette values `#E3B9DF`, `#131315`, `#8AADDB`, and `#F8F8F8`.
- The Dribbble description says the concept combines a prominent left navigation panel, calendar/chat/analytics access, a central greeting, dashboard statistics, patient analytics, a daily schedule, and status/payment information. It describes a light gray/white background, dark contrasting sidebar and soft blue/violet accents.

### Inferences/recommendations in this specification

- All CSS-like spacing, card radii, type sizes and coordinate measurements not explicitly printed on the brand board.
- Mapping appointment/ratings/payment content into temperature tasks, facility occupancy, patient outcome analytics, discharge queues and mortality metrics.
- Role-specific screen content, mobile/tablet behaviour, interaction details, keyboard/accessibility expectations and component names.
- Exact secondary supporting colours and their semantic mapping.

These inferences are intended to make the design implementable for WardLine while preserving the image's visual grammar. If a later Figma source or original component library becomes available, treat that as more authoritative than the approximate measurements here.

---

## 17. Reference citation

- Ronas IT | UI/UX Team, **“Healthcare Hospital Management Web Design”**, Dribbble: https://dribbble.com/shots/27035970-Healthcare-Hospital-Management-Web-Design
- User-provided screenshots: four 1024 × 768 PNG images supplied with this request (front-on dashboard, angled close-up, multi-panel composition and branding board).

