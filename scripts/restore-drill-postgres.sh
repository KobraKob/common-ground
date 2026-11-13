#!/usr/bin/env bash
set -Eeuo pipefail

: "${BACKUP_FILE:?Set BACKUP_FILE to a verified custom-format pg_dump file}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to an isolated, disposable database}"
test -s "$BACKUP_FILE"
if [[ -f "$BACKUP_FILE.sha256" ]]; then
  sha256sum --check "$BACKUP_FILE.sha256"
fi
pg_restore --list "$BACKUP_FILE" >/dev/null
echo "Restoring into the explicitly supplied isolated target."
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists --no-owner --no-acl "$BACKUP_FILE"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), now();'
echo "Restore command completed. Run application-level smoke tests before declaring the drill successful."
