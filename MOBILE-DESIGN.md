# Rent Control — Mobile Design Reference

**What this is:** a description of the visual system the app *already uses*, extracted from the
shipping code. It is not a proposal and it changes nothing. Read it before building a new screen so
screen 12 still looks like screen 3.

**What this is not:** architecture. State, API layers, forms, navigation and the feature-slice
structure live in `.claude/docs/architectural_patterns.md`. This file covers only what the user sees.

**Scope:** the mobile app (`rent-control/`). The web app (`rent-control-web/`) shares the palette
and fonts but is a separate codebase with its own layout conventions. See §10.

---

## 1. The app

Property management for private landlords: properties, renters, leases, transactions, reports,
reminders. All data scoped to one authenticated owner. English and Hebrew (RTL), both first-class.

It is a **records tool**, not a consumer finance app. Users are checking a number, logging a
payment, or confirming a lease date — usually on a phone, usually briefly, often mid-task. That
shapes everything below:

- **Density over decoration.** Body text sits at 13-15px, not 17px. Rows are compact. This is
  deliberate; do not "breathe" a list out to half the rows per screen.
- **Numbers are the content.** Amounts, dates and durations are what people came for. Chrome stays
  quiet so they stand out.
- **Native chrome.** Bottom tabs, native stack headers and Paper components stay native. Brand
  lives in color, type and content components, not in custom navigation.

**Posture:** unified brand across iOS/Android/web, native navigation underneath.

**Dials** (see `mobile-taste` skill for the scale): `DESIGN_EXPRESSION 5` · `MOTION_INTENSITY 2` ·
`VISUAL_DENSITY 6`.

---

## 2. Color

**Single source of truth: `src/core/theme/colors.ts`.** Do not restate hex values anywhere else,
including in this file. Both palettes are complete and every token name exists in both.

How to use it:

- Read semantic tokens (`textSecondary`, `revFg`, `expBg`), never raw hex, and never a Tailwind-ish
  gray you brought with you.
- `lightColors` / `darkColors` are wired into MD3 via `src/core/theme/theme.ts` and consumed through
  Paper's `useTheme()`, or directly where a token has no MD3 equivalent.
- Dark mode is not an afterthought here. It is a **navy-cast charcoal** — not black, and no longer
  a navy — with a faintly warm off-white for text rather than pure white. The surfaces still carry
  the brand hue (216°), at ~22% saturation: enough to read as ours, low enough that the accents
  have somewhere to stand. Check both modes before calling a screen done.

**Conventions worth knowing:**

| Rule | Detail |
|---|---|
| One accent | Mustard. It is the only non-semantic brand color. Do not introduce a second. |
| Money is semantic | Revenue uses `revFg`/`revBg`, expense uses `expFg`/`expBg`. Never plain text colors for amounts. |
| No gradients | The app has none. Keep it that way unless there is a compositional reason. |
| Light elevation is untinted | MD3's stock light elevation tints surfaces purple. `theme.ts` overrides every level to `surface`. Do not revert this. |

**Known deviations, accepted:**

- `accentFg` is white on mustard in light mode, which measures 2.31:1. Reviewed 2026-09-11 and kept
  for brand reasons; see §9.
- `warning` and `accent` are the same value in light mode. A mustard element is brand or caution
  depending on context, not color.
- `error` and `expFg` are the same value in light mode. An expense and a failure read alike.
- The gray ramp mixes warm (cream surfaces) and cool (`textSecondary`, `placeholder`,
  `avatarBackground`) families.

These are recorded so nobody "discovers" them again and quietly changes them.

---

## 3. Type

Single family: **Rubik**, covering Latin and Hebrew at every weight. Hierarchy is carried by weight,
not by a second typeface, so English and Hebrew headings stay visually matched. Registered per weight
in `src/core/theme/fonts.ts`; `fontWeight` is pinned to `"normal"` so no platform synthesizes a
faux-bold on top.

**IBM Plex Mono** (`MONO_FONT`) is bundled for identifiers where character alignment matters: bank
accounts, reference numbers. It has digits and the shekel glyph but **no Hebrew** — scope it to the
value, never to a sentence.

### The scale in use

Measured across the codebase; the "used by" column is the dominant real usage, not an aspiration.

| Role | Size | Weight | Used by |
|---|---|---|---|
| Screen title | 28 | 700 | `screenTitle`, `heroTitle`, `pageTitle` |
| Dialog title | 20 | 600-700 | `dialogTitle`, headline values |
| Section header | 17-18 | 600-700 | `heading1`, `headerTitle`, `sectionHeader` |
| Input / sheet title | 16 | 400-600 | `input`, `sheetTitle`, `amountInput` |
| Body | 15 | 400 | `body`, `heading3`, transaction amounts |
| Row title | 13-14 | 500-600 | list row names, `sectionTitle`, `search` |
| Caption | 12 | 400-500 | `badgeText`, addresses, sub-info, pill text |
| Meta | 11 | 400-500 | timestamps, counts, `metaText` |
| Micro label | 10 | 500-600 | KPI and segment labels |

