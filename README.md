# Edutrack

A minimalist tutoring management platform for individual tutors and academies.

## Features

- **Role-based onboarding** — Individual Tutor or Academy
- **Student management** — Name, phone, email
- **Flexible subscriptions** — Custom plans (e.g. 1500 DZD / 8 sessions)
- **Attendance engine** — Paid Absence vs Flexible policies
- **Smart dashboard** — Green / Yellow / Red subscription status
- **Scheduling** — Recurring study days
- **Finance** — Revenue, expenses, profit tracking
- **i18n** — English, French, Arabic (RTL)

## Quick Start

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

`db:push` is for local development only. Do not run `db:push` in deployment build commands (for example on Render), because build environments may not have stable database connectivity.

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001

## Demo Data

After seeding, demo data includes 4 students, 2 classes, subscriptions at various statuses, and sample payments/expenses.

Skip onboarding by clearing localStorage, or complete onboarding to create a new organization.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- TanStack Query + Zustand
- Express + Prisma + SQLite
- react-i18next
