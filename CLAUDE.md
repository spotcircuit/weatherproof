# WeatherProof Project Architecture & Environment

## Project Overview
WeatherProof is a construction weather delay tracking application that helps contractors document weather-related delays for insurance claims and project management.

## Tech Stack (2025)
- **Frontend Framework**: Next.js 15.4.4 (App Router)
- **React**: 19.1.0
- **Styling**: Tailwind CSS v4.1.11 (New zero-config architecture)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Language**: TypeScript 5

## CRITICAL: Tailwind CSS v4 Setup (Major Changes!)
As of 2025, Tailwind CSS v4 has a completely new architecture that is VERY DIFFERENT from v3:

### Key Changes from v3 to v4:
1. **NO tailwind.config.js needed** - Zero configuration by default
2. **Different package structure**:
   - Install: `npm install -D tailwindcss @tailwindcss/postcss postcss`
   - NOT the old way: ~~`npm install -D tailwindcss postcss autoprefixer`~~
3. **PostCSS config MUST use .mjs extension**: `postcss.config.mjs`
   ```javascript
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   }
   ```
4. **New import syntax in globals.css**:
   ```css
   @import 'tailwindcss';
   ```
   NOT the old way: ~~`@tailwind base; @tailwind components; @tailwind utilities;`~~

### Common Mistakes to Avoid:
- Don't create tailwind.config.js unless you need custom configuration
- Don't use the old @tailwind directives
- Don't install autoprefixer separately (it's included)
- Don't use postcss.config.js (must be .mjs)

### If Tailwind Classes Don't Work:
1. Check postcss.config.mjs exists and uses '@tailwindcss/postcss'
2. Verify globals.css has `@import 'tailwindcss';`
3. For custom utilities (like `border-border`), you MUST:
   - Create a tailwind.config.ts file with custom color definitions
   - Add `@config '../../tailwind.config.ts';` after the import in globals.css
   - Define colors in theme using CSS variables: `border: "hsl(var(--border))"`
4. Use @theme {} for defining custom CSS variables in v4 (not @layer base)
5. Ensure globals.css is imported in app/layout.tsx
6. Restart the dev server after changes

### Custom Color Setup in v4:
```css
@import 'tailwindcss';
@config '../../tailwind.config.ts';

@theme {
  --color-border: hsl(214.3 31.8% 91.4%);
  /* other custom colors */
}
```

## File Structure
```
weatherProof/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── globals.css   # Global styles with Tailwind imports
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   └── components/       # React components
├── postcss.config.mjs    # PostCSS config for Tailwind v4
├── tsconfig.json         # TypeScript configuration
├── .env.local           # Environment variables (Supabase keys)
└── package.json         # Dependencies
```

## Environment Variables
- Supabase URL and keys configured in `.env.local`
- Weather API keys (NOAA, Weather Underground, Visual Crossing)
- AWS S3 for report storage
- Email/SMS notification services

## External Services
- **n8n Workflow Automation**: Used for weather alerts and notifications
  - Call webhook with weather data
  - n8n handles email/SMS/push notifications
  - Returns JSON response

## Key Features
1. Hyperlocal weather tracking for construction sites
2. Automatic delay detection based on customizable thresholds
3. Insurance-grade report generation
4. Integration with construction management tools

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Notes
- Using Supabase Auth for authentication (no Prisma needed)
- Server Components by default with App Router
- Tailwind classes work directly without configuration