**Picking one:** a list row is 13 or 14 with a 12 or 11 subtitle. A form input is 16. A screen title
is 28 and appears once. If you are reaching for a size not in this table, use the nearest one.

**Honest note:** nine steps is more than this app needs, and 13/14/15 do overlapping jobs. Documented
as-is rather than collapsed, because collapsing them means touching several hundred call sites. New
screens should prefer **28 / 18 / 16 / 15 / 13 / 12 / 11** and leave 17, 14 and 10 alone.

### Dynamic Type

**Cap the chrome, let the content scale.** A property address, a renter's name, a note — anything
the user typed — scales without limit, because that is the text someone turned the setting up to
read. The furniture around it does not: a tab label, a segment, a chip, a screen title and a month
axis all live in boxes the layout sizes, and past a point they stop being more readable and start
being clipped. `src/core/theme/typeScale.ts` holds the policy:

| Token | Value | For |
|---|---|---|
| `MAX_CHROME_FONT_SCALE` | 1.4 | Labels inside a box the layout controls |
| `MAX_TIGHT_FONT_SCALE` | 1.2 | A fixed tile or axis with no room at all |
| `REFLOW_FONT_SCALE` | 1.4 | Above this, side-by-side layouts stack |

`useIsLargeText()` gates layout changes; Apple draws the same line with
`UIContentSizeCategory.isAccessibilityCategory`. Native-owned text (tab labels, native stack
headers) exposes no such prop and is verified on the emulator, not in code.

**Three failure mechanisms, in order of damage:**

1. **A pinned `lineHeight` clips its own glyphs.** React Native scales `fontSize` and not
   `lineHeight` — it is a plain number. MD3 pins one on *every* variant, so every
   `<Text variant=…>` in the app clipped horizontally through the middle of its letters. The theme
   now scales them (`scaleFontsLineHeight`, applied in `ThemeContext`); for a literal in a
   StyleSheet use `useScaledLineHeight(base)`. **Never write `fontSize` and `lineHeight` as two
   literals in the same style.**
2. **Truncation, not overflow.** 69 `numberOfLines={1}` in the app. Decide per row which side
   yields: the label truncates, the number never does — give the number's column `flexShrink: 0`.
   A currency value clipped from `+2,200₪` to `+2.20` is a wrong figure, not a layout bug.
3. **A fixed `height` on anything containing text.** Use `minHeight`.

**Verify before and after.** A change here must be pixel-identical at scale 1.0 — screenshot the
same screens before and after and diff them, excluding the status bar, because the clock moves.

### Android

`includeFontPadding: false` and an explicit `lineHeight` on display-size text, or Android adds
asymmetric padding above and below.

---

## 4. Radius

`theme.ts` sets Paper `roundness: 16`, but screens use literals. The values in real use, by role:

| Radius | Role | Used by |
|---|---|---|
| `999` | Pills — fully round | `pill`, `chip`, `badge`, `newTag`, `yearChip` |
| `16` | Dialogs, heroes, large surfaces | `dialog`, `surface`, `hero`, `bubble`, `filterCard` |
| `12` | **Cards, buttons and form fields — the default** | `card`, `button`, `row`, `splitBox`, every input and dropdown |
| `8` | Inner elements inside a card | `iconWrap`, `countBadge`, `mark`, `code_block` (27 names) |
| `4` | Tiny: skeletons and hairline decorations | `skeletonEyebrow` |

**Use `4 / 8 / 12 / 16 / 999`.** Anything else in the codebase (2, 3, 6, 9, 10, 14, 18, 20) is drift
from before this was written down. Do not add to it. `10` in particular appears 20 times and should
have been `12`; leave existing uses alone but do not copy them.

**Shape lock:** one scale, applied by role. No radius-20 input next to a radius-12 card.

**Form fields are `12`, not `4`.** They were `4` until 2026-09-11, which put a near-square box
inside a radius-16 card and was the single most dated shape in the app. `fieldSurface.ts` owns the
value; do not set a radius on an input by hand.

---

## 5. Spacing and density

Scale in `src/core/theme/spacing.ts`: `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`, plus
`formPaddingHorizontal 18` and `keyboardExtraScrollHeight 100`.

Discipline is decent: ~746 `spacing.*` references against ~297 literal padding/margin values. The
literals cluster at 2, 4, 6, 10 and 14 — fine nudges the scale does not offer.

**Rules:**

- Reach for `spacing.*` first. A literal is acceptable for a sub-4px optical nudge; it is not
  acceptable for section padding.
- Screen horizontal padding: `spacing.lg` (16) for lists and detail screens,
  `formPaddingHorizontal` (18) for add/edit forms.
- Vertical rhythm inside a card: `spacing.md` (12) between rows, `spacing.lg` (16) at the edges.

**Touch targets are a hard floor: 44pt minimum, regardless of how dense the row is.** Density 6
buys tighter *text*, not smaller *targets*. Verify with `adb shell uiautomator dump`, which reports
real touch-target sizes in dp.

---

## 6. Elevation

Four levels are in use. Every one pairs an iOS shadow with an Android `elevation` — shipping
`shadowColor` without `elevation` makes the shadow invisible on Android. All current call sites do
this correctly; keep it that way.

