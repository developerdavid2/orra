# Auth

## Overview

The better-auth server config used by the user service: email OTP and two factor plugins, custom user fields, cookie cache, nodemailer for email.

## Stack

- **Key dependencies**: better-auth, drizzle-orm, zod, nodemailer

## Conventions

- Single `createAuth()` in `src/index.ts`; email templates in `src/lib/email-templates.ts`
- Sessions last 24 hours

## Gotchas

- Polar billing is wired into `createAuth()` when `config.polar` is provided, enabling the checkout, portal, and webhooks sub-plugins; the Polar SDK client lives in `packages/auth`, and webhook plan-tier sync writes to the DB directly via `@orra/db`

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
