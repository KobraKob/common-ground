#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE must be set}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/commonground-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
umask 077

PLAIN="$BACKUP_DIR/commonground-$STAMP.dump"
ENCRYPTED="$PLAIN.gpg"
PASS_FILE="$(mktemp)"
chmod 600 "$PASS_FILE"
printf '%s' "$BACKUP_ENCRYPTION_PASSPHRASE" > "$PASS_FILE"
unset BACKUP_ENCRYPTION_PASSPHRASE
trap 'rm -f "$PLAIN" "$PASS_FILE"' EXIT

PG_DUMP_URL="$(printf '%s' "$DATABASE_URL" | sed 's#^postgresql+asyncpg://#postgresql://#')"
pg_dump --version
echo "[$(date -u +%FT%TZ)] Creating PostgreSQL backup."
pg_dump --dbname="$PG_DUMP_URL" --format=custom --no-owner --no-acl --file="$PLAIN"
test -s "$PLAIN"
pg_restore --list "$PLAIN" >/dev/null

gpg --batch --yes --pinentry-mode loopback --symmetric --cipher-algo AES256 \
  --passphrase-file "$PASS_FILE" --output "$ENCRYPTED" "$PLAIN"
test -s "$ENCRYPTED"
sha256sum "$ENCRYPTED" > "$ENCRYPTED.sha256"
rm -f "$PLAIN"

: "${BACKUP_S3_URI:?BACKUP_S3_URI must point to encrypted off-host object storage}"
command -v aws >/dev/null || { echo "AWS CLI is required for BACKUP_S3_URI uploads." >&2; exit 1; }
aws s3 cp "$ENCRYPTED" "$BACKUP_S3_URI/$(basename "$ENCRYPTED")" --sse AES256
aws s3 cp "$ENCRYPTED.sha256" "$BACKUP_S3_URI/$(basename "$ENCRYPTED.sha256")" --sse AES256
echo "[$(date -u +%FT%TZ)] Encrypted backup and checksum uploaded."

find "$BACKUP_DIR" -type f -name 'commonground-*.dump.gpg' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'commonground-*.dump.gpg.sha256' -mtime "+$RETENTION_DAYS" -delete
echo "[$(date -u +%FT%TZ)] Backup archive and checksum verified."