| Level | Offset | Opacity | Radius | `elevation` | Used for |
|---|---|---|---|---|---|
| 1 — subtle | `0, 1` | 0.06 | 4 | 2 | sticky list headers, chat bubbles, focused inputs |
| 2 — raised | `0, 4` | 0.10 | 12 | 4 | feature cards (e.g. expiring leases) |
| 3 — dialog | `0, 4` | 0.14 | 16 | 8 | dialogs, prompts, the suppliers header button |
| 4 — overlay | `0, 10` | 0.30 | 24 | 12 | tour overlay and anything drawing over the navigator |

**Shadow color has two dialects**, both in use: `#1E3A5F` (navy) on brand surfaces like dialogs and
form inputs, `#000` on content surfaces like cards and chat. Prefer navy for anything on cream.

**Cards are not the only grouping tool.** Whitespace, `StyleSheet.hairlineWidth` separators and
grouped-list sections all group content without a shadow. A card should mean a discrete, tappable,
self-contained object. A screen that is a stack of shadowed rounded cards is the failure mode.

### The grouped list — the detail-screen pattern

`DetailSection` + `DetailRow` (`src/shared/components/ui/`) are how label/value content is grouped
on the renter and property detail screens. Use them for any new detail surface.

- **`DetailSection`** — a quiet uppercase label in `textSecondary` on the page background, above a
  `surface` container at radius 12 with a hairline border. Separators are injected *between*
  children, so a row never needs to know whether it is last, and conditionally-rendered rows
  (`{cond && <Row/>}`) leave no dangling line. It renders nothing when it has no rows, so the old
  `hasXDetails` guards are unnecessary.
- **`DetailRow`** — label left, value right, 48pt minimum height. **Icons are opt-in and off by
  default.** Pass one only where it carries status the label does not (an insurance shield, a
  document type). A pin beside "Zip Code" repeats the label and adds noise.
- **`SectionLabel`** — the label alone, for groups whose body is too interactive to express as
  rows (the custom-files lists, which hold inputs and per-row buttons). Those keep their `Card`
  body and drop only the header bar.

**What this replaced:** a `Card` whose title sat in a full-bleed saturated bar
(`backgroundColor: colors.primary` or `colors.sectionAccent`, white text), with a tinted icon on
every row. The bar colour varied per card for decoration rather than meaning, and the per-row icons
tinted themselves by section, so the same glyph changed colour between cards. Do not reintroduce
either. `IconDetailRow` is the old row and now has no callers; delete it once nothing references it.

### Layer stack

Absolute overlays coordinate through a shared ladder. Both `zIndex` and `elevation` are set, since
Android uses elevation for z-order:

| Layer | Value | Component |
|---|---|---|
| Offline gate | 2000 | `shared/components/ui/OfflineGate.tsx` |
| Legal consent gate | 1500 | `features/legal/components/LegalConsentGate.tsx` |
| Tour overlay / loading | 1000 | `features/onboarding/TourOverlay.tsx`, `ui/LoadingOverlay.tsx` |

A new full-screen gate picks a value on this ladder and is added to this table.

---

## 7. Icons

Sizes are fixed in `src/core/theme/icons.ts`. Pick one, never free-form:

`ICON_XS 16` · `ICON_SM 20` · `ICON_MD 22` · `ICON_LG 24` · `ICON_HERO 26` (FAB only)

Family is **Lucide** (`lucide-react-native`), stroke-based, inheriting `currentColor` from the
surrounding text or View. `@expo/vector-icons` and `expo-symbols` are present for cases Lucide does
not cover. **Never use emoji as icons.**

---

## 8. Motion and haptics

### Motion

Deliberately minimal. `react-native-reanimated` is installed but **used in zero files**; RN's core
`Animated` appears in five (chat messages, tour scroll, month bar chart, transactions hero,
skeleton blocks). Navigation transitions are entirely native.

This is a records tool and it does not need choreography. If you add motion:

1. Navigation transitions are native and free. Do not re-implement them.
2. Press feedback on touchables comes next — Android ripple via Paper, spring scale ~0.97 on iOS.
   One or the other per surface, never both.
3. State transitions (insert, remove, reorder) after that.
4. Decorative motion last, if ever.

Motion needs a one-sentence justification — hierarchy, feedback, or state change — or it does not
ship. Springs over timing curves for anything interactive. No entering animations inside virtualized
list cells; recycled cells replay them mid-scroll.

`useReducedMotion` is currently honored nowhere. Anything beyond press feedback should respect it.

### Haptics

`expo-haptics`, 33 call sites: 26 `impactAsync(Light)`, 5 `selectionAsync`, 2 `impactAsync(Medium)`.

Intended vocabulary:

| Feedback | When |
|---|---|
| `selectionAsync` | pickers, toggles, segment changes |
| `impactAsync(Light)` | a meaningful confirmation — saved, added, linked |
| `impactAsync(Medium)` | a heavier state change, e.g. entering selection mode |
| `notificationAsync` | async outcomes (success/failure). Currently unused. |

**Never on a plain tap or on navigation.** The Light-impact count is high enough that some existing
call sites are probably on ordinary taps; leave them, but do not add more.

