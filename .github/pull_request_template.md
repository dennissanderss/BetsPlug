<!-- Pull request template — see docs/i18n.md for context. -->

## Summary

<!-- 1-3 bullets: what changed and why. -->

## i18n checklist

- [ ] No hardcoded user-facing strings added (use `t("key")` via `useTranslations()`)
- [ ] New translation keys added to `frontend/src/i18n/messages.ts` EN block
- [ ] Hand-translated for all 6 ENABLED_LOCALES (en/nl/de/fr/es/it) — auto-translator is OK for parked locales but not for enabled ones
- [ ] `npm run i18n:check` passes locally
- [ ] No `t(... as any)` or other type-system bypasses
- [ ] If a meta-tag was added: it lives in `PAGE_META` (`src/data/page-meta.ts`) for all 6 enabled locales

## Test plan

<!-- Bulleted markdown checklist. -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
