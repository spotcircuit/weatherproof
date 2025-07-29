# WeatherProof - Construction Weather Delay Documentation System

A legal-grade weather documentation system that automatically tracks, documents, and reports weather-related construction delays to help contractors recover costs through insurance claims and improve project planning.

## Features

- **Multi-Source Weather Tracking**: Integrates NOAA, Weather Underground, and Visual Crossing APIs
- **Intelligent Delay Detection**: Pre-configured industry-standard thresholds by trade type
- **Legal Documentation**: Court-admissible reports with multiple source verification
- **Mobile Field Tools**: Progressive Web App for photo documentation
- **ROI Dashboard**: Real-time delay cost tracking and savings calculator

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL with TimescaleDB
- **Authentication**: Supabase Auth
- **Queue**: Bull + Redis
- **Storage**: AWS S3

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with TimescaleDB extension)
- Redis
- Supabase account
- Weather API keys (NOAA is free, others require accounts)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/spotcircuit/weatherproof.git
cd weatherproof/weather-proof
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.local` to `.env` and fill in your values:

```bash
cp .env.local .env
```

Required environment variables:
- Supabase credentials
- Database URL
- Redis URL
- Weather API keys
- AWS S3 credentials (for report storage)
- Email/SMS credentials (for notifications)

### 4. Set up the database

```bash
# Install TimescaleDB extension in PostgreSQL
# https://docs.timescale.com/self-hosted/latest/install/

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Set up Supabase Auth

1. Create a new Supabase project
2. Enable Email authentication
3. Copy your project URL and anon key to `.env`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
weather-proof/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries and utilities
│   ├── services/       # Business logic and API integrations
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
├── .env.local          # Environment variables template
└── package.json        # Dependencies and scripts
```

## Development Workflow

1. **Database Changes**: Edit `prisma/schema.prisma` and run `npx prisma migrate dev`
2. **API Routes**: Add new routes in `src/app/api/`
3. **Components**: Create reusable components in `src/components/`
4. **Weather Services**: Add weather API integrations in `src/services/weather/`

## Deployment

### Vercel (Recommended for frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Database

Use a managed PostgreSQL service with TimescaleDB:
- Timescale Cloud
- Supabase (with TimescaleDB extension)
- AWS RDS with TimescaleDB

### Background Jobs

Deploy the worker process separately:
- Railway
- Render
- AWS ECS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.