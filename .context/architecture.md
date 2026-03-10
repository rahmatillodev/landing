# Architecture

> Source of truth for system structure. Every agent reads this first.

## Overview
AI Clothing Business Course landing page (Uzbek language). Conversion-focused static site selling a paid Telegram course (99,000 UZS) that teaches AI-powered methods for starting a clothing business. Visitors land → watch video → click CTA → redirect to Telegram bot for payment/enrollment.

## Tech Stack
- **Framework**: None — vanilla HTML5, CSS3, plain JavaScript (no build tools)
- **Language**: JavaScript (ES5-compatible, no transpilation)
- **Database**: Supabase (PostgreSQL) for visitor attribution/analytics
- **API**: Supabase JS client v2 (CDN), geojs.io REST API
- **State management**: DOM attributes, sessionStorage, URL parameters
- **Styling**: Pure CSS with custom properties (design system variables)
- **Hosting**: Netlify (static deploy with `_redirects`)

## Directory Structure
```
/
├── index.html          # Main landing page (all HTML + inline CSS)
├── go.html             # Telegram redirect page (attribution handoff)
├── script.js           # All JS logic (attribution, video, carousel)
├── _redirects          # Netlify clean URL routing (/go → go.html)
├── assets/
│   └── images/         # Course images, Telegram screenshots, cover
├── .context/           # Workflow context files
├── .kanban/            # Task management board
└── CLAUDE.md           # Claude Code config
```

## Database
- **Provider**: Supabase (hosted PostgreSQL)
- **Endpoint**: `https://amwtipeqehtnbcbeprfq.supabase.co`
- **Schema location**: Managed in Supabase dashboard (no local migrations)
- **Key tables**:
  - `attribution_logs` — tracks every visitor with UTM params, device info, geo data, Meta Pixel IDs

### `attribution_logs` Schema
| Column       | Type         | Purpose                          |
|-------------|-------------|----------------------------------|
| id          | text         | Unique visit ID (generated client-side) |
| ip_address  | text         | Visitor IP (from geojs.io)       |
| city        | text         | Geo city                         |
| state       | text         | Geo region                       |
| device      | text         | OS + Browser string              |
| fbp         | text         | Meta Pixel `_fbp` cookie         |
| fbc         | text         | Meta Pixel `fbc` token           |
| fbclid      | text         | Facebook click ID                |
| user_agent  | text         | Full UA string                   |
| utm_source  | text         | Attribution source               |
| utm_medium  | text         | Attribution medium               |
| utm_campaign| text         | Attribution campaign             |
| utm_term    | text         | Attribution term                 |
| utm_content | text         | Attribution content              |
| created_at  | timestamptz  | Auto-set on insert               |

## External Services
- **Supabase**: Visitor attribution analytics (insert on visit, async enrich)
- **geojs.io**: Free geolocation API (`https://get.geojs.io/v1/ip/geo.json`, 5s timeout)
- **Meta Pixel**: Facebook conversion tracking (reads/creates `_fbp` cookie, constructs `fbc` from `fbclid`)
- **YouTube**: Embedded hero video (lazy-loaded on click, ID: `SOHeeuQzifc`)
- **Telegram Bot**: Payment + enrollment (`t.me/safa_agency_bot?start=<attribution_id>`)

## Critical Data Flow
```
Visit → Generate ID → Insert Supabase row → Async enrich (geo + fbp)
  → User clicks CTA → /go?id=<id> → go.html → Redirect to Telegram bot with ID
```
