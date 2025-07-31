# WeatherProof Documentation

Welcome to the WeatherProof documentation. This guide will help you understand, develop, and deploy the WeatherProof application.

## 📚 Essential Documentation

### Getting Started

1. **[Database Reference](database-reference.md)** ⭐ **START HERE**
   - Complete database schema and data dictionary
   - Supabase connection details (URLs, keys, etc.)
   - Business logic and cost calculation formulas
   - Required data for insurance claims
   - Common queries and relationships

2. **[Developer Setup Guide](developer-setup-guide.md)**
   - Environment setup (Windows/WSL)
   - Dependencies and prerequisites
   - Running the development server
   - Building and deployment

### Core Features

3. **[Features & Workflows Guide](features-workflows-guide.md)**
   - User workflows and best practices
   - Dashboard overview
   - Delay documentation process
   - Report generation
   - Mobile usage

4. **[Insurance Documentation Guide](insurance-documentation-guide.md)**
   - Insurance company requirements
   - Required documentation standards
   - Cost calculation details
   - Claim submission process
   - Common rejection reasons

### Technical Reference

5. **[API & Integrations Guide](api-integrations-guide.md)**
   - NOAA Weather API integration
   - Internal API endpoints
   - Report generation endpoints
   - Future integrations roadmap

6. **[Report Generation Workflow](report-generation-workflow.md)**
   - PDF generation process
   - Report templates and formats
   - Insurance claim formats
   - ACORD form mapping

### Implementation Details

7. **[NOAA Integration Plan](noaa-integration-plan.md)**
   - Weather data collection strategy
   - API endpoints and rate limits
   - Verification workflows
   - Station distance validation

8. **[Google Sheets Integration](google-sheets-integration.md)**
   - Survey form webhook setup
   - Apps Script configuration
   - Lead capture workflow

9. **[Questionnaire Setup](questionnaire-setup.md)**
   - Survey configuration
   - Lead qualification
   - Response handling

## 🚀 Quick Start for New Sessions

1. **Database Access**: Check `DATABASE_REFERENCE.md` and `.database-config.json`
2. **Demo Login**: demo@weatherproof.app / Qu!ckWeather$$Demo8
3. **Supabase Dashboard**: https://supabase.com/dashboard/project/kxbqvacdtsddgnxtdkgp

## 🔧 Common Tasks

### Setting Up Development
```bash
npm install
cp .env.local.example .env.local
npm run dev
```

### Running Migrations
1. Go to Supabase SQL Editor
2. Run migrations in order (009, 010, 011, 012, 013)

### Understanding Cost Calculations
```
Total Delay Cost = 
  Σ(crew_hours × hourly_rate × burden_rate) +
  Σ(equipment_hours × standby_rate) +
  (daily_overhead × days) +
  material_damage
```

### Key Insurance Requirements
- Specific crew members (not just counts)
- Specific equipment with standby rates
- Weather station within 10 miles
- NOAA verification required
- Timestamped photos

## 📁 Document Organization

- **Core Docs**: Database, setup, features, insurance
- **Technical**: APIs, integrations, workflows
- **Quick Access**: `.database-config.json` for connection info

## 🔄 Migration Status

Latest migrations applied:
- 009_add_insurance_requirements_essential.sql
- 010_fix_rls_policies.sql
- 011_add_missing_weather_columns.sql
- 012_add_delay_crew_equipment_tracking.sql
- 013_add_missing_delay_columns.sql

---

**Last Updated**: January 2025
**Version**: 1.0