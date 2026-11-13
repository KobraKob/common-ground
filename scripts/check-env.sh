#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

missing=()
while IFS='=' read -r key _; do
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  key="$(printf '%s' "$key" | tr -d '[:space:]')"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  value="${!key-}"
  if [[ -z "$value" ]]; then missing+=("$key"); fi
done < "$ENV_FILE"

if [[ "${ENVIRONMENT:-development}" == "production" ]]; then
  for key in SECRET_KEY DATABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET NEXT_PUBLIC_API_URL CORS_ORIGINS BACKUP_S3_URI BACKUP_ENCRYPTION_PASSPHRASE; do
    value="${!key-}"
    if [[ -z "$value" || "$value" == replace-with* ]]; then missing+=("$key"); fi
  done
  if [[ "${DATABASE_URL:-}" == sqlite* ]]; then echo "Production DATABASE_URL must not use SQLite." >&2; exit 1; fi
  if [[ "${NEXT_PUBLIC_API_URL:-}" != https://* ]]; then echo "Production NEXT_PUBLIC_API_URL must use HTTPS." >&2; exit 1; fi
fi

if (( ${#missing[@]} > 0 )); then
  printf 'Missing required environment values: %s\n' "$(printf '%s ' "${missing[@]}" | xargs)" >&2
  exit 1
fi

echo "Environment variables are present. Secret values were not printed."
