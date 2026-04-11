#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Setup git hooks for auto-translation
# Run once after cloning: sh frontend/scripts/setup-hooks.sh
# ─────────────────────────────────────────────────────────────

HOOK_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat > "$HOOK_DIR/pre-commit" << 'HOOK'
#!/bin/sh
if git diff --cached --name-only | grep -q "frontend/src/i18n/messages.ts"; then
  echo ""
  echo "  i18n: messages.ts changed — auto-translating..."
  echo ""
  cd frontend && node scripts/translate.mjs 2>&1
  if [ $? -eq 0 ]; then
    git add src/i18n/locales/de.ts \
            src/i18n/locales/fr.ts \
            src/i18n/locales/es.ts \
            src/i18n/locales/it.ts \
            src/i18n/locales/sw.ts \
            src/i18n/locales/id.ts 2>/dev/null
    echo ""
    echo "  i18n: Locale files auto-staged ✓"
    echo ""
  fi
  cd ..
fi
HOOK

chmod +x "$HOOK_DIR/pre-commit"
echo "✓ Pre-commit hook installed"
