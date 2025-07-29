# WeatherProof - Construction Weather Delay Documentation System

A comprehensive weather delay tracking and documentation platform that helps construction contractors automatically monitor weather conditions, document delays, and generate insurance-grade reports to recover costs from weather-related work stoppages.

## 🎯 What WeatherProof Does

WeatherProof solves a $4-6 billion annual problem in the construction industry by automating weather delay documentation. The platform:

- **Monitors Weather 24/7**: Automatically tracks weather conditions at all your construction sites using hyperlocal weather data
- **Detects Delays Instantly**: Uses customizable thresholds based on construction type (roofing, concrete, framing, etc.) to identify when work must stop
- **Documents Everything**: Creates legally-admissible documentation with timestamps, weather data from multiple sources, and cost calculations
- **Generates Reports**: Produces insurance-grade PDF reports that meet claim requirements, saving hours of manual documentation
- **Calculates Costs**: Automatically tracks labor hours lost, equipment downtime, and overhead costs during delays
- **Sends Alerts**: Notifies project managers via email/SMS when delays are detected or approaching (via n8n integration)

## 💰 Value Proposition

- **For Small Contractors (10-50 employees)**: Save 10-15 hours per month on documentation, recover $50,000-$200,000 annually in weather delay costs
- **For Mid-Size Contractors (50-100 employees)**: Centralized delay tracking across multiple projects, recover $200,000-$500,000 annually
- **For Insurance Claims**: Provide court-admissible documentation with government weather data (NOAA) that insurance companies accept

## 🚀 Key Features

### 1. **Automated Weather Monitoring**
- Integration with NOAA (free, government data - legally accepted)
- Optional premium integrations with Weather Underground and Visual Crossing
- Checks weather every 15 minutes via n8n workflows
- Hyperlocal data using nearest weather station

### 2. **Smart Delay Detection**
- Pre-configured thresholds by trade:
  - **Roofing**: Wind > 25mph, Any precipitation, Temp < 40°F or > 95°F
  - **Concrete**: Wind > 30mph, Precip > 0.25", Temp < 40°F or > 90°F
  - **Framing**: Wind > 35mph, Precip > 0.5", Temp < 20°F
  - **Painting**: Wind > 20mph, No precipitation, Temp 50-90°F, Humidity < 85%
- Customizable thresholds per project

### 3. **Comprehensive Documentation**
- Automatic delay event creation with start/end times
- Weather data snapshots with source verification
- Cost calculations (labor, equipment, overhead)
- Photo upload capability for field documentation
- Activity logs showing what work was affected

### 4. **Insurance-Grade Reports**
- PDF generation with professional formatting
- Includes all required elements for claims:
  - Project details and location
  - Weather data with timestamps
  - Cost breakdowns by category
  - Multiple weather source verification
  - Company and policy information
- CSV export for spreadsheet analysis

### 5. **Integration Capabilities**
- **CSV Import**: Bulk import projects from existing systems
- **n8n Webhooks**: Automated workflows for alerts and notifications
- **Future Integrations**: ServiceTitan, QuickBooks, Pipedrive (via CSV for now)

### 6. **Real-Time Dashboard**
- Active project monitoring
- Delay alerts and notifications
- Cost impact tracking
- 30-day weather history
- Report generation status

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.4, React 19, TypeScript 5
- **Styling**: Tailwind CSS v4 (zero-config architecture)
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (future: AWS S3)
- **Workflow Automation**: n8n (webhooks for alerts)
- **Deployment**: Vercel + Supabase

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- n8n instance (for automated alerts)
- Weather API keys (NOAA is free)

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/weatherproof.git
cd weatherproof
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local .env
```

Edit `.env` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run database migrations**
```bash
# Apply migrations via Supabase dashboard or CLI
```

5. **Seed demo data (optional)**
```bash
npx tsx src/scripts/seed-data.ts
```

Demo credentials:
- Email: demo@weatherproof.app
- Password: demo123456

6. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
weatherProof/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API endpoints for n8n
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   └── projects/       # Project management
│   ├── components/         # Reusable UI components
│   ├── services/          # Business logic
│   │   ├── weather/       # Weather API integrations
│   │   └── report-generator.ts
│   ├── lib/               # Utilities and Supabase client
│   └── types/             # TypeScript types
├── supabase/
│   └── migrations/        # Database schema
└── postcss.config.mjs     # Tailwind v4 config
```

## 🔧 Configuration

### Weather Thresholds
Edit thresholds in project settings or during project creation:
```typescript
{
  wind_speed: 25,        // mph
  precipitation: 0.1,    // inches
  temperature_min: 40,   // °F
  temperature_max: 95,   // °F
  humidity_max: 85       // % (for painting)
}
```

### n8n Webhook Integration
1. Create n8n workflow with webhook trigger
2. Add webhook URL to WeatherProof
3. n8n receives delay notifications and sends emails/SMS

## 📊 API Endpoints for n8n

- `POST /api/weather/check` - Check weather for projects
- `POST /api/reports/generate` - Generate delay reports
- `GET /api/projects/delays` - Get recent delays

## 🚢 Deployment

### Vercel (Frontend)
1. Connect GitHub repository
2. Add environment variables
3. Deploy

### Supabase (Backend)
1. Create new project
2. Run migrations
3. Enable Row Level Security
4. Configure authentication

### n8n (Automation)
1. Self-host or use n8n.cloud
2. Create weather monitoring workflows
3. Set up notification templates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Documentation: [Coming Soon]
- Issues: GitHub Issues
- Email: support@weatherproof.app

---

Built with ❤️ for construction contractors who lose money to weather delays every year.