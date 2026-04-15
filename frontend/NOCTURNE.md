# NOCTURNE — BetsPlug design system cheatsheet

> **Read this before touching visual code.** Every new page, section, card,
> button or data chip on BetsPlug must follow these conventions. If you ship
> a plain `<div>` with hard-coded hex colours, it will look off-brand.

## Core vibe

Atmospheric dark canvas with translucent glass surfaces, soft-rounded corners,
hex-shaped icon frames, neon gradient borders on premium cards, and one primary
accent (logo green) backed by purple/magenta and cool blue for variety. Mixed
case typography. Feels like an always-on app dashboard, not a SaaS marketing
site.

Brand accent = logo green `#22c55e / #4ade80`. Purple/magenta for special
moments (Platinum, feature highlights). Cool blue for info/tertiary.

---

## 1. What auto-inherits (don't worry about these)

- Body background with atmospheric radial glow blobs — `body::before` in `globals.css`.
- Default typography on `h1`-`h6`, `p`, `li`, `a`.
- Every `rounded-*` Tailwind class is clamped to the NOCTURNE radius scale (6 / 10 / 14 / 20 px).
- `.btn-lime`, `.btn-gradient`, `.btn-outline`, `.btn-cyan` are legacy aliases
  that automatically map to NOCTURNE button variants.
- Legacy safety net: old Tailwind colour classes (`bg-slate-*`, `text-slate-*`,
  `bg-green-50`, `text-green-600`, `border-gray-200`, `bg-white`, …) are
  remapped to NOCTURNE tokens. Safe to use if you migrate snippets from older
  code — they won't look broken.

## 2. What must be applied explicitly

**Panels, icons, data chips, section headers and ambient glows.** A fresh
`<div>` will render as a flat box — no neon border, no halo. Use the
primitives below.

---

## 3. Design tokens (CSS variables in `globals.css`)

```
--accent-green        142 71% 45%   /* #22c55e  logo brand */
--accent-green-bright 142 76% 60%   /* #4ade80  neon */
--accent-green-soft   142 71% 70%   /* #86efac */

--accent-purple        271 91% 65%   /* #a855f7  feature/premium */
--accent-purple-bright 294 72% 59%   /* #d946ef */

--accent-blue       217 91% 60%   /* #3b82f6  info */
--accent-blue-soft  213 94% 74%   /* #60a5fa */

--bg-base     234 17% 6%     /* #0a0b11   deep dark canvas */
--surface-1   230 16% 10%    /* #141722   card solid */
--surface-2   230 16% 13%    /* #1a1d2b   raised */
--surface-3   230 15% 16%    /* #212536   hover/active */

--glass-1     230 16% 10% / 0.55  /* translucent card */
--glass-2     230 16% 13% / 0.65  /* raised glass */
--glass-3     230 15% 16% / 0.75  /* top layer */

--border-subtle  0 0% 100% / 0.06
--border-default 0 0% 100% / 0.1
--border-strong  0 0% 100% / 0.16

--text-primary    210 40% 94%   /* #ededed */
--text-secondary  218 13% 68%   /* #a3a9b8 */
--text-muted      218 11% 45%   /* #6b7280 */

--status-win   142 76% 56%
--status-loss  0 84% 62%
--status-draw  38 95% 58%
```

**Radii**
- `--r-sm` 6px (small chips)
- `--r-md` 10px (buttons)
- `--r-lg` 14px (cards, default)
- `--r-xl` 20px (large panels, modals)
- `--r-pill` 9999px (pills, badges, date tabs)

When writing inline, prefer `hsl(var(--accent-green) / 0.12)` over hard-coded
hex colours so palette changes propagate.

---

## 4. Primitives (always use these)

Located at `src/components/noct/`. Import once, use everywhere.

### 4.1 `<GlassPanel>` — translucent surface

```tsx
import { GlassPanel } from "@/components/noct/glass-panel";

<GlassPanel variant="default | lifted | raised" glow="none | green | purple | blue" featureTile="none | green | purple | blue">
  content
</GlassPanel>
```

- `variant` — `default` (standard card), `lifted` (hoverable, for feature
  cards), `raised` (top layer: modals, popovers).
