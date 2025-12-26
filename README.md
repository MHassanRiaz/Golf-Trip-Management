# GINApp - Golf Trip Management System

A comprehensive golf trip management application for organizing trips, tracking scores, managing teams, and splitting expenses.

## Features

- **Trip Management**: Create and manage golf trips with multiple rounds
- **Team System**: Organize players into exactly 2 competing teams
- **Smart Scoring**: Hole-by-hole scoring with handicap allocation
- **Match Formats**: Support for 2v2 (best ball) and 1v1 formats
- **Drinking Mode**: Track drinks and separate standings
- **Handicap Engine**: Two-pass stroke allocation system
- **Expense Tracking**: Split expenses equally or custom amounts
- **Real-time Standings**: Live team rankings and statistics

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: React Context + localStorage (transitioning to database)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (or Docker)
- npm or yarn

### Quick Start with Docker (Recommended)

1. **Start PostgreSQL with Docker**
```bash
docker run --name ginapp-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=ginapp \
  -p 5432:5432 \
  -d postgres:15
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.local .env
# Edit .env and change JWT_SECRET to a random string
```

4. **Initialize database**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: adds sample data
```

5. **Start development server**
```bash
npm run dev
```

Visit **http://localhost:3000**

### Local PostgreSQL Setup

See **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** for detailed instructions on:
- Installing PostgreSQL locally (Ubuntu, MacOS, Windows)
- Database configuration
- Troubleshooting common issues

## Database Management

### View Database (Prisma Studio)
```bash
npm run prisma:studio
```
Opens visual database editor at http://localhost:5555

### Create Migration (After Schema Changes)
```bash
npx prisma migrate dev --name description_of_change
```

### Reset Database (Start Fresh)
```bash
npm run prisma:migrate:reset
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

## Project Structure

```
ginapp/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── trips/             # Trip management
│   │   ├── rounds/            # Round management
│   │   └── matches/           # Match & scoring
│   ├── trips/                 # Trip pages
│   ├── scoring/               # Scoring interface
│   ├── standings/             # Team standings
│   └── expenses/              # Expense tracking
├── lib/
│   ├── auth-context.tsx       # Auth state management
│   ├── auth-middleware.ts     # JWT authentication
│   ├── jwt.ts                 # JWT utilities
│   ├── prisma.ts              # Database client
│   ├── handicap-engine.ts     # Stroke allocation
│   ├── match-generator.ts     # Match creation logic
│   └── standings-calculator.ts # Team standings
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data
└── components/
    ├── ui/                    # Reusable UI components
    └── navigation.tsx         # App navigation
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Trips
- `GET /api/trips` - List all trips
- `POST /api/trips` - Create trip
- `GET /api/trips/[tripId]` - Get trip details
- `PUT /api/trips/[tripId]` - Update trip
- `DELETE /api/trips/[tripId]` - Delete trip

### Teams & Participants
- `GET /api/trips/[tripId]/teams` - List teams
- `POST /api/trips/[tripId]/teams` - Create team (max 2)
- `GET /api/trips/[tripId]/participants` - List participants
- `POST /api/trips/[tripId]/participants` - Add participant

### Rounds & Matches
- `GET /api/trips/[tripId]/rounds` - List rounds
- `POST /api/trips/[tripId]/rounds` - Create round
- `POST /api/rounds/[roundId]/foursomes` - Create foursomes
- `POST /api/rounds/[roundId]/matches/generate` - Generate matches

## Development Workflow

1. **Start PostgreSQL** (Docker or local)
2. **Run dev server**: `npm run dev`
3. **Make changes** to code
4. **Update database schema?**
   - Edit `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name change_description`
5. **Test with Prisma Studio**: `npm run prisma:studio`

## Testing Credentials (After Seed)

```
Email: test@example.com
Password: password123
```

## Environment Variables

Create `.env` file with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ginapp?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NODE_ENV="development"
```

## Troubleshooting

### Can't connect to database
- Check PostgreSQL is running: `docker ps` or `systemctl status postgresql`
- Verify DATABASE_URL credentials match your setup

### Prisma Client errors
- Regenerate client: `npm run prisma:generate`
- Reset database: `npm run prisma:migrate:reset`

### Port 3000 already in use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

## Documentation

- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Backend architecture guide
- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Local development setup
- **[GINApp MVP Spec](./user_read_only_context/text_attachments/)** - Product requirements

## Deployment

When ready for production:

1. Set up cloud PostgreSQL (Neon, Supabase, Railway)
2. Update `DATABASE_URL` in environment
3. Generate strong JWT secret: `openssl rand -base64 32`
4. Run migrations: `npx prisma migrate deploy`
5. Deploy to Vercel/Railway/Render

## License

Private - All rights reserved