---

## 9. Copy and content

- **No em-dash (`—`) in any visible string**, English or Hebrew. Use a comma, a colon, or restructure.
  This is a hard lint rule.
- All user-facing text goes through i18next (`en.json`, `he.json`). No hardcoded strings.
- Realistic data in mockups and empty states. No "John Doe", no "Acme", no `99.99%`.
- No filler verbs: "Elevate", "Seamless", "Unleash", "Supercharge".
- No exclamation-onboarding voice ("You're all set!", "Let's get started! 🎉").
- No "Welcome back, {name} 👋" headers. Personalization is not the product.
- `Alert.alert()` is for destructive confirmations only. Success is a state change plus an optional
  haptic; errors are inline; transient messages are a snackbar.

### Required states

Every data screen owns the full cycle:

| State | Treatment |
|---|---|
| Loading | Skeletons mirroring the final layout (`ui/SkeletonBlock.tsx`). Never a full-screen spinner over the tab bar. |
| Empty | Composed, with the action that populates it. Centered is correct here. |
| Error | Inline for forms; retry affordance for content. |
| Offline | `OfflineGate` handles the app-level case. Data screens should tolerate cached content. |
| Refreshing | `RefreshControl`, distinct from initial load. |

---

## 10. Hebrew and RTL

Both languages are first-class. Hebrew is not a translation layer bolted on.

- Changing language triggers an app reload to flip RTL layout.
- **RTL hooks in `src/core/context/LanguageContext.tsx` — `useRtlInputStyle`, `useRtlPlaceholder`,
  `useRtlLabelStyle` — MUST be used on all form inputs.** This is the single most common source of
  RTL bugs.
- Use `start`/`end` rather than `left`/`right` in styles wherever the platform supports it.
- Icons that encode direction (chevrons, arrows, back) flip. Icons that encode meaning (home, plus,
  trash) do not.
- Mixed-direction strings — a Hebrew sentence containing a Latin amount or date — are where layout
  breaks. Test them specifically.
- **Verify RTL on the emulator.** The web preview does not reproduce native RTL. A previous review
  found list bullets on the wrong side in Hebrew, invisible in a browser.

---

## 11. Relationship to the web app

`rent-control-web/` shares this palette and both font families, and its
`src/core/theme/colors.ts` is a **manual copy** of the mobile file, marked as such in a header
comment. It drifts if only one side is edited.

**If you change a color token, change it in both repos in the same session.** The same already
applies to `src/features/legal/legalContent.ts` and to `features/onboarding/types.ts`.

Everything else here — radius, elevation, spacing, haptics, motion, icon sizes — is mobile-specific.
The web app has its own layout conventions and should not inherit these tables.

---

## 12. Verifying UI work

From `CLAUDE.md`, restated because it applies to everything in this file:

**Any change to what the user sees must be checked on the Android emulator before it is done.**
`./scripts/emulator.sh preview` boots it; `./scripts/emulator.sh shot` captures. Drive with
`adb shell input tap/text/swipe`, deep-link with `rentcontrol://`, and read the real accessibility
tree — labels and touch-target sizes in dp — with `adb shell uiautomator dump`.

The web preview does not match native rendering and hides real bugs: keyboard behavior, safe areas,
RTL, font scaling and touch targets are all wrong or absent in a browser.

Check both color schemes and both languages.

---

## 13. Decisions log

Proposals considered and their outcome, so they are not relitigated.

### 2026-09-11 — Palette and typography review

A design-system pass audited the palette and proposed three changes. **All three were declined and
no code was changed.** Recorded with the reasoning:

| Proposal | Measurement | Outcome |
|---|---|---|
| Light-mode `accentFg` white → navy on mustard | White on `#D4A24C` is **2.31:1**, below the 4.5:1 AA minimum. Navy would be 5.98:1. | **Declined** — white on mustard is the preferred look. Keeping white would otherwise require darkening the accent to about `#9A6828`, which reads visibly browner and changes the brand more than the text swap. |
| Split `error` from `expFg` (both `#9A3412`) | Expense rows and failure banners are currently indistinguishable. | **Declined** — keep expenses red. |
| IBM Plex Mono for currency amounts | Plex Mono has digits and `₪`, no Hebrew, so it would be scoped to numerals via a `<Money>` component. | **Declined** — the mono face looks wrong in context. Amounts stay in Rubik. |

**Still open, zero visual cost:** Rubik ships with tabular figures (`tnum` is in its GSUB feature
list). `fontVariant: ['tabular-nums']` on amount styles makes digits align in columns with no change
to the typeface. Not applied.

**Also noted, not acted on:** `warning` and `accent` share a value in light mode; the gray ramp mixes
warm and cool families. See §2.

### 2026-09-11 — Detail screens moved to the grouped list

Renter and property detail screens moved off painted section headers onto `DetailSection` /
`DetailRow` (see §6). Colour tokens were not touched. Alongside it:

