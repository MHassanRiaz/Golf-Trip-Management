# GINApp Backend Setup Guide

This guide will help you set up the backend for the GINApp MVP with PostgreSQL, Prisma, and JWT authentication.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Step 1: Install Dependencies

The necessary dependencies are already listed in package.json. Install them:

```bash
npm install
```

This installs:
- `@prisma/client` - Prisma client for database access
- `prisma` - Prisma CLI (dev dependency)
- `jsonwebtoken` - JWT token generation and verification
- `bcryptjs` - Password hashing
- `tsx` - TypeScript execution for seed scripts

## Step 2: Set Up Database

### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:

```sql
CREATE DATABASE ginapp;
```

### Option B: Cloud PostgreSQL (Recommended)

Use a managed PostgreSQL service:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier with PostgreSQL
- **Railway** (https://railway.app) - Easy setup
- **Vercel Postgres** (https://vercel.com/storage/postgres) - Integrated with Vercel

## Step 3: Configure Environment Variables

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Update `.env` with your database credentials:

```env
# Example for local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/ginapp?schema=public"

# Example for Neon
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/ginapp?sslmode=require"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"

# Environment
NODE_ENV="development"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Important**: Never commit your `.env` file to version control!

## Step 4: Generate Prisma Client

Generate the Prisma client based on your schema:

```bash
npm run prisma:generate
```

This creates the TypeScript types and client for your database models.

## Step 5: Run Database Migrations

Create the database tables:

```bash
npm run prisma:migrate
```

Enter a migration name when prompted (e.g., "initial_setup").

This will:
- Create all tables defined in `prisma/schema.prisma`
- Set up foreign keys and constraints
- Create indexes for performance

## Step 6: (Optional) Seed the Database

If you want to add sample data for testing:

```bash
npm run prisma:seed
```

## Step 7: Start Development Server

Start the Next.js development server:

```bash
npm run dev
```

Your backend API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Trips
- `GET /api/trips` - Get all trips
- `POST /api/trips` - Create trip
- `GET /api/trips/[tripId]` - Get trip details
- `PUT /api/trips/[tripId]` - Update trip
- `DELETE /api/trips/[tripId]` - Delete trip

### Teams
- `GET /api/trips/[tripId]/teams` - Get teams
- `POST /api/trips/[tripId]/teams` - Create team (max 2)

### Participants
- `GET /api/trips/[tripId]/participants` - Get participants
- `POST /api/trips/[tripId]/participants` - Add participant

### Rounds
- `GET /api/trips/[tripId]/rounds` - Get rounds
- `POST /api/trips/[tripId]/rounds` - Create round

### Foursomes & Matches
- `POST /api/rounds/[roundId]/foursomes` - Create foursomes
- `POST /api/rounds/[roundId]/matches/generate` - Generate matches

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token is returned from `/api/auth/login` and `/api/auth/register`.

## Useful Prisma Commands

```bash
# View database in browser
npm run prisma:studio

# Push schema changes without migrations (dev only)
npm run prisma:push

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

## Troubleshooting

### Migration Errors

If you encounter migration errors:

```bash
# Reset and recreate
npx prisma migrate reset
npm run prisma:migrate
```

### Connection Issues

- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall/network settings for cloud databases
- Verify SSL settings for cloud databases

### Type Errors

If you see Prisma type errors:

```bash
npm run prisma:generate
```

## Production Deployment

For production on Vercel:

1. Add DATABASE_URL to Vercel environment variables
2. Add JWT_SECRET to Vercel environment variables
3. Prisma will automatically run migrations during build

## Next Steps

- Add more API endpoints for scoring, standings, expenses
- Implement real-time updates with WebSockets
- Add API rate limiting and validation
- Set up monitoring and logging
