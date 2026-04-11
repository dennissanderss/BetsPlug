#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Setup git hooks for auto-translation
# Run once after cloning: sh frontend/scripts/setup-hooks.sh
# ─────────────────────────────────────────────────────────────

HOOK_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat > "$HOOK_DIR/pre-commit" << 'HOOK'
#!/bin/sh
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

  cd frontend && node scripts/translate.mjs $TRANSLATE_FLAGS 2>&1
  if [ $? -eq 0 ]; then
    git add src/i18n/locales/de.ts \
            src/i18n/locales/fr.ts \
            src/i18n/locales/es.ts \
            src/i18n/locales/it.ts \
            src/i18n/locales/sw.ts \
            src/i18n/locales/id.ts 2>/dev/null
    git add src/i18n/messages.ts 2>/dev/null
    git add src/data/page-meta.ts 2>/dev/null
    echo ""
    echo "  i18n: All translation files auto-staged ✓"
    echo ""
  fi
  cd ..
fi
HOOK

chmod +x "$HOOK_DIR/pre-commit"
echo "Pre-commit hook installed"
