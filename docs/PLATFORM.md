# WhatsCRM platform (admin + customer)

The app opens on the **login screen** (`/`). The session role decides where you land:
admin → `/admin/dashboard`, customer → `/panel/dashboard`. A signed-in visitor to `/` is redirected automatically;
`/admin/*` and `/panel/*` are guarded in the server layouts (`getSession()`), with a cookie pre-check in `src/middleware.ts`.

## First login
| Role | Email | Password |
| --- | --- | --- |
| Admin | `ADMIN_EMAIL` (default `admin@whatscrm.app`) | `ADMIN_PASSWORD` (dev default `Admin@12345`; in production a random one is printed to the log on first start) |
| Customer (dev only, or `SEED_CUSTOMER=true`) | `CUSTOMER_EMAIL` (default `customer@whatscrm.app`) | `CUSTOMER_PASSWORD` (default `Customer@12345`) |

New customers can also self-sign-up at `/signup` (14-day trial) or be created from an enquiry (Admin → Enquiries → Convert).

## Structure
- `src/lib/server/*` – JSON-file store (`DATA_DIR`, default `.data/`), sessions, role-checked data API, payments, WhatsApp, AI.
- `src/app/api/platform/*` – data (`/data/[collection]`), auth, actions (admin / whatsapp / ai), pay, media, public forms, v1 REST API, webhook.
- `src/lib/platform/schemas*.ts` – field definitions for every object (35–69 fields each). Adding a field = adding one string.
- `src/components/platform/crud.tsx` – schema-driven **full-screen** list / new / view / edit / delete (no pop-ups anywhere).
- `src/components/platform/apps.tsx` – route → page registry; `nav.tsx` – sidebars.
- `panel-crud.tsx`, `panel-special.tsx`, `inbox.tsx`, `admin-pages.tsx`, `public-forms.tsx` – feature pages.

Routes follow `<page>/new`, `<page>/<id>`, `<page>/<id>/edit`, `<page>/<id>/delete`, plus page-specific screens (e.g. `enquiries/<id>/convert`).
