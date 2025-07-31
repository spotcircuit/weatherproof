# WeatherProof Developer Setup Guide

## Overview
WeatherProof is a Next.js 15 application that helps construction companies track weather-related delays and generate insurance claims. It uses Supabase for backend services and is designed to work on both Windows and WSL environments.

## Prerequisites

### Required Software
- **Node.js**: 20.0.0 or higher (recommended: 22.17.1 as specified in `.nvmrc`)
- **npm**: Comes with Node.js
- **Git**: For version control
- **Code Editor**: VS Code recommended

### Optional Tools
- **nvm**: Node Version Manager for easy Node.js version switching
- **WSL2**: For Linux development environment on Windows

## Environment Setup

### 1. Clone the Repository
```bash
git clone [repository-url]
cd weatherProof
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

Or create `.env.local` with these values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kxbqvacdtsddgnxtdkgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnF2YWNkdHNkZGdueHRka2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MjQ0NzksImV4cCI6MjA0ODMwMDQ3OX0.jfZqR7JEOdZ8cZn-5M2W1vXpCjR2D8nW2PUlc0CWBHE
SUPABASE_SERVICE_ROLE_KEY=[contact-admin-for-key]

# NOAA Weather API (optional for development)
NOAA_API_TOKEN=your_noaa_token_here
```

## Running the Development Server

### Windows (CMD/PowerShell)

1. **Using the provided script:**
   ```powershell
   .\dev.cmd
   ```

2. **Or manually:**
   ```powershell
   npm run dev
   ```

3. **With Turbopack (faster):**
   ```powershell
   npm run dev:turbo
   ```

### WSL (Windows Subsystem for Linux)

1. **Navigate to project:**
   ```bash
   cd /mnt/c/Users/[YourUsername]/[PathToProject]/weatherProof
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

### Access the Application
Open your browser and navigate to: `http://localhost:3000`

## Demo Account
Use these credentials for testing:
- **Email**: demo@weatherproof.app
- **Password**: Qu!ckWeather$$Demo8

## Database Setup

### Initial Setup
The database schema is already configured in Supabase. If you need to run migrations:

```bash
# Check current schema
npm run db:check

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### Accessing Supabase Dashboard
- **URL**: https://supabase.com/dashboard/project/kxbqvacdtsddgnxtdkgp
- **Sections**:
  - Database: View and edit tables
  - Authentication: Manage users
  - Storage: Handle file uploads
  - SQL Editor: Run custom queries

## Building for Production

### Windows
```powershell
.\build.cmd
```

### Manual Build
```bash
npm run build
```

### Run Production Build Locally
```bash
npm start
```

## Common Development Tasks

### Working with the Database

1. **View current schema:**
   ```bash
   npm run db:check
   ```

2. **Create a new migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Name your migration: XXX_description.sql
   ```

3. **Apply RLS policies:**
   Check `docs/supabase-database-schema.md` for policy templates

### Adding New Features

1. **Create new database table:**
   - Add migration in `/supabase/migrations/`
   - Update types in `/src/types/database.ts`
   - Add RLS policies

2. **Create new API route:**
   - Add route in `/src/app/api/[feature]/route.ts`
   - Use Supabase server client

3. **Create new page:**
   - Add page in `/src/app/[feature]/page.tsx`
   - Create client component if needed
   - Use authenticated layout

### Testing

1. **Type checking:**
   ```bash
   npm run type-check
   ```

2. **Linting:**
   ```bash
   npm run lint
   ```

3. **Fix linting issues:**
   ```bash
   npm run lint:fix
   ```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors:**
   ```bash
   npm run type-check
   ```

3. **Database connection issues:**
   - Check `.env.local` configuration
   - Verify Supabase project is active
   - Check RLS policies

4. **Build errors:**
   - Clear Next.js cache: `rm -rf .next`
   - Check for TypeScript errors
   - Ensure all dependencies are installed

### WSL-Specific Issues

1. **File watching not working:**
   - Use polling: `CHOKIDAR_USEPOLLING=true npm run dev`
   - Or work in WSL filesystem instead of `/mnt/c/`

2. **Permission issues:**
   ```bash
   chmod -R 755 .
   ```

3. **Line ending issues:**
   ```bash
   git config core.autocrlf false
   ```

## Project Structure

```
weatherProof/
├── src/
│   ├── app/            # Next.js 15 app directory
│   ├── components/     # Reusable components
│   ├── services/       # Business logic
│   ├── lib/           # Utilities and configs
│   └── types/         # TypeScript types
├── public/            # Static assets
├── supabase/          # Database migrations
├── docs/              # Documentation
└── scripts/           # Build and utility scripts
```

## Key Technologies

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: NOAA Weather API
- **PDF Generation**: jsPDF, html2canvas
- **Forms**: React Hook Form
- **Date Handling**: date-fns

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `.next` folder to hosting
3. Set environment variables
4. Start with: `npm start`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation in `/docs`
3. Contact the development team