| Change | Why |
|---|---|
| Ended lease: status chip, banner only when terminated | The banner was a full-width bordered box holding one short line, with a large empty right half. A plain expiry is metadata; a termination has a date, a reason and a Reopen action, and earns the banner. |
| Extend button takes the edge slot when the overflow is absent | It was offset 44px to sit beside an overflow menu that is only rendered while the lease is live, leaving exactly one button of empty space on ended leases. |
| `StatBox` labels wrap to two lines | Three equal columns truncated "Number of payments" in English and would be worse in Hebrew. Chosen over shortening the copy, which would have meant editing both locale files. |
| Lease-period list: scroll indicator on, cap clips a row mid-height | `showsVerticalScrollIndicator` was `false` on a height-capped list, so a long lease history looked complete at four rows. The half-cut row is the affordance; `LEASE_ROWS_VISIBLE` keeps it deliberate. |

Mock fixtures `Daniel Okafor` (id 7, terminated, 8 lease periods) and `Noa Shalev` (id 8, live, 6
periods) exist in `src/core/api/mock.ts` to exercise the ended states and the list overflow in
preview mode.

### 2026-09-11 — Chrome quietened on the detail headers

| Change | Why |
|---|---|
| Contact actions share one circle treatment | Call was teal, WhatsApp a hardcoded `rgba(37,211,102,0.16)` brand green, Email mustard. Three sibling actions in three hues that meant nothing, and the only hardcoded brand colour in the app. Now one navy tint at 12% with a `textPrimary` glyph. |
| Renter header buttons lose their fills | Edit, Extend and the overflow were filled navy discs which, with the avatar, put four of them in the top third. They are plain glyphs now; the avatar is the only filled circle. |
| Property header collapses without a photo | The 200px slot held a grey house glyph and a floating button when empty, reading as a broken image on a screen that names the property directly below. With a photo it is still a hero, and the edit button keeps its fill there because a plain glyph over a photo is illegible. |
| `IconDetailRow` deleted | Last callers went with the grouped-list change. |

**Contrast note:** the contact glyph is `textPrimary`, not `primary`. Against the 12% tint over the
dark surface, `primary` measures **2.97:1** — under the 3:1 floor for a non-text control.
`textPrimary` gives 10.4:1 light and 13.1:1 dark.

### 2026-09-11 — Property header gets a type medallion

Collapsing the empty photo slot (above) removed the anchor without replacing it, leaving a lone
edit button in a blank row. A property with no photo now shows an 80pt medallion holding its type
glyph, in the same slot the renter screen gives the avatar, so both detail screens open on an
identity mark. Solid `primary` with an `onPrimary` glyph, matching `RenterAvatar` — 11.5:1 light,
5.2:1 dark. With a photo the hero is unchanged.

The `Type` stat tile was dropped as a duplicate of the medallion, leaving Surface area and Rooms in
two wider tiles.

`PROPERTY_TYPE_ICONS` (`features/properties/constants/propertyTypeIcons.ts`) is now the single map.
It existed twice before — in `PropertyInfoTab` and `RenterPropertyTab` — both typed
`Record<PropertyType, IconName>` while covering three of the five types, so both were type errors
falling through to an `?? 'home'` fallback. Fixing them took the repo from 18 type errors to 16.
`Icon`'s names are a closed union by design, so `garden_apartment` and `housing_unit` reuse existing
glyphs (`home` and `building`) rather than widening it.

**Sparse properties still look empty below the tiles.** `DetailSection` correctly renders nothing
when it has no rows, where the old cards showed a titled bar over an empty body. That is an
improvement, but a property with only an address and a size now has a lot of blank space. A proper
empty state for that case is not written yet.

---

*Last updated 2026-09-11. When something here stops matching the code, fix this file in the same
change.*

### 2026-09-11 — Forms redrawn: one field primitive, outlined boxes

The forms read as a database rather than a task: every field the same height, the same weight, the
same 12px gap, in roughly schema order. Step one of the property form was eleven identical beige
rectangles.

**Fields are outlined, not filled.** The old field was `inputFilledBackground` with a `colors.outline`
border — 1.11:1 fill and 1.33:1 border against the card, so neither one actually drew the edge and a
blank form read as a stack of grey slabs. The fill is gone and `inputBorder` carries the boundary
alone at the 3:1 WCAG 1.4.11 asks of a control: `rgba(26,45,74,0.51)` light (3.07:1 on a card, 3.02:1
on cream), `rgba(241,236,223,0.38)` dark (3.04:1 / 3.17:1). The old dark `inputBorder` token existed
at 2.06:1 and nothing used it — the fields were drawing themselves with `outline` at 1.63:1.

**Focus is a colour, not a width.** It ran `borderWidth` 1 → 2, which shifted every character in the
field by a pixel, and its shadow was a hardcoded navy invisible on the dark palette. The width is a
constant 1.5 and `inputBorderFocus` carries the state: `primary` light (11.5:1), `#6BA0DC` dark —
*not* `primary`, which is 2.79:1 on the dark card and fails the 3:1 a focus ring owes.

**`placeholder` was 2.21:1 light and 3.67:1 dark**, both under the 4.5:1 placeholder text owes. Now
`#6B7280` (4.83:1) and `rgba(241,236,223,0.55)` (4.77:1). Light placeholder equals `textSecondary` on
purpose; a real value still reads darker because it uses `textPrimary`.

