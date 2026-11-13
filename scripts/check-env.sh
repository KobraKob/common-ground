#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-.env}"
EXAMPLE_FILE="${2:-.env.example}"
if [[ ! -f "$ENV_FILE" || ! -f "$EXAMPLE_FILE" ]]; then
  echo "Provide an environment file and the repository .env.example." >&2
  exit 1
fi

declare -A values=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line#"\${line%%[![:space:]]*}"}"
  [[ -z "$line" || "$line" == \#* || "$line" != *=* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  key="$(printf '%s' "$key" | tr -d '[:space:]')"
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && values["$key"]="$value"
done < "$ENV_FILE"

get_value() {
  local name="$1"
  local env_value="${!name-}"
  if [[ -n "$env_value" ]]; then printf '%s' "$env_value"; else printf '%s' "${values[$name]-}"; fi
}

missing=()
while IFS='=' read -r key _; do
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  key="$(printf '%s' "$key" | tr -d '[:space:]')"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  value="$(get_value "$key")"
  if [[ -z "$value" ]]; then missing+=("$key"); fi
done < "$EXAMPLE_FILE"

environment="$(get_value ENVIRONMENT)"
if [[ "$environment" == "production" ]]; then
  for key in SECRET_KEY DATABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_JWT_SECRET NEXT_PUBLIC_API_URL CORS_ORIGINS BACKUP_S3_URI BACKUP_ENCRYPTION_PASSPHRASE; do
    value="$(get_value "$key")"
    if [[ -z "$value" || "$value" == replace-with* ]]; then missing+=("$key"); fi
  done
  database_url="$(get_value DATABASE_URL)"
  api_url="$(get_value NEXT_PUBLIC_API_URL)"
  cors_origins="$(get_value CORS_ORIGINS)"
  if [[ "$database_url" == sqlite* ]]; then echo "Production DATABASE_URL must not use SQLite." >&2; exit 1; fi
  if [[ "$api_url" != https://* ]]; then echo "Production NEXT_PUBLIC_API_URL must use HTTPS." >&2; exit 1; fi
  if [[ "$cors_origins" == *localhost* || "$cors_origins" == *127.0.0.1* ]]; then echo "Production CORS_ORIGINS must not include localhost." >&2; exit 1; fi
fi

if (( ${#missing[@]} > 0 )); then
  printf 'Missing required environment values: %s\n' "$(printf '%s ' "${missing[@]}" | xargs)" >&2
  exit 1
fi

echo "Environment variables are present. Secret values were not printed."
