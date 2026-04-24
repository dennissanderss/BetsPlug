# BetsPlug session-start protocol

Every new Claude Code session opens with the routine below before touching any feature work. The goal is to catch surprises that landed while I was away — deploys, dictionary drift, hardcoded strings re-introduced by a co-founder commit — and surface them to the user in a single standup-style summary.

I am not a long-running agent. I cannot monitor the repo between sessions. What I CAN do is front-load a few cheap checks each time we reconnect so the human never has to ask "what happened since yesterday?".

## 1 — Resolve the last session anchor

Prefer the most recent commit that mentions `i18n`, `seo`, or was made by this assistant (`Co-Authored-By: Claude Opus`). That's "last session". Fallback: last 24h.

```bash
git log --oneline -20                              # orient
git log --oneline --author="Claude" -5             # last assistant commits
git log --oneline --since="1 day ago"              # active window
```

## 2 — Surface new activity (human + machine commits)

```bash
git log --oneline --since="<anchor>"               # new commits
git diff --stat <anchor>..HEAD                     # file-level churn
```

Flag:
- Commits authored by Denis (co-founder) that are NOT co-authored by me — those may contain hardcoded strings or schema drift.
- Changes in `frontend/src/i18n/messages.ts`, `frontend/src/i18n/locales/*.ts`, `frontend/src/data/page-meta.ts` — i18n drift surface.
- Changes under `frontend/src/app/(app)/` — authed dashboard where the hardcoded-string rule is intentionally relaxed.

## 3 — Hardcoded-string scan on changed files

```bash
cd frontend
CHANGED=$(git diff --name-only <anchor>..HEAD -- 'src/**/*.ts' 'src/**/*.tsx' | sed 's|^frontend/||')
[ -n "$CHANGED" ] && node scripts/check-no-hardcoded-strings.mjs $CHANGED
```

If violations, list them in the standup. Do NOT silently fix — the user decides priority.

## 4 — Deploy status

```bash
# Last commit on main that Vercel should have deployed
git log origin/main --oneline -3
# Does the sitemap on prod reflect the latest league/combo/pillar set?
curl -s https://betsplug.com/sitemap.xml | grep -c "<loc>"
# Canonical + hreflang sanity on one page
curl -sI https://betsplug.com/ | grep -iE "x-robots-tag|content-language"
curl -s https://betsplug.com/ | grep -c "hreflang"
```

Known-good numbers on EN-only phase (pre Nerdytips rollout): sitemap `<loc>` count ≈ 80–90, hreflang count = 0 on `/`. Under Nerdytips rollout: sitemap `<loc>` ≈ high thousands, hreflang count = 17 per page (x-default + 16 locales).

## 5 — Translation gap scan

```bash
# How many UI keys are missing in each aux locale? (rough signal)
for f in frontend/src/i18n/locales/*.ts; do
  loc=$(basename "$f" .ts)
  en_count=$(grep -c '":' frontend/src/i18n/messages.ts || true)
  loc_count=$(grep -c '":' "$f" || true)
  echo "$loc: $loc_count keys (EN source: $en_count)"
done
```

If any locale is >50 keys behind EN, run `node scripts/translate.mjs` to catch up.

## 6 — Sanity content gaps (after Nerdytips schema migration)

The Phase 2 Sanity schema is live on `feat/i18n-full-scale`. DeepL
Free-tier backfill is **partial as of 2026-04-25**: `learnPillar`
documents got ~3-4 of 6 translated into the 13 DeepL-supported
locales; every other type (`leagueHub`, `betTypeHub`, `pageMeta`,
`homepage`, etc.) is still EN-only in Sanity — render falls back to
EN on /xx/ URLs via `locRecord`.

**Quota resets 1 May.** Either upgrade to DeepL Growth (€23.80/mo
for 5M chars) to finish immediately, or wait for the monthly
rollover and complete the remaining types with the 500k allowance.

```bash
# Quick gap check — how many documents per type have EN content
# but are missing at least one non-EN locale. Needs SANITY_API_TOKEN.
# (script to be added after Growth decision)

# DeepL usage — shows characters consumed this month.
curl -s -H "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
  https://api-free.deepl.com/v2/usage
```

When ready to resume:
```bash
cd frontend && \
  DEEPL_API_KEY=xxx SANITY_API_TOKEN=yyy \
  node scripts/translate-sanity.mjs --force
```

Budget-aware partial run (top 6 locales only, fits in 500k):
```bash
# Edit TARGET_LOCALES in translate-sanity.mjs to ["nl","de","fr","es","it","pt"]
# before running. Revert afterwards.
```

## 7 — Open the standup to the user

Format:

> **Since last session (<anchor>):**
> - <N> new commits on main (<M> from Denis, <N-M> from me)
> - Changed files of interest: `<paths>`
> - Hardcoded-string scan: <pass / N violations>
> - Deploy: <sitemap count, hreflang count, health>
> - Translation gap: <per-locale key delta>
>
> **Action suggested:** <one-line proposal, e.g. "run the translator to fill 12 missing DE keys" or "clean git state, nothing pending">.
>
> What are we working on today?

That's the ritual. Skip it only if the user's opening message explicitly overrides ("skip the standup, just do X").