**`FormField` + `fieldSurface` are the only way to draw a field.** Eleven components each declared
their own `errorText` and three their own `labelRow`, which is why the conventions had drifted:
the property form marked required fields with an asterisk while the transaction forms marked
optional ones in the label string. **Mark what is required. Never suffix a label with "(optional)".**
Field labels are `textSecondary`, not `textPrimary` — on a filled form the value is what you read.

**`FormRow` pairs short fields and `FormSubheading` groups a run of them.** Floor, Apartment, Block
and Plot hold two or three characters each and had a full-width box apiece. Per §6 the grouping tool
inside a card is a hairline and whitespace, not another card.

**`StepHeader` hardcoded `#1A2D4A`**, so on dark the filled segment was 1.25:1 against the page and
the empty one 1.02:1 — the progress bar was not there at all. Both come from the palette now
(3.33:1 and 3.17:1 dark).

**`SegmentedControl`'s track is unfilled** for the same reason as the fields, and because inactive
labels on `inputFilledBackground` measured 4.36:1. On the card they read 4.83:1.

`PaymentMethodRadios` — a 2×2 radio grid with no label — became `PaymentMethodField`. It rendered
`value || 'cash'`, drawing Cash as chosen when the form held nothing; on the revenue form, whose
default is `''` and whose schema permits `''`, you could save a transaction with no payment method
after seeing Cash selected throughout.

English said "Square Feet" for the same stored number Hebrew called `מ"ר`. The app is Israeli —
block and plot are the Tabu registry fields — so English now says `Size (m²)`.

Verified on the emulator across the property and transaction forms in light, dark and Hebrew RTL.
All 30 colour pairings introduced here clear their WCAG floor.

**One header for every form.** `StepHeader` became `FormHeader` and the step strip is now the
optional part. The transaction forms had a bare back chevron with their title buried in the first
card; the chooser had no header at all; document-scan rendered a one-of-one strip, a full bar that
says nothing. All four wear the same header, and the first card on a transaction form is titled
"Details" rather than repeating the screen name.

**The transaction chooser stays vertically centred.** It was moved to the top in the same pass, on
the reasoning that centred content in an empty screen reads unfinished — but the unfinished feeling
came from having no header, and the header fixed it. The chooser is the one screen in the add/edit
stack that is not a form: nothing to fill in, nothing to scroll. Pinning two primary targets under
the header puts them in the hardest part of a tall phone to reach one-handed. Form layout rules do
not automatically apply to a screen that is not a form.

**Nothing fails silently any more.** `handleSubmit`'s `onInvalid` focuses the first invalid field in
page order, which scrolls it into view. That immediately exposed a second bug: the transaction
schemas passed no message to `.min(1)`, so Zod's own English reached the user — *"String must
contain at least 1 character(s)"*. The keys (`validation.amountRequired` and friends) already
existed and were already translated; they were simply never wired up.

### 2026-09-11 — Field labels darkened after the redraw

The label change above went too far. It moved labels to `textSecondary` **and** shrank them 14px →
13px in one step, and only the colour change was needed.

WCAG ratios cannot see this — they ignore size and weight, and 4.83:1 passes AA either way. APCA,
which models both, put the light label at **Lc 74 where 14px/500 wants ~94**, and the dark label at
**Lc 52**, down from Lc 92 before the change. Dark was much the worse because `textSecondary` there
is 0.66 alpha.

`fieldLabel` is a new token for this one role: `#3A4760` light (Lc 91.5) and
`rgba(241,236,223,0.90)` dark (Lc 79.6 — reverse polarity caps the reachable range at 92, so the
label sits near the top of it rather than mid-way). Labels are 14px again.

**Weight was left at 500 deliberately.** Measured against the APCA font table, bolding 500 → 600
relaxes the requirement by ~6 Lc; darkening bought 18. Weight is the expensive lever here — a bold
label competes with the value it labels, which is the hierarchy the redraw was protecting. The ramp
that matters is value > label > placeholder: Lc 100 / 91 / 80 light, 92 / 80 / 57 dark.

Error text moved off `bodySmall` (12px) to 13px/500, and `FormSubheading` from 11px to 12px/700 —
uppercase at 11px was the least legible thing on a form card.

### 2026-09-11 — Two regressions on the Transactions tab

**An absolute overlay must measure what it sits below, not assume it.** `SuppliersHeaderButton`
sat at a fixed `top: 72` in raw screen coordinates while the title row it was meant to clear starts
at the safe-area inset. On a 44dp inset the row runs 44-100dp, so the button landed 28dp inside it
and covered the settings gear — a device-dependent bug, since the inset is what varies between
phones.

Two quantities move that button and both were guessed. The inset now comes from
`useSafeAreaInsets()`. The row height is now **measured**: `TransactionsListHeader` reports it
through `onTitleRowLayout` and the screen passes it down, with `TITLE_ROW_HEIGHT_FALLBACK` used only
for the first frame and for the empty/error states, which render no title row.

