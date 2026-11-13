#!/usr/bin/env bash
set -Eeuo pipefail

: "${BACKUP_FILE:?Set BACKUP_FILE to an encrypted .dump.gpg backup}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?BACKUP_ENCRYPTION_PASSPHRASE must be set}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to an isolated disposable database}"
test -s "$BACKUP_FILE"

if [[ -f "$BACKUP_FILE.sha256" ]]; then
  EXPECTED_SHA="$(awk 'NR == 1 {print $1}' "$BACKUP_FILE.sha256")"
  ACTUAL_SHA="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
  test -n "$EXPECTED_SHA" && test "$EXPECTED_SHA" = "$ACTUAL_SHA"
fi

RESTORE_DIR="$(mktemp -d)"
PLAIN="$RESTORE_DIR/restore.dump"
PASS_FILE="$RESTORE_DIR/passphrase"
chmod 700 "$RESTORE_DIR"
printf '%s' "$BACKUP_ENCRYPTION_PASSPHRASE" > "$PASS_FILE"
unset BACKUP_ENCRYPTION_PASSPHRASE
trap 'rm -rf "$RESTORE_DIR"' EXIT

gpg --batch --yes --pinentry-mode loopback --decrypt --passphrase-file "$PASS_FILE" --output "$PLAIN" "$BACKUP_FILE"
pg_restore --list "$PLAIN" >/dev/null
RESTORE_URL="$(printf '%s' "$RESTORE_DATABASE_URL" | sed 's#^postgresql+asyncpg://#postgresql://#')"
pg_restore --dbname="$RESTORE_URL" --clean --if-exists --no-owner --no-acl "$PLAIN"
psql "$RESTORE_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), now();'
echo "Restore completed. Run application-level smoke tests before declaring the drill successful."