- `glow` — optional coloured gradient backdrop behind the panel.
- `featureTile` — optional internal vertical colour glow column (for the
  Bankers/Upcoming/Success-Rate-style tiles in Nerdytips).

### 4.2 `<HexBadge>` — hexagonal icon frame

```tsx
import { HexBadge } from "@/components/noct/hex-badge";

<HexBadge variant="green | purple | blue" size="sm | md | lg | xl" noGlow?>
  <Icon className="h-5 w-5" strokeWidth={2} />
</HexBadge>
```

- Used wherever an icon **identifies** a feature/section — KPI cards, feature
  tiles, nav decoration, status indicators, plan cards, step cards.
- Sizes: `sm` 36px (inline with labels), `md` 48px (standard card), `lg` 68px
  (feature hero), `xl` 96px (welcome/celebration).
- Use `noGlow` when a HexBadge sits inside a card that already has its own
  halo — prevents glow stacking.

### 4.3 `<Pill>`, `<DataChip>`, `<TrustScore>`

```tsx
import { Pill, DataChip, TrustScore } from "@/components/noct/pill";

<Pill tone="default | active | win | loss | draw | purple">
  <Icon className="h-3 w-3" /> label
</Pill>

<DataChip tone="default | win | loss">61%</DataChip>

<TrustScore value={10} max={10} />
```

- **`Pill`** — general purpose rounded-full chip. `active` = solid lime
  gradient for date tabs, filters, live indicators. `purple` for premium
  moments. `win`/`loss`/`draw` for state.
- **`DataChip`** — tabular number chip (odds, probabilities, scores).
  Narrower, slightly square. `win` tone highlights the favourite side.
- **`TrustScore`** — the "10/10" style rating pill. Solid green gradient.

**Never** use plain `<span className="bg-green-500 rounded-full">` for a data
chip. Use the primitives so typography, padding and tone are consistent.

---

## 5. Utility classes (from `globals.css`)

### Typography
- `.text-display` — h1-marquee (clamp 1.5–3.5rem, line-height 1, weight 800)
- `.text-heading` — h2/h3 (clamp 1.5–2.75rem, mixed case, weight 700)
- `.text-stat` — tabular numbers (weight 700, tight tracking, tabular-nums)

### Section eyebrow
- `.section-label` — soft rounded-full lime pill placed above every H2. Contains
  a small lucide icon + short uppercase text.

### Gradient text
- `.gradient-text-green` — green-to-dark-green text gradient (highlight word in titles)
- `.gradient-text-purple` — purple variant (Platinum/premium accents)
- `.gradient-text-cyan` — cool blue variant (info)

### Buttons
- `.btn-primary` — logo-green gradient with gloss + glow (key CTA, one per block)
- `.btn-glass` — translucent outline (secondary)
- `.btn-ghost` — transparent, hover background (tertiary, "back" links)
- `.btn-purple` — purple gradient (special feature CTA)

### Card recipes
- `.card-neon` — neutral neon gradient-border card (uses ::before mask)
- `.card-neon-green` / `.card-neon-purple` / `.card-neon-blue` — per-theme border
- `.glass-panel` / `.glass-panel-lifted` / `.glass-panel-raised` — translucent surfaces
- `.halo-green` / `.halo-purple` / `.halo-blue` — coloured drop-shadow under floating cards

### Navigation (dashboard sidebar)
- `.nav-item` — default nav link row
- `.nav-active` — active row (soft green tint + lime left rail)

### Misc
- `.live-dot` / `.live-dot-red` — pulsing status dot
- `.search-pill` — rounded-full search input with blur + lime focus

---

## 6. The section recipe (memorize this)

Every content section follows the same skeleton:

