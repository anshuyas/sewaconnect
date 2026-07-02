# SewaConnect

A secure local-services marketplace connecting verified providers (tutors,
electricians, plumbers, home-care workers) with customers, built as the
coursework deliverable for the Secure Web Application Development module.

## Stack

Next.js (App Router) + TypeScript + MongoDB (Mongoose) + Docker + GitHub Actions.

## Folder structure

```
src/
  app/
    (customer)/           customer-facing pages (route group, no /customer prefix)
    (provider)/            provider dashboard pages
    (admin)/                admin dashboard pages
    api/
      auth/                register, login, mfa, logout
      bookings/             booking CRUD — this is where IDOR protection lives
      profile/              profile update — this is where mass-assignment protection lives
      providers/             public provider listing/search
      payments/               initiate + webhook handlers
      admin/                  verify-provider, audit-logs (admin-only, RBAC enforced)

  lib/
    db/                       mongoose connection singleton
    auth/                     JWT issuing/verification, session logic, MFA (TOTP)
    validation/                zod schemas — the mass-assignment allow-lists live here
    crypto/                     field-level encryption helpers (AES-256-GCM)
    payments/                  eSewa/Khalti sandbox client wrappers

  middleware/                 requireAuth, requireRole, requireOwnership —
                                the core RBAC + object-level authorization layer

  models/                     Mongoose schemas: User, ProviderProfile, Booking,
                                Payment, Review, AuditLog

  types/                       shared TypeScript types

tests/
  unit/                        pure function tests
  integration/                  API route tests
  security/                     regression tests for the vulnerabilities you find
                                and fix (IDOR, mass assignment, price tampering) —
                                these are your "fix confirmation + retest evidence"

docs/
  pentest/                      scope doc, methodology notes, vulnerability write-ups
  evidence/                     screenshots/payloads (gitignored — keep out of git
                                history, attach to report separately)
```

## Local setup

```bash
cp .env.example .env        # fill in secrets — never commit .env
docker compose up --build
```

## Security design decisions (expand this as you build — feeds directly into
your report's "Design and Implementation" section)

- **Authorization model**: every resource-scoped API route runs through
  `requireOwnership` in `src/middleware`, which re-derives the resource owner
  from the database — never trusts a client-supplied `userId`.
- **Mass assignment**: all `PATCH`/`PUT` bodies are parsed through explicit
  zod allow-list schemas in `src/lib/validation`; fields like `role` and
  `isVerified` are never accepted from client input on user-facing routes.
- **Password hashing**: Argon2id (see `src/lib/auth`), chosen over bcrypt —
  justify this choice with OWASP Password Storage Cheat Sheet in your report.
- **MFA**: TOTP via `otplib`, no third-party SMS dependency.
- **Encryption at rest**: provider verification documents encrypted with
  AES-256-GCM before storage (`src/lib/crypto`); key from `ENCRYPTION_KEY` env
  var — in production this would move to a KMS.
- **Transaction integrity**: payment amount always recalculated server-side
  before charging; idempotency key per booking prevents double-charge.

## Commit convention

Use prefixes so your commit history maps cleanly to your report's
"mapping GitHub commits to security decisions" section:

- `feat:` new functionality
- `sec:` a security control added
- `fix:` a vulnerability fix (reference the doc in `docs/pentest/`)
- `test:` new test coverage
- `docs:` documentation