A constant would in fact have survived here — the row is pinned by a 40dp `IconButton`, which is an
icon and does not scale with Dynamic Type, so the row measures 56dp at both 1.0x and 1.3x. That is
luck, not design: a larger title, a bigger gear, or a line box that did scale would have broken it
again. Verified at font scale 1.0 and 1.3: gear 59.8-99.8dp, button 115.8-184.0dp, clear by 16dp in
both.

**Rule:** an absolutely positioned overlay may not encode another component's height as a literal.
Take the inset from the hook and the height from `onLayout`.

**A silent catch is not an empty state.** `TransactionSummaryContext` swallowed every summary
failure with `catch { /* silent — chart shows empty state */ }`, which made a broken request
indistinguishable from a month with no transactions — the chart just went blank with nothing to say
why. It now carries `summaryError`, and `MonthsBarChart` renders the message with a retry in place
of the bars.

**The mock returned a hardcoded `[]` for the summary**, so the chart was blank on every preview
build — the build UI work is actually done against. It now aggregates the mock transactions through
the same `bucketByMonth` / `lastNMonths` helpers the app uses, matching the backend's zero-padded
trailing six months.

**Still open:** `src/core/api/mock.ts` seeds every transaction at a hardcoded `2026-03-*`, so the
trailing-six-month window is empty whenever the system date is more than six months past March 2026
— the chart renders its axis correctly but every bar is zero. Seed dates should be relative to
today.

**Also found while testing this:** at font scale 1.3 the Transactions tab clips badly — the screen
title, every filter chip label ("Prop…", "Ren…", "Ow…"), the type segments, the month labels
("A", "Ma", "Ju") and, worst, the amounts (`+2,200₪` renders as `+2.20`). Money truncated to look
like a smaller number is a correctness problem, not a cosmetic one. Not addressed here.

### 2026-09-11 — Dynamic Type, first pass

Applied the policy above. `maxFontSizeMultiplier` went from 1 call site to ~15 (chips, both
segmented controls, screen titles, form header, month axis, suppliers tile, tour footer, hero
number); the theme's variant line heights now scale; five fixed `height`s on text containers became
`minHeight`; `TransactionRow`'s amount column got `flexShrink: 0`; the tour footer and the
transaction row reflow past 1.4.

**Verified pixel-identical at scale 1.0** — Home and Transactions, before vs after, differ only in
the status-bar clock (bbox confined to y 70-82; identical below).

At 1.5-2.0 the tour card is fixed outright (it was the worst: body clipped mid-sentence, `Skip` as
`Ski`, `Next` as `Ne`), screen titles, row text and the month axis all survive, and the hero number
no longer paints over its own eyebrow.

**Not finished at 2.0.** Still clipping: the hero eyebrow, filter chip labels, the section headers,
the tab bar (native-owned — no prop to set), and the amounts. The remaining work is the sweep this
pass deliberately did not do: the other ~19 explicit `lineHeight` literals, the other 59 fixed
heights, and the other ~65 `numberOfLines={1}`. Treat ~1.5 as the supported ceiling today.

### 2026-09-11 — Dark mode: the navy pulled back to a charcoal

Prompted by the observation that the web app's dark mode looks more current than this one's. It
does, and the web palette was still the wrong thing to copy — `#121212` plus stock Tailwind accents
is the house style of every generated dashboard, and adopting it would have deleted the only
distinctive thing the app has. Three specific mechanisms were at fault instead, all fixed by
values in `colors.ts`; no component was restructured.

**1. The dark was not dark, it was blue.** Measured on a real Transactions screenshot at font
scale 1.0: **98.7% of pixels chromatic, 94.9% inside a single 15° blue bucket, 1.3% neutral.** The
surfaces sat at **50% saturation**. For scale, the most heavily tinted dark theme anyone ships is
GitHub's canvas at 27.8% — at almost exactly the same hue (216°). iOS is 3.4%, Linear 11.1%, Slack
11.9%, Material/Vercel/Notion 0%. So a blue-cast dark was never the problem; being ~1.8× past the
ceiling was. Saturation pulled to ~22%, hue and lightness kept.

**2. The accent had nowhere to stand.** Dark `primary` `#3E6FA8` sat **2.4° of hue from its own
card** at **2.79:1** — under the 3:1 WCAG 1.4.11 asks of a control, and far under the 4.5:1 it owed
as text at **70 of its 90 call sites**, which are foreground uses. The root cause is that the
palette applied a *light*-theme convention to dark mode: a mid-dark primary with white text. MD3's
dark convention is the inverse — a light primary with dark `onPrimary`. Adopted: `primary`
`#65ACE2` (5.90:1 on the card, APCA Lc 50, up from Lc 22), `onPrimary` `#111D2C` (6.92:1).

**3. The money colours were too weak, and they are the content.** `revFg`/`expFg` measured
**APCA Lc 41 and Lc 39** — roughly the floor for *large* text, at a 15px size — on a screen whose
whole job is the sign of a number. Now Lc 64 and Lc 61.

Also: the cream `#F1ECDF` was 39% saturation at hue 43° sitting on a 215° ground, near-
complementary, which is what made it read faintly sepia. Cooled to 11%, keeping the warmth as a
signature.