```tsx
<section className="relative overflow-hidden py-20 md:py-28">
  {/* Ambient glow behind section */}
  <div
    aria-hidden
    className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
    style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
  />

  <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
    {/* Section header */}
    <div className="mb-12 max-w-3xl">
      <span className="section-label">
        <Sparkles className="h-3 w-3" /> SECTION BADGE
      </span>
      <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
        Title with <span className="gradient-text-green">highlight</span>
      </h2>
      <p className="mt-4 max-w-xl text-base text-[#a3a9b8]">subtitle copy</p>
    </div>

    {/* Content grid of cards */}
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item, i) => {
        const variant = (["green", "purple", "blue"][i % 3]) as const;
        return (
          <div key={item.id} className={`card-neon card-neon-${variant} p-6 sm:p-7`}>
            {/* IMPORTANT: wrap interior in relative so it sits above the ::before mask */}
            <div className="relative">
              <HexBadge variant={variant} size="md">
                <item.icon className="h-5 w-5" />
              </HexBadge>
              <h3 className="text-heading mt-4 text-xl text-[#ededed]">{item.title}</h3>
              <p className="mt-3 text-sm text-[#a3a9b8]">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>
```

**Notes**
- Section padding: `py-20 md:py-28` for content; `py-6 md:py-8` for dashboard widget spacing.
- Container: `mx-auto max-w-7xl px-4 sm:px-6` (or `max-w-5xl/6xl` for narrower).
- Always include at least one ambient glow blob — no flat section backgrounds.
- Card interior must be wrapped in `<div className="relative">` because
  `.card-neon::before` is the gradient hairline mask.

---

## 7. Common recipes

### 7.1 CTA button row

```tsx
<div className="flex flex-wrap items-center gap-3">
  <Link href="/checkout?plan=bronze" className="btn-primary inline-flex items-center gap-1.5">
    Start free trial <ArrowRight className="h-4 w-4" />
  </Link>
  <Link href="/how-it-works" className="btn-glass">How it works</Link>
</div>
```

Mixed case button text. Icons to the right of the label. `btn-primary` for
exactly one CTA per block.

### 7.2 KPI card

Prefer the shared `<KpiCard>`:

```tsx
import { KpiCard } from "@/components/common/kpi-card";

<KpiCard
  title="Accuracy"
  value="66.7%"
  change={+5.45}
  icon={TrendingUp}
  variant="green"  // "green" | "purple" | "blue" | "none"
/>
```

Or inline if you need full control — always use `card-neon` + `HexBadge` +
`text-stat` for the number + `Pill tone="win|loss|draw"` for change.

### 7.3 Match row (data feed)

```tsx
<div className="card-neon card-neon-green p-4">
  <div className="relative flex items-center gap-3">
    {/* League + time */}
    <div>
      <Pill tone="default">{league}</Pill>
      <Pill tone="default" className="ml-2">
        <Clock className="h-3 w-3" />{kickoff}
      </Pill>
    </div>

    {/* Teams */}
    <div className="flex flex-1 items-center gap-3">
      <TeamLogo src={homeLogo} /><span className="font-semibold text-[#ededed]">{homeTeam}</span>
      <span className="text-xs text-[#6b7280]">vs</span>
      <span className="font-semibold text-[#ededed]">{awayTeam}</span><TeamLogo src={awayLogo} />
    </div>

    {/* Probabilities */}
    <div className="flex gap-2">
      <DataChip tone={predicted === "home" ? "win" : "default"}>{homeProb}%</DataChip>
      <DataChip>{drawProb}%</DataChip>
      <DataChip tone={predicted === "away" ? "win" : "default"}>{awayProb}%</DataChip>
    </div>

    <TrustScore value={Math.round(confidence / 10)} max={10} />
  </div>
</div>
```

### 7.4 Form input (glass style)

```tsx
<input
  className="w-full rounded-lg bg-white/[0.03] px-4 py-3 text-[#ededed] placeholder:text-[#6b7280]"
  style={{
    border: "1px solid hsl(0 0% 100% / 0.1)",
  }}
  onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--accent-green) / 0.6)")}
  onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(0 0% 100% / 0.1)")}
  ...
/>
```

Or use the `.search-pill` class for search-style inputs.

### 7.5 Final CTA band

