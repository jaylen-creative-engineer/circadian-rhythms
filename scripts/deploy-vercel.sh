#!/usr/bin/env bash
# Deploy circadian-rhythms to Vercel and sync environment variables from .env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
PROJECT_NAME="${VERCEL_PROJECT:-circadian-rhythms}"

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "Not logged in to Vercel. Run: npx vercel login"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

echo "→ Linking Vercel project ($PROJECT_NAME)…"
npx vercel link --yes --project "$PROJECT_NAME" 2>/dev/null || npx vercel link --yes

is_sensitive() {
  case "$1" in
    WHOOP_CLIENT_SECRET|NEXTAUTH_SECRET|SUPABASE_SECRET_KEY|CRON_SECRET) return 0 ;;
    *) return 1 ;;
  esac
}

push_env() {
  local key="$1"
  local value="$2"
  echo "  · $key"
  for env in production preview development; do
    if is_sensitive "$key"; then
      npx vercel env add "$key" "$env" \
        --value "$value" --yes --force --sensitive >/dev/null
    else
      npx vercel env add "$key" "$env" \
        --value "$value" --yes --force >/dev/null
    fi
  done
}

HAS_CRON_SECRET=0
echo "→ Pushing environment variables to Vercel…"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  [[ "$key" == "NEXTAUTH_URL" ]] && continue
  [[ "$key" == "CRON_SECRET" ]] && HAS_CRON_SECRET=1
  push_env "$key" "$value"
done < "$ENV_FILE"

if [[ "$HAS_CRON_SECRET" -eq 0 ]]; then
  CRON_SECRET="$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  echo "  · CRON_SECRET (generated)"
  npx vercel env add CRON_SECRET production \
    --value "$CRON_SECRET" --yes --force --sensitive >/dev/null
  npx vercel env add CRON_SECRET preview \
    --value "$CRON_SECRET" --yes --force --sensitive >/dev/null
  npx vercel env add CRON_SECRET development \
    --value "$CRON_SECRET" --yes --force --sensitive >/dev/null
fi

echo "→ Production deploy (initial)…"
DEPLOY_LOG="$(mktemp)"
npx vercel deploy --prod --yes 2>&1 | tee "$DEPLOY_LOG"
DEPLOY_URL="$(grep -Eo 'https://[a-zA-Z0-9._-]+\.vercel\.app' "$DEPLOY_LOG" | head -1 || true)"
rm -f "$DEPLOY_LOG"

if [[ -z "$DEPLOY_URL" ]]; then
  DEPLOY_URL="https://${PROJECT_NAME}.vercel.app"
  echo "→ Could not parse deploy URL; using $DEPLOY_URL"
else
  echo "→ Deploy URL: $DEPLOY_URL"
fi

echo "→ Setting NEXTAUTH_URL=$DEPLOY_URL"
for env in production preview development; do
  npx vercel env add NEXTAUTH_URL "$env" \
    --value "$DEPLOY_URL" --yes --force >/dev/null
done

echo "→ Redeploying with NEXTAUTH_URL…"
npx vercel deploy --prod --yes

echo ""
echo "Done."
echo "  App:        $DEPLOY_URL"
echo "  Display:    $DEPLOY_URL/display?mode=peak"
echo "  Settings:   $DEPLOY_URL/dashboard/settings"
echo ""
echo "Update WHOOP Developer Dashboard:"
echo "  OAuth redirect: $DEPLOY_URL/api/auth/callback/whoop"
echo "  Webhook URL:    $DEPLOY_URL/api/webhooks/whoop (v2)"
