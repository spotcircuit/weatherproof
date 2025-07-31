# WeatherProof

Automated weather delay tracking and insurance claim generation for construction companies.

## Features

- 📊 **Real-time Weather Monitoring** - Automatic NOAA weather data collection
- 📸 **Delay Documentation** - Photo uploads and detailed cost tracking  
- 📄 **Insurance Reports** - Professional PDF generation with weather verification
- 💰 **Cost Calculations** - Automatic labor, equipment, and overhead calculations
- 📈 **Analytics Dashboard** - Track delays, costs, and weather patterns
- 🔄 **Bulk Import/Export** - CSV support for projects, crew, and equipment

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

Visit http://localhost:3000

## Demo Account
- **Email**: demo@weatherproof.app
- **Password**: Qu!ckWeather$$Demo8

## Documentation

📚 **Complete documentation available in `/docs`:**

- [Database Reference](docs/database-reference.md) - **START HERE** - Complete database schema, Supabase connection details, and data dictionary
- [Developer Setup Guide](docs/developer-setup-guide.md) - Environment setup and configuration
- [Features & Workflows](docs/features-workflows-guide.md) - User guides and best practices
- [API & Integrations](docs/api-integrations-guide.md) - API reference and external services

⚡ **Quick Access:**
- Database Config: `.database-config.json` - Supabase URLs and connection info
- Demo Login: demo@weatherproof.app / Qu!ckWeather$$Demo8

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: NOAA Weather Service
- **PDF**: jsPDF with html2canvas
- **UI**: shadcn/ui components

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

## Project Structure

```
weatherProof/
├── src/
│   ├── app/         # Next.js app directory
│   ├── components/  # Reusable components
│   ├── services/    # Business logic
│   └── types/       # TypeScript types
├── docs/            # Documentation
└── supabase/        # Database migrations
```

## Deployment

Optimized for [Vercel](https://vercel.com) deployment. See [deployment guide](docs/developer-setup-guide.md#deployment) for details.

## License

Proprietary - All rights reserved

---

Built with ❤️ for the construction industry