```tsx
<section className="relative py-20 md:py-28">
  <div className="mx-auto max-w-5xl px-4 sm:px-6">
    <div className="card-neon halo-green relative overflow-hidden p-10 text-center md:p-16">
      {/* Ambient twin glows */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full"
           style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(110px)" }} />
      <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-20 h-[280px] w-[280px] rounded-full"
           style={{ background: "hsl(var(--accent-purple) / 0.24)", filter: "blur(110px)" }} />

      <div className="relative">
        <span className="section-label mx-auto"><Sparkles className="h-3 w-3" /> Ready to try?</span>
        <h2 className="text-display mx-auto max-w-2xl text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
          Start with <span className="gradient-text-green">€0,01</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-[#a3a9b8]">…</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/checkout?plan=bronze" className="btn-primary inline-flex items-center gap-1.5">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/how-it-works" className="btn-ghost">Learn more</Link>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## 8. Anti-patterns (never do these)

- ❌ Brutalist uppercase headings (`className="uppercase tracking-widest"`). Only allowed on section-label eyebrows and tiny mono micro-labels.
- ❌ Corner-bracket decoration via absolute `<span>` elements (legacy PIT LANE).
- ❌ `stripe-lime`, `grid-bg`, `scanline`, `.brackets`, `.brackets-all`, `mono-label` as structural classes.
- ❌ Solid hex containers like `bg-[#0a0a0a]` or `bg-[#181818]` as card backgrounds — use `card-neon` or `glass-panel`.
- ❌ Hard-edge borders (`border-l-2 border-[#4ade80]` rectangles). Let the `.card-neon` gradient border do the work.
- ❌ `rounded-none` / `border-radius: 0` anywhere.
- ❌ Plain `<span class="bg-green-500/20 rounded-full">` data chips. Use `Pill`/`DataChip`.
- ❌ Flat section backgrounds. Always an ambient glow blob.
- ❌ Lucide icons floating without a HexBadge when they're the **primary visual identifier** of a feature/section/card.
- ❌ More than one `btn-primary` per block. Secondary CTAs are `btn-glass` or `btn-ghost`.

---

## 9. Palette rhythm

When you have 3+ cards side-by-side and want each to feel distinct, cycle the
variant by index:

```tsx
const variant = (["green", "purple", "blue"][i % 3]) as "green" | "purple" | "blue";
```

Applied to: `HexBadge`, `card-neon-{variant}`, gradient-text variants,
ambient glow colour. Keep **logo green as the overall accent** — purple and
blue are rhythm fillers, not equal partners.

Platinum / lifetime / premium moments can use amber gold (custom inline
gradient) — see `pricing-section.tsx` Platinum card for the recipe.

---

## 10. Adding content as the dev

When adding/editing a section:

1. Start from the section recipe (Section 6).
2. Pick 3 HexBadge variants for rhythm (default: green / purple / blue cycle).
3. Wrap cards in `card-neon` (+ variant suffix) or `<GlassPanel>`.
4. Wrap every feature icon in `<HexBadge>`.
5. Data → `<Pill>` / `<DataChip>` / `<TrustScore>`.
6. One `btn-primary` CTA max; secondaries in `btn-glass`/`btn-ghost`.
7. At least one ambient glow blob behind the section.
8. Use `hsl(var(--accent-green) / 0.12)` style tokens, not hard-coded hex.
9. Mixed case copy. Uppercase only on section-label eyebrows + small mono labels.

If the result still reads like a SaaS landing page instead of a premium sports
app dashboard, re-check: missing ambient glow, no card-neon gradient border,
plain span chips, brutalist caps, or a flat solid hex container.

---

## 11. Reference files (gold standard)

Study these when in doubt:

- `src/app/home-content.tsx` — full-page composition.
- `src/components/ui/pricing-section.tsx` — variant cycling + amber Platinum.
- `src/components/ui/testimonials-section.tsx` — carousel card rhythm.
- `src/components/ui/comparison-table.tsx` — data-heavy card with Pills.
- `src/components/ui/free-predictions.tsx` — data feed pattern.
- `src/components/common/kpi-card.tsx` — KPI primitive.
- `src/components/layout/sidebar.tsx` + `header.tsx` — shell language.

---

## 12. When to ask

Ping before doing any of:

- Changing design tokens in `globals.css` (`--accent-*`, radii, tokens).
- Introducing a new primitive colour (beyond green / purple / blue / amber).
- Adding a new shape (we use hexagon badges; don't mix in squares or circles as
  primary icon frames).
- Building a new `card-*` variant (name it consistently: `card-neon-{variant}`).

Cosmetic tweaks inside a section (spacing, copy, order) are fine without asking.