**Three things the change exposed rather than caused**, each fixed here:

- `error` is now a light tone, so `onError` could no longer be white — that pairing measured
  **1.98:1**. It is dark ink now (8.60:1). `theme.ts` also hardcoded `primaryContainer` and
  `errorContainer` as rgba literals of the *old* values; both now track the new ones.
- The Suppliers button drew mustard on `primary`. That measured **1.90:1 even before this change**
  and 1.11:1 after. It takes `onPrimary` in dark now, and **keeps the mustard in light**, where it
  measures a passing 4.97:1 — fix what is broken, not what merely changed.
- `QuickActionsSection` hardcodes its icon tint as `rgba(194,149,67,0.15)`. Over the old saturated
  navy the blue dominated and it read as a cool blue-grey (hue 212°, sat 16.2%); over a neutral
  ground the mustard and the blue cancelled to a dead grey (**hue 60°, sat 2.7%**). Raised to 0.28,
  which restores exactly the previous 16.2% chroma, now warm. `plNeutralBg` `#3A3A3A` had the same
  problem — a 0%-saturation grey reads brown against a blue-cast page — and took the family cast.

**Verified.** Every pair re-measured: 15 contrast checks and 6 APCA readings, zero failures,
nothing regressed (elevation 1.19→1.22, `textSecondary` 6.18→6.28, `inputBorder` 3.04→3.08).
`tsc` at the 16-error pre-existing baseline. **Light mode is untouched** — pixel diff of the
Transactions screen before vs after differs in 700 of 2,592,000 pixels (0.027%), all of it the
status-bar clock plus ~2px of antialiasing jitter on the FAB glyph; sampled colours identical.

**Still hardcoded, deliberately left:** four `rgba(241,236,223,…)` literals at alpha 0.06–0.10
(`HomeReportsCard` dividers, `FilterSegmentedControl` track) that bypass the tokens. At those
alphas the shift is under half a step of R — imperceptible — and routing them through tokens would
alter light mode too.

### 2026-09-11 — Full-app visual audit: three bugs fixed, three claims withdrawn

Walked 17 screens across dark, light and Hebrew/RTL after the palette change. Fixed:

**1. The mustard tint was hardcoded in seven files at four different alphas, and none of them
survived the desaturation.** Mustard is 49% saturation; it was rendering at **sat 2.7%** on the
chat starter tiles (`#3A3A37`, hue 60 — a dead grey), **6.7%** on the "Scan a lease" button and
**18%** on the Settings theme segment. Root cause is the same one found on `QuickActionsSection`:
those alphas were tuned against a 50%-saturated navy that did most of the chroma work.

Fixed structurally rather than site by site — `accentBg` and `primaryBg` are tokens now, and the
five call sites read them. `secondaryContainer` (which fills every `contained-tonal` button and
the selected `SegmentedButton`) became a **solid `#544526` instead of an rgba**, because as an
alpha it composited against whatever surface happened to be behind it and landed on a different
colour in the dialog than in Settings. Measured after: tiles sat 2.7% → **16.2%**, button 6.7% →
**37.7%**. `NeedsAttentionSection` was also still holding `rgba(62,111,168,…)` — the *old* dark
primary, stale since the palette change.

**2. `cpiMinAmount` and `cpiMinPercent` both read "Minimum change"** in both locales — one is ₪,
one is %. Now "Minimum amount" / "Minimum percent" (סכום מזערי / אחוז מזערי).

**3. Three signed amounts had no bidi guard, so in Hebrew the sign moved to the far end** —
`+2,200₪` rendered as `2,200₪+`. `TransactionRow` and `TransactionDetailScreen` already wrap the
string in `U+202A…U+202C`; `RecentTransactionsSection`, `TransactionSectionHeader` and
`TransactionsHero` did not. All five are wrapped and balanced now. On a screen whose content is
the sign of a number this is a correctness bug, not a layout one.

**Three things reported as bugs that turned out not to be, recorded so they are not "fixed" later:**

- The renter lease list clipping mid-row is **deliberate** and documented in
  `RenterLeaseInfoDisplayCard`: a list that stops flush on a row boundary reads as complete, so
  the cap slices the fifth row on purpose.
- A renter showing **"Active" with "Lease ends: 1 Sep 2026"** is not a stale badge. The badge
  reads `getEffectiveScheduleEnd` (which includes option years, running to 27-28) while the label
  reads `getEffectiveLeaseEnd`. Both are right; they answer different questions. Whether the card
  should show the term end or the schedule end is a product decision, not a rendering fix.
- Light mode's `plNeutralBg` reads heavy, but the positive and negative P&L tiles are solid
  colour blocks too — the neutral one is consistent with its siblings, not an outlier.

**Verified.** `tsc` at the 16-error baseline, eslint clean, both locale files parse. Light mode
re-diffed after the change: 566 of 2,592,000 px differ (0.022%), all of it the status-bar clock;
the quick-action tile samples byte-identical.

**Found but not fixed:** the FAB overlaps the amount column of the last visible transaction row,
in both LTR and RTL. Scrolling clears it, but the list wants bottom padding.

