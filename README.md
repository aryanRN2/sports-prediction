# 🏏 CricPredict AI — Cricket Winner Prediction Engine

> A full-stack AI-powered cricket match prediction platform with a holographic dashboard, real-time confidence scores, and a PostgreSQL-backed analytical engine.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🌟 What It Does

CricPredict AI predicts the winner of upcoming international cricket matches using a multi-factor analytical engine. It considers:

- 📊 **Head-to-Head (H2H) History** — past matchup records between the two teams
- 🔥 **Recent Form** — current win/loss momentum for each team
- 🏟️ **Venue Factor** — home-ground advantage and pitch conditions
- 🎯 **Format Factor** — performance history in the specific format (T20, ODI, TEST)

All predictions are stored in PostgreSQL, computed deterministically, and displayed in a cinematic dark-mode dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (serverless) |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL via Supabase |
| **Deployment** | Vercel |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
cricket winner prediction/
├── prisma/
│   └── schema.prisma          # Database schema (Team, Venue, Match, Prediction)
├── public/
│   └── logos/                 # Local team flag images (FlagCDN)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page with video background
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Main prediction dashboard
│   │   └── api/
│   │       ├── fixtures/
│   │       │   └── route.ts   # Auto-seeds & returns match data
│   │       └── predict/
│   │           └── route.ts   # On-demand prediction engine
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       └── predictor.ts       # Multi-factor prediction engine
└── .env                       # Environment variables (not committed)
```

---

## 🗄️ Database Schema

```prisma
model Team {
  id          String   @id @default(uuid())
  name        String   @unique
  shortName   String
  logoUrl     String?
  homeMatches Match[]  @relation("HomeTeam")
  awayMatches Match[]  @relation("AwayTeam")
}

model Venue {
  id        String  @id @default(uuid())
  name      String  @unique
  city      String
  country   String
  latitude  Float
  longitude Float
}

model Match {
  id           String      @id @default(uuid())
  apiFixtureId String      @unique
  homeTeamId   String
  awayTeamId   String
  venueId      String
  scheduledAt  DateTime
  status       MatchStatus @default(SCHEDULED)
  format       MatchFormat
  prediction   Prediction?
}

model Prediction {
  id                String   @id @default(uuid())
  matchId           String   @unique
  homeWinConfidence Float
  awayWinConfidence Float
  predictedWinnerId String
  featureSnapshot   Json     # Stores H2H, Form, Venue, Format scores
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/aryanRN2/sports-prediction.git
cd sports-prediction
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Transaction-mode pooler (used by the app at runtime)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session-mode pooler (used by Prisma for schema migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> **Where to find these?**
> Go to your Supabase project → **Project Settings** → **Database** → **Connection String** → copy both the **Transaction** and **Session** URLs.

### 4. Push the Database Schema

```bash
npx prisma db push
```

This creates all 4 tables + 2 enums in your Supabase database automatically.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Seed the Database

Visit this URL in your browser to auto-seed all teams, venues, matches and predictions:

```
http://localhost:3000/api/fixtures
```

This will populate 6 teams, 6 venues, 6 upcoming matches, and run the AI prediction engine for each match automatically.

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add these **Environment Variables** in Vercel project settings:
   - `DATABASE_URL` — your Supabase transaction pooler URL
   - `DIRECT_URL` — your Supabase session pooler URL
4. Deploy!

> ⚠️ **Important:** `DIRECT_URL` is required because Prisma needs a direct session connection (not PgBouncer) for schema introspection. Without it, the build will fail.

---

## 🧠 How the Prediction Engine Works

The predictor in `src/lib/predictor.ts` computes a weighted confidence score using 4 signals:

```
Final Score = (H2H × 0.25) + (Form × 0.35) + (Venue × 0.25) + (Format × 0.15)
```

| Factor | Weight | Description |
|---|---|---|
| H2H | 25% | Historical win rate between these two specific teams |
| Form | 35% | Recent match win rate (last 5 games) |
| Venue | 25% | Win rate at this specific ground |
| Format | 15% | Win rate in this match format (T20/ODI/TEST) |

All feature scores are stored in the `featureSnapshot` JSON field for full auditability.

---

## 📸 Screenshots

| Page | Description |
|---|---|
| **Landing Page** | Cinematic full-screen video background with neon gradient hero |
| **Dashboard** | 6 match cards with team flags, AI confidence bars, and venue info |
| **API Response** | `/api/fixtures` returns full match + prediction JSON |

---

## 👤 Author

**Aryan Maurya**  
[Portfolio](https://me-aryan.vercel.app) • [GitHub](https://github.com/aryanRN2) • [LinkedIn](https://linkedin.com/in/aryan-maurya)

---

## 📄 License

MIT License — feel free to use, modify, and build on this project.
