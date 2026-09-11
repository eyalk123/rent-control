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
- Dark mode is not an afterthought here. It is a deep warm navy (not black), with cream-toned text
  rather than pure white. Check both modes before calling a screen done.

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

Currently unbounded everywhere — `maxFontSizeMultiplier` appears zero times. At large accessibility
sizes, dense rows will grow past their containers.

When adding new chrome (buttons, custom headers, badges), set `maxFontSizeMultiplier` around
**1.3-1.5** and leave body text unbounded. Native-owned text (tab labels, native stack headers)
exposes no such prop; that scaling is verified on the emulator, not in code.

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
| `12` | **Cards and buttons — the default** | `card`, `button`, `row`, `splitBox` (28 style names) |
| `8` | Inner elements inside a card | `iconWrap`, `countBadge`, `mark`, `code_block` (27 names) |
| `4` | Tiny: skeletons, dropdowns, input outlines | `skeletonEyebrow`, `dropdown`, `inputOutline` |

**Use `4 / 8 / 12 / 16 / 999`.** Anything else in the codebase (2, 3, 6, 9, 10, 14, 18, 20) is drift
from before this was written down. Do not add to it. `10` in particular appears 20 times and should
have been `12`; leave existing uses alone but do not copy them.

**Shape lock:** one scale, applied by role. No radius-20 input next to a radius-12 card.

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
