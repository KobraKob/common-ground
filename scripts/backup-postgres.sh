#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
umask 077

OUT="$BACKUP_DIR/commonground-$STAMP.dump"
echo "[$(date -u +%FT%TZ)] Creating PostgreSQL backup: $OUT"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$OUT"
test -s "$OUT"
pg_restore --list "$OUT" >/dev/null
sha256sum "$OUT" > "$OUT.sha256"
find "$BACKUP_DIR" -type f -name 'commonground-*.dump' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'commonground-*.dump.sha256' -mtime "+$RETENTION_DAYS" -delete
echo "[$(date -u +%FT%TZ)] Backup created and archive listing verified."
echo "Restore verification must be performed against an isolated database; see docs/RELEASE_READINESS.md."
