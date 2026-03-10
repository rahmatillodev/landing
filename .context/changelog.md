# Changelog

> Permanent record of all changes. Newest at top. Never delete entries.

---

## 2026-02-27 — task-001: A/B Test Survey Before Telegram Redirect

**Files modified:**
- `index.html` — Added `id="cta-join-mid"` to mid-page CTA, survey modal CSS (~40 rules), survey modal HTML (4-question form with radio/checkbox inputs)
- `script.js` — Added A/B variant assignment IIFE (50/50 split, sessionStorage), added `variant` field to `buildRow()` for `attribution_logs`, added survey IIFE (CTA interception, modal open/close, form validation, Supabase insert to `survey_responses`, 5s fallback timeout, error handling)

**DB migration required (Supabase SQL Editor):**
- ALTER `attribution_logs`: add `variant` text column (nullable, CHECK A/B)
- CREATE `survey_responses` table with FK to `attribution_logs`, CHECK constraints, RLS for anon insert/select
