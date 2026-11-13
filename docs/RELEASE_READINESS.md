# CommonGround release readiness and operational controls

This document defines the controls expected before a production release. It is deliberately explicit about actions that require production credentials or operator approval. CI must never receive production database credentials.

## 1. Automated quality gates

Required for every pull request:
- Backend unit/integration suite: `cd backend && pytest -q`.
- Frontend static type validation and production build: `cd frontend && npm ci && npm run typecheck && npm run build`.
- Production-route HTTP smoke checks after the server starts.
- Playwright + axe checks for core routes, responsive overflow, theme switching, campus-map selection, mentorship guest state and reduced motion.
- Mobile-throttled Lighthouse collection for landing, discovery, city, Commons and Build; current budgets warn on LCP, CLS and total blocking time.
- Python dependency audit: `pip-audit -r backend/requirements.txt`.
- npm audit: `npm audit --audit-level=high` from `frontend/`.
- Secret scanning and dependency-change review.
- Human review of authorization, privacy, migrations, configuration and third-party changes.

The repository now contains a browser smoke suite using Playwright and axe. It checks route rendering, desktop/mobile horizontal overflow, selected accessible interactions and serious/critical automated accessibility violations. It is not full authenticated journey coverage. Add multi-user journeys for signup/login, onboarding, messaging, community privacy/block boundaries, project collaboration, event attendance and moderation before claiming complete E2E coverage. A Lighthouse lab run is not a substitute for real-device field INP measurement.

## 2. Dependency reproducibility

- Keep `frontend/package-lock.json` committed. CI must use `npm ci`, never `npm install`.
- `backend/requirements.in` is the Python input manifest. Generate a complete, hash-pinned lock using:
  `pip-compile --generate-hashes --resolver=backtracking --output-file=backend/requirements.lock backend/requirements.in`
  Run from repository root with pip-tools installed.
- Once the lock is generated and reviewed, install in CI with `pip-sync backend/requirements.lock` and use the lock as the cache key.
- Dependabot updates must be reviewed and pass the same CI gates. Do not auto-merge dependency updates into production.
- Pin GitHub Actions to reviewed full commit SHAs as a follow-up hardening task; major-version tags are used in the initial workflows for maintainability.

## 3. Environment parity and staging

Maintain staging with the same:
- OS/container base images and supported runtime versions.
- PostgreSQL major version and migration sequence.
- Middleware, reverse-proxy behavior, TLS policy and network boundaries.
- Required environment-variable names and service integrations.
- Monitoring, logging and health-check integrations.

Staging data must be synthetic or anonymized. Never copy production personal data into staging without an approved, documented privacy process. Validate external service connectivity and secret availability using staging-only credentials. Record configuration drift and resolve it before release.

## 4. Secrets and configuration

- Copy `.env.example` to an untracked local `.env`; replace every placeholder.
- Store deployed secrets in the hosting provider's encrypted environment/secret manager. Do not store them in GitHub variables when a secret store is available.
- Rotate any real credential that has ever been committed. Removing a value from the current file does not remove it from Git history.
- Do not expose service-role keys, database URLs or signing secrets through `NEXT_PUBLIC_*`.
- Validate production values, CORS origins, redirect URLs, TLS certificates, firewall rules and outbound service access during the staging release rehearsal.
- Configuration changes must be reviewed and version-controlled. Do not put secret values in configuration files or logs.

## 5. Database backup and restore

Before every production deployment that can change data or schema:
1. Confirm a recent automated backup exists.
2. Create a fresh timestamped custom-format dump with `scripts/backup-postgres.sh`.
3. Verify the dump can be listed and its SHA-256 checksum matches.
4. Store backups in encrypted, access-controlled storage outside the application host. The local script writes to a local directory only; configure secure off-host upload/retention in the deployment platform.
5. Run scheduled restore drills against an isolated disposable database using `scripts/restore-drill-postgres.sh`.
6. Record backup time, restore duration, verification result, RPO and RTO.

A successful `pg_dump` is not proof of recoverability. Only a completed isolated restore plus application-level verification counts as a successful restore drill.

## 6. Migration procedure

- Review SQL migration diffs and confirm forward-only/backward compatibility.
- Prefer expand/contract migrations: add nullable structures first, deploy compatible code, backfill in bounded batches, then enforce constraints/remove old structures in a later release.
- Snapshot the database immediately before schema/data changes.
- Test the exact migration order against a fresh database and a production-like staging snapshot with anonymized data.
- Communicate maintenance window, expected impact, owner and rollback decision point.
- Never assume a destructive migration can be rolled back by reversing SQL. Define a tested compensating migration or restore strategy.
- Do not run production migrations from pull-request CI.
- Record applied migration identifiers and post-migration validation queries.

## 7. Deployment checklist

- [ ] All required CI jobs green; no skipped security checks.
- [ ] Peer review completed; high-risk changes receive a second reviewer.
- [ ] Dependency review and vulnerability triage completed.
- [ ] Staging deploy completed using the same image/build artifact intended for production.
- [ ] Staging health, auth, storage, email and external endpoint checks passed.
- [ ] Environment drift, TLS, firewall and DNS checks passed.
- [ ] Backup created, checksum verified and restore drill status reviewed.
- [ ] Migration sequence and rollback/restore plan approved.
- [ ] Stakeholders notified of timing and impact.
- [ ] Post-deploy smoke tests, error rates and latency monitored.
- [ ] Release owner records outcome and any follow-up issues.

## 8. Operational limitations / owner actions

GitHub CI cannot safely create production backups, inspect hosting-provider secrets, verify deployed TLS certificates, or prove staging parity without environment-specific credentials and infrastructure access. Those checks remain explicit release-owner tasks until the relevant provider integrations and protected staging environment are configured.

The repository currently has no confirmed staging environment or production backup destination. Configure those outside GitHub before treating the controls as operational.
