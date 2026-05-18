# GoalTrack | AtomQuest Hackathon 1.0

A professional, enterprise-grade Goal Setting and Tracking Portal built for Atomberg Technologies.

## 🚀 Tech Stack & Hosting Choices
We chose a modern, serverless architecture to ensure maximum performance, instant scalability, and zero-maintenance infrastructure:
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui. Chosen for its superior developer experience and highly responsive, accessible UI components.
- **Backend**: Next.js Serverless API Routes. This eliminates the need for a separate backend server, reducing infrastructure overhead and latency.
- **Authentication**: NextAuth.js with Credentials Provider and strict Role-Based Access Control (RBAC) via JWTs.
- **Database**: PostgreSQL (via Supabase) with Prisma ORM. Ensures robust relational data integrity for our complex 8-table schema while remaining cost-effective (Free Tier).
- **Hosting**: Vercel. Provides automatic CI/CD deployments and serverless edge caching out of the box.

## 🔑 Demo Login Credentials
The application is pre-seeded with accounts for all three user journeys. 
**Password for all accounts:** `password123`

| Role | Email |
|------|-------|
| **Admin** | `admin@test.com` |
| **Manager** | `manager@test.com` |
| **Employee** | `employee@test.com` |

*(Note: There are quick-access demo buttons on the login page for convenience).*

## ⚡ Core Features Implemented
- **Business Logic Enforced**: 100% total weightage rules, 10% minimum weightage limits, and 8-goal maximums are enforced at both the UI and secure API levels.
- **Quarterly Gating**: Check-in data entry is mathematically gated by Active Cycle Windows controlled by the Admin.
- **Progress Scoring**: Graceful division-by-zero handling for all 4 required UoM types (MIN, MAX, TIMELINE, ZERO).
- **Approval Workflows**: Complete flow for submission, manager review, mandatory rework comments, and locking.

## 💻 Local Setup Instructions
If you wish to run this repository locally:
1. Clone the repository: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Set up the local SQLite database: `npx prisma db push`
4. Start the server: `npm run dev`
5. Click "Initialize Demo Database" on the login screen to generate users and cycles.
