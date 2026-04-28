#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Setup git hooks for auto-translation + hardcoded-string check.
# Run once after cloning:  sh frontend/scripts/setup-hooks.sh
# ─────────────────────────────────────────────────────────────

HOOK_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat > "$HOOK_DIR/pre-commit" << 'HOOK'
#!/bin/sh
# 1. Block commits that introduce hardcoded isNl/locale ternaries —
#    those bypass the i18n dictionary and were the root cause of the
#    April 2026 brand-SEO collapse.
# 2. Block commits that introduce raw Dutch UI text (JSX text node or
#    common JSX prop) anywhere in src/, including the authed (app)
#    routes that the ternary-only check skips. Pre-existing leaks
#    are tolerated (--diff-only); only NEW Dutch is blocked.
# 3. If messages.ts or page-meta.ts changed, auto-run the translator
#    so missing locales are filled before the commit lands.

REPO_ROOT="$(git rev-parse --show-toplevel)"

# ── Guard 1: hardcoded isNl / locale ternaries (STAGED files) ────
# Pass only staged .ts/.tsx files to the checker so pre-existing
# violations in untouched files don't block an unrelated commit.
cd "$REPO_ROOT/frontend" || exit 1
STAGED=$(git diff --cached --name-only --diff-filter=ACM -- \
           'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' 2>/dev/null \
           | sed 's|^frontend/||')
if [ -n "$STAGED" ]; then
  # shellcheck disable=SC2086
  if ! node scripts/check-no-hardcoded-strings.mjs $STAGED; then
    echo ""
    echo "  ✗ pre-commit: hardcoded locale ternary in a staged file —"
    echo "    commit blocked. Extract each string to messages.ts and"
    echo "    use t(\"key\") via useTranslations() instead."
    echo "    See CLAUDE.md § i18n for the full convention."
    exit 1
  fi
fi

# ── Guard 2: raw Dutch UI text in NEW lines of staged files ──────
# Diff-only mode: only flags Dutch strings the staged change
# introduces. A pre-existing backlog of Dutch leaks in src/app/(app)
# does not block unrelated commits — but every NEW Dutch leak does.
if [ -n "$STAGED" ]; then
  # shellcheck disable=SC2086
  if ! node scripts/check-no-dutch-leaks.mjs --diff-only $STAGED; then
    echo ""
    echo "  ✗ pre-commit: NEW hardcoded Dutch UI text in a staged file —"
    echo "    commit blocked. Add the string to messages.ts (en + nl) and"
    echo "    use t(\"key\") via useTranslations(); the translator (or"
    echo "    apply-i18n-batch.mjs) will fill the other 14 locales."
    exit 1
  fi
fi

# ── Auto-translate if dictionary or page-meta changed ──────────
MESSAGES_CHANGED=""
PAGEMETA_CHANGED=""

if git diff --cached --name-only | grep -q "frontend/src/i18n/messages.ts"; then
  MESSAGES_CHANGED="1"
fi
if git diff --cached --name-only | grep -q "frontend/src/data/page-meta.ts"; then
  PAGEMETA_CHANGED="1"
fi

if [ -n "$MESSAGES_CHANGED" ] || [ -n "$PAGEMETA_CHANGED" ]; then
  echo ""
  [ -n "$MESSAGES_CHANGED" ] && echo "  i18n: messages.ts changed"
  [ -n "$PAGEMETA_CHANGED" ] && echo "  i18n: page-meta.ts changed"
  echo "  i18n: auto-translating..."
  echo ""

  TRANSLATE_FLAGS=""
  if [ -z "$PAGEMETA_CHANGED" ]; then
    TRANSLATE_FLAGS="--skip-page-meta"
  fi

  node scripts/translate.mjs $TRANSLATE_FLAGS 2>&1
  if [ $? -eq 0 ]; then
    git add src/i18n/locales/*.ts 2>/dev/null
    git add src/i18n/messages.ts 2>/dev/null
    git add src/data/page-meta.ts 2>/dev/null
    echo ""
    echo "  i18n: All translation files auto-staged ✓"
    echo ""
  fi
fi
HOOK

chmod +x "$HOOK_DIR/pre-commit"
echo "Pre-commit hook installed"
