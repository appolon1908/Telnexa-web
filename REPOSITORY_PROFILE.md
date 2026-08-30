# Repository Profile — `Telnexa-web`

## Identity

- **Repository:** `appolon1908-hue/Telnexa-web`
- **Category:** Public website — Telnexa
- **Visibility:** `private`
- **Default branch:** `main`
- **Authority:** Primary Telnexa marketing, compliance, and service-onboarding frontend authority
- **Status:** Large Nuxt bilingual website with legal publication and service activation deliberately gated.

## Purpose

Provides the public website for Telnexa communications products, legal/compliance content, conversion forms, support, privacy requests, and reviewed onboarding for SMS, voice, AI voice, and wholesale services.

## Owns

- Public Telnexa product, marketing, support, legal, and privacy pages
- Conversion and service-onboarding forms
- Bilingual SEO, accessibility, compliance, and same-origin intake behavior

## Does not own

- Jasmin/SMPP runtime, SMS billing, or provider credentials
- VICIdial/Asterisk voice runtime
- Automatic service provisioning or one-click activation

## Key integrations

- Kong and Middleware
- `telnexa` for SMS runtime
- `Vicidialer-Codestra` for voice
- Odoo and n8n only behind Middleware

## Current priorities

1. Complete counsel review and immutable legal-policy archives
2. Keep onboarding review-only and fail closed
3. Prove forms, bilingual routes, accessibility, SEO, and performance
4. Complete Docker, Caddy, staging, DNS/TLS, rollback, and production evidence

## Governance and safety

- Promotion model: `feature/docs/fix/security/upgrade -> development -> test -> staging -> production -> main`.
- Use pull requests and exact-head/merge-result validation; merge never activates a communications service.
- Never expose Odoo, n8n, Jasmin, Postal, SIP providers, databases, queues, or secrets to browsers.
- Legal publication and provider activation require separate approval.
- This document does not send SMS/email, place calls, provision services, or activate production.

## Account-wide catalog

See `appolon1908-hue/documentaions/REPOSITORY_CATALOG.md`.
