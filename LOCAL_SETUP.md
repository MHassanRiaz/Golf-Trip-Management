# GINApp - Local Development Setup Guide

## Prerequisites

You need to install PostgreSQL on your local machine.

### Option 1: Install PostgreSQL Directly

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**MacOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### Option 2: Use Docker (Recommended - Easier)

Install Docker Desktop, then run:

```bash
docker run --name ginapp-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=ginapp \
  -p 5432:5432 \
  -d postgres:15
```

This creates a PostgreSQL container that you can start/stop anytime.

---

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- `prisma` - Database ORM
- `@prisma/client` - Prisma client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `jose` - JWT verification for Next.js

### 2. Create Environment File

Copy the `.env.local` file content and create your own `.env` file:

```bash
cp .env.local .env
```

**Edit `.env` file:**
- Change `JWT_SECRET` to any random string (at least 32 characters)
- If your PostgreSQL uses different credentials, update `DATABASE_URL`

**Example DATABASE_URL formats:**
```
# Local PostgreSQL with custom credentials
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Docker PostgreSQL (default)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ginapp?schema=public"
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# (Optional) Seed with sample data
npm run prisma:seed
```

**What these commands do:**
- `prisma:generate` - Creates TypeScript types from your schema
- `prisma:migrate` - Creates all database tables and relationships
- `prisma:seed` - Adds sample users and trips (optional)

### 4. Start Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:3000**

---

## Verify Database Connection

### Using Prisma Studio (Visual Database Editor)

```bash
npm run prisma:studio
```

This opens a web interface at **http://localhost:5555** where you can:
- View all tables
- Browse data
- Add/edit records manually
- Verify database structure

### Using psql (Command Line)

```bash
# Connect to local PostgreSQL
psql -U postgres -d ginapp

# List all tables
\dt

# View users
SELECT * FROM "User";

# Exit
\q
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Check if PostgreSQL is running:**

**Docker:**
```bash
docker ps  # Should show ginapp-postgres
docker start ginapp-postgres  # If not running
```

**Local PostgreSQL:**
```bash
# Ubuntu/Debian
sudo systemctl status postgresql
sudo systemctl start postgresql

# MacOS
brew services list
brew services start postgresql@15
```

### Error: "Authentication failed"

Check your `DATABASE_URL` credentials match your PostgreSQL setup:
- Default username: `postgres`
- Default password: `postgres`
- Default database: `ginapp`

### Error: "Database does not exist"

Create the database manually:

```bash
# Using psql
psql -U postgres
CREATE DATABASE ginapp;
\q

# Then run migrations again
npm run prisma:migrate
```

### Reset Database (Start Fresh)

```bash
# Drop all tables and recreate
npm run prisma:migrate:reset

# This will:
# 1. Delete all data
# 2. Drop all tables
# 3. Recreate tables from schema
# 4. Run seed if available
```

---

## Database Management Commands

```bash
# View current database schema
npm run prisma:studio

# Create new migration after schema changes
npx prisma migrate dev --name description_of_changes

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npm run prisma:generate

# Format schema file
npx prisma format
```

---

## Local Development Workflow

1. **Start PostgreSQL** (Docker or local service)
2. **Run migrations** if you changed schema: `npm run prisma:migrate`
3. **Start dev server**: `npm run dev`
4. **Open Prisma Studio** (optional): `npm run prisma:studio`
5. **Make changes** to your app
6. **Database changes?** Update `prisma/schema.prisma` → run migration

---

## Sample Data (Optional)

If you want to test with sample data, create a seed file:

**prisma/seed.ts** (already created) includes:
- Sample users (test@example.com / password123)
- Sample trip
- Sample participants and teams

Run: `npm run prisma:seed`

---

## Production Deployment (Later)

When ready to deploy:

1. **Use a cloud PostgreSQL** (Neon, Supabase, Railway, etc.)
2. **Update DATABASE_URL** with production connection string
3. **Generate strong JWT_SECRET**: `openssl rand -base64 32`
4. **Run migrations**: `npx prisma migrate deploy`

But for now, everything runs **100% locally**!

---

## Quick Start Summary

```bash
# 1. Start PostgreSQL
docker run --name ginapp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=ginapp -p 5432:5432 -d postgres:15

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.local .env

# 4. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 5. Start app
npm run dev
```

**Done! Your app is running locally at http://localhost:3